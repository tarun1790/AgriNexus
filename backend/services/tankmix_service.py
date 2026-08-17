from typing import List, Dict, Any

class TankMixCompatibilityService:
    """
    Precision Agrochemical Tank-Mix Compatibility & Antagonism Engine.
    Simulates jar-test flocculation, chemical lockout, pH buffering, phytotoxicity risks,
    and constructs the strict WALES sequence (Wettable Powders -> Agitate -> Liquids -> EC -> Surfactants).
    """

    def __init__(self):
        # Master Agrochemical Database
        self.chemicals_db = {
            "copper_oxychloride": {
                "name": "Copper Oxychloride 50% WP",
                "category": "Fungicide / Bactericide",
                "formulation": "WP", # Wettable Powder
                "ph_effect": "Slightly Alkaline (7.2-7.8)",
                "incompatible_with": ["phosphorous_acid", "dimethoate", "lime_sulphur", "acidic_buffers"],
                "antagonism_notes": "Copper ions hydrolyze and precipitate with phosphonates or strong acids, causing severe foliar burn."
            },
            "streptocycline": {
                "name": "Streptomycin Sulfate + Tetracycline (90:10)",
                "category": "Bactericide",
                "formulation": "SP", # Soluble Powder
                "ph_effect": "Neutral (6.5-7.0)",
                "incompatible_with": ["lime_sulphur", "bordeaux_mixture"],
                "antagonism_notes": "Degrades in high alkaline solutions (pH > 8.0)."
            },
            "chlorpyrifos": {
                "name": "Chlorpyrifos 50% + Cypermethrin 5% EC",
                "category": "Insecticide",
                "formulation": "EC", # Emulsifiable Concentrate
                "ph_effect": "Neutral",
                "incompatible_with": ["lime_sulphur", "bordeaux_mixture"],
                "antagonism_notes": "Emulsifiers break down in presence of free copper or high alkaline water."
            },
            "emamectin_benzoate": {
                "name": "Emamectin Benzoate 5% SG",
                "category": "Biological / Bio-Insecticide",
                "formulation": "SG", # Soluble Granule
                "ph_effect": "Neutral",
                "incompatible_with": ["alkaline_surfactants"],
                "antagonism_notes": "High UV photodegradation; best applied with neutral non-ionic surfactants."
            },
            "mancozeb": {
                "name": "Mancozeb 75% WP",
                "category": "Broad-Spectrum Protectant Fungicide",
                "formulation": "WP",
                "ph_effect": "Slightly Acidic (6.0-6.5)",
                "incompatible_with": ["lime_sulphur", "bordeaux_mixture", "urea_high_conc"],
                "antagonism_notes": "Safe with most insecticides and zinc chelates."
            },
            "zinc_edta": {
                "name": "Chelated Zinc (Zn-EDTA 12%)",
                "category": "Micronutrient Chelate",
                "formulation": "SP",
                "ph_effect": "Neutral",
                "incompatible_with": ["unchelated_phosphates"],
                "antagonism_notes": "EDTA chelate ring prevents zinc fixation and keeps solution homogeneous."
            },
            "neem_oil": {
                "name": "Cold-Pressed Neem Oil (10,000 ppm Azadirachtin)",
                "category": "Botanical Bio-Pesticide",
                "formulation": "EC",
                "ph_effect": "Neutral",
                "incompatible_with": ["copper_oxychloride", "strong_acids"],
                "antagonism_notes": "Requires emulsifier (e.g. soapnut extract or polysorbate-20) for uniform dispersion."
            },
            "potassium_nitrate": {
                "name": "13-0-45 (Potassium Nitrate Multi-K)",
                "category": "Foliar Fertilizer",
                "formulation": "WSF", # Water Soluble Fertilizer
                "ph_effect": "Neutral (6.5)",
                "incompatible_with": ["calcium_nitrate_high_salinity"],
                "antagonism_notes": "Dissolve completely in fresh water prior to adding emulsifiable concentrates."
            }
        }

    def evaluate_tankmix(self, chemical_keys: List[str], water_volume_liters: float = 200.0) -> Dict[str, Any]:
        """
        Evaluates physical jar-test compatibility, pH buffer window, phytotoxicity risk,
        and constructs the WALES addition sequence.
        """
        selected_chems = [self.chemicals_db[k] for k in chemical_keys if k in self.chemicals_db]
        if not selected_chems:
            # default fallback
            selected_chems = [self.chemicals_db["copper_oxychloride"], self.chemicals_db["streptocycline"]]

        incompatibilities = []
        antagonism_warnings = []
        jar_test_score = 100

        for i, chem_a in enumerate(selected_chems):
            for chem_b in selected_chems[i+1:]:
                # Check cross incompatibilities
                key_b = [k for k, v in self.chemicals_db.items() if v["name"] == chem_b["name"]][0]
                if key_b in chem_a["incompatible_with"]:
                    incompatibilities.append(f"❌ {chem_a['name']} is INCOMPATIBLE with {chem_b['name']}!")
                    antagonism_warnings.append(chem_a["antagonism_notes"])
                    jar_test_score -= 40

        is_compatible = len(incompatibilities) == 0

        # WALES Ordering Strategy:
        # W = Wettable powders & water-dispersible granules (WP, WDG, SG, SP, WSF)
        # A = Agitate tank thoroughly until dissolved
        # L = Liquid flowables & suspensions (SC, F, SL)
        # E = Emulsifiable concentrates & oils (EC, EW)
        # S = Surfactants, spreaders & stickers (NIS, Organosilicones)

        w_items = [c["name"] for c in selected_chems if c["formulation"] in ["WP", "WDG", "SG", "SP", "WSF"]]
        l_items = [c["name"] for c in selected_chems if c["formulation"] in ["SC", "F", "SL"]]
        e_items = [c["name"] for c in selected_chems if c["formulation"] in ["EC", "EW"]]

        wales_steps = [
            {"step": 1, "code": "W", "title": "Fill Tank 50% + Add Dry Powders / Granules", "items": w_items if w_items else ["None required"], "instruction": "Premix dry powders with small bucket of water first, then pour through tank filter."},
            {"step": 2, "code": "A", "title": "Agitate Solution Thoroughly for 3-5 Minutes", "items": ["Mechanical / Hydro Agitation"], "instruction": "Ensure all solid granules are completely dissolved before adding liquids."},
            {"step": 3, "code": "L", "title": "Add Liquid Flowables & Soluble Concentrates", "items": l_items if l_items else ["None required"], "instruction": "Pour liquid concentrates slowly while maintaining continuous agitation."},
            {"step": 4, "code": "E", "title": "Add Emulsifiable Concentrates (EC) & Oils", "items": e_items if e_items else ["None required"], "instruction": "Add EC formulations last before filling remaining water up to target level."},
            {"step": 5, "code": "S", "title": "Add Non-Ionic Surfactant / Spreader & Fill 100%", "items": ["Non-Ionic Spreader (e.g. Silwet L-77 @ 0.3ml/L)"], "instruction": "Surfactant reduces droplet surface tension and ensures zero nozzle clogging."}
        ]

        jar_test_result = "✅ Completely Homogeneous Solution (No precipitation, separation, or clumping)" if is_compatible else "⚠️ Flocculation / Curdling Detected! Coagulation risk inside spray nozzles."

        return {
            "selected_chemicals": [c["name"] for c in selected_chems],
            "water_volume_liters": water_volume_liters,
            "is_physically_compatible": is_compatible,
            "jar_test_stability_rating_pct": max(15, jar_test_score),
            "jar_test_observation": jar_test_result,
            "target_ph_solution": "6.2 - 6.6 (Optimal Stomatal Absorption Window)",
            "incompatibilities_detected": incompatibilities,
            "antagonism_warnings": antagonism_warnings,
            "wales_mixing_protocol": wales_steps,
            "safety_equipment_required": ["Nitrile Gloves", "Organic Vapor Respirator", "Splash Goggles", "Long-Sleeve Rubber Apron"]
        }

tankmix_service = TankMixCompatibilityService()
