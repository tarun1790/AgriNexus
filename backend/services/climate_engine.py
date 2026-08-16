from typing import List, Dict, Any, Optional
from backend.models.schemas import (
    WeatherData,
    SoilData,
    ClimateRiskAssessment,
    WhatIfSimulationRequest,
    WhatIfSimulationResponse,
    AlternativeCropOption
)

class ClimateIntelligenceEngine:
    """
    Predictive Multi-Hazard Climate Risk & 'What-If' Climate Scenario Simulator.
    Simulates physiological crop yield impacts, evapotranspiration changes,
    and ranks climate-resilient alternative crop pathways.
    """

    def assess_climate_risk(self, weather: WeatherData, soil: SoilData, crop: str = "Cotton") -> ClimateRiskAssessment:
        # 1. Temperature-Humidity Index (THI) & Heat Stress
        # THI = 0.8 * T + (RH/100) * (T - 14.4) + 46.4
        t = weather.temperature_celsius
        rh = weather.humidity_percentage
        thi = 0.8 * t + (rh / 100.0) * (t - 14.4) + 46.4

        if t > 38.0 or thi > 82.0:
            heat_stress = min(95.0, 70.0 + (t - 38.0) * 8.0)
        elif t > 34.0:
            heat_stress = 45.0 + (t - 34.0) * 6.0
        else:
            heat_stress = max(10.0, t * 0.8)

        # 2. Drought Risk
        # Combines low soil moisture, low rain probability, and high solar radiation
        moisture_deficit = max(0.0, 35.0 - soil.moisture_percentage)
        rain_deficit = max(0.0, 50.0 - weather.rain_probability_pct)
        drought_risk = min(98.0, (moisture_deficit * 1.5) + (rain_deficit * 0.6) + (weather.solar_radiation_mj * 0.5))

        # 3. Flood Risk
        flood_risk = min(95.0, (weather.rainfall_forecast_mm * 1.8) + (weather.rain_probability_pct * 0.3) if weather.rainfall_forecast_mm > 25 else (weather.rainfall_forecast_mm * 0.5))

        # 4. Disease-Conducive Microclimate Risk
        # Warm + high humidity (RH > 75% and Temp between 24-32 C triggers fungal germination)
        if rh >= 70 and 22 <= t <= 33:
            disease_risk = min(92.0, 50.0 + (rh - 70) * 1.4)
        else:
            disease_risk = max(15.0, rh * 0.4)

        # Overall synthesis
        max_hazard = max(heat_stress, drought_risk, flood_risk, disease_risk)
        if max_hazard >= 75:
            overall_tier = "CRITICAL"
        elif max_hazard >= 55:
            overall_tier = "HIGH"
        elif max_hazard >= 35:
            overall_tier = "MODERATE"
        else:
            overall_tier = "LOW"

        # Targeted irrigation calculation
        irrigation_needed = drought_risk > 45 or soil.moisture_percentage < 25.0
        est_liters_acre = int(max(0, (30.0 - soil.moisture_percentage) * 850)) if irrigation_needed else 0

        irrigation_advisory = {
            "needed": irrigation_needed,
            "urgency_window_hours": "18-24 hours" if drought_risk > 60 else "48-72 hours",
            "recommended_volume_liters_per_acre": est_liters_acre,
            "irrigation_method": "Drip / Alternate Furrow Irrigation (saves 35% water vs. flood)",
            "favorable_window": "Late evening (17:30 - 20:00) or early morning (05:30 - 08:00) to minimize evaporative loss"
        }

        alerts = []
        if heat_stress >= 70:
            alerts.append({
                "hazard": "Extreme Heat Stress",
                "severity": "HIGH",
                "message": f"Temperature {t}°C exceeds vegetative threshold. Canopy wilting likely without protective foliar kaolin spray or evening micro-irrigation."
            })
        if drought_risk >= 60:
            alerts.append({
                "hazard": "Root-Zone Drought Alert",
                "severity": "HIGH",
                "message": f"Declining volumetric soil moisture ({soil.moisture_percentage}%). Rainfall probability is only {weather.rain_probability_pct}%. Immediate irrigation cycle required."
            })
        if disease_risk >= 65:
            alerts.append({
                "hazard": "Fungal Germination Warning",
                "severity": "MODERATE",
                "message": f"Relative humidity ({rh}%) combined with temperature ({t}°C) accelerates fungal spore propagation. Inspect lower leaf canopy for early leaf spot/blight."
            })

        return ClimateRiskAssessment(
            overall_risk_level=overall_tier,
            heat_stress_pct=round(heat_stress, 1),
            drought_risk_pct=round(drought_risk, 1),
            flood_risk_pct=round(flood_risk, 1),
            disease_conducive_risk_pct=round(disease_risk, 1),
            irrigation_advisory=irrigation_advisory,
            active_hazard_alerts=alerts
        )

    def simulate_what_if_scenario(self, req: WhatIfSimulationRequest) -> WhatIfSimulationResponse:
        """
        Simulate climate change scenario (+ΔT, -ΔRainfall, extreme heat days)
        on crop yield, water deficit, and discover climate-resilient alternative crops.
        """
        crop = req.crop.lower()
        delta_t = req.delta_temperature_c
        delta_r = req.delta_rainfall_pct
        extreme_days = req.extreme_heat_days

        # Crop sensitivity coefficients (% yield change per +1C and per -10% rain)
        sensitivity = {
            "cotton": {"temp_sens": -4.2, "rain_sens": -3.8, "base_yield": 2.2, "water_base": 6500},
            "rice": {"temp_sens": -6.5, "rain_sens": -7.2, "base_yield": 4.1, "water_base": 12000},
            "wheat": {"temp_sens": -5.8, "rain_sens": -4.5, "base_yield": 3.4, "water_base": 5500},
            "maize": {"temp_sens": -5.0, "rain_sens": -5.5, "base_yield": 4.8, "water_base": 6200},
            "soybean": {"temp_sens": -4.8, "rain_sens": -4.2, "base_yield": 2.1, "water_base": 5000}
        }
        params = sensitivity.get(crop, sensitivity["cotton"])

        # Yield impact calculation
        temp_loss = delta_t * params["temp_sens"] if delta_t > 0 else delta_t * (params["temp_sens"] * 0.3)
        rain_loss = (delta_r / 10.0) * params["rain_sens"]
        extreme_penalty = extreme_days * -0.9
        om_benefit = req.soil_organic_matter_delta * 4.5  # regenerative soil organic matter buffers climate shock!

        total_yield_delta = round(temp_loss + rain_loss + extreme_penalty + om_benefit, 1)

        # Evapotranspiration water deficit
        et_multiplier = 1.0 + (delta_t * 0.062)  # ~6.2% more ET per +1C
        rain_deficit_factor = max(0.0, -delta_r / 100.0)
        water_deficit_liters_acre = round((params["water_base"] * (et_multiplier - 1.0) + (params["water_base"] * rain_deficit_factor * 0.7)) * 100, 0)

        # Vulnerability tier
        if total_yield_delta <= -25.0:
            tier = "Severe Vulnerability (High Climate Risk)"
        elif total_yield_delta <= -12.0:
            tier = "Moderate Vulnerability"
        elif total_yield_delta < 5.0:
            tier = "Slight Impact / Managed"
        else:
            tier = "Climate-Resilient / Positive Adaptation"

        summary = (
            f"Under simulated scenario of ΔT={'+' if delta_t > 0 else ''}{delta_t}°C and rainfall anomaly of {delta_r}%, "
            f"baseline {req.crop} experiences a projected {abs(total_yield_delta)}% {'yield reduction' if total_yield_delta < 0 else 'yield gain'}. "
            f"Evaporative crop water deficit rises by {int(water_deficit_liters_acre):,} liters/acre."
        )

        strategies = [
            "Switch to ultra-efficient subsurface drip irrigation to mitigate higher atmospheric evaporative demand (VPD).",
            "Incorporate cover crops and biochar to elevate Soil Organic Matter, boosting soil moisture retention by up to 24%.",
            "Introduce micro-climatic shelterbelts or companion agroforestry borders to reduce direct canopy heat load by 1.8°C."
        ]
        if delta_r <= -20:
            strategies.append("Adopt rainwater harvesting farm ponds (Jal Kund) for supplemental critical flowering stage irrigation.")

        # Alternative climate-smart crops library
        alternatives: List[AlternativeCropOption] = [
            AlternativeCropOption(
                crop_name="Pearl Millet (Bajra / Pennisetum glaucum)",
                resilience_score=9.4,
                projected_yield_ton_per_ha=3.1,
                water_footprint_liters_per_kg=2200,
                soil_improvement_score=8.8,
                profitability_index=8.2,
                recommended_reason="C4 photosynthetic pathway tolerates temperatures up to 44°C and thrives with 40% less water than baseline crops."
            ),
            AlternativeCropOption(
                crop_name="Sorghum (Jowar)",
                resilience_score=9.1,
                projected_yield_ton_per_ha=3.8,
                water_footprint_liters_per_kg=2800,
                soil_improvement_score=8.5,
                profitability_index=8.4,
                recommended_reason="Deep root architecture penetrates subsoil moisture reserves; high biomass return to organic matter."
            ),
            AlternativeCropOption(
                crop_name="Pigeonpea / Red Gram (Arhar / Cajanus cajan)",
                resilience_score=8.7,
                projected_yield_ton_per_ha=1.9,
                water_footprint_liters_per_kg=3100,
                soil_improvement_score=9.6,
                profitability_index=9.1,
                recommended_reason="Symbiotically fixes atmospheric Nitrogen, breaking soil hardpan and commanding premium market price."
            ),
            AlternativeCropOption(
                crop_name="Drought-Tolerant Native Cotton (Desi Cotton / G. arboreum)",
                resilience_score=8.2,
                projected_yield_ton_per_ha=1.8,
                water_footprint_liters_per_kg=4800,
                soil_improvement_score=7.4,
                profitability_index=8.0,
                recommended_reason="Indigenous open-pollinated variety resistant to sucking pests and tolerant to irregular rain spells."
            )
        ]

        return WhatIfSimulationResponse(
            baseline_crop=req.crop,
            simulated_yield_change_pct=total_yield_delta,
            simulated_water_deficit_liters_per_acre=water_deficit_liters_acre,
            projected_stress_index=round(min(100.0, max(10.0, 50.0 - total_yield_delta * 1.8)), 1),
            vulnerability_tier=tier,
            climate_impact_summary=summary,
            adaptation_strategies=strategies,
            alternative_resilient_crops=alternatives
        )

climate_engine = ClimateIntelligenceEngine()
