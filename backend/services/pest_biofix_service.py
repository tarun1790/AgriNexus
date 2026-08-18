from typing import Dict, Any, List

class PestBiofixService:
    """
    Thermal Degree-Day Biofix Pest Instar & Life-Cycle Forecasting Engine.
    Models physiological development thresholds (Tbase, Tupper) and thermal heat unit accumulation (DD)
    for high-impact crop pests (Pink Bollworm, Fall Armyworm, Whitefly, Tobacco Caterpillar).
    Pinpoints the optimal 3-day biocontrol / larvicide spraying window before larvae bore inside plant tissue.
    """

    PEST_MODELS = {
        "pink_bollworm": {
            "scientific_name": "Pectinophora gossypiella",
            "common_name": "Pink Bollworm (PBW)",
            "target_crop": "Cotton",
            "t_base": 12.0,
            "t_upper": 35.0,
            "degree_days_required": 480.0,
            "instar_thresholds_dd": [
                {"stage": "Egg Deposition & Embryogenesis", "min_dd": 0, "max_dd": 70, "vulnerability": "Egg Parasitoid (Trichogramma @ 60k/acre)"},
                {"stage": "1st-2nd Instar (Surface Crawling Larvae)", "min_dd": 71, "max_dd": 140, "vulnerability": "CRITICAL 72h WINDOW: Neem 10k ppm + Emamectin Benzoate"},
                {"stage": "3rd-4th Instar (Boll Burrowing & Lockout)", "min_dd": 141, "max_dd": 280, "vulnerability": "LOW (Protected inside green boll lint)"},
                {"stage": "Pupation in Soil Leaf Litter", "min_dd": 281, "max_dd": 400, "vulnerability": "Soil Neem Cake + Entomopathogenic Nematodes"},
                {"stage": "Adult Moth Emergence & Flight", "min_dd": 401, "max_dd": 480, "vulnerability": "Gossyplure Pheromone Delta Traps (8/acre)"}
            ]
        },
        "fall_armyworm": {
            "scientific_name": "Spodoptera frugiperda",
            "common_name": "Fall Armyworm (FAW)",
            "target_crop": "Maize",
            "t_base": 10.9,
            "t_upper": 38.0,
            "degree_days_required": 390.0,
            "instar_thresholds_dd": [
                {"stage": "Egg Masses with Hairy Coverings", "min_dd": 0, "max_dd": 45, "vulnerability": "Egg crush & T. chilonis release"},
                {"stage": "1st-2nd Instar (Pin-hole Foliar Scrapers)", "min_dd": 46, "max_dd": 115, "vulnerability": "OPTIMAL WINDOW: Bacillus thuringiensis (Bt @ 2g/L)"},
                {"stage": "3rd-5th Instar (Deep Whorl Cannibals)", "min_dd": 116, "max_dd": 250, "vulnerability": "Spinetoram 11.7% SC direct whorl application"},
                {"stage": "Pupation (Subterranean)", "min_dd": 251, "max_dd": 340, "vulnerability": "Inter-row harrowing"},
                {"stage": "Adult Moth Nocturnal Oviposition", "min_dd": 341, "max_dd": 390, "vulnerability": "Solar Light Traps (1 per 2 acres)"}
            ]
        },
        "chilli_thrips": {
            "scientific_name": "Scirtothrips dorsalis",
            "common_name": "Chilli Yellow Thrips / Murda Complex",
            "target_crop": "Chilli",
            "t_base": 13.0,
            "t_upper": 36.0,
            "degree_days_required": 220.0,
            "instar_thresholds_dd": [
                {"stage": "Egg Inserted in Leaf Epidermis", "min_dd": 0, "max_dd": 40, "vulnerability": "Preventative Lecanicillium lecanii spray"},
                {"stage": "Nymph 1 & 2 (Active Sucking Pests)", "min_dd": 41, "max_dd": 110, "vulnerability": "CRITICAL: Blue Sticky Traps (20/acre) + Diafenthiuron 50% WP"},
                {"stage": "Pseudopupa in Topsoil Cracks", "min_dd": 111, "max_dd": 160, "vulnerability": "Soil moisture saturation"},
                {"stage": "Adult Winged Thrips (Leaf Curler)", "min_dd": 161, "max_dd": 220, "vulnerability": "Finetuned low-pressure systemic spray"}
            ]
        }
    }

    def forecast_pest_instar_stage(self, crop: str = "Cotton", mean_temp_c: float = 30.5, days_since_biofix: int = 6) -> Dict[str, Any]:
        """
        Calculates accumulated degree days:
        Daily DD = max(0, min(Tmax, Tupper) - Tbase)
        """
        pest_key = "pink_bollworm"
        if "maize" in crop.lower():
            pest_key = "fall_armyworm"
        elif "chilli" in crop.lower():
            pest_key = "chilli_thrips"

        model = self.PEST_MODELS[pest_key]
        t_base = model["t_base"]
        effective_temp = min(model["t_upper"], max(t_base, mean_temp_c))
        daily_dd = max(0.0, effective_temp - t_base)
        accumulated_dd = round(daily_dd * days_since_biofix, 1)

        # Identify current active instar
        active_stage = model["instar_thresholds_dd"][0]
        for stage in model["instar_thresholds_dd"]:
            if stage["min_dd"] <= accumulated_dd <= stage["max_dd"]:
                active_stage = stage
                break

        progress_pct = round(min(100.0, (accumulated_dd / model["degree_days_required"]) * 100.0), 1)

        # Spray Window Alert
        is_spray_window = "WINDOW" in active_stage["vulnerability"] or "CRITICAL" in active_stage["vulnerability"] or "OPTIMAL" in active_stage["vulnerability"]

        return {
            "target_pest": model["common_name"],
            "scientific_name": model["scientific_name"],
            "target_crop": model["target_crop"],
            "biofix_parameters": {
                "days_since_pheromone_trap_biofix": days_since_biofix,
                "daily_degree_day_accumulation_rate": round(daily_dd, 1),
                "accumulated_degree_days_dd": accumulated_dd,
                "total_generation_cycle_dd": model["degree_days_required"],
                "life_cycle_completion_pct": progress_pct
            },
            "active_instar_stage": {
                "stage_name": active_stage["stage"],
                "optimal_intervention": active_stage["vulnerability"],
                "is_critical_spray_window": is_spray_window,
                "urgency_badge": "🚨 ACTION REQUIRED (Peak Vulnerability)" if is_spray_window else "MONITORING (Sub-Threshold)"
            },
            "instar_timeline": model["instar_thresholds_dd"]
        }

pest_biofix_service = PestBiofixService()
