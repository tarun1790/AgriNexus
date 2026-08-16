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

        # Telemetry variables
        ndvi_val = satellite.mean_ndvi
        moisture_val = profile.soil.moisture_percentage
        rain_prob = profile.weather.rain_probability_pct
        temp_val = profile.weather.temperature_celsius
        humidity_val = profile.weather.humidity_percentage
        irr_vol = climate.irrigation_advisory.get("recommended_volume_liters_per_acre", 0)
        total_vol = int(irr_vol * acres)
        irr_window = climate.irrigation_advisory.get("urgency_window_hours", "24-48 hours")

        # 1. 💧 DYNAMIC IRRIGATION LOGIC & HEADLINE (Scientific FAO-56 Water Balance)
        if rain_prob >= 55.0:
            headline = f"🌧️ Rain expected ({rain_prob:.0f}% probability); postpone irrigation for your {acres}-acre {crop} field."
            irr_text = (
                f"Convective precipitation probability is {rain_prob:.0f}% with forecast showers in the next 24–48 hours. "
                f"Postpone all artificial irrigation to prevent root-zone waterlogging, nitrogen leaching, and hypoxia. "
                f"Ensure farm field bunds and drainage furrows are clear to safely discharge excess runoff."
            )
            urgency = "Weather Watch (24-48h)"
            irr_needed = False
        elif moisture_val < 28.0 or climate.irrigation_advisory.get("needed", False):
            headline = f"💧 Volumetric soil moisture deficit detected; irrigate your {acres}-acre {crop} field within the next {irr_window}."
            irr_text = (
                f"Soil volumetric moisture has declined to {moisture_val:.1f}%. Rain probability for the next 48h is only {rain_prob:.0f}%, "
                f"while ambient temperatures reach {temp_val:.1f}°C. Apply an estimated {total_vol:,} liters ({irr_vol:,} L/acre) "
                f"using precision drip or alternate furrow irrigation during early morning (6–9 AM) or late evening to minimize evaporative losses."
            )
            urgency = "Immediate Action (18-24h)"
            irr_needed = True
        else:
            headline = f"✅ Optimal root-zone moisture; maintain current cultivation schedule for {crop}."
            irr_text = (
                f"Soil volumetric moisture is well-balanced at {moisture_val:.1f}% with manageable evaporative demand. "
                f"Rain probability is {rain_prob:.0f}%. Defer irrigation to conserve water and promote deeper root penetration."
            )
            urgency = "Routine Maintenance"
            irr_needed = False

        # 2. 🌱 DYNAMIC SOIL & NUTRITION PRESCRIPTION
        n_status = soil.npk_status.get("Nitrogen", "Moderate")
        p_status = soil.npk_status.get("Phosphorus", "Moderate")
        k_status = soil.npk_status.get("Potassium", "Moderate")

        if n_status == "Deficient":
            fert_text = f"Nitrogen is deficient in root zone. Top-dress with 25 kg/acre neem-coated urea or apply 200 kg/acre bio-enriched vermicompost before next watering."
        elif soil.soil_health_score < 60:
            fert_text = f"Soil health score is {soil.soil_health_score}/100. Organic carbon is depleted. Apply 3 tonnes/acre Farm Yard Manure (FYM) or 1.5 tonnes/acre biochar-vermicompost blend."
        elif temp_val >= 32.0:
            fert_text = f"High ambient temperature ({temp_val:.1f}°C). Apply 1% Potassium Nitrate (KNO3) or 2% Salicylic acid foliar spray to regulate stomatal conductance and mitigate heat stress."
        elif p_status == "Deficient":
            fert_text = f"Phosphorus is deficient. Band-place 20 kg/acre Di-Ammonium Phosphate (DAP) or Single Super Phosphate (SSP) at root depth."
        else:
            fert_text = f"Macronutrients (N-P-K) are balanced. Maintain organic mulch on soil surface to preserve microbial diversity and slow evaporation."

        # 3. 🦠 DYNAMIC CROP-SPECIFIC PATHOLOGY & IPM PROTECTION
        if disease and disease.pathogen_type != "Healthy":
            pest_text = f"Alert: {disease.disease_name} identified ({disease.confidence_pct}% confidence). Recommended: {disease.biological_treatments[0]} or {disease.safe_chemical_remedies[0]}."
        elif crop.lower() == "cotton":
            if humidity_val > 65.0:
                pest_text = f"High relative humidity ({humidity_val:.0f}%) elevates risk of Bacterial Blight (Angular Leaf Spot). Inspect lower leaves; spray Copper Oxychloride 50% WP (2.5 g/L) if water-soaked lesions appear."
            else:
                pest_text = f"Monitor for sucking pests (Jassids, Thrips, and Whiteflies) on underside of top 3 leaves. Install 8 yellow sticky traps per acre."
        elif crop.lower() == "chilli":
            pest_text = f"Monitor for Chilli Leaf Curl Virus and Yellow Mite / Thrips vectors. Install 10 yellow/blue sticky traps/acre. Spray Neem Baan 10,000 ppm (2 ml/L) at early sign of leaf curling."
        elif crop.lower() in ["rice", "paddy"]:
            pest_text = f"Scout for Blast (Pyricularia oryzae) and Brown Planthopper (BPH). Practice Alternate Wetting and Drying (AWD) to suppress pest populations."
        elif crop.lower() == "wheat":
            pest_text = f"Inspect lower leaf canopies for Stripe/Yellow Rust pustules. Spray Propiconazole 25% EC (1 ml/L) if disease foci are detected."
        else:
            pest_text = f"Canopy vigor is stable (NDVI {ndvi_val:.3f}). Conduct routine bi-weekly field scouting along a 'W' shaped walking pattern."

        # 4. Assembled Detailed Plan
        detailed_plan = (
            f"🌾 Field Status: Mean NDVI {ndvi_val:.3f} ({satellite.healthy_area_pct}% vigorous canopy). "
            f"Soil Health Score: {soil.soil_health_score}/100 ({soil.rating_category}).\n\n"
            f"💧 Water Action: {irr_text}\n\n"
            f"🌱 Nutrition: {fert_text}\n\n"
            f"🦠 Crop Protection: {pest_text}"
        )

        # Multilingual Translations
        # Telugu (తెలుగు)
        if rain_prob >= 55.0:
            telugu_headline = f"🌧️ వర్ష సూచన ({rain_prob:.0f}% అవకాశం); మీ {acres} ఎకరాల {crop} చేనులో నీటిపారుదల వాయిదా వేయండి."
            telugu_irr = f"రాబోయే 24-48 గంటల్లో {rain_prob:.0f}% వర్షం పడే అవకాశం ఉంది. నీటిపారుదల ఆపి, అదనపు వర్షపు నీరు వెళ్లేలా డ్రైనేజీ కాలువలను శుభ్రం చేయండి."
        elif moisture_val < 28.0:
            telugu_headline = f"💧 నేలలో తేమ లోపం; రాబోయే {irr_window}లలో మీ {acres} ఎకరాల {crop} పొలానికి నీరు అందించండి."
            telugu_irr = f"నేలలో తేమ {moisture_val:.1f}%కి తగ్గింది. వర్ష సూచన కేవలం {rain_prob:.0f}%. ఉదయం లేదా సాయంత్రం వేళల్లో ఎకరానికి {irr_vol:,} లీటర్ల నీటిని అందించండి."
        else:
            telugu_headline = f"✅ నేలలో తగినంత తేమ ఉంది; మీ {crop} పంట నిర్వహణను కొనసాగించండి."
            telugu_irr = f"నేలలో తేమ సమృద్ధిగా ఉంది ({moisture_val:.1f}%). నీటిపారుదల వాయిదా వేసి నీటిని ఆదా చేయండి."

        telugu_plan = (
            f"🌾 పొలం పరిస్థితి: ఉపగ్రహ NDVI {ndvi_val:.3f} ({satellite.healthy_area_pct}% ఆరోగ్యకరమైన పంట). నేల ఆరోగ్య సూచిక: {soil.soil_health_score}/100.\n\n"
            f"💧 నీటి యాజమాన్యం: {telugu_irr}\n\n"
            f"🌱 ఎరువుల నిర్వహణ: {fert_text}\n\n"
            f"🦠 రక్షణ చర్యలు: {pest_text}"
        )

        # Hindi (हिन्दी)
        if rain_prob >= 55.0:
            hindi_headline = f"🌧️ बारिश की संभावना ({rain_prob:.0f}%); अपने {acres} एकड़ {crop} के खेत में सिंचाई स्थगित करें।"
            hindi_irr = f"अगले 24-48 घंटों में {rain_prob:.0f}% बारिश की संभावना है। कृत्रिम सिंचाई रोकें और जलभराव से बचने के लिए खेत की नालियों को साफ रखें।"
        elif moisture_val < 28.0:
            hindi_headline = f"💧 मिट्टी में नमी की कमी; अगले {irr_window} के भीतर अपने {acres} एकड़ {crop} के खेत की सिंचाई करें।"
            hindi_irr = f"मिट्टी की नमी गिरकर {moisture_val:.1f}% रह गई है। बारिश की संभावना केवल {rain_prob:.0f}% है। प्रति एकड़ {irr_vol:,} लीटर पानी सुबह या शाम दें।"
        else:
            hindi_headline = f"✅ मिट्टी में पर्याप्त नमी है; {crop} की नियमित देखरेख जारी रखें।"
            hindi_irr = f"मिट्टी में नमी का स्तर संतुलित है ({moisture_val:.1f}%)। सिंचाई स्थगित करके पानी बचाएं।"

        hindi_plan = (
            f"🌾 खेत की स्थिति: सैटेलाइट NDVI {ndvi_val:.3f} ({satellite.healthy_area_pct}% स्वस्थ फसल)। मृदा स्वास्थ्य स्कोर: {soil.soil_health_score}/100.\n\n"
            f"💧 सिंचाई प्रबंधन: {hindi_irr}\n\n"
            f"🌱 पोषण प्रबंधन: {fert_text}\n\n"
            f"🦠 फसल सुरक्षा: {pest_text}"
        )

        multilingual = {
            "en": {"headline": headline, "plan": detailed_plan, "lang_name": "English"},
            "te": {"headline": telugu_headline, "plan": telugu_plan, "lang_name": "తెలుగు (Telugu)"},
            "hi": {"headline": hindi_headline, "plan": hindi_plan, "lang_name": "हिन्दी (Hindi)"}
        }

        return LocalizedAdvisoryResponse(
            advisory_id=f"ADV-{uuid.uuid4().hex[:8].upper()}",
            timestamp=now_str,
            crop=crop,
            field_size_acres=acres,
            summary_headline=headline,
            detailed_action_plan=detailed_plan,
            irrigation_prescription={
                "needed": irr_needed,
                "liters_per_acre": irr_vol if irr_needed else 0,
                "recommended_liters_total": total_vol if irr_needed else 0,
                "recommended_liters_per_acre": irr_vol if irr_needed else 0,
                "urgency_window": irr_window if irr_needed else "N/A",
                "method": "Precision Drip / Alternate Furrow",
                "narrative": irr_text
            },
            fertilizer_prescription={
                "recommendation": fert_text,
                "priority_nutrient": "Nitrogen" if n_status == "Deficient" else "Balanced Maintenance",
                "organic_input": "Biochar-vermicompost / Farm Yard Manure"
            },
            pest_disease_prescription={
                "recommendation": pest_text,
                "risk_level": "High" if disease and disease.pathogen_type != "Healthy" else ("Moderate" if humidity_val > 65 else "Low")
            },
            multilingual_versions=multilingual,
            urgency_badge=urgency
        )

advisory_engine = AgriculturalAdvisoryEngine()
