import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Optional, List, Dict, Any

from backend.models.schemas import (
    FarmProfile,
    FieldCoordinates,
    SoilData,
    WeatherData,
    SatelliteAnalysisResponse,
    SoilHealthResponse,
    ClimateRiskAssessment,
    WhatIfSimulationRequest,
    WhatIfSimulationResponse,
    DiseaseDetectionResponse,
    LocalizedAdvisoryResponse,
    FederatedNodeStatus,
    FederatedAggregationResponse,
    CopilotChatRequest,
    CopilotChatResponse,
    IoTProbeTelemetry
)
from backend.services.satellite_engine import satellite_engine
from backend.services.soil_engine import soil_engine
from backend.services.climate_engine import climate_engine
from backend.services.disease_engine import disease_engine
from backend.services.advisory_engine import advisory_engine
from backend.services.federated_engine import federated_engine
from backend.services.gemini_service import gemini_service
from backend.services.earth_engine_service import earth_engine_service
from backend.services.vertex_ai_service import vertex_ai_service
from backend.services.gcp_speech_service import gcp_speech_service
from backend.services.bigquery_service import bigquery_service
from backend.services.public_data_service import public_data_service
from backend.services.agent_orchestrator import agent_orchestrator
from backend.services.iot_telemetry_service import iot_service
from backend.services.live_weather_service import live_weather_service
from backend.services.live_soil_service import live_soil_service
from backend.data.demo_samples import DEMO_FARMS

app = FastAPI(
    title="AgriNexus API — AI Digital Public Infrastructure for Climate-Resilient Agriculture",
    version="2.5.0",
    description="Live Real-Time Cross-Border Agronomic Intelligence DPI powered by Google AI (Gemini, Vertex AI, Google Earth Engine, BigQuery, Cloud Speech), Live Meteorological Ingestion, and Federated Learning."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- SYSTEM & GOOGLE AI HEALTH -----------------
@app.get("/api/v1/health")
def health_check():
    import torch
    return {
        "status": "online",
        "service": "AgriNexus Real-Time Agricultural Intelligence Engine v2.5",
        "live_data_ingestion": {
            "meteorological_stream": "Open-Meteo & IMD High-Resolution Real-Time Grids",
            "soilgrids_stream": "ISRIC Global SoilGrids 250m REST API",
            "satellite_stream": "Google Earth Engine & Copernicus Sentinel-2 MSI (10m)"
        },
        "google_ai_stack": {
            "generative_ai": "Google Gemini 1.5 Pro / Flash & Vertex AI GenAI",
            "agentic_orchestration": "Gemini Multi-Agent Autonomous Agronomic Orchestrator",
            "predictive_modelling": "Vertex AI AutoML & Model Serving",
            "vision_multimodal": "Gemini Multimodal Vision & Vertex AI Vision",
            "geospatial": "Google Earth Engine & Copernicus Sentinel-2 MSI",
            "voice_multilingual": "Google Cloud Text-to-Speech & Cloud Translation",
            "data_warehouse": "Google Cloud BigQuery & Firebase Real-time DB"
        },
        "cuda_available": torch.cuda.is_available(),
        "device": str(disease_engine.device),
        "protocol": "Agri-DPI Standard v2.5 (Live Real-Time Interoperable)"
    }

# ----------------- REAL-TIME DYNAMIC FIELD INTELLIGENCE -----------------
@app.post("/api/v1/realtime/field-intel")
def get_realtime_field_intelligence(
    lat: float = 16.5062,
    lon: float = 80.6480,
    crop: str = "Cotton",
    area_acres: float = 2.4,
    farmer_name: str = "Field Operator"
):
    """
    100% Real-Time Live Dynamic Endpoint:
    Fetches real live weather & soil data for ANY GPS coordinate on Earth,
    computes satellite indices, soil health, climate hazards, and fused advisory.
    """
    live_weather = live_weather_service.fetch_live_weather(lat=lat, lon=lon)
    live_soil = live_soil_service.fetch_live_soil_properties(lat=lat, lon=lon)

    field_profile = FarmProfile(
        farm_id="realtime_custom_field",
        farmer_name=farmer_name,
        country_code="IN" if (8.0 <= lat <= 35.0 and 68.0 <= lon <= 89.0) else "GLOBAL",
        region=f"GPS ({lat:.4f}, {lon:.4f})",
        crop=crop,
        crop_stage="Active Field Monitoring",
        field=FieldCoordinates(latitude=lat, longitude=lon, area_acres=area_acres),
        soil=live_soil,
        weather=live_weather
    )

    satellite_res = satellite_engine.generate_field_multispectral_matrix(lat=lat, lon=lon, crop=crop)
    soil_res = soil_engine.calculate_soil_health(soil=live_soil, crop=crop)
    climate_res = climate_engine.assess_climate_risk(weather=live_weather, soil=live_soil, crop=crop)
    advisory_res = advisory_engine.generate_advisory(
        profile=field_profile,
        satellite=satellite_res,
        soil=soil_res,
        climate=climate_res
    )

    return {
        "field_profile": field_profile,
        "satellite": satellite_res,
        "soil_health": soil_res,
        "climate_risk": climate_res,
        "advisory": advisory_res,
        "data_source_mode": "100% Live Real-Time Ingestion (GPS + Met Grid + SoilGrids)"
    }

# ----------------- FARMS & DIGITAL TWINS -----------------
@app.get("/api/v1/farms", response_model=List[FarmProfile])
def list_farms():
    return list(DEMO_FARMS.values())

@app.get("/api/v1/farms/{farm_id}", response_model=FarmProfile)
def get_farm(farm_id: str):
    if farm_id not in DEMO_FARMS:
        raise HTTPException(status_code=404, detail="Farm profile not found")
    return DEMO_FARMS[farm_id]

# ----------------- SATELLITE MULTISPECTRAL & EARTH ENGINE -----------------
@app.post("/api/v1/satellite/indices", response_model=SatelliteAnalysisResponse)
def analyze_satellite_field(
    lat: float = 16.5062,
    lon: float = 80.6480,
    crop: str = "Cotton",
    stress_factor: float = 0.25
):
    return satellite_engine.generate_field_multispectral_matrix(
        lat=lat,
        lon=lon,
        crop=crop,
        stress_factor=stress_factor
    )

# ----------------- SOIL HEALTH & REGENERATIVE OPTIMIZER -----------------
@app.post("/api/v1/soil/health", response_model=SoilHealthResponse)
def calculate_soil_health(soil: SoilData, crop: str = "Cotton"):
    return soil_engine.calculate_soil_health(soil=soil, crop=crop)

# ----------------- CLIMATE RISK & WHAT-IF SIMULATOR -----------------
@app.post("/api/v1/climate/risk", response_model=ClimateRiskAssessment)
def assess_climate_risk(weather: WeatherData, soil: SoilData, crop: str = "Cotton"):
    return climate_engine.assess_climate_risk(weather=weather, soil=soil, crop=crop)

@app.post("/api/v1/climate/simulate", response_model=WhatIfSimulationResponse)
def simulate_what_if_scenario(req: WhatIfSimulationRequest):
    return climate_engine.simulate_what_if_scenario(req)

# ----------------- CROP DISEASE VISION (GEMINI + PYTORCH) -----------------
@app.post("/api/v1/disease/detect", response_model=DiseaseDetectionResponse)
async def detect_crop_disease(
    file: Optional[UploadFile] = File(None),
    crop_hint: str = Form("Cotton")
):
    if file:
        image_bytes = await file.read()
    else:
        from PIL import Image
        import io
        img = Image.new('RGB', (224, 224), color=(140, 110, 45))
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        image_bytes = buf.getvalue()

    return disease_engine.analyze_image_bytes(image_bytes=image_bytes, crop_hint=crop_hint)

# ----------------- LOCALIZED ADVISORY (GEMINI REASONING) -----------------
@app.post("/api/v1/advisory/generate", response_model=LocalizedAdvisoryResponse)
def generate_advisory(farm_id: Optional[str] = "farm_in_cotton_01", custom_profile: Optional[FarmProfile] = None):
    profile = custom_profile if custom_profile else DEMO_FARMS.get(farm_id, DEMO_FARMS["farm_in_cotton_01"])

    satellite_res = satellite_engine.generate_field_multispectral_matrix(
        lat=profile.field.latitude,
        lon=profile.field.longitude,
        crop=profile.crop
    )
    soil_res = soil_engine.calculate_soil_health(soil=profile.soil, crop=profile.crop)
    climate_res = climate_engine.assess_climate_risk(weather=profile.weather, soil=profile.soil, crop=profile.crop)

    return advisory_engine.generate_advisory(
        profile=profile,
        satellite=satellite_res,
        soil=soil_res,
        climate=climate_res
    )

# ----------------- GEMINI MULTI-AGENT COPILOT -----------------
@app.post("/api/v1/copilot/chat", response_model=CopilotChatResponse)
def chat_with_agronomic_copilot(req: CopilotChatRequest):
    return agent_orchestrator.process_query(req)

# ----------------- IOT FIELD TELEMETRY STREAM -----------------
@app.get("/api/v1/iot/live-telemetry", response_model=IoTProbeTelemetry)
def get_live_iot_telemetry(moisture: float = 24.0):
    return iot_service.get_live_probe_reading(baseline_moisture=moisture)

# ----------------- VERTEX AI PREDICTIVE YIELD -----------------
@app.post("/api/v1/vertex-ai/predict-yield")
def predict_yield_vertex_ai(
    country_code: str = "IN",
    crop: str = "Cotton",
    nitrogen: float = 140.0,
    organic_carbon: float = 0.52,
    moisture: float = 24.0,
    ndvi: float = 0.61
):
    return vertex_ai_service.predict_crop_yield_and_risk(
        country_code=country_code,
        crop=crop,
        soil_params={"nitrogen": nitrogen, "organic_carbon": organic_carbon, "moisture_percentage": moisture},
        weather_params={"temperature": 35.0},
        multispectral_ndvi=ndvi
    )

# ----------------- BIGQUERY & CROSS-BORDER DATA -----------------
@app.get("/api/v1/bigquery/analytics")
def get_bigquery_analytics(country_code: str = "IN", crop: str = "Cotton"):
    return bigquery_service.execute_cross_border_analytics_query(country_code=country_code, crop=crop)

@app.get("/api/v1/public-data/sources")
def list_public_data_sources():
    return public_data_service.sources

# ----------------- FEDERATED LEARNING / DPI NETWORK -----------------
@app.get("/api/v1/federated/nodes", response_model=List[FederatedNodeStatus])
def get_federated_nodes():
    return federated_engine.get_nodes_status()

@app.post("/api/v1/federated/aggregate", response_model=FederatedAggregationResponse)
def trigger_federated_round():
    return federated_engine.trigger_federated_round()

# ----------------- STATIC FRONTEND MOUNT -----------------
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(frontend_dir, "index.html"))
