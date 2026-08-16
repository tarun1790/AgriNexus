/**
 * AgriNexus — Frontend Application Logic
 * Integrates Field Digital Twins, Satellite Zonation, What-If Climate Simulator,
 * Disease Scanner, and Federated DPI Interoperability Layer.
 */

const API_BASE = '';

const AppState = {
    currentFarmId: 'farm_in_cotton_01',
    currentLanguage: 'en',
    farmProfile: null,
    satelliteData: null,
    soilData: null,
    climateRisk: null,
    advisoryData: null,
    diseaseData: null,
    federatedData: null,
    isPlayingAudio: false
};

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    initTabs();
    initControls();
    initSimulator();
    initDiseaseScanner();
    initFederatedNetwork();
    
    // Load initial health and data
    await checkSystemHealth();
    await loadFarmData(AppState.currentFarmId);
});

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

            if (window.lucide) window.lucide.createIcons();
        });
    });
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

    farmSelect.addEventListener('change', async (e) => {
        AppState.currentFarmId = e.target.value;
        await loadFarmData(AppState.currentFarmId);
    });

    langSelect.addEventListener('change', (e) => {
        AppState.currentLanguage = e.target.value;
        renderLocalizedAdvisory();
    });

    voiceBtn.addEventListener('click', () => {
        speakCurrentAdvisory();
    });
}

// ----------------- DATA LOADING & ADVISORY -----------------
async function loadFarmData(farmId) {
    try {
        // Fetch farm profile
        const farmRes = await fetch(`${API_BASE}/api/v1/farms/${farmId}`);
        AppState.farmProfile = await farmRes.json();

        // Fetch satellite indices
        const satRes = await fetch(`${API_BASE}/api/v1/satellite/indices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lat: AppState.farmProfile.field.latitude,
                lon: AppState.farmProfile.field.longitude,
                crop: AppState.farmProfile.crop
            })
        });
        AppState.satelliteData = await satRes.json();

        // Fetch soil health
        const soilRes = await fetch(`${API_BASE}/api/v1/soil/health`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(AppState.farmProfile.soil)
        });
        AppState.soilData = await soilRes.json();

        // Fetch climate risk
        const climRes = await fetch(`${API_BASE}/api/v1/climate/risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                weather: AppState.farmProfile.weather,
                soil: AppState.farmProfile.soil,
                crop: AppState.farmProfile.crop
            })
        });
        AppState.climateRisk = await climRes.json();

        // Fetch advisory
        const advRes = await fetch(`${API_BASE}/api/v1/advisory/generate?farm_id=${farmId}`, {
            method: 'POST'
        });
        AppState.advisoryData = await advRes.json();

        // Render UI panels
        renderAdvisoryPanel();
        renderSatelliteGrid();
        renderSoilPanel();
        renderClimateMeters();

    } catch (err) {
        console.error('Error loading farm data:', err);
    }
}

function renderAdvisoryPanel() {
    if (!AppState.advisoryData) return;
    renderLocalizedAdvisory();

    const irrVol = AppState.advisoryData.irrigation_prescription.liters_per_acre;
    const irrWin = AppState.advisoryData.irrigation_prescription.urgency_window;
    document.getElementById('presc-irr-vol').textContent = irrVol > 0 ? `${irrVol.toLocaleString()} L / Acre` : '0 L (Adequate)';
    document.getElementById('presc-irr-window').textContent = `Window: ${irrWin}`;

    const fertN = AppState.advisoryData.fertilizer_prescription.nitrogen_status;
    document.getElementById('presc-fert-title').textContent = `Nitrogen: ${fertN}`;
    document.getElementById('presc-fert-note').textContent = AppState.advisoryData.fertilizer_prescription.recommendation;
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

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        document.getElementById('voice-speak-btn').innerHTML = '<i data-lucide="volume-2"></i> <span>Listen Voice</span>';
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
        if (window.lucide) window.lucide.createIcons();
    };

    window.speechSynthesis.speak(utterance);
    document.getElementById('voice-speak-btn').innerHTML = '<i data-lucide="square"></i> <span>Stop Voice</span>';
    if (window.lucide) window.lucide.createIcons();
}

// ----------------- SATELLITE FIELD GRID -----------------
function renderSatelliteGrid() {
    if (!AppState.satelliteData) return;
    const data = AppState.satelliteData;

    document.getElementById('mean-ndvi-val').textContent = data.mean_ndvi;
    document.getElementById('mean-ndwi-val').textContent = data.mean_ndwi;
    document.getElementById('vigour-area-pct').textContent = `${data.healthy_area_pct}%`;
    document.getElementById('stress-area-pct').textContent = `${data.stress_area_pct}%`;
    document.getElementById('satellite-timestamp').textContent = `Pass: ${data.acquisition_date}`;

    const gridContainer = document.getElementById('satellite-field-grid');
    gridContainer.innerHTML = '';

    data.grid_matrix.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
            const div = document.createElement('div');
            div.className = 'grid-cell';

            if (cell.health_status === 'vigorous') {
                div.classList.add('cell-vigorous');
            } else if (cell.health_status === 'moderate_stress') {
                div.classList.add('cell-moderate');
            } else {
                div.classList.add('cell-severe');
            }

            div.title = `Parcel [${rIdx},${cIdx}] NDVI: ${cell.ndvi} | NDWI: ${cell.ndwi}`;
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
            <strong>NDVI (Vigour):</strong> <span class="text-success">${cell.ndvi}</span><br>
            <strong>NDWI (Moisture):</strong> <span class="text-info">${cell.ndwi}</span><br>
            <strong>Status:</strong> <span class="${cell.health_status === 'vigorous' ? 'text-success' : 'text-danger'}">${cell.health_status.toUpperCase().replace('_', ' ')}</span>
        </div>
    `;
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

    document.getElementById('flood-risk-val').textContent = `${c.flood_risk_pct}%`;
    document.getElementById('flood-risk-bar').style.width = `${c.flood_risk_pct}%`;

    document.getElementById('disease-risk-val').textContent = `${c.disease_conducive_risk_pct}%`;
    document.getElementById('disease-risk-bar').style.width = `${c.disease_conducive_risk_pct}%`;
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
    document.getElementById('carbon-usd-val').textContent = s.carbon_credit_potential_est_usd.toFixed(2);

    const recsList = document.getElementById('regenerative-practices-list');
    recsList.innerHTML = '';

    s.regenerative_recommendations.forEach(r => {
        const item = document.createElement('div');
        item.className = 'rec-item';
        item.innerHTML = `
            <div class="rec-header">
                <span class="rec-title">${r.practice_name}</span>
                <span class="rec-badge">${r.impact_category}</span>
            </div>
            <p class="rec-desc">${r.description}</p>
            <div class="rec-metrics">
                <span>🌱 +${r.soil_carbon_gain_tons_per_yr} t Carbon/yr</span>
                <span>💧 +${r.water_saving_pct}% Water Saved</span>
                <span>⚡ ${r.implementation_urgency}</span>
            </div>
        `;
        recsList.appendChild(item);
    });
}

// ----------------- "WHAT-IF" CLIMATE SIMULATOR -----------------
function initSimulator() {
    const tempSlider = document.getElementById('sim-temp-slider');
    const rainSlider = document.getElementById('sim-rain-slider');
    const heatSlider = document.getElementById('sim-heatdays-slider');
    const somSlider = document.getElementById('sim-som-slider');
    const runBtn = document.getElementById('run-sim-btn');
    const resetBtn = document.getElementById('reset-sim-btn');

    tempSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        document.getElementById('sim-temp-display').textContent = `${val >= 0 ? '+' : ''}${val.toFixed(1)} °C`;
    });

    rainSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        document.getElementById('sim-rain-display').textContent = `${val >= 0 ? '+' : ''}${val} %`;
    });

    heatSlider.addEventListener('input', (e) => {
        document.getElementById('sim-heatdays-display').textContent = `${e.target.value} Days`;
    });

    somSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        document.getElementById('sim-som-display').textContent = `${val >= 0 ? '+' : ''}${val.toFixed(2)} % SOM`;
    });

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

    runBtn.addEventListener('click', () => {
        executeSimulation();
    });

    // Run baseline simulation
    executeSimulation();
}

async function executeSimulation() {
    const deltaT = parseFloat(document.getElementById('sim-temp-slider').value);
    const deltaR = parseFloat(document.getElementById('sim-rain-slider').value);
    const extremeDays = parseInt(document.getElementById('sim-heatdays-slider').value);
    const somDelta = parseFloat(document.getElementById('sim-som-slider').value);

    try {
        const res = await fetch(`${API_BASE}/api/v1/climate/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crop: AppState.farmProfile ? AppState.farmProfile.crop : 'Cotton',
                delta_temperature_c: deltaT,
                delta_rainfall_pct: deltaR,
                extreme_heat_days: extremeDays,
                soil_organic_matter_delta: somDelta
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

        const tableBody = document.querySelector('#alternative-crops-table tbody');
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

    } catch (e) {
        console.error('Error running climate simulation:', e);
    }
}

// ----------------- AI LEAF DISEASE SCANNER -----------------
function initDiseaseScanner() {
    const dropzone = document.getElementById('leaf-dropzone');
    const fileInput = document.getElementById('leaf-file-input');
    const sampleButtons = document.querySelectorAll('.btn-sample');

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--brand-primary)';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'var(--border-subtle)';
    });

    dropzone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border-subtle)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await uploadAndDiagnose(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            await uploadAndDiagnose(e.target.files[0]);
        }
    });

    sampleButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const sampleType = btn.getAttribute('data-sample');
            await testSampleDiagnosis(sampleType);
        });
    });

    // Default diagnosis preview
    testSampleDiagnosis('cotton_blight');
}

async function uploadAndDiagnose(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('crop_hint', AppState.farmProfile ? AppState.farmProfile.crop : 'Cotton');

    try {
        const res = await fetch(`${API_BASE}/api/v1/disease/detect`, {
            method: 'POST',
            body: formData
        });
        const diagnosis = await res.json();
        renderDiagnosisResult(diagnosis);
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
    } catch (e) {
        console.error('Error fetching sample diagnosis:', e);
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
    document.getElementById('fed-round-tag').textContent = `Round #${data.round_number}`;
    document.getElementById('global-acc-val').textContent = `${data.global_model_accuracy_pct}%`;
    document.getElementById('global-acc-val').parentElement.querySelector('.fed-stat-sub').textContent = `+${data.accuracy_gain_pct}% global gain`;

    renderNodesList(data.participating_nodes);

    const logBox = document.getElementById('fed-log-box');
    const timestamp = new Date().toISOString();
    logBox.textContent = `[ROUND ${data.round_number} @ ${timestamp}]
[ALGORITHM] ${data.aggregation_algorithm}
[STATUS] ${data.convergence_status}
[PRIVACY] ${data.privacy_guarantee}
[DIFF] Global weights aggregated across 4 sovereign nodes without raw record egress.
\n` + logBox.textContent;
}
