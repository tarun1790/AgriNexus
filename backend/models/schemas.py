from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class FieldCoordinates(BaseModel):
    latitude: float = Field(..., example=16.5062)
    longitude: float = Field(..., example=80.6480)
    area_acres: float = Field(default=2.4, example=2.4)
    boundary_geojson: Optional[Dict[str, Any]] = None

class SoilData(BaseModel):
    ph: float = Field(default=6.5, ge=3.0, le=10.0, description="Soil pH level")
    nitrogen: float = Field(default=140.0, ge=0.0, le=500.0, description="Available N in kg/ha")
    phosphorus: float = Field(default=22.0, ge=0.0, le=200.0, description="Available P in kg/ha")
    potassium: float = Field(default=180.0, ge=0.0, le=600.0, description="Available K in kg/ha")
    organic_carbon: float = Field(default=0.55, ge=0.05, le=5.0, description="Organic Carbon %")
    moisture_percentage: float = Field(default=28.0, ge=0.0, le=100.0, description="Volumetric Soil Moisture %")
    soil_type: str = Field(default="Black Cotton Clay", description="Dominant soil classification")
    bulk_density: float = Field(default=1.35, description="Bulk density in g/cm3")

class WeatherData(BaseModel):
    temperature_celsius: float = Field(default=34.5, description="Current temperature")
    humidity_percentage: float = Field(default=62.0, description="Relative humidity %")
    rainfall_forecast_mm: float = Field(default=4.2, description="Forecasted 48h precipitation")
    rain_probability_pct: float = Field(default=18.0, description="Rainfall probability %")
    wind_speed_kmh: float = Field(default=12.5, description="Wind speed in km/h")
    solar_radiation_mj: float = Field(default=21.0, description="Solar radiation in MJ/m2")

class FarmProfile(BaseModel):
    farm_id: str = Field(default="farm_in_ap_001")
    farmer_name: str = Field(default="Ramesh Kumar")
    country_code: str = Field(default="IN")
    region: str = Field(default="Andhra Pradesh, Krishna Basin")
    crop: str = Field(default="Cotton")
    crop_stage: str = Field(default="Vegetative / Flowering")
    field: FieldCoordinates
    soil: SoilData
    weather: WeatherData

class SatelliteGridCell(BaseModel):
    row: int
    col: int
    lat: float
    lon: float
    ndvi: float
    ndwi: float
    evi: float
    health_status: str  # "vigorous", "moderate_stress", "severe_stress", "waterlogged"

class SatelliteAnalysisResponse(BaseModel):
    mean_ndvi: float
    mean_ndwi: float
    mean_evi: float
    stress_area_pct: float
    healthy_area_pct: float
    vegetation_index_trend: List[Dict[str, Any]]
    grid_resolution_meters: int
    grid_matrix: List[List[SatelliteGridCell]]
    satellite_source: str
    acquisition_date: str
    spatial_anomaly_detected: bool
    anomaly_notes: str

class RegenerativeRecommendation(BaseModel):
    practice_name: str
    impact_category: str  # "Soil Organic Matter", "Water Retention", "Carbon Sequestration", "Biodiversity"
    description: str
    soil_carbon_gain_tons_per_yr: float
    water_saving_pct: float
    implementation_urgency: str

class SoilHealthResponse(BaseModel):
    soil_health_score: int
    rating_category: str  # "Degraded", "Moderate", "Healthy", "Optimal"
    npk_status: Dict[str, str]
    carbon_status: str
    water_retention_capacity_mm: float
    regenerative_recommendations: List[RegenerativeRecommendation]
    organic_amendments: List[Dict[str, str]]
    carbon_credit_potential_est_usd: float

class ClimateRiskAssessment(BaseModel):
    overall_risk_level: str  # "LOW", "MODERATE", "HIGH", "CRITICAL"
    heat_stress_pct: float
    drought_risk_pct: float
    flood_risk_pct: float
    disease_conducive_risk_pct: float
    irrigation_advisory: Dict[str, Any]
    active_hazard_alerts: List[Dict[str, str]]

class WhatIfSimulationRequest(BaseModel):
    crop: str = Field(default="Cotton")
    delta_temperature_c: float = Field(default=2.0, ge=-5.0, le=8.0, description="Temperature anomaly in C")
    delta_rainfall_pct: float = Field(default=-20.0, ge=-80.0, le=100.0, description="Rainfall anomaly in %")
    soil_organic_matter_delta: float = Field(default=0.0, ge=-1.0, le=2.0, description="Organic matter change %")
    extreme_heat_days: int = Field(default=5, ge=0, le=30)
    current_soil: Optional[SoilData] = None

class AlternativeCropOption(BaseModel):
    crop_name: str
    resilience_score: float
    projected_yield_ton_per_ha: float
    water_footprint_liters_per_kg: float
    soil_improvement_score: float
    profitability_index: float
    recommended_reason: str

class WhatIfSimulationResponse(BaseModel):
    baseline_crop: str
    simulated_yield_change_pct: float
    simulated_water_deficit_liters_per_acre: float
    projected_stress_index: float
    vulnerability_tier: str
    climate_impact_summary: str
    adaptation_strategies: List[str]
    alternative_resilient_crops: List[AlternativeCropOption]

class DiseaseDetectionResponse(BaseModel):
    disease_name: str
    pathogen_type: str  # "Fungal", "Bacterial", "Viral", "Pest Infestation", "Nutrient Deficiency", "Healthy"
    confidence_pct: float
    severity_level: str  # "Mild", "Moderate", "Severe", "None"
    affected_crop: str
    description: str
    cultural_practices: List[str]
    biological_treatments: List[str]
    safe_chemical_remedies: List[str]
    prevention_for_next_season: str
    inference_device: str

class LocalizedAdvisoryResponse(BaseModel):
    advisory_id: str
    timestamp: str
    crop: str
    field_size_acres: float
    summary_headline: str
    detailed_action_plan: str
    irrigation_prescription: Dict[str, Any]
    fertilizer_prescription: Dict[str, Any]
    pest_disease_prescription: Dict[str, Any]
    multilingual_versions: Dict[str, Dict[str, str]]
    urgency_badge: str  # "Immediate Action (12-24h)", "Scheduled", "Normal"

class FederatedNodeStatus(BaseModel):
    node_id: str
    country_name: str
    country_code: str
    local_samples_count: int
    local_model_accuracy_pct: float
    privacy_epsilon: float
    last_sync_timestamp: str
    status: str

class FederatedAggregationResponse(BaseModel):
    round_number: int
    participating_nodes: List[FederatedNodeStatus]
    global_model_accuracy_pct: float
    accuracy_gain_pct: float
    aggregation_algorithm: str
    privacy_guarantee: str
    convergence_status: str
