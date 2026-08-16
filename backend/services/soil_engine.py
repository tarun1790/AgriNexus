from typing import Dict, List, Any
from backend.models.schemas import SoilData, SoilHealthResponse, RegenerativeRecommendation

class SoilIntelligenceEngine:
    """
    Soil Health Scoring and Regenerative Agriculture Optimization Engine.
    Evaluates NPK, Organic Carbon, pH, and generates restorative agronomic plans.
    """

    def calculate_soil_health(self, soil: SoilData, crop: str = "Cotton") -> SoilHealthResponse:
        # 1. pH Score (Optimal 6.0 - 7.5)
        if 6.2 <= soil.ph <= 7.2:
            ph_score = 100
            ph_status = "Optimal"
        elif 5.5 <= soil.ph < 6.2 or 7.2 < soil.ph <= 7.8:
            ph_score = 80
            ph_status = "Slightly Off-target"
        elif 5.0 <= soil.ph < 5.5 or 7.8 < soil.ph <= 8.5:
            ph_score = 55
            ph_status = "Moderately Alkaline/Acidic"
        else:
            ph_score = 30
            ph_status = "Severely Acidic/Alkaline"

        # 2. Organic Carbon Score (Ideal >= 0.75% for tropical/subtropical soils)
        if soil.organic_carbon >= 0.85:
            oc_score = 100
            oc_status = "High Organic Carbon (Excellent Biology)"
        elif soil.organic_carbon >= 0.60:
            oc_score = 75
            oc_status = "Moderate Organic Carbon"
        elif soil.organic_carbon >= 0.40:
            oc_score = 50
            oc_status = "Low Organic Matter (Soil Depletion Risk)"
        else:
            oc_score = 25
            oc_status = "Critically Degraded Carbon Pool"

        # 3. NPK Nutrient Balances
        # Target standards for typical sub-tropical field (kg/ha)
        n_ratio = min(soil.nitrogen / 240.0, 1.0)
        p_ratio = min(soil.phosphorus / 35.0, 1.0)
        k_ratio = min(soil.potassium / 220.0, 1.0)
        npk_score = (n_ratio * 0.4 + p_ratio * 0.3 + k_ratio * 0.3) * 100

        npk_status = {
            "Nitrogen": "Adequate" if soil.nitrogen >= 200 else ("Moderate" if soil.nitrogen >= 120 else "Deficient"),
            "Phosphorus": "Adequate" if soil.phosphorus >= 30 else ("Moderate" if soil.phosphorus >= 18 else "Deficient"),
            "Potassium": "Adequate" if soil.potassium >= 200 else ("Moderate" if soil.potassium >= 140 else "Deficient"),
        }

        # 4. Moisture Retention Factor
        if 25.0 <= soil.moisture_percentage <= 45.0:
            moisture_score = 95
        elif 18.0 <= soil.moisture_percentage < 25.0:
            moisture_score = 65
        else:
            moisture_score = 40

        # Weighted Composite Score
        total_score = int(round(
            ph_score * 0.20 +
            oc_score * 0.35 +
            npk_score * 0.30 +
            moisture_score * 0.15
        ))

        if total_score >= 80:
            rating = "Optimal"
        elif total_score >= 65:
            rating = "Healthy"
        elif total_score >= 45:
            rating = "Moderate"
        else:
            rating = "Degraded"

        # Soil Available Water Capacity (AWC in mm)
        # Based on bulk density, clay content proxy, and organic carbon
        water_capacity_mm = round((soil.organic_carbon * 18.5) + (35.0 / max(0.5, soil.bulk_density)), 1)

        # Regenerative Recommendations tailored to deficits
        recs: List[RegenerativeRecommendation] = []

        if soil.organic_carbon < 0.75:
            recs.append(RegenerativeRecommendation(
                practice_name="Biochar & Compost Co-Application",
                impact_category="Soil Organic Matter",
                description="Apply 2.5 tons/acre of vermicompost enriched with 15% pyrolyzed biochar to stimulate microbial fungal networks and lock soil carbon for 5+ years.",
                soil_carbon_gain_tons_per_yr=0.85,
                water_saving_pct=16.0,
                implementation_urgency="High Priority (Pre-sowing / Rooting)"
            ))

        if npk_status["Nitrogen"] == "Deficient":
            recs.append(RegenerativeRecommendation(
                practice_name="Legume Intercropping & Green Manure",
                impact_category="Carbon Sequestration",
                description="Incorporate Sunn hemp (Crotalaria juncea) or Cowpea as a companion border crop to biologically fix 45-60 kg atmospheric Nitrogen/ha naturally without synthetic urea spike.",
                soil_carbon_gain_tons_per_yr=0.60,
                water_saving_pct=10.0,
                implementation_urgency="Immediate"
            ))

        recs.append(RegenerativeRecommendation(
            practice_name="Mulching & Zero-Tillage Residue Retention",
            impact_category="Water Retention",
            description="Retain 30-40% previous crop residue on topsoil surface. Reduces evaporative water loss by up to 28% and regulates soil root-zone temperature during heat spikes.",
            soil_carbon_gain_tons_per_yr=0.45,
            water_saving_pct=22.0,
            implementation_urgency="Standard Seasonal"
        ))

        organic_amendments = [
            {"amendment": "Neem Cake", "dose": "150 kg/acre", "purpose": "Nitrification inhibitor & soil-borne nematode suppression"},
            {"amendment": "Mycorrhizal Bio-inoculant (VAM)", "dose": "5 kg/acre", "purpose": "Expands root phosphorus uptake surface by 300%"},
            {"amendment": "Farmyard Manure (FYM)", "dose": "3 tons/acre", "purpose": "Restores microbial biomass and cation exchange capacity"}
        ]

        # Estimated carbon credit offset potential ($15/ton CO2e standard)
        est_carbon_gain = sum(r.soil_carbon_gain_tons_per_yr for r in recs)
        carbon_credit_usd = round(est_carbon_gain * 3.67 * 15.0 * 2.4, 2)  # for typical 2.4 acre field

        return SoilHealthResponse(
            soil_health_score=total_score,
            rating_category=rating,
            npk_status=npk_status,
            carbon_status=oc_status,
            water_retention_capacity_mm=water_capacity_mm,
            regenerative_recommendations=recs,
            organic_amendments=organic_amendments,
            carbon_credit_potential_est_usd=carbon_credit_usd
        )

soil_engine = SoilIntelligenceEngine()
