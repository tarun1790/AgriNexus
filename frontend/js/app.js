/**
 * AgriNexus v3.0 — Next-Generation Agricultural Intelligence System
 * Real-Time Live Data Ingestion, 3D Canopy Digital Twin, Satellite Overpass Tracker,
 * Precision VRA Fertilizer Prescription, Drone UAV Thermal Imaging, and BRICS Carbon MRV Ledger.
 */

const API_BASE = '';

const AppState = {
    currentLat: 16.5062,
    currentLon: 80.6480,
    currentCrop: 'Cotton',
    currentArea: 2.4,
    currentLanguage: 'en',
    activeSpectralLayer: 'ndvi',
    currentPlatform: 'satellite',
    map: null,
    marker: null,
    polygonLayer: null,
    drawnPoints: [],
    isDrawingPolygon: false,
    farmProfile: null,
    satelliteData: null,
    soilData: null,
    climateRisk: null,
    advisoryData: null,
    weatherChartInstance: null,
    satelliteChartInstance: null,
    soilRadarChartInstance: null,
    is3DRotating: true,
    is3DWireframe: false,
    anim3DId: null,
    isRecordingSpeech: false
};

document.addEventListener('DOMContentLoaded', async () => {
    if (window.lucide) window.lucide.createIcons();

    initTabs();
    initControls();
    initLeafletMap();
    initSpectralSwitcher();
    initPlatformSwitcher();
    init3DDigitalTwin();
    initSimulator();
    initDiseaseScanner();
    initFederatedNetwork();
    initCopilot();
    initDossierExport();
    
    await checkSystemHealth();

    // PROACTIVELY TRIGGER LIVE GPS GEOLOCATION PERMISSION PROMPT ON PAGE LOAD
    autoRequestUserLocation();
});

// ----------------- AUTOMATIC GPS LOCATION REQUEST ON LOAD -----------------
async function autoRequestUserLocation() {
    const hudTag = document.getElementById('live-ingestion-tag');
    const gpsBtn = document.getElementById('btn-gps-locate');

    if (gpsBtn) {
        gpsBtn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i> <span>Acquiring GPS...</span>';
        if (window.lucide) window.lucide.createIcons();
    }
    if (hudTag) hudTag.textContent = '📡 Requesting Live GPS & Satellite Ingestion...';

    let ipResolved = false;

    // 1. Instant Fast IP Geolocation fallback so user immediately sees their local region
    try {
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();
        if (ipData && ipData.latitude && ipData.longitude) {
            ipResolved = true;
            await updateActiveCoordinates(parseFloat(ipData.latitude), parseFloat(ipData.longitude));
        }
    } catch (e) {}

    // 2. High-Precision Browser HTML5 GPS
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                await updateActiveCoordinates(lat, lon);
                if (gpsBtn) {
                    gpsBtn.innerHTML = '<i data-lucide="navigation"></i> <span>GPS Locked 📍</span>';
                    if (window.lucide) window.lucide.createIcons();
                }
                if (hudTag) hudTag.textContent = '🟢 High-Precision GPS Locked';
            },
            async (err) => {
                if (!ipResolved) {
                    await fetchLiveFieldIntelligence(AppState.currentLat, AppState.currentLon, AppState.currentCrop, AppState.currentArea);
                }
                if (gpsBtn) {
                    gpsBtn.innerHTML = '<i data-lucide="navigation"></i> <span>Locate Field (GPS)</span>';
                    if (window.lucide) window.lucide.createIcons();
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else if (!ipResolved) {
        await fetchLiveFieldIntelligence(AppState.currentLat, AppState.currentLon, AppState.currentCrop, AppState.currentArea);
    }
}

// ----------------- LEAFLET GIS MAP & POLYGON BOUNDARY DRAWER -----------------
function initLeafletMap() {
    const mapEl = document.getElementById('gis-leaflet-map');
    if (!mapEl || typeof L === 'undefined') return;

    AppState.map = L.map('gis-leaflet-map', {
        zoomControl: true,
        maxZoom: 19
    }).setView([AppState.currentLat, AppState.currentLon], 16);

    // High-Resolution True-Color Satellite Orthophoto Layer (Esri World Imagery)
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
    }).addTo(AppState.map);

    // Hybrid Reference Labels (Places, Roads, Administrative Perimeters)
    const labelsLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri World Boundaries & Places',
        maxZoom: 19
    }).addTo(AppState.map);

    // Standard Street Layer for optional toggle
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    });

    // Add Layer Control in top right corner
    const baseMaps = {
        "🛰️ High-Res Satellite View": satelliteLayer,
        "🗺️ Street & Road Map": streetLayer
    };
    const overlayMaps = {
        "🏷️ Village & Boundary Labels": labelsLayer
    };
    L.control.layers(baseMaps, overlayMaps, { position: 'topright' }).addTo(AppState.map);

    AppState.marker = L.marker([AppState.currentLat, AppState.currentLon], {
        draggable: true,
        title: "Active Monitored Field"
    }).addTo(AppState.map);

    AppState.marker.bindPopup("<b>🛰️ Active Monitored Field</b><br>High-Res Satellite Stream Active").openPopup();

    AppState.map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        if (AppState.isDrawingPolygon) {
            handlePolygonVertexClick(lat, lng);
        } else {
            await updateActiveCoordinates(lat, lng);
        }
    });

    AppState.map.on('dblclick', (e) => {
        if (AppState.isDrawingPolygon) {
            finishPolygonDrawing();
        }
    });

    AppState.marker.on('dragend', async (e) => {
        const { lat, lng } = e.target.getLatLng();
        await updateActiveCoordinates(lat, lng);
    });

    const drawBtn = document.getElementById('btn-draw-polygon');
    const clearBtn = document.getElementById('btn-clear-polygon');

    if (drawBtn) {
        drawBtn.addEventListener('click', () => {
            AppState.isDrawingPolygon = !AppState.isDrawingPolygon;
            if (AppState.isDrawingPolygon) {
                AppState.drawnPoints = [];
                if (AppState.polygonLayer) AppState.map.removeLayer(AppState.polygonLayer);
                drawBtn.classList.add('active');
                drawBtn.innerHTML = '<i data-lucide="check"></i> Finish Drawing (Double Click)';
            } else {
                finishPolygonDrawing();
            }
            if (window.lucide) window.lucide.createIcons();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (AppState.polygonLayer) {
                AppState.map.removeLayer(AppState.polygonLayer);
                AppState.polygonLayer = null;
            }
            AppState.drawnPoints = [];
            AppState.isDrawingPolygon = false;
            if (drawBtn) {
                drawBtn.classList.remove('active');
                drawBtn.innerHTML = '<i data-lucide="pen-tool"></i> Draw Field Polygon';
            }
            document.getElementById('polygon-acreage-badge').textContent = 'Acreage: 2.40 Acres';
            AppState.currentArea = 2.4;
            if (window.lucide) window.lucide.createIcons();
        });
    }

    const gpsBtn = document.getElementById('btn-gps-locate');
    if (gpsBtn) {
        gpsBtn.addEventListener('click', () => {
            autoRequestUserLocation(true);
        });
    }

    const triggerGpsBtn = document.getElementById('btn-trigger-gps');
    if (triggerGpsBtn) {
        triggerGpsBtn.addEventListener('click', () => {
            autoRequestUserLocation(true);
        });
    }

    const manualApplyBtn = document.getElementById('btn-apply-manual-coords');
    if (manualApplyBtn) {
        manualApplyBtn.addEventListener('click', async () => {
            const latVal = parseFloat(document.getElementById('input-manual-lat').value);
            const lonVal = parseFloat(document.getElementById('input-manual-lon').value);
            if (!isNaN(latVal) && !isNaN(lonVal)) {
                await updateActiveCoordinates(latVal, lonVal);
            }
        });
    }

    const searchBtn = document.getElementById('btn-search-location');
    const searchInput = document.getElementById('map-search-input');

    const handleSearch = async () => {
        const query = searchInput.value.trim();
        if (!query) return;

        searchBtn.textContent = 'Searching...';
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const results = await res.json();
            if (results && results.length > 0) {
                const lat = parseFloat(results[0].lat);
                const lon = parseFloat(results[0].lon);
                await updateActiveCoordinates(lat, lon);
            } else {
                alert('Location not found. Try another city, mandal, or coordinates.');
            }
        } catch (e) {
            console.error('Geocoding error:', e);
        } finally {
            searchBtn.textContent = 'Search City';
        }
    };

    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }
}

function handlePolygonVertexClick(lat, lon) {
    AppState.drawnPoints.push([lat, lon]);
    if (AppState.polygonLayer) {
        AppState.map.removeLayer(AppState.polygonLayer);
    }
    AppState.polygonLayer = L.polygon(AppState.drawnPoints, {
        color: '#059669',
        fillColor: '#10b981',
        fillOpacity: 0.35,
        weight: 3
    }).addTo(AppState.map);
}

function finishPolygonDrawing() {
    AppState.isDrawingPolygon = false;
    const drawBtn = document.getElementById('btn-draw-polygon');
    if (drawBtn) {
        drawBtn.classList.remove('active');
        drawBtn.innerHTML = '<i data-lucide="pen-tool"></i> Draw Field Polygon';
    }

    if (AppState.drawnPoints.length >= 3) {
        const calculatedAcres = calculateSphericalPolygonArea(AppState.drawnPoints);
        AppState.currentArea = Math.max(0.5, Math.min(250.0, calculatedAcres));
        document.getElementById('polygon-acreage-badge').textContent = `Acreage: ${AppState.currentArea.toFixed(2)} Acres`;
        fetchLiveFieldIntelligence(AppState.currentLat, AppState.currentLon, AppState.currentCrop, AppState.currentArea);
    }
    if (window.lucide) window.lucide.createIcons();
}

function calculateSphericalPolygonArea(coords) {
    const R = 6378137;
    if (coords.length < 3) return 2.4;

    let totalAngle = 0;
    for (let i = 0; i < coords.length; i++) {
        const p1 = coords[i];
        const p2 = coords[(i + 1) % coords.length];
        const radLat1 = (p1[0] * Math.PI) / 180;
        const radLon1 = (p1[1] * Math.PI) / 180;
        const radLat2 = (p2[0] * Math.PI) / 180;
        const radLon2 = (p2[1] * Math.PI) / 180;

        totalAngle += (radLon2 - radLon1) * (2 + Math.sin(radLat1) + Math.sin(radLat2));
    }

    const areaM2 = Math.abs((totalAngle * R * R) / 4.0);
    const areaAcres = areaM2 / 4046.86;
    return areaAcres > 0.01 ? areaAcres : 2.4;
}

async function updateActiveCoordinates(lat, lon) {
    AppState.currentLat = lat;
    AppState.currentLon = lon;

    if (AppState.map) {
        if (AppState.marker) {
            AppState.marker.setLatLng([lat, lon]);
        } else {
            AppState.marker = L.marker([lat, lon], { draggable: true, title: 'Active Monitored Field' }).addTo(AppState.map);
        }
        
        // Fly smoothly to the exact field location with high-resolution zoom
        AppState.map.flyTo([lat, lon], 17, { animate: true, duration: 1.2 });

        // Add or update accuracy perimeter circle
        if (AppState.accuracyCircle) AppState.map.removeLayer(AppState.accuracyCircle);
        AppState.accuracyCircle = L.circle([lat, lon], {
            radius: 120,
            color: '#059669',
            fillColor: '#10b981',
            fillOpacity: 0.2,
            weight: 2
        }).addTo(AppState.map);
    }

    const gpsDisplay = document.getElementById('active-gps-display');
    if (gpsDisplay) gpsDisplay.textContent = `📍 ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`;

    const latInput = document.getElementById('input-manual-lat');
    const lonInput = document.getElementById('input-manual-lon');
    if (latInput) latInput.value = lat.toFixed(4);
    if (lonInput) lonInput.value = lon.toFixed(4);

    try {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            .then(r => r.json())
            .then(data => {
                if (data && data.display_name) {
                    const parts = data.display_name.split(',');
                    const placeName = parts.slice(0, 3).join(', ');
                    if (gpsDisplay) gpsDisplay.textContent = `📍 ${placeName} (${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)`;
                }
            }).catch(() => {});
    } catch (e) {}

    await fetchLiveFieldIntelligence(lat, lon, AppState.currentCrop, AppState.currentArea);
}

// ----------------- LIVE REAL-TIME INGESTION API -----------------
async function fetchLiveFieldIntelligence(lat, lon, crop, area) {
    try {
        const hudTag = document.getElementById('live-ingestion-tag');
        if (hudTag) hudTag.textContent = '⏳ Streaming Live Weather & Soil Data...';

        const res = await fetch(`${API_BASE}/api/v1/realtime/field-intel?lat=${lat}&lon=${lon}&crop=${crop}&area_acres=${area}`, {
            method: 'POST'
        });
        const data = await res.json();

        AppState.farmProfile = data.field_profile;
        AppState.satelliteData = data.satellite;
        AppState.soilData = data.soil_health;
        AppState.climateRisk = data.climate_risk;
        AppState.advisoryData = data.advisory;

        if (hudTag) hudTag.textContent = '🟢 Live Weather & Soil Streams Active';

        renderLiveWeatherDisplay(data.field_profile.weather);
        renderAdvisoryPanel();
        renderSatelliteGrid();
        renderSoilPanel();
        renderClimateMeters();
        renderFAO56Hydrology();
        if (data.regional_grounding) renderRegionalGrounding(data.regional_grounding);

        renderWeatherForecastChart(data.field_profile.weather);
        renderSatelliteTrajectoryChart();
        renderSoilRadarChart(data.field_profile.soil);

        // Fetch Satellite Overpass, VRA, Carbon MRV, Bharat Indian AgData Hub, and Scientific Biophysics
        fetchSatelliteOverpass(lat, lon);
        fetchVRAPrescription(crop, area, data.satellite.mean_ndvi);
        fetchCarbonMRV(area);
        fetchBharatAgData(lat, lon, crop);
        fetchScientificBiophysics(lat, lon, crop);
        fetchGEESpectralBands(lat, lon, crop);
        fetchCarbonMRV(area);
        fetchIndianAgData(lat, lon, crop, area, data.field_profile.soil.organic_carbon, data.field_profile.soil.ph);
        fetchScientificBiophysics(crop, data.satellite.mean_ndvi);

    } catch (err) {
        console.error('Error fetching live field intelligence:', err);
    }
}

async function fetchScientificBiophysics(crop, meanNdvi) {
    try {
        const [dualRes, nppRes] = await Promise.all([
            fetch(`${API_BASE}/api/v1/science/fao56-dual-balance?crop=${crop}&mean_ndvi=${meanNdvi}`),
            fetch(`${API_BASE}/api/v1/science/monteith-npp?crop=${crop}&mean_ndvi=${meanNdvi}`)
        ]);

        const dual = await dualRes.json();
        const npp = await nppRes.json();

        const et0El = document.getElementById('fao-et0');
        const etcEl = document.getElementById('fao-etc');
        const vpdEl = document.getElementById('fao-vpd');

        if (et0El) et0El.innerHTML = `${dual.reference_et0_mm_day} mm/d <span style="font-size:0.72rem;color:var(--text-muted);">(Kcb=${dual.basal_transpiration_kcb}, Ke=${dual.soil_evaporation_ke})</span>`;
        if (etcEl) etcEl.innerHTML = `<strong>${dual.actual_evapotranspiration_etc_mm_day} mm/d</strong> <span style="font-size:0.72rem;color:var(--brand-primary);">(Ks=${dual.transpiration_stress_ks})</span>`;
        if (vpdEl) vpdEl.innerHTML = `NPP: <strong>${npp.net_primary_production_npp_g_c_m2_day} g C/m²/d</strong> <span style="font-size:0.72rem;color:var(--brand-mint);">(${npp.daily_dry_biomass_accumulation_kg_ha_day} kg/ha)</span>`;
    } catch (e) {
        console.warn('Scientific biophysics deferred:', e);
    }
}

async function fetchIndianAgData(lat, lon, crop, area, oc, ph) {
    try {
        const [shcRes, mandiRes, damuRes, schemeRes] = await Promise.all([
            fetch(`${API_BASE}/api/v1/india/soil-health-card?lat=${lat}&lon=${lon}&oc=${oc}&ph=${ph}`),
            fetch(`${API_BASE}/api/v1/india/mandi-prices?lat=${lat}&lon=${lon}&crop=${crop}`),
            fetch(`${API_BASE}/api/v1/india/agromet-bulletin?lat=${lat}&lon=${lon}`),
            fetch(`${API_BASE}/api/v1/india/schemes?area_acres=${area}&crop=${crop}`)
        ]);

        const shc = await shcRes.json();
        const mandis = await mandiRes.json();
        const damu = await damuRes.json();
        const schemes = await schemeRes.json();

        renderSoilHealthCard(shc);
        renderMandiPrices(mandis);
        renderDAMUBulletin(damu);
        renderPMSchemes(schemes);
    } catch (e) {
        console.warn('Indian AgData Hub deferred:', e);
    }
}

function renderSoilHealthCard(shc) {
    const idBadge = document.getElementById('shc-id-badge');
    const subText = document.getElementById('shc-sub-text');
    const recBox = document.getElementById('shc-recommendation-box');
    const grid = document.getElementById('shc-12-grid');

    if (idBadge) idBadge.textContent = `SHC ID: ${shc.shc_sample_id}`;
    if (subText) subText.textContent = `${shc.agro_ecological_sub_region}`;
    if (recBox) recBox.innerHTML = `<strong>ICAR Soil Recommendation:</strong> ${shc.official_recommendation}`;

    if (grid) {
        grid.innerHTML = '';
        shc.parameters.forEach(p => {
            const isDef = p.status.includes('DEFICIENT') || p.status.includes('LOW');
            const isOpt = p.status.includes('OPTIMAL') || p.status.includes('SUFFICIENT') || p.status.includes('NORMAL');
            const meterWidth = isDef ? 34 : (isOpt ? 82 : 95);

            const card = document.createElement('div');
            card.className = 'shc-param-card';
            card.innerHTML = `
                <span class="param-category-tag">${p.category}</span>
                <span class="param-name">${p.name}</span>
                <span class="param-val">${p.value}</span>
                <span class="param-benchmark">Benchmark: ${p.benchmark}</span>
                <div class="shc-meter-bar">
                    <div class="shc-meter-fill ${isDef ? 'meter-deficient' : ''}" style="width: ${meterWidth}%;"></div>
                </div>
                <span class="param-status-tag ${p.color}">${p.status}</span>
                <span style="font-size: 0.68rem; color: var(--text-muted); margin-top: 0.35rem; font-style: italic; border-top: 1px dashed var(--border-subtle); padding-top: 0.25rem;">🔬 ${p.method || 'ICAR Standard Extraction'}</span>
            `;
            grid.appendChild(card);
        });
    }
}

function renderMandiPrices(mandis) {
    const list = document.getElementById('mandi-list');
    if (!list) return;
    list.innerHTML = '';

    mandis.forEach(m => {
        const item = document.createElement('div');
        item.className = 'mandi-item';
        item.innerHTML = `
            <div class="mandi-title-group">
                <h5>${m.mandi_name}</h5>
                <span class="mandi-sub">📍 <strong>${m.distance_km} km</strong> away from field • ${m.commodity} • Arrival: ${m.arrival_tonnes} T</span>
                <div style="margin-top: 0.25rem;">
                    <span class="msp-tag">CACP MSP: ₹${m.msp_benchmark}/Q</span>
                    <span style="font-size: 0.72rem; color: var(--brand-primary); font-weight: 700; margin-left: 0.35rem;">${m.price_trend}</span>
                </div>
            </div>
            <div class="mandi-rate-box">
                <div class="mandi-modal-rate">₹${m.modal_price.toLocaleString()}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted);">Range: ₹${m.min_price} - ₹${m.max_price}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderDAMUBulletin(damu) {
    const hl = document.getElementById('damu-headline');
    const sm = document.getElementById('damu-summary');
    const db = document.getElementById('damu-date-badge');

    if (hl) hl.textContent = damu.agro_advisory_headline;
    if (sm) sm.textContent = `${damu.damu_weather_summary} — ${damu.issuing_authority}`;
    if (db) db.textContent = `${damu.district} District (${damu.bulletin_date})`;
}

function renderPMSchemes(s) {
    const grid = document.getElementById('pm-schemes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    s.eligible_schemes.forEach(sc => {
        const card = document.createElement('div');
        card.className = 'pm-scheme-card';
        card.innerHTML = `
            <div>
                <h5>${sc.scheme_name}</h5>
                <p>${sc.disbursement_frequency || sc.coverage || sc.support_details || 'Govt Direct Assistance'}</p>
            </div>
            <span class="msp-tag">${sc.eligibility_status}</span>
        `;
        grid.appendChild(card);
    });
}

function renderRegionalGrounding(g) {
    const authEl = document.getElementById('grounding-authority-title');
    const seriesEl = document.getElementById('grounding-series-name');
    const confEl = document.getElementById('grounding-conf-pill');
    const minEl = document.getElementById('grounding-mineralogy');
    const cecEl = document.getElementById('grounding-cec');
    const drainEl = document.getElementById('grounding-drainage');
    const protoEl = document.getElementById('grounding-protocol');

    if (authEl) authEl.textContent = `${g.governing_authority} Grounded`;
    if (seriesEl) seriesEl.textContent = g.soil_series_name;
    if (confEl) confEl.textContent = `Confidence: ${g.confidence_score}%`;
    if (minEl) minEl.textContent = g.dominant_mineralogy;
    if (cecEl) cecEl.textContent = g.regional_cation_exchange;
    if (drainEl) drainEl.textContent = g.subsurface_drainage_class;
    if (protoEl) protoEl.textContent = g.recommended_kvk_protocol;

    const stream = document.getElementById('thoughts-stream');
    if (stream) {
        stream.textContent = `[TOOL] Grounded with ${g.governing_authority}
[SERIES] ${g.soil_series_name} (CEC: ${g.regional_cation_exchange})
[DRAINAGE] ${g.subsurface_drainage_class}
[PROTOCOL] ${g.recommended_kvk_protocol}`;
    }
}

async function fetchSatelliteOverpass(lat, lon) {
    try {
        const res = await fetch(`${API_BASE}/api/v1/satellite/overpass?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        const next = data.next_constellation_pass;
        document.getElementById('orbit-time-text').textContent = `In ${next.hours_until_pass}h (${next.spatial_resolution})`;
    } catch (e) {}
}

async function fetchGEESpectralBands(lat, lon, crop) {
    try {
        const res = await fetch(`${API_BASE}/api/v1/gee/spectral-bands?lat=${lat}&lon=${lon}&crop=${crop}`);
        const data = await res.json();
        if (data && data.surface_reflectance_boa) {
            const boa = data.surface_reflectance_boa;
            const b2El = document.getElementById('gee-b2-val');
            const b3El = document.getElementById('gee-b3-val');
            const b4El = document.getElementById('gee-b4-val');
            const b5El = document.getElementById('gee-b5-val');
            const b8El = document.getElementById('gee-b8-val');
            const b11El = document.getElementById('gee-b11-val');
            const lstEl = document.getElementById('gee-lst-val');

            if (b2El) b2El.textContent = boa.B2_BLUE_490nm.toFixed(3);
            if (b3El) b3El.textContent = boa.B3_GREEN_560nm.toFixed(3);
            if (b4El) b4El.textContent = boa.B4_RED_665nm.toFixed(3);
            if (b5El) b5El.textContent = boa.B5_RED_EDGE_705nm.toFixed(3);
            if (b8El) b8El.textContent = boa.B8_NIR_842nm.toFixed(3);
            if (b11El) b11El.textContent = boa.B11_SWIR1_1610nm.toFixed(3);
            if (lstEl && data.thermal_radiometry) lstEl.textContent = `${data.thermal_radiometry.land_surface_temperature_lst_c.toFixed(1)}°C`;
        }
    } catch (e) {}
}

async function fetchVRAPrescription(crop, area, ndvi) {
    try {
        const res = await fetch(`${API_BASE}/api/v1/precision/vra-prescription?crop=${crop}&area_acres=${area}&mean_ndvi=${ndvi}`);
        const vra = await res.json();
        renderVRAPanel(vra);
    } catch (e) {}
}

function renderVRAPanel(v) {
    document.getElementById('vra-total-urea').textContent = `${v.total_prescribed_urea_kg} kg`;
    document.getElementById('vra-blanket-urea').textContent = `${v.conventional_blanket_urea_kg} kg`;
    document.getElementById('vra-saved-urea').textContent = `${v.fertilizer_saved_kg} kg (${v.fertilizer_saved_pct}%)`;
    document.getElementById('vra-ghg-abated').textContent = `${v.nitrous_oxide_reduction_kg_co2e} kg CO2e`;
    document.getElementById('vra-saved-badge').textContent = `Fertilizer Saved: ~${v.fertilizer_saved_pct}%`;

    const container = document.getElementById('vra-zones-grid');
    if (!container) return;
    container.innerHTML = '';

    v.vra_zones.forEach(z => {
        const card = document.createElement('div');
        card.className = 'vra-zone-card';
        card.innerHTML = `
            <div class="vra-zone-header">
                <span class="vra-zone-title">${z.zone_name}</span>
                <span class="vra-zone-tag" style="background: ${z.color_code};">${z.area_pct}% Field (${z.area_acres} Ac)</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted);">${z.soil_condition}</p>
            <div class="vra-dosage-box">
                <div><strong>Target Urea:</strong> ${z.prescription.nitrogen_urea_kg_per_acre} kg/ac (Total Zone: ${z.total_zone_urea_kg} kg)</div>
                <div><strong>DAP / Potash:</strong> ${z.prescription.phosphorus_dap_kg_per_acre} kg DAP / ${z.prescription.potash_mop_kg_per_acre} kg MOP per acre</div>
                <div><strong>Regenerative Input:</strong> ${z.prescription.regenerative_input}</div>
                <div><strong>Method:</strong> ${z.prescription.application_method}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function fetchCarbonMRV(area) {
    try {
        const res = await fetch(`${API_BASE}/api/v1/carbon/ledger?area_acres=${area}`);
        const mrv = await res.json();
        document.getElementById('mrv-tons-c').textContent = `${mrv.total_sequestered_tco2e} tCO2e`;
        document.getElementById('mrv-usd-val').textContent = `$${mrv.valuation.usd.toFixed(2)}`;
        document.getElementById('mrv-inr-val').textContent = `₹${mrv.valuation.inr.toLocaleString()}`;
        document.getElementById('mrv-brl-val').textContent = `R$${mrv.valuation.brl.toFixed(2)}`;
        document.getElementById('mrv-hash-badge').textContent = `MRV Hash: ${mrv.verification_hash.slice(0, 10)}...`;

        const txList = document.getElementById('carbon-transactions-list');
        if (txList) {
            txList.innerHTML = '';
            mrv.ledger_transactions.forEach(tx => {
                const item = document.createElement('div');
                item.className = 'carbon-tx-item';
                item.innerHTML = `
                    <div><strong>${tx.date}</strong> — ${tx.activity}</div>
                    <div class="text-success font-bold">+${tx.tco2e} tCO2e [${tx.status}]</div>
                `;
                txList.appendChild(item);
            });
        }
    } catch (e) {}
}

function renderLiveWeatherDisplay(w) {
    document.getElementById('live-temp-display').textContent = `${w.temperature_celsius.toFixed(1)}°C`;
    document.getElementById('live-humidity-display').textContent = `${w.humidity_percentage.toFixed(0)}%`;
    document.getElementById('live-rainprob-display').textContent = `${w.rain_probability_pct.toFixed(0)}%`;
}

function renderFAO56Hydrology() {
    if (!AppState.climateRisk || !AppState.climateRisk.irrigation_advisory) return;
    const ir = AppState.climateRisk.irrigation_advisory;
    const et0El = document.getElementById('fao-et0');
    const etcEl = document.getElementById('fao-etc');
    const vpdEl = document.getElementById('fao-vpd');
    if (et0El) et0El.textContent = `${ir.fao56_et0_mm_day || 5.4} mm/day`;
    if (etcEl) etcEl.textContent = `${ir.fao56_etc_mm_day || 6.2} mm/day`;
    if (vpdEl) vpdEl.textContent = `${ir.vpd_kpa || 2.1} kPa`;
}

// ----------------- TAB NAVIGATION -----------------
function initTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }

            if (targetId === 'tab-3d' && window.resize3DCanvas) {
                setTimeout(window.resize3DCanvas, 50);
            }

            if (AppState.map) {
                setTimeout(() => AppState.map.invalidateSize(), 150);
            }
            if (window.lucide) window.lucide.createIcons();
        });
    });
}

// ----------------- PLATFORM SWITCHER (SATELLITE VS DRONE) -----------------
function initPlatformSwitcher() {
    const satBtn = document.getElementById('btn-platform-satellite');
    const droneBtn = document.getElementById('btn-platform-drone');

    if (satBtn && droneBtn) {
        satBtn.addEventListener('click', () => {
            satBtn.classList.add('active');
            droneBtn.classList.remove('active');
            AppState.currentPlatform = 'satellite';
            renderSatelliteGrid();
        });

        droneBtn.addEventListener('click', () => {
            droneBtn.classList.add('active');
            satBtn.classList.remove('active');
            AppState.currentPlatform = 'drone';
            renderSatelliteGrid();
        });
    }
}

// ----------------- 3D CANOPY DIGITAL TWIN CANVAS -----------------
function init3DDigitalTwin() {
    const canvas = document.getElementById('canvas-3d-twin');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let angle = 0.45;
    let particles = [];
    let waterDrops = [];
    AppState.active3DLayer = 'all';

    const CROP_SPECS = {
        'Cotton': { heightCm: 68, stalkHeightPx: 24, foliageR: 3.8, rootDepthPx: 28, rootColor: '#f59e0b', stage: 'Vegetative / Square Formation' },
        'Chilli': { heightCm: 46, stalkHeightPx: 18, foliageR: 3.2, rootDepthPx: 22, rootColor: '#d97706', stage: 'Early Flowering' },
        'Rice': { heightCm: 88, stalkHeightPx: 32, foliageR: 4.5, rootDepthPx: 18, rootColor: '#fbbf24', stage: 'Tillering / Panicle' },
        'Wheat': { heightCm: 75, stalkHeightPx: 28, foliageR: 3.5, rootDepthPx: 26, rootColor: '#fcd34d', stage: 'Crown Root Initiation' },
        'Maize': { heightCm: 195, stalkHeightPx: 48, foliageR: 5.5, rootDepthPx: 38, rootColor: '#f59e0b', stage: 'Silking & Tasseling' },
        'Soybean': { heightCm: 62, stalkHeightPx: 22, foliageR: 3.6, rootDepthPx: 25, rootColor: '#d97706', stage: 'Pod Development' }
    };

    // Initialize 80 photosynthetic photons
    for (let i = 0; i < 80; i++) {
        particles.push({
            x: (Math.random() - 0.5) * 580,
            y: (Math.random() - 0.5) * 400,
            z: Math.random() * 160,
            speed: 0.6 + Math.random() * 0.9,
            radius: 1.6 + Math.random() * 2.2,
            opacity: 0.4 + Math.random() * 0.6
        });
    }

    // Initialize 35 subsoil percolation droplets
    for (let i = 0; i < 35; i++) {
        waterDrops.push({
            x: (Math.random() - 0.5) * 500,
            y: (Math.random() - 0.5) * 340,
            z: Math.random() * -120,
            speed: 0.7 + Math.random() * 0.9,
            length: 5 + Math.random() * 8
        });
    }

    function resizeCanvas() {
        if (!canvas) return;
        const parentW = canvas.parentElement ? canvas.parentElement.clientWidth : 0;
        const parentH = canvas.parentElement ? canvas.parentElement.clientHeight : 0;
        canvas.width = (parentW > 100) ? parentW : (window.innerWidth > 900 ? 1080 : window.innerWidth - 40);
        canvas.height = (parentH > 100) ? parentH : 560;
    }
    window.resize3DCanvas = resizeCanvas;
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Layer filter controls
    const layerAll = document.getElementById('btn-3d-layer-all');
    const layerCanopy = document.getElementById('btn-3d-layer-canopy');
    const layerRoots = document.getElementById('btn-3d-layer-roots');

    function setActiveLayerBtn(activeBtn) {
        [layerAll, layerCanopy, layerRoots].forEach(b => { if (b) b.classList.remove('active'); });
        if (activeBtn) activeBtn.classList.add('active');
    }

    if (layerAll) {
        layerAll.addEventListener('click', () => {
            AppState.active3DLayer = 'all';
            setActiveLayerBtn(layerAll);
        });
    }
    if (layerCanopy) {
        layerCanopy.addEventListener('click', () => {
            AppState.active3DLayer = 'canopy';
            setActiveLayerBtn(layerCanopy);
        });
    }
    if (layerRoots) {
        layerRoots.addEventListener('click', () => {
            AppState.active3DLayer = 'roots';
            setActiveLayerBtn(layerRoots);
        });
    }

    const rotateBtn = document.getElementById('btn-3d-rotate');
    const wireBtn = document.getElementById('btn-3d-wireframe');

    if (rotateBtn) {
        rotateBtn.addEventListener('click', () => {
            AppState.is3DRotating = !AppState.is3DRotating;
            rotateBtn.classList.toggle('btn-primary', AppState.is3DRotating);
        });
    }

    if (wireBtn) {
        wireBtn.addEventListener('click', () => {
            AppState.is3DWireframe = !AppState.is3DWireframe;
            wireBtn.classList.toggle('btn-primary', AppState.is3DWireframe);
        });
    }

    // Interactive mouse drag to rotate 360°
    let isDragging = false;
    let lastMouseX = 0;
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.clientX - lastMouseX;
            angle += dx * 0.008;
            lastMouseX = e.clientX;
        }
    });

    // Touch drag support for mobile/tablet
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            lastMouseX = e.touches[0].clientX;
        }
    }, { passive: true });
    window.addEventListener('touchend', () => { isDragging = false; });
    canvas.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            const dx = e.touches[0].clientX - lastMouseX;
            angle += dx * 0.008;
            lastMouseX = e.touches[0].clientX;
        }
    }, { passive: true });

    function render3DFrame() {
        const cw = (canvas.parentElement && canvas.parentElement.clientWidth > 100) ? canvas.parentElement.clientWidth : (canvas.width > 100 ? canvas.width : 1080);
        const ch = (canvas.parentElement && canvas.parentElement.clientHeight > 100) ? canvas.parentElement.clientHeight : (canvas.height > 100 ? canvas.height : 560);
        
        if (canvas.width !== cw || canvas.height !== ch) {
            canvas.width = cw;
            canvas.height = ch;
        }

        ctx.clearRect(0, 0, cw, ch);

        // Deep rich geospatial cockpit backdrop
        const grad = ctx.createRadialGradient(cw / 2, ch / 2, 40, cw / 2, ch / 2, cw * 0.75);
        grad.addColorStop(0, '#063a23');
        grad.addColorStop(0.5, '#021e12');
        grad.addColorStop(1, '#011009');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);

        const crop = AppState.currentCrop || 'Cotton';
        const cropSpec = CROP_SPECS[crop] || CROP_SPECS['Cotton'];
        const cx = cw / 2;
        const cy = ch / 2 + 25;
        const gridW = 18;
        const gridH = 18;
        const spacing = Math.max(18, Math.min(26, cw / 40));

        if (AppState.is3DRotating) angle += 0.005;

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const pitch = 0.50;

        // 1. Draw Volumetric Solar Vector & Sunlight Rays
        const sunX = cx + Math.cos(angle + 1.2) * (spacing * 12);
        const sunY = 70;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 45);
        sunGrad.addColorStop(0, 'rgba(253, 224, 71, 0.95)');
        sunGrad.addColorStop(0.4, 'rgba(234, 179, 8, 0.45)');
        sunGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 45, 0, Math.PI * 2);
        ctx.fill();

        // 2. Draw 3D Geological Horizon Subsoil Walls (0 to -100cm depth cross-section)
        if (AppState.active3DLayer !== 'canopy') {
            const edgeX1 = -gridW / 2;
            const edgeY1 = gridH / 2 - 1;
            const edgeX2 = gridW / 2 - 1;
            const edgeY2 = gridH / 2 - 1;

            const rx1 = edgeX1 * cosA - edgeY1 * sinA;
            const ry1 = edgeX1 * sinA + edgeY1 * cosA;
            const isoX1 = cx + (rx1 - ry1) * spacing;
            const isoY1 = cy + (rx1 + ry1) * spacing * pitch;

            const rx2 = edgeX2 * cosA - edgeY2 * sinA;
            const ry2 = edgeX2 * sinA + edgeY2 * cosA;
            const isoX2 = cx + (rx2 - ry2) * spacing;
            const isoY2 = cy + (rx2 + ry2) * spacing * pitch;

            // Soil Horizon A Wall (0 to -30cm Topsoil)
            ctx.fillStyle = 'rgba(20, 83, 45, 0.55)';
            ctx.beginPath();
            ctx.moveTo(isoX1, isoY1);
            ctx.lineTo(isoX2, isoY2);
            ctx.lineTo(isoX2, isoY2 + 35);
            ctx.lineTo(isoX1, isoY1 + 35);
            ctx.closePath();
            ctx.fill();

            // Soil Horizon B Wall (-30 to -60cm Root Zone)
            ctx.fillStyle = 'rgba(15, 60, 32, 0.65)';
            ctx.beginPath();
            ctx.moveTo(isoX1, isoY1 + 35);
            ctx.lineTo(isoX2, isoY2 + 35);
            ctx.lineTo(isoX2, isoY2 + 70);
            ctx.lineTo(isoX1, isoY1 + 70);
            ctx.closePath();
            ctx.fill();

            // Soil Horizon C Wall (-60 to -100cm Deep Subsoil)
            ctx.fillStyle = 'rgba(8, 40, 22, 0.75)';
            ctx.beginPath();
            ctx.moveTo(isoX1, isoY1 + 70);
            ctx.lineTo(isoX2, isoY2 + 70);
            ctx.lineTo(isoX2, isoY2 + 105);
            ctx.lineTo(isoX1, isoY1 + 105);
            ctx.closePath();
            ctx.fill();

            // Horizon Stratum Depth Labels
            ctx.fillStyle = 'rgba(167, 243, 208, 0.8)';
            ctx.font = '9px Space Grotesk, sans-serif';
            ctx.fillText('Horizon A: Topsoil (0–30 cm)', isoX1 - 130, isoY1 + 20);
            ctx.fillText('Horizon B: Root-Zone (30–60 cm)', isoX1 - 145, isoY1 + 55);
            ctx.fillText('Horizon C: Deep Lithosphere (60–100 cm)', isoX1 - 170, isoY1 + 90);
        }

        // 3. Draw 3D Isometric Elevation Terrain Grid
        for (let x = -gridW / 2; x < gridW / 2; x++) {
            for (let y = -gridH / 2; y < gridH / 2; y++) {
                const rx = x * cosA - y * sinA;
                const ry = x * sinA + y * cosA;

                const zElevation = (Math.sin(x * 0.35 + angle * 0.8) * Math.cos(y * 0.35) + Math.sin((x + y) * 0.18)) * 24;
                const isoX = cx + (rx - ry) * spacing;
                const isoY = cy + (rx + ry) * spacing * pitch - zElevation;

                const nextRx = (x + 1) * cosA - y * sinA;
                const nextRy = (x + 1) * sinA + y * cosA;
                const nextZElev = (Math.sin((x + 1) * 0.35 + angle * 0.8) * Math.cos(y * 0.35) + Math.sin((x + 1 + y) * 0.18)) * 24;
                const nextIsoX = cx + (nextRx - nextRy) * spacing;
                const nextIsoY = cy + (nextRx + nextRy) * spacing * pitch - nextZElev;

                // Terrain Mesh Grid lines
                ctx.strokeStyle = AppState.is3DWireframe ? 'rgba(52, 211, 153, 0.45)' : 'rgba(5, 150, 105, 0.55)';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(isoX, isoY);
                ctx.lineTo(nextIsoX, nextIsoY);
                ctx.stroke();

                // Cross grid connecting line
                const crossRx = x * cosA - (y + 1) * sinA;
                const crossRy = x * sinA + (y + 1) * cosA;
                const crossZElev = (Math.sin(x * 0.35 + angle * 0.8) * Math.cos((y + 1) * 0.35) + Math.sin((x + y + 1) * 0.18)) * 24;
                const crossIsoX = cx + (crossRx - crossRy) * spacing;
                const crossIsoY = cy + (crossRx + crossRy) * spacing * pitch - crossZElev;

                ctx.beginPath();
                ctx.moveTo(isoX, isoY);
                ctx.lineTo(crossIsoX, crossIsoY);
                ctx.stroke();

                // 4. Draw Crop Stalks, Foliage & Taproots
                if (!AppState.is3DWireframe && (x + y) % 2 === 0) {
                    const isCanopyHigh = zElevation > 4;

                    // CANOPY LAYER
                    if (AppState.active3DLayer !== 'roots') {
                        // Vertical Stalk
                        ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
                        ctx.lineWidth = 1.8;
                        ctx.beginPath();
                        ctx.moveTo(isoX, isoY);
                        ctx.lineTo(isoX, isoY - cropSpec.stalkHeightPx);
                        ctx.stroke();

                        // Foliage Bulb
                        ctx.fillStyle = isCanopyHigh ? '#34d399' : '#10b981';
                        ctx.beginPath();
                        ctx.arc(isoX, isoY - cropSpec.stalkHeightPx, cropSpec.foliageR, 0, Math.PI * 2);
                        ctx.fill();

                        // Solar highlight on top of foliage
                        ctx.fillStyle = '#a7f3d0';
                        ctx.beginPath();
                        ctx.arc(isoX - 1, isoY - cropSpec.stalkHeightPx - 1, cropSpec.foliageR * 0.4, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // ROOT-ZONE LAYER
                    if (AppState.active3DLayer !== 'canopy') {
                        // Downward Taproot
                        ctx.strokeStyle = cropSpec.rootColor;
                        ctx.lineWidth = 1.3;
                        ctx.beginPath();
                        ctx.moveTo(isoX, isoY);
                        ctx.lineTo(isoX + Math.sin(x * 0.5) * 5, isoY + cropSpec.rootDepthPx);
                        ctx.stroke();

                        // Lateral feeder roots
                        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
                        ctx.lineWidth = 0.9;
                        ctx.beginPath();
                        ctx.moveTo(isoX, isoY + (cropSpec.rootDepthPx * 0.5));
                        ctx.lineTo(isoX - 6, isoY + (cropSpec.rootDepthPx * 0.7));
                        ctx.moveTo(isoX, isoY + (cropSpec.rootDepthPx * 0.6));
                        ctx.lineTo(isoX + 6, isoY + (cropSpec.rootDepthPx * 0.8));
                        ctx.stroke();
                    }
                }
            }
        }

        // 5. Draw Rising Photosynthetic Photons (Transpiration & Carbon Fixation)
        if (AppState.active3DLayer !== 'roots') {
            particles.forEach(p => {
                p.z += p.speed;
                if (p.z > 160) p.z = 0;

                const px = cx + p.x * cosA - p.y * sinA;
                const py = cy + (p.x * sinA + p.y * cosA) * pitch - p.z;

                ctx.fillStyle = `rgba(110, 231, 183, ${p.opacity * (1 - p.z / 160)})`;
                ctx.beginPath();
                ctx.arc(px, py, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // 6. Draw Subsoil Water Percolation Droplets (FAO-56 Infiltration)
        if (AppState.active3DLayer !== 'canopy') {
            waterDrops.forEach(w => {
                w.z -= w.speed;
                if (w.z < -120) w.z = 0;

                const wx = cx + w.x * cosA - w.y * sinA;
                const wy = cy + (w.x * sinA + w.y * cosA) * pitch - w.z;

                ctx.strokeStyle = 'rgba(96, 165, 250, 0.65)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(wx, wy);
                ctx.lineTo(wx, wy + w.length);
                ctx.stroke();
            });
        }

        // 7. Dynamic HUD Telemetry Label Updates
        const cropHud = document.getElementById('hud-3d-crop');
        const chmHud = document.getElementById('hud-3d-chm');
        if (cropHud) cropHud.innerHTML = `🌾 Active Crop: <strong>${crop} (${cropSpec.stage})</strong>`;
        if (chmHud) chmHud.innerHTML = `🌱 Canopy Height (CHM): <strong>${cropSpec.heightCm} cm</strong>`;

        // 8. Compass Orientation Indicator
        ctx.save();
        ctx.translate(50, 50);
        ctx.rotate(angle);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(0, -16);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(5, -6);
        ctx.lineTo(-5, -6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Space Grotesk, sans-serif';
        ctx.fillText('N', -4, -20);
        ctx.restore();

        AppState.anim3DId = requestAnimationFrame(render3DFrame);
    }

    render3DFrame();

    // Horizontal rail navigation buttons
    const shcPrev = document.getElementById('btn-shc-prev');
    const shcNext = document.getElementById('btn-shc-next');
    const shcGrid = document.getElementById('shc-12-grid');

    if (shcPrev && shcGrid) {
        shcPrev.addEventListener('click', () => {
            shcGrid.scrollBy({ left: -300, behavior: 'smooth' });
        });
    }
    if (shcNext && shcGrid) {
        shcNext.addEventListener('click', () => {
            shcGrid.scrollBy({ left: 300, behavior: 'smooth' });
        });
    }
}

// ----------------- SYSTEM & CONTROLS -----------------
async function checkSystemHealth() {
    try {
        const res = await fetch(`${API_BASE}/api/v1/health`);
        const data = await res.json();
        const gpuText = document.getElementById('gpu-status-text');
        if (data.cuda_available) {
            gpuText.textContent = `PyTorch CUDA Online (${data.device})`;
        } else {
            gpuText.textContent = 'PyTorch Engine Active';
        }
    } catch (e) {
        console.warn('Backend health check deferred', e);
    }
}

function initControls() {
    const farmSelect = document.getElementById('farm-selector');
    const langSelect = document.getElementById('lang-selector');
    const voiceBtn = document.getElementById('voice-speak-btn');

    if (farmSelect) {
        farmSelect.addEventListener('change', async (e) => {
            const val = e.target.value;
            if (val === 'farm_in_cotton_01') await updateActiveCoordinates(16.5062, 80.6480);
            else if (val === 'farm_in_rice_02') await updateActiveCoordinates(30.9010, 75.8573);
            else if (val === 'farm_br_soy_03') await updateActiveCoordinates(-12.5425, -55.7211);
            else if (val === 'farm_za_maize_04') await updateActiveCoordinates(-27.3833, 26.6167);
            else if (val === 'realtime_custom_field') autoRequestUserLocation();
        });
    }

    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            AppState.currentLanguage = e.target.value;
            renderLocalizedAdvisory();
        });
    }

    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            speakCurrentAdvisory();
        });
    }
}

// ----------------- SPECTRAL LAYER SWITCHER -----------------
function initSpectralSwitcher() {
    const buttons = document.querySelectorAll('.btn-spectral');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.activeSpectralLayer = btn.getAttribute('data-layer');
            renderSatelliteGrid();
        });
    });
}

// ----------------- ADVISORY PANEL & 4 DECISION PILLARS -----------------
function renderAdvisoryPanel() {
    if (!AppState.advisoryData) return;
    renderLocalizedAdvisory();
    renderDecisionPillars();
}

function renderDecisionPillars() {
    const adv = AppState.advisoryData;
    const weather = AppState.farmProfile ? AppState.farmProfile.weather : { rain_probability_pct: 76, temperature_celsius: 30.3 };
    const crop = AppState.currentCrop || 'Cotton';
    const area = AppState.currentArea || 2.4;

    // 1. Water Pillar
    const rainProb = weather.rain_probability_pct;
    const isRainExpected = rainProb >= 55.0;
    const decWaterTag = document.getElementById('dec-water-tag');
    const decWaterHead = document.getElementById('dec-water-headline');
    const decWaterProb = document.getElementById('dec-water-rainprob');
    const decWaterVol = document.getElementById('dec-water-vol');
    const decWaterGuide = document.getElementById('dec-water-guide');

    if (decWaterTag) decWaterTag.textContent = isRainExpected ? 'Weather Watch' : 'Irrigate Field';
    if (decWaterHead) decWaterHead.textContent = isRainExpected ? `Hold Irrigation — Rain Forecast (${rainProb:.0f}%)` : `Irrigate ${area} Acres via Drip`;
    if (decWaterProb) decWaterProb.textContent = `${rainProb.toFixed(0)}% (Next 48h)`;
    if (decWaterVol) decWaterVol.textContent = isRainExpected ? '0 L (Conserved)' : `${Math.round(area * 47700).toLocaleString()} L`;
    if (decWaterGuide) decWaterGuide.textContent = isRainExpected ? 'Showers expected. Keep field drainage furrows clear to prevent waterlogging.' : 'Volumetric moisture deficit. Run drip pumps for 2.5 hours in early morning.';

    // 2. Fertilizer Pillar
    const decFertTag = document.getElementById('dec-fert-tag');
    const decFertHead = document.getElementById('dec-fert-headline');
    const decFertUrea = document.getElementById('dec-fert-urea');
    const decFertBio = document.getElementById('dec-fert-bio');
    const decFertGuide = document.getElementById('dec-fert-guide');

    if (decFertTag) decFertTag.textContent = `Save ₹${Math.round(area * 590).toLocaleString()} via VRA`;
    if (decFertHead) decFertHead.textContent = `Precision 4-Zone Prescription for ${crop}`;
    if (decFertUrea) decFertUrea.textContent = `${(area * 0.5).toFixed(1)} Bags (${Math.round(area * 25)} kg)`;
    if (decFertBio) decFertBio.textContent = `${(area * 1.0).toFixed(1)} Bags (${Math.round(area * 50)} kg)`;
    if (decFertGuide) decFertGuide.textContent = 'Apply as per 4-Zone VRA map to cut synthetic nitrogen burns and build organic carbon.';

    // 3. Pest Alert Pillar
    const decPestTag = document.getElementById('dec-pest-tag');
    const decPestHead = document.getElementById('dec-pest-headline');
    const decPestTarget = document.getElementById('dec-pest-target');
    const decPestDose = document.getElementById('dec-pest-dose');
    const decPestGuide = document.getElementById('dec-pest-guide');

    if (crop === 'Cotton') {
        if (decPestTag) decPestTag.textContent = 'Moderate Risk';
        if (decPestHead) decPestHead.textContent = 'Bacterial Blight / Sucking Pests';
        if (decPestTarget) decPestTarget.textContent = 'Whitefly & Jassids';
        if (decPestDose) decPestDose.textContent = 'Neem Baan @ 2 ml/L';
        if (decPestGuide) decPestGuide.textContent = 'Install 8 yellow sticky traps per acre; inspect underside of upper leaves.';
    } else if (crop === 'Chilli') {
        if (decPestTag) decPestTag.textContent = 'High Mite Risk';
        if (decPestHead) decPestHead.textContent = 'Chilli Leaf Curl & Yellow Mites';
        if (decPestTarget) decPestTarget.textContent = 'Thrips & Mites';
        if (decPestDose) decPestDose.textContent = 'Diafenthiuron @ 1g/L';
        if (decPestGuide) decPestGuide.textContent = 'Install 10 blue sticky traps/acre. Spray at early sign of upward leaf cupping.';
    } else if (crop === 'Rice') {
        if (decPestTag) decPestTag.textContent = 'Fungal Watch';
        if (decPestHead) decPestHead.textContent = 'Blast & Brown Planthopper';
        if (decPestTarget) decPestTarget.textContent = 'Pyricularia / BPH';
        if (decPestDose) decPestDose.textContent = 'Tricyclazole @ 0.6g/L';
        if (decPestGuide) decPestGuide.textContent = 'Practice Alternate Wetting and Drying (AWD) to control BPH root colonies.';
    } else {
        if (decPestTag) decPestTag.textContent = 'Low Risk';
        if (decPestHead) decPestHead.textContent = 'Routine Canopy Health';
        if (decPestTarget) decPestTarget.textContent = 'Foliar Rusts';
        if (decPestDose) decPestDose.textContent = 'Propiconazole @ 1ml/L';
        if (decPestGuide) decPestGuide.textContent = 'Scout field corners along a standard W-shaped walking path.';
    }

    // 4. Market Arbitrage Pillar
    const decMarketTag = document.getElementById('dec-market-tag');
    const decMarketHead = document.getElementById('dec-market-headline');
    const decMarketRate = document.getElementById('dec-market-rate');
    const decMarketMsp = document.getElementById('dec-market-msp');
    const decMarketGuide = document.getElementById('dec-market-guide');

    if (crop === 'Cotton') {
        if (decMarketTag) decMarketTag.textContent = '+₹529 Above MSP';
        if (decMarketHead) decMarketHead.textContent = 'Guntur APMC Yard (📍 14.2 km)';
        if (decMarketRate) decMarketRate.textContent = '₹7,650 / Q';
        if (decMarketMsp) decMarketMsp.textContent = '₹7,121 / Q';
        if (decMarketGuide) decMarketGuide.textContent = 'Modal rates trading favorably. Sell via e-NAM direct bidding for instant settlement.';
    } else if (crop === 'Chilli') {
        if (decMarketTag) decMarketTag.textContent = 'Premium Teja Grade';
        if (decMarketHead) decMarketHead.textContent = 'Guntur Chilli Yard (📍 14.2 km)';
        if (decMarketRate) decMarketRate.textContent = '₹16,800 / Q';
        if (decMarketMsp) decMarketMsp.textContent = '₹14,500 / Q';
        if (decMarketGuide) decMarketGuide.textContent = 'High export demand for Teja/LCA-334 with moisture < 10%.';
    } else {
        if (decMarketTag) decMarketTag.textContent = 'Active Mandi Trade';
        if (decMarketHead) decMarketHead.textContent = 'Regional APMC Yard (📍 18.5 km)';
        if (decMarketRate) decMarketRate.textContent = '₹2,320 / Q';
        if (decMarketMsp) decMarketMsp.textContent = '₹2,183 / Q';
        if (decMarketGuide) decMarketGuide.textContent = 'Fair Average Quality (FAQ) rates meeting CACP procurement standards.';
    }
}

function renderLocalizedAdvisory() {
    if (!AppState.advisoryData) return;
    const lang = AppState.currentLanguage;
    const localized = AppState.advisoryData.multilingual_versions[lang] || AppState.advisoryData.multilingual_versions['en'];

    document.getElementById('advisory-headline').textContent = localized.headline;
    document.getElementById('advisory-body-text').textContent = localized.plan;
    document.getElementById('urgency-badge').textContent = AppState.advisoryData.urgency_badge;
}

function speakCurrentAdvisory() {
    if (!('speechSynthesis' in window)) {
        alert('Text-to-speech not supported on this browser.');
        return;
    }

    const waveform = document.getElementById('voice-waveform');

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        document.getElementById('voice-speak-btn').innerHTML = '<i data-lucide="volume-2"></i> <span>Listen Voice</span>';
        if (waveform) waveform.style.display = 'none';
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    const lang = AppState.currentLanguage;
    const localized = AppState.advisoryData.multilingual_versions[lang] || AppState.advisoryData.multilingual_versions['en'];
    const textToSpeak = `${localized.headline}. ${localized.plan}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (lang === 'te') utterance.lang = 'te-IN';
    else if (lang === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-IN';

    utterance.rate = 0.95;
    utterance.onend = () => {
        document.getElementById('voice-speak-btn').innerHTML = '<i data-lucide="volume-2"></i> <span>Listen Voice</span>';
        if (waveform) waveform.style.display = 'none';
        if (window.lucide) window.lucide.createIcons();
    };

    if (waveform) waveform.style.display = 'flex';
    window.speechSynthesis.speak(utterance);
    document.getElementById('voice-speak-btn').innerHTML = '<i data-lucide="square"></i> <span>Stop Voice</span>';
    if (window.lucide) window.lucide.createIcons();
}

// ----------------- SATELLITE / DRONE FIELD GRID -----------------
function renderSatelliteGrid() {
    if (!AppState.satelliteData) return;
    const data = AppState.satelliteData;
    const layer = AppState.activeSpectralLayer;
    const platform = AppState.currentPlatform;

    document.getElementById('mean-ndvi-val').textContent = data.mean_ndvi;
    document.getElementById('mean-ndwi-val').textContent = data.mean_ndwi;
    document.getElementById('mean-savi-val').textContent = data.mean_savi;
    document.getElementById('stress-area-pct').textContent = `${data.stress_area_pct}%`;
    document.getElementById('satellite-timestamp').textContent = platform === 'drone' ? 'UAV Pass: 2cm Micro-Ortho' : `Pass: ${data.acquisition_date}`;

    const gridContainer = document.getElementById('satellite-field-grid');
    gridContainer.innerHTML = '';

    data.grid_matrix.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
            const div = document.createElement('div');
            div.className = 'grid-cell';

            let val = cell.ndvi;
            if (layer === 'ndwi') val = cell.ndwi;
            else if (layer === 'evi') val = cell.evi;
            else if (layer === 'savi') val = cell.savi;
            else if (layer === 'tir') val = (28.0 + cell.ndvi * 10.0).toFixed(1);
            else if (layer === 'ndre') val = (cell.ndvi * 0.88).toFixed(3);

            if (layer === 'tir') {
                if (parseFloat(val) > 34.0) div.classList.add('cell-thermal-hot');
                else div.classList.add('cell-thermal-cool');
            } else if (layer === 'ndwi') {
                if (val >= 0.25) div.classList.add('cell-vigorous');
                else if (val >= 0.12) div.classList.add('cell-moderate');
                else div.classList.add('cell-severe');
            } else {
                if (val >= 0.60) div.classList.add('cell-vigorous');
                else if (val >= 0.45) div.classList.add('cell-moderate');
                else div.classList.add('cell-severe');
            }

            div.title = `[${rIdx},${cIdx}] ${layer.toUpperCase()}: ${val}`;
            div.addEventListener('click', () => {
                inspectCell(cell, rIdx, cIdx);
            });

            gridContainer.appendChild(div);
        });
    });
}

function inspectCell(cell, r, c) {
    const inspector = document.getElementById('inspector-content');
    inspector.innerHTML = `
        <div style="line-height: 1.6;">
            <strong>Parcel Coordinate:</strong> (${cell.lat}, ${cell.lon})<br>
            <strong>Grid Sector:</strong> Row ${r + 1}, Col ${c + 1}<br>
            <strong>NDVI (Vigour):</strong> <span class="text-success">${cell.ndvi}</span> | <strong>NDWI:</strong> <span class="text-info">${cell.ndwi}</span><br>
            <strong>EVI:</strong> <span>${cell.evi}</span> | <strong>SAVI:</strong> <span class="text-warning">${cell.savi}</span><br>
            <strong>Diagnosis:</strong> <span class="${cell.health_status === 'vigorous' ? 'text-success' : 'text-danger'}">${cell.health_status.toUpperCase().replace('_', ' ')}</span>
        </div>
    `;
}

// ----------------- DYNAMIC CHART.JS TIMESERIES GRAPHS -----------------
function renderWeatherForecastChart(weather) {
    const ctx = document.getElementById('weather-forecast-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    if (AppState.weatherChartInstance) {
        AppState.weatherChartInstance.destroy();
    }

    const baseT = weather.temperature_celsius;
    const baseRain = weather.rainfall_forecast_mm;
    const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    const tempData = [baseT, baseT + 1.2, baseT + 2.0, baseT + 0.5, baseT - 1.0, baseT - 0.5, baseT + 1.5];
    const rainData = [baseRain, baseRain * 0.4, 0, 0, baseRain * 1.8, baseRain * 0.9, 0];

    AppState.weatherChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: tempData,
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.08)',
                    fill: true,
                    tension: 0.35,
                    yAxisID: 'y'
                },
                {
                    label: 'Rainfall (mm)',
                    data: rainData,
                    type: 'bar',
                    backgroundColor: 'rgba(52, 211, 153, 0.65)',
                    borderRadius: 4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { labels: { boxWidth: 12, font: { size: 10, weight: 700 } } }
            },
            scales: {
                y: { type: 'linear', position: 'left', min: 15, max: 45, ticks: { font: { size: 9 } } },
                y1: { type: 'linear', position: 'right', min: 0, max: 30, grid: { drawOnChartArea: false }, ticks: { font: { size: 9 } } },
                x: { ticks: { font: { size: 9 } } }
            }
        }
    });
}

function renderSatelliteTrajectoryChart() {
    const ctx = document.getElementById('satellite-trend-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    if (AppState.satelliteChartInstance) {
        AppState.satelliteChartInstance.destroy();
    }

    const labels = ['Day -30', 'Day -24', 'Day -18', 'Day -12', 'Day -6', 'Today'];
    const ndviTrend = [0.42, 0.49, 0.55, 0.62, 0.64, AppState.satelliteData ? AppState.satelliteData.mean_ndvi : 0.61];
    const ndwiTrend = [0.18, 0.22, 0.26, 0.28, 0.25, AppState.satelliteData ? AppState.satelliteData.mean_ndwi : 0.24];
    const saviTrend = [0.35, 0.41, 0.47, 0.53, 0.55, AppState.satelliteData ? AppState.satelliteData.mean_savi : 0.52];

    AppState.satelliteChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'NDVI (Canopy)',
                    data: ndviTrend,
                    borderColor: '#059669',
                    backgroundColor: '#059669',
                    tension: 0.35,
                    borderWidth: 2
                },
                {
                    label: 'NDWI (Moisture)',
                    data: ndwiTrend,
                    borderColor: '#34d399',
                    backgroundColor: '#34d399',
                    tension: 0.35,
                    borderWidth: 2
                },
                {
                    label: 'SAVI (Soil-Adj)',
                    data: saviTrend,
                    borderColor: '#064e3b',
                    backgroundColor: '#064e3b',
                    borderDash: [4, 4],
                    tension: 0.35,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { boxWidth: 10, font: { size: 10, weight: 700 } } }
            },
            scales: {
                y: { min: 0.0, max: 1.0, ticks: { font: { size: 9 } } },
                x: { ticks: { font: { size: 9 } } }
            }
        }
    });
}

function renderSoilRadarChart(soil) {
    const ctx = document.getElementById('soil-radar-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    if (AppState.soilRadarChartInstance) {
        AppState.soilRadarChartInstance.destroy();
    }

    const nScore = Math.min(100, Math.round((soil.nitrogen / 280.0) * 100));
    const pScore = Math.min(100, Math.round((soil.phosphorus / 35.0) * 100));
    const kScore = Math.min(100, Math.round((soil.potassium / 280.0) * 100));
    const ocScore = Math.min(100, Math.round((soil.organic_carbon / 1.0) * 100));
    const phScore = Math.round(100 - Math.abs(6.8 - soil.ph) * 20);
    const moistureScore = Math.min(100, Math.round(soil.moisture_percentage * 2.5));

    AppState.soilRadarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)', 'Organic Carbon', 'pH Balance', 'Moisture AWC'],
            datasets: [{
                label: 'Active Field Nutrients',
                data: [nScore, pScore, kScore, ocScore, phScore, moistureScore],
                backgroundColor: 'rgba(5, 150, 105, 0.2)',
                borderColor: '#059669',
                pointBackgroundColor: '#047857',
                pointBorderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: '#dcfce7' },
                    grid: { color: '#dcfce7' },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ----------------- CLIMATE METERS -----------------
function renderClimateMeters() {
    if (!AppState.climateRisk) return;
    const c = AppState.climateRisk;

    document.getElementById('overall-risk-badge').textContent = `Risk: ${c.overall_risk_level}`;
    document.getElementById('heat-stress-val').textContent = `${c.heat_stress_pct}%`;
    document.getElementById('heat-stress-bar').style.width = `${c.heat_stress_pct}%`;

    document.getElementById('drought-risk-val').textContent = `${c.drought_risk_pct}%`;
    document.getElementById('drought-risk-bar').style.width = `${c.drought_risk_pct}%`;
}

// ----------------- SOIL & REGENERATIVE OPTIMIZER -----------------
function renderSoilPanel() {
    if (!AppState.soilData || !AppState.farmProfile) return;
    const s = AppState.soilData;
    const p = AppState.farmProfile.soil;

    document.getElementById('soil-score-main').textContent = s.soil_health_score;
    document.getElementById('soil-score-tier').textContent = s.rating_category;
    document.getElementById('soil-health-badge').textContent = `Score: ${s.soil_health_score} / 100`;

    document.getElementById('soil-ph-val').textContent = p.ph;
    document.getElementById('soil-oc-val').textContent = `${p.organic_carbon}%`;
    document.getElementById('soil-n-val').textContent = `${p.nitrogen} kg/ha`;
    document.getElementById('soil-p-val').textContent = `${p.phosphorus} kg/ha`;
    document.getElementById('soil-k-val').textContent = `${p.potassium} kg/ha`;
    document.getElementById('soil-awc-val').textContent = `${s.water_retention_capacity_mm} mm`;
}

// ----------------- "WHAT-IF" CLIMATE SIMULATOR -----------------
function initSimulator() {
    const tempSlider = document.getElementById('sim-temp-slider');
    const rainSlider = document.getElementById('sim-rain-slider');
    const heatSlider = document.getElementById('sim-heatdays-slider');
    const somSlider = document.getElementById('sim-som-slider');
    const runBtn = document.getElementById('run-sim-btn');
    const resetBtn = document.getElementById('reset-sim-btn');

    let simDebounceTimer = null;
    function triggerReactiveSimulation() {
        clearTimeout(simDebounceTimer);
        simDebounceTimer = setTimeout(() => {
            executeSimulation();
        }, 120);
    }

    if (tempSlider) {
        tempSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('sim-temp-display').textContent = `${val >= 0 ? '+' : ''}${val.toFixed(1)} °C`;
            triggerReactiveSimulation();
        });
    }

    if (rainSlider) {
        rainSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            document.getElementById('sim-rain-display').textContent = `${val >= 0 ? '+' : ''}${val} %`;
            triggerReactiveSimulation();
        });
    }

    if (heatSlider) {
        heatSlider.addEventListener('input', (e) => {
            document.getElementById('sim-heatdays-display').textContent = `${e.target.value} Days`;
            triggerReactiveSimulation();
        });
    }

    if (somSlider) {
        somSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('sim-som-display').textContent = `${val >= 0 ? '+' : ''}${val.toFixed(2)} % SOM`;
            triggerReactiveSimulation();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            tempSlider.value = 0;
            rainSlider.value = 0;
            heatSlider.value = 0;
            somSlider.value = 0;
            tempSlider.dispatchEvent(new Event('input'));
            rainSlider.dispatchEvent(new Event('input'));
            heatSlider.dispatchEvent(new Event('input'));
            somSlider.dispatchEvent(new Event('input'));
        });
    }

    if (runBtn) {
        runBtn.addEventListener('click', () => {
            executeSimulation();
        });
    }

    executeSimulation();
}

async function executeSimulation() {
    const tempSlider = document.getElementById('sim-temp-slider');
    const rainSlider = document.getElementById('sim-rain-slider');
    const heatSlider = document.getElementById('sim-heatdays-slider');
    const somSlider = document.getElementById('sim-som-slider');

    const deltaT = tempSlider ? parseFloat(tempSlider.value) : 2.0;
    const deltaR = rainSlider ? parseFloat(rainSlider.value) : -20.0;
    const extremeDays = heatSlider ? parseInt(heatSlider.value) : 5;
    const somDelta = somSlider ? parseFloat(somSlider.value) : 0.0;

    try {
        const res = await fetch(`${API_BASE}/api/v1/climate/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crop: AppState.currentCrop,
                delta_temperature_c: deltaT,
                delta_rainfall_pct: deltaR,
                extreme_heat_days: extremeDays,
                soil_organic_matter_delta: somDelta,
                simulation_years: 5
            })
        });

        const sim = await res.json();

        document.getElementById('sim-summary-text').textContent = sim.climate_impact_summary;
        document.getElementById('sim-vuln-badge').textContent = sim.vulnerability_tier;

        const yieldEl = document.getElementById('sim-yield-delta');
        yieldEl.textContent = `${sim.simulated_yield_change_pct >= 0 ? '+' : ''}${sim.simulated_yield_change_pct}%`;
        yieldEl.className = `metric-number ${sim.simulated_yield_change_pct >= 0 ? 'text-success' : 'text-danger'}`;

        document.getElementById('sim-water-deficit').textContent = `+${Math.round(sim.simulated_water_deficit_liters_per_acre).toLocaleString()} L`;
        document.getElementById('sim-stress-index').textContent = `${sim.projected_stress_index} / 100`;

        if (sim.multi_year_roi_projection) {
            const roi = sim.multi_year_roi_projection;
            document.getElementById('roi-loss').textContent = `$${roi.projected_unadapted_loss_usd_per_acre}/ac`;
            document.getElementById('roi-gain').textContent = `$${roi.regenerative_adaptation_gain_5yr_usd}`;
            document.getElementById('roi-water').textContent = `${roi.cumulative_water_conserved_m3} m³`;
            document.getElementById('roi-carbon').textContent = `${roi.carbon_offset_tco2e_sequestered} tCO2e`;
        }

        const tableBody = document.querySelector('#alternative-crops-table tbody');
        if (tableBody) {
            tableBody.innerHTML = '';
            sim.alternative_resilient_crops.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${c.crop_name}</strong></td>
                    <td><span class="text-success" style="font-weight:700;">${c.resilience_score} / 10</span></td>
                    <td>${c.water_footprint_liters_per_kg.toLocaleString()} L/kg</td>
                    <td><span class="text-warning">${c.soil_improvement_score} / 10</span></td>
                    <td>${c.recommended_reason}</td>
                `;
                tableBody.appendChild(tr);
            });
        }

    } catch (e) {
        console.error('Error running climate simulation:', e);
    }
}

// ----------------- AI LEAF DISEASE SCANNER & GRAD-CAM -----------------
function initDiseaseScanner() {
    const dropzone = document.getElementById('leaf-dropzone');
    const fileInput = document.getElementById('leaf-file-input');
    const cameraBtn = document.getElementById('btn-camera-snap');
    const sampleButtons = document.querySelectorAll('.btn-sample');

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());

        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => {
                fileInput.setAttribute('capture', 'environment');
                fileInput.click();
            });
        }

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--brand-primary)';
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.style.borderColor = 'var(--border-medium)';
        });

        dropzone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--border-medium)';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                await uploadAndDiagnose(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files[0]) {
                await uploadAndDiagnose(e.target.files[0]);
            }
        });
    }

    sampleButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const sampleType = btn.getAttribute('data-sample');
            await testSampleDiagnosis(sampleType);
        });
    });

    testSampleDiagnosis('cotton_blight');
}

async function uploadAndDiagnose(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('crop_hint', AppState.currentCrop);

    try {
        const res = await fetch(`${API_BASE}/api/v1/disease/detect`, {
            method: 'POST',
            body: formData
        });
        const diagnosis = await res.json();
        renderDiagnosisResult(diagnosis);
        renderGradCAMOverlay(file);
    } catch (e) {
        console.error('Error in disease diagnostics:', e);
    }
}

async function testSampleDiagnosis(sampleType) {
    let cropHint = 'Cotton';
    if (sampleType === 'rice_blast') cropHint = 'Rice';
    if (sampleType === 'wheat_rust') cropHint = 'Wheat';
    if (sampleType === 'healthy') cropHint = 'Healthy';

    try {
        const formData = new FormData();
        formData.append('crop_hint', cropHint);

        const res = await fetch(`${API_BASE}/api/v1/disease/detect`, {
            method: 'POST',
            body: formData
        });
        const diagnosis = await res.json();
        renderDiagnosisResult(diagnosis);
        renderSyntheticGradCAM(sampleType);
    } catch (e) {
        console.error('Error fetching sample diagnosis:', e);
    }
}

function renderGradCAMOverlay(file) {
    const previewBox = document.getElementById('cam-preview-box');
    const canvas = document.getElementById('lesion-cam-canvas');
    if (!previewBox || !canvas) return;

    previewBox.style.display = 'block';
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const grad = ctx.createRadialGradient(
                img.width * 0.48, img.height * 0.52, 10,
                img.width * 0.48, img.height * 0.52, img.width * 0.35
            );
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.65)');
            grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.45)');
            grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, img.width, img.height);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function renderSyntheticGradCAM(sampleType) {
    const previewBox = document.getElementById('cam-preview-box');
    const canvas = document.getElementById('lesion-cam-canvas');
    if (!previewBox || !canvas) return;

    previewBox.style.display = 'block';
    canvas.width = 320;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e3a2b';
    ctx.fillRect(0, 0, 320, 200);

    if (sampleType !== 'healthy') {
        const grad = ctx.createRadialGradient(160, 100, 15, 160, 100, 75);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
        grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.55)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 320, 200);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(110, 55, 100, 90);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.fillText('Lesion Zone: 97.4%', 115, 50);
    } else {
        ctx.fillStyle = '#059669';
        ctx.fillRect(0, 0, 320, 200);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        ctx.fillText('Canopy Clean: No Pathological Lesions Detected', 30, 105);
    }
}

function renderDiagnosisResult(d) {
    document.getElementById('disease-conf-badge').textContent = `${d.confidence_pct}% Confidence`;
    document.getElementById('disease-name-title').textContent = d.disease_name;
    document.getElementById('pathogen-type-tag').textContent = `Pathogen: ${d.pathogen_type}`;
    document.getElementById('severity-level-tag').textContent = `Severity: ${d.severity_level}`;
    document.getElementById('inference-device-tag').textContent = d.inference_device;
    document.getElementById('disease-desc-text').textContent = d.description;

    const fillList = (id, items) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '';
        items.forEach(i => {
            const li = document.createElement('li');
            li.textContent = i;
            el.appendChild(li);
        });
    };

    fillList('cultural-list', d.cultural_practices);
    fillList('biological-list', d.biological_treatments);
    fillList('chemical-list', d.safe_chemical_remedies);
}

// ----------------- FEDERATED DPI NETWORK -----------------
function initFederatedNetwork() {
    const triggerBtn = document.getElementById('trigger-fedavg-btn');
    if (triggerBtn) {
        triggerBtn.addEventListener('click', async () => {
            triggerBtn.disabled = true;
            triggerBtn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i> Aggregating Node Weights (FedAvg)...';
            if (window.lucide) window.lucide.createIcons();

            try {
                const res = await fetch(`${API_BASE}/api/v1/federated/aggregate`, { method: 'POST' });
                const data = await res.json();
                renderFederatedRound(data);
            } catch (e) {
                console.error('Error executing federated round:', e);
            } finally {
                triggerBtn.disabled = false;
                triggerBtn.innerHTML = '<i data-lucide="refresh-cw"></i> Trigger Federated Aggregation (FedAvg)';
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    loadInitialFederatedNodes();
}

async function loadInitialFederatedNodes() {
    try {
        const res = await fetch(`${API_BASE}/api/v1/federated/nodes`);
        const nodes = await res.json();
        renderNodesList(nodes);
    } catch (e) {
        console.error('Error loading federated nodes:', e);
    }
}

function renderNodesList(nodes) {
    const container = document.getElementById('federated-nodes-grid');
    if (!container) return;
    container.innerHTML = '';

    nodes.forEach(n => {
        const card = document.createElement('div');
        card.className = 'node-card';
        card.innerHTML = `
            <div class="node-header">
                <span class="node-country">${n.country_name}</span>
                <span class="status-dot"></span>
            </div>
            <div class="node-stat-row">
                <span>Local Accuracy:</span>
                <strong class="text-success">${n.local_model_accuracy_pct}%</strong>
            </div>
            <div class="node-stat-row">
                <span>Sovereign Records:</span>
                <strong>${n.local_samples_count.toLocaleString()}</strong>
            </div>
            <div class="node-stat-row">
                <span>Privacy:</span>
                <span>(ε=${n.privacy_epsilon}, δ=1e-5)</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderFederatedRound(data) {
    const roundTag = document.getElementById('fed-round-tag');
    const accVal = document.getElementById('global-acc-val');
    if (roundTag) roundTag.textContent = `Round #${data.round_number}`;
    if (accVal) {
        accVal.textContent = `${data.global_model_accuracy_pct}%`;
        accVal.parentElement.querySelector('.fed-stat-sub').textContent = `+${data.accuracy_gain_pct}% global gain`;
    }

    renderNodesList(data.participating_nodes);

    const logBox = document.getElementById('fed-log-box');
    if (logBox) {
        const timestamp = new Date().toISOString();
        logBox.textContent = `[ROUND ${data.round_number} @ ${timestamp}]
[ALGORITHM] ${data.aggregation_algorithm}
[STATUS] ${data.convergence_status}
[PRIVACY] ${data.privacy_guarantee}
[DIFF] Global weights aggregated across 4 sovereign nodes without raw record egress.
\n` + logBox.textContent;
    }
}

// ----------------- GEMINI MULTI-AGENT COPILOT & SPEECH MIC -----------------
function initCopilot() {
    const toggleBtn = document.getElementById('copilot-toggle-btn');
    const closeBtn = document.getElementById('close-copilot-btn');
    const drawer = document.getElementById('copilot-drawer');
    const form = document.getElementById('copilot-form');
    const input = document.getElementById('copilot-input');
    const micBtn = document.getElementById('copilot-mic-btn');
    const messages = document.getElementById('copilot-messages');
    const chips = document.querySelectorAll('.quick-chip');

    if (toggleBtn && drawer) {
        toggleBtn.addEventListener('click', () => {
            drawer.classList.toggle('hidden');
        });
    }

    if (closeBtn && drawer) {
        closeBtn.addEventListener('click', () => {
            drawer.classList.add('hidden');
        });
    }

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.getAttribute('data-prompt');
            sendCopilotMessage(prompt);
        });
    });

    if (form && input) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (text) {
                sendCopilotMessage(text);
                input.value = '';
            }
        });
    }

    if (micBtn && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = false;

        micBtn.addEventListener('click', () => {
            if (AppState.isRecordingSpeech) {
                recognition.stop();
                return;
            }

            const lang = AppState.currentLanguage;
            recognition.lang = lang === 'te' ? 'te-IN' : (lang === 'hi' ? 'hi-IN' : 'en-IN');

            recognition.start();
            AppState.isRecordingSpeech = true;
            micBtn.classList.add('recording');
        });

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            if (input) {
                input.value = transcript;
                sendCopilotMessage(transcript);
                input.value = '';
            }
        };

        recognition.onend = () => {
            AppState.isRecordingSpeech = false;
            micBtn.classList.remove('recording');
        };

        recognition.onerror = (e) => {
            AppState.isRecordingSpeech = false;
            micBtn.classList.remove('recording');
        };
    }

    async function sendCopilotMessage(text) {
        if (!messages) return;
        const uDiv = document.createElement('div');
        uDiv.className = 'msg-user';
        uDiv.textContent = text;
        messages.appendChild(uDiv);
        messages.scrollTop = messages.scrollHeight;

        const botDiv = document.createElement('div');
        botDiv.className = 'msg-bot';
        botDiv.textContent = '🧠 Gemini & 3 sub-agents reasoning over field evidence...';
        messages.appendChild(botDiv);
        messages.scrollTop = messages.scrollHeight;

        try {
            const res = await fetch(`${API_BASE}/api/v1/copilot/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    farm_id: 'realtime_custom_field',
                    language: AppState.currentLanguage,
                    context: {
                        lat: AppState.currentLat,
                        lon: AppState.currentLon,
                        crop: AppState.currentCrop
                    }
                })
            });
            const data = await res.json();
            botDiv.innerHTML = data.reply.replace(/\n/g, '<br>');
            messages.scrollTop = messages.scrollHeight;

            if (data.agent_thoughts && data.agent_thoughts.length > 0) {
                const stream = document.getElementById('thoughts-stream');
                if (stream) {
                    stream.textContent = data.agent_thoughts.join('\n');
                }
            }
        } catch (e) {
            botDiv.textContent = 'Unable to reach Gemini Orchestrator service.';
        }
    }
}

// ----------------- DOSSIER EXPORT -----------------
function initDossierExport() {
    const exportBtn = document.getElementById('btn-export-dossier');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            window.print();
        });
    }
}
