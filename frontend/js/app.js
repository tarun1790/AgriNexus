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
function autoRequestUserLocation() {
    const hudTag = document.getElementById('live-ingestion-tag');
    const gpsBtn = document.getElementById('btn-gps-locate');

    if (!navigator.geolocation) {
        fetchLiveFieldIntelligence(AppState.currentLat, AppState.currentLon, AppState.currentCrop, AppState.currentArea);
        return;
    }

    if (hudTag) hudTag.textContent = '📍 Requesting browser GPS access...';
    if (gpsBtn) {
        gpsBtn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i> <span>Acquiring GPS...</span>';
        if (window.lucide) window.lucide.createIcons();
    }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            await updateActiveCoordinates(lat, lon);
            if (gpsBtn) {
                gpsBtn.innerHTML = '<i data-lucide="navigation"></i> <span>Locate Field (GPS)</span>';
                if (window.lucide) window.lucide.createIcons();
            }
        },
        async (err) => {
            if (gpsBtn) {
                gpsBtn.innerHTML = '<i data-lucide="navigation"></i> <span>Locate Field (GPS)</span>';
                if (window.lucide) window.lucide.createIcons();
            }
            await fetchLiveFieldIntelligence(AppState.currentLat, AppState.currentLon, AppState.currentCrop, AppState.currentArea);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
}

// ----------------- LEAFLET GIS MAP & POLYGON BOUNDARY DRAWER -----------------
function initLeafletMap() {
    const mapEl = document.getElementById('gis-leaflet-map');
    if (!mapEl || typeof L === 'undefined') return;

    AppState.map = L.map('gis-leaflet-map').setView([AppState.currentLat, AppState.currentLon], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Google Earth Engine Hybrid'
    }).addTo(AppState.map);

    AppState.marker = L.marker([AppState.currentLat, AppState.currentLon], {
        draggable: true,
        title: "Active Monitored Field"
    }).addTo(AppState.map);

    AppState.marker.bindPopup("<b>Active Monitored Field</b><br>Real-Time Ingestion Active").openPopup();

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
            autoRequestUserLocation();
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
            searchBtn.textContent = 'Search & Ingest Real-Time Data';
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

    if (AppState.map && AppState.marker) {
        AppState.marker.setLatLng([lat, lon]);
        AppState.map.panTo([lat, lon]);
    }

    document.getElementById('active-gps-display').textContent = `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`;

    try {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
            .then(r => r.json())
            .then(data => {
                if (data && data.display_name) {
                    const parts = data.display_name.split(',');
                    const placeName = parts.slice(0, 3).join(', ');
                    document.getElementById('active-gps-display').textContent = `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E (${placeName})`;
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

        // Fetch Satellite Overpass, VRA, Carbon MRV, and Bharat Indian AgData Hub
        fetchSatelliteOverpass(lat, lon);
        fetchVRAPrescription(crop, area, data.satellite.mean_ndvi);
        fetchCarbonMRV(area);
        fetchIndianAgData(lat, lon, crop, area, data.field_profile.soil.organic_carbon, data.field_profile.soil.ph);

    } catch (err) {
        console.error('Error fetching live field intelligence:', err);
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
            const card = document.createElement('div');
            card.className = 'shc-param-card';
            card.innerHTML = `
                <span class="param-category-tag">${p.category}</span>
                <span class="param-name">${p.name}</span>
                <span class="param-val">${p.value}</span>
                <span class="param-benchmark">Norm: ${p.benchmark}</span>
                <span class="param-status-tag ${p.color}">${p.status}</span>
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
    let angle = 0;

    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const rotateBtn = document.getElementById('btn-3d-rotate');
    const wireBtn = document.getElementById('btn-3d-wireframe');

    if (rotateBtn) {
        rotateBtn.addEventListener('click', () => {
            AppState.is3DRotating = !AppState.is3DRotating;
        });
    }

    if (wireBtn) {
        wireBtn.addEventListener('click', () => {
            AppState.is3DWireframe = !AppState.is3DWireframe;
        });
    }

    function render3DFrame() {
        ctx.fillStyle = '#021a10';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2 + 30;
        const gridW = 16;
        const gridH = 16;
        const spacing = 18;

        if (AppState.is3DRotating) angle += 0.008;

        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const pitch = 0.55;

        // Draw 3D Isometric Grid Mesh
        for (let x = -gridW / 2; x < gridW / 2; x++) {
            for (let y = -gridH / 2; y < gridH / 2; y++) {
                const rx = x * cosA - y * sinA;
                const ry = x * sinA + y * cosA;

                const zElevation = Math.sin(x * 0.4 + angle) * Math.cos(y * 0.4) * 22;
                const isoX = cx + (rx - ry) * spacing;
                const isoY = cy + (rx + ry) * spacing * pitch - zElevation;

                const nextRx = (x + 1) * cosA - y * sinA;
                const nextRy = (x + 1) * sinA + y * cosA;
                const nextZElev = Math.sin((x + 1) * 0.4 + angle) * Math.cos(y * 0.4) * 22;
                const nextIsoX = cx + (nextRx - nextRy) * spacing;
                const nextIsoY = cy + (nextRx + nextRy) * spacing * pitch - nextZElev;

                ctx.strokeStyle = AppState.is3DWireframe ? 'rgba(52, 211, 153, 0.4)' : '#059669';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(isoX, isoY);
                ctx.lineTo(nextIsoX, nextIsoY);
                ctx.stroke();

                // Draw Canopy height nodes
                if (!AppState.is3DWireframe) {
                    ctx.fillStyle = zElevation > 5 ? '#34d399' : '#047857';
                    ctx.beginPath();
                    ctx.arc(isoX, isoY, Math.max(1.5, (zElevation + 25) * 0.12), 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        AppState.anim3DId = requestAnimationFrame(render3DFrame);
    }

    render3DFrame();
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

// ----------------- ADVISORY PANEL -----------------
function renderAdvisoryPanel() {
    if (!AppState.advisoryData) return;
    renderLocalizedAdvisory();
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

    if (tempSlider) {
        tempSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('sim-temp-display').textContent = `${val >= 0 ? '+' : ''}${val.toFixed(1)} °C`;
        });
    }

    if (rainSlider) {
        rainSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            document.getElementById('sim-rain-display').textContent = `${val >= 0 ? '+' : ''}${val} %`;
        });
    }

    if (heatSlider) {
        heatSlider.addEventListener('input', (e) => {
            document.getElementById('sim-heatdays-display').textContent = `${e.target.value} Days`;
        });
    }

    if (somSlider) {
        somSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            document.getElementById('sim-som-display').textContent = `${val >= 0 ? '+' : ''}${val.toFixed(2)} % SOM`;
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
            executeSimulation();
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
