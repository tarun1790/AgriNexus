import uuid
from datetime import datetime
from typing import Dict, Any
from backend.models.schemas import (
    FarmProfile,
    SatelliteAnalysisResponse,
    SoilHealthResponse,
    ClimateRiskAssessment,
    DiseaseDetectionResponse,
    LocalizedAdvisoryResponse
)

class AgriculturalAdvisoryEngine:
    """
    Evidence-based Agricultural Advisory Fusion Layer.
    Translates structured satellite, soil, climate, and pathology telemetry
    into highly specific, localized farm action plans in English, Telugu, and Hindi.
    """

    def generate_advisory(
        self,
        profile: FarmProfile,
        satellite: SatelliteAnalysisResponse,
        soil: SoilHealthResponse,
        climate: ClimateRiskAssessment,
        disease: DiseaseDetectionResponse = None
    ) -> LocalizedAdvisoryResponse:
        now_str = datetime.now().strftime("%d %b %Y, %I:%M %p")
        acres = profile.field.area_acres
        crop = profile.crop

        # 1. Irrigation formulation
        irr_needed = climate.irrigation_advisory.get("needed", False)
        irr_vol = climate.irrigation_advisory.get("recommended_volume_liters_per_acre", 0)
        total_vol = int(irr_vol * acres)
        irr_window = climate.irrigation_advisory.get("urgency_window_hours", "24-48 hours")

        # 2. Key evidence signals
        ndvi_val = satellite.mean_ndvi
        moisture_val = profile.soil.moisture_percentage
        rain_prob = profile.weather.rain_probability_pct
        temp_val = profile.weather.temperature_celsius

        # Formulate English Summary & Detailed Plan
        if irr_needed:
            headline = f"Irrigate your {acres}-acre {crop} field within the next {irr_window}."
            irr_text = (
                f"Soil volumetric moisture has declined to {moisture_val}%. Rain probability for the next 48h is only {rain_prob}%, "
                f"with maximum temperatures reaching {temp_val}°C. Apply an estimated {total_vol:,} liters ({irr_vol:,} L/acre) "
                f"using drip or alternate furrow irrigation during early morning or late evening."
            )
        else:
            headline = f"Optimal soil moisture in your {acres}-acre {crop} field; defer irrigation."
            irr_text = f"Soil moisture is adequate ({moisture_val}%). Rain probability is {rain_prob}%. Save water and avoid waterlogging."

        # Soil & Fertilizer Prescription
        n_status = soil.npk_status.get("Nitrogen", "Moderate")
        if n_status == "Deficient":
            fert_text = f"Nitrogen is deficient. Apply 25 kg/acre neem-coated urea or side-dress with bio-enriched vermicompost (200 kg/acre) before next irrigation cycle."
        else:
            fert_text = f"Nutrient levels are stable. Apply 1% Potassium Nitrate (KNO3) foliar spray to bolster heat resilience."

        # Pest/Disease Action
        if disease and disease.pathogen_type != "Healthy":
            pest_text = f"Alert: {disease.disease_name} identified ({disease.confidence_pct}% confidence). {disease.biological_treatments[0]} or {disease.safe_chemical_remedies[0]}."
        elif climate.disease_conducive_risk_pct > 60:
            pest_text = f"Microclimate alert: High humidity ({profile.weather.humidity_percentage}%) increases fungal risk. Scout field corners for early spots."
        else:
            pest_text = "Canopy health is stable. Routine bi-weekly scouting recommended."

        detailed_plan = (
            f"🌾 Field Status: Mean NDVI {ndvi_val} ({satellite.healthy_area_pct}% vigorous canopy). "
            f"Soil Health Score: {soil.soil_health_score}/100 ({soil.rating_category}).\n\n"
            f"💧 Water Action: {irr_text}\n\n"
            f"🌱 Nutrition: {fert_text}\n\n"
            f"🦠 Crop Protection: {pest_text}"
        )

        # Multilingual Translations
        # Telugu (తెలుగు)
        telugu_headline = f"రాబోయే {irr_window}లలో మీ {acres} ఎకరాల {crop} పొలానికి నీటిపారుదల చేయండి." if irr_needed else f"మీ {acres} ఎకరాల {crop} చేనులో తేమ సమృద్ధిగా ఉంది; నీటిపారుదల వాయిదా వేయండి."
        telugu_plan = (
            f"🌾 పొలం పరిస్థితి: ఉపగ్రహ NDVI {ndvi_val} ({satellite.healthy_area_pct}% ఆరోగ్యకరమైన పంట). నేల ఆరోగ్య సూచిక: {soil.soil_health_score}/100.\n\n"
            f"💧 నీటి యాజమాన్యం: నేలలో తేమ {moisture_val}%కి తగ్గింది. వర్ష సూచన కేవలం {rain_prob}%. ఉదయం లేదా సాయంత్రం వేళల్లో ఎకరానికి {irr_vol:,} లీటర్ల నీటిని అందించండి.\n\n"
            f"🌱 ఎరువుల నిర్వహణ: {fert_text}\n\n"
            f"🦠 రక్షణ చర్యలు: {pest_text}"
        )

        # Hindi (हिन्दी)
        hindi_headline = f"अगले {irr_window} के भीतर अपने {acres} एकड़ {crop} के खेत की सिंचाई करें।" if irr_needed else f"आपके {acres} एकड़ {crop} के खेत में पर्याप्त नमी है; सिंचाई स्थगित करें।"
        hindi_plan = (
            f"🌾 खेत की स्थिति: सैटेलाइट NDVI {ndvi_val} ({satellite.healthy_area_pct}% स्वस्थ फसल)। मृदा स्वास्थ्य स्कोर: {soil.soil_health_score}/100.\n\n"
            f"💧 सिंचाई प्रबंधन: मिट्टी की नमी गिरकर {moisture_val}% रह गई है। बारिश की संभावना केवल {rain_prob}% है। सुबह या शाम के समय प्रति एकड़ {irr_vol:,} लीटर पानी दें।\n\n"
            f"🌱 पोषण प्रबंधन: {fert_text}\n\n"
            f"🦠 फसल सुरक्षा: {pest_text}"
        )

        multilingual = {
            "en": {"headline": headline, "plan": detailed_plan, "lang_name": "English"},
            "te": {"headline": telugu_headline, "plan": telugu_plan, "lang_name": "తెలుగు (Telugu)"},
            "hi": {"headline": hindi_headline, "plan": hindi_plan, "lang_name": "हिन्दी (Hindi)"}
        }

        urgency = "Immediate Action (18-24h)" if (irr_needed or climate.overall_risk_level in ["HIGH", "CRITICAL"]) else "Normal Advisory"

        return LocalizedAdvisoryResponse(
            advisory_id=f"adv_{uuid.uuid4().hex[:8]}",
            timestamp=now_str,
            crop=crop,
            field_size_acres=acres,
            summary_headline=headline,
            detailed_action_plan=detailed_plan,
            irrigation_prescription={
                "action": "Irrigate" if irr_needed else "Hold",
                "liters_total": total_vol,
                "liters_per_acre": irr_vol,
                "urgency_window": irr_window,
                "method": climate.irrigation_advisory.get("irrigation_method")
            },
            fertilizer_prescription={
                "nitrogen_status": n_status,
                "recommendation": fert_text,
                "organic_carbon_score": soil.soil_health_score
            },
            pest_disease_prescription={
                "status": "Warning" if (disease and disease.pathogen_type != "Healthy") else "Clear",
                "details": pest_text
            },
            multilingual_versions=multilingual,
            urgency_badge=urgency
        )

advisory_engine = AgriculturalAdvisoryEngine()
