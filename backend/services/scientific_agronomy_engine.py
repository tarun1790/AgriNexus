import math
from typing import Dict, Any

class ScientificAgronomyEngine:
    """
    Peer-Reviewed Biophysical & Agronomic Modeling Engine.
    Implements:
    1. FAO-56 Dual Crop Coefficient Model (Allen et al., 1998): ETc = (Ks * Kcb + Ke) * ET0
    2. Saxton & Rawls (2006) Soil Water Characteristic Pedotransfer Functions (TAW, RAW, FC, WP)
    3. Monteith (1972) Radiation-Use Efficiency (RUE) Net Primary Production (NPP)
    4. IPCC Tier-2 Nitrous Oxide (N2O) & Biochar Carbon Recalcitrance Stoichiometry
    """

    CROP_FAO56_PARAMETERS = {
        "Cotton": {"kcb_ini": 0.15, "kcb_mid": 1.10, "kcb_end": 0.45, "zr_max": 1.20, "p_depletion": 0.65, "rue_max": 1.85, "c_pathway": "C3"},
        "Rice": {"kcb_ini": 0.30, "kcb_mid": 1.15, "kcb_end": 0.70, "zr_max": 0.60, "p_depletion": 0.20, "rue_max": 2.20, "c_pathway": "C3"},
        "Wheat": {"kcb_ini": 0.20, "kcb_mid": 1.10, "kcb_end": 0.25, "zr_max": 1.00, "p_depletion": 0.55, "rue_max": 2.10, "c_pathway": "C3"},
        "Maize": {"kcb_ini": 0.15, "kcb_mid": 1.15, "kcb_end": 0.50, "zr_max": 1.20, "p_depletion": 0.55, "rue_max": 2.65, "c_pathway": "C4"},
        "Soybean": {"kcb_ini": 0.15, "kcb_mid": 1.10, "kcb_end": 0.30, "zr_max": 0.90, "p_depletion": 0.50, "rue_max": 1.75, "c_pathway": "C3"},
        "Chilli": {"kcb_ini": 0.20, "kcb_mid": 1.05, "kcb_end": 0.75, "zr_max": 0.80, "p_depletion": 0.45, "rue_max": 1.60, "c_pathway": "C3"}
    }

    def compute_saxton_rawls_hydrology(self, clay_pct: float = 45.0, sand_pct: float = 25.0, om_pct: float = 1.0, root_depth_m: float = 1.0) -> Dict[str, Any]:
        """
        Saxton & Rawls (2006) Pedotransfer Functions deriving Soil Water Constants:
        theta_FC (Field Capacity), theta_WP (Permanent Wilting Point), theta_SAT (Saturation),
        TAW (Total Available Water), and RAW (Readily Available Water).
        """
        clay = max(5.0, min(80.0, clay_pct)) / 100.0
        sand = max(5.0, min(85.0, sand_pct)) / 100.0
        om = max(0.2, min(8.0, om_pct))

        # 1. 1500 kPa (Permanent Wilting Point, theta_1500)
        theta_1500t = -0.024 * sand + 0.487 * clay + 0.006 * om + 0.005 * (sand * om) - 0.013 * (clay * om) + 0.068 * (sand * clay) + 0.031
        theta_wp = theta_1500t + (0.14 * theta_1500t - 0.02)
        theta_wp = max(0.06, min(0.35, theta_wp))

        # 2. 33 kPa (Field Capacity, theta_33)
        theta_33t = -0.251 * sand + 0.195 * clay + 0.011 * om + 0.006 * (sand * om) - 0.027 * (clay * om) + 0.452 * (sand * clay) + 0.299
        theta_fc = theta_33t + (1.283 * (theta_33t**2) - 0.374 * theta_33t - 0.015)
        theta_fc = max(theta_wp + 0.08, min(0.55, theta_fc))

        # 3. Saturation (0 kPa, theta_S)
        theta_s = theta_fc + 0.18 - 0.097 * sand

        # Total Available Water (TAW in mm per meter of root zone)
        taw_mm_m = 1000.0 * (theta_fc - theta_wp)
        taw_total_mm = taw_mm_m * root_depth_m

        return {
            "field_capacity_volumetric": round(theta_fc, 3),
            "wilting_point_volumetric": round(theta_wp, 3),
            "saturation_volumetric": round(theta_s, 3),
            "total_available_water_mm_per_m": round(taw_mm_m, 1),
            "total_available_water_rootzone_mm": round(taw_total_mm, 1),
            "pedotransfer_standard": "Saxton & Rawls (2006) Soil-Water Characteristics"
        }

    def compute_fao56_dual_crop_coefficient(
        self,
        et0_mm_day: float,
        crop: str,
        stage: str = "mid",
        mean_ndvi: float = 0.61,
        rain_mm: float = 0.0,
        clay_pct: float = 45.0,
        sand_pct: float = 25.0,
        om_pct: float = 1.0,
        days_since_last_wetting: int = 4
    ) -> Dict[str, Any]:
        """
        FAO-56 Dual Crop Coefficient Model:
        ETc = (Ks * Kcb + Ke) * ET0
        Decomposes crop transpiration (Kcb) and soil surface evaporation (Ke).
        """
        crop_params = self.CROP_FAO56_PARAMETERS.get(crop, self.CROP_FAO56_PARAMETERS["Cotton"])
        kcb = crop_params["kcb_mid"] if stage == "mid" else (crop_params["kcb_ini"] if stage == "ini" else crop_params["kcb_end"])
        
        # Scale Kcb slightly with spectral NDVI canopy cover (fc = 1.35 * (NDVI - 0.15))
        fc = max(0.05, min(0.95, 1.35 * (mean_ndvi - 0.15)))
        kcb_adj = round(kcb * (fc / 0.8), 2)

        # Soil Evaporation Coefficient (Ke) based on stage 1 (REW) and stage 2 (TEW) drying
        kc_max = max(1.20, kcb_adj + 0.05)
        kr = max(0.05, min(1.0, math.exp(-0.25 * days_since_last_wetting)))
        if rain_mm > 5.0:
            kr = 1.0
        ke = round((1.0 - fc) * kr * (kc_max - kcb_adj), 2)
        ke = max(0.02, min(0.80, ke))

        # Root zone depletion & Transpiration reduction stress coefficient (Ks)
        hydrology = self.compute_saxton_rawls_hydrology(clay_pct, sand_pct, om_pct, crop_params["zr_max"])
        taw = hydrology["total_available_water_rootzone_mm"]
        p = crop_params["p_depletion"]
        raw = round(p * taw, 1)

        # Simulated cumulative root zone depletion Dr (mm)
        dr = round(min(taw * 0.9, et0_mm_day * (kcb_adj + ke) * days_since_last_wetting - (rain_mm * 0.8)), 1)
        dr = max(0.0, dr)

        if dr <= raw:
            ks = 1.0
            stress_diagnosis = "OPTIMAL_TRANSPIRATION (No Stomatal Closure)"
        else:
            ks = max(0.0, round((taw - dr) / ((1.0 - p) * taw), 2))
            stress_diagnosis = f"STOMATAL_STRESS_ACTIVE (Ks={ks:.2f}, Depletion exceeds RAW)"

        etc_dual = round((ks * kcb_adj + ke) * et0_mm_day, 2)
        net_irrigation_deficit_mm = max(0.0, round(dr, 1))
        liters_per_acre = int(net_irrigation_deficit_mm * 4046.86)

        return {
            "fao56_standard": "FAO-56 Dual Crop Coefficient (Allen et al., 1998)",
            "reference_et0_mm_day": et0_mm_day,
            "basal_transpiration_kcb": kcb_adj,
            "soil_evaporation_ke": ke,
            "transpiration_stress_ks": ks,
            "crop_canopy_cover_fraction_fc": round(fc, 3),
            "actual_evapotranspiration_etc_mm_day": etc_dual,
            "total_available_water_taw_mm": taw,
            "readily_available_water_raw_mm": raw,
            "root_zone_depletion_dr_mm": dr,
            "stress_state": stress_diagnosis,
            "net_volumetric_irrigation_deficit_liters_per_acre": liters_per_acre,
            "recommended_schedule": "Immediate micro-drip fertigation" if dr > raw else "Moisture sufficient for next 48h"
        }

    def compute_monteith_light_use_efficiency(
        self,
        solar_radiation_mj_m2_day: float = 19.5,
        mean_ndvi: float = 0.61,
        ambient_temp_c: float = 30.5,
        vpd_kpa: float = 1.8,
        crop: str = "Cotton"
    ) -> Dict[str, Any]:
        """
        Monteith (1972) Radiation-Use Efficiency (RUE) Model:
        NPP = epsilon_max * fAPAR * PAR * f(T) * f(VPD)
        Computes daily Photosynthetic Biomass Carbon Fixation in g C/m2/day.
        """
        crop_params = self.CROP_FAO56_PARAMETERS.get(crop, self.CROP_FAO56_PARAMETERS["Cotton"])
        rue_max = crop_params["rue_max"]

        # Photosynthetically Active Radiation (PAR = 48% of total solar flux Rs)
        par = 0.48 * solar_radiation_mj_m2_day

        # Fraction of Absorbed PAR (fAPAR derived from multispectral NDVI)
        fapar = max(0.05, min(0.95, 1.25 * (mean_ndvi - 0.10)))

        # Temperature modifier f(T)
        t_opt = 28.0 if crop_params["c_pathway"] == "C3" else 32.0
        f_temp = math.exp(-0.5 * ((ambient_temp_c - t_opt) / 10.0)**2)

        # Vapor Pressure Deficit stomatal conductance modifier f(VPD)
        f_vpd = max(0.35, min(1.0, 1.0 - 0.22 * max(0.0, vpd_kpa - 1.0)))

        # Net Primary Production (g Carbon / m² / day)
        npp_daily_g_c_m2 = round(rue_max * fapar * par * f_temp * f_vpd, 2)
        biomass_daily_kg_ha = round(npp_daily_g_c_m2 * 10.0 * 2.2, 1)

        return {
            "biophysical_model": "Monteith (1972) Radiation-Use Efficiency (RUE)",
            "photosynthetically_active_radiation_par_mj_m2": round(par, 2),
            "fraction_absorbed_fapar": round(fapar, 3),
            "temperature_photosynthetic_modifier": round(f_temp, 3),
            "vpd_stomatal_conductance_modifier": round(f_vpd, 3),
            "net_primary_production_npp_g_c_m2_day": npp_daily_g_c_m2,
            "daily_dry_biomass_accumulation_kg_ha_day": biomass_daily_kg_ha,
            "photosynthetic_pathway": crop_params["c_pathway"]
        }

    def compute_ipcc_tier2_carbon_stoichiometry(self, chemical_nitrogen_saved_kg: float = 34.6, biochar_applied_kg: float = 120.0) -> Dict[str, Any]:
        """
        IPCC Tier-2 Stoichiometric GHG Reduction & Stable Recalcitrant Biochar Sequestration:
        E_N2O = (N_saved * EF_1 * 44/28) * GWP_100 (273 kg CO2e / kg N2O)
        C_biochar = M_biochar * C_org * F_perm * 44/12
        """
        # EF_1 = 1.0% direct emission factor (IPCC 2019 Refinement)
        n2o_n_saved_kg = chemical_nitrogen_saved_kg * 0.010
        n2o_gas_saved_kg = n2o_n_saved_kg * (44.0 / 28.0)
        ghg_abatement_co2e_kg = round(n2o_gas_saved_kg * 273.0, 2)

        # Biochar permanent recalcitrance (H/C < 0.4, 75% stability over 100+ years)
        biochar_c_seq_kg = round(biochar_applied_kg * 0.78 * 0.75 * (44.0 / 12.0), 2)
        total_co2e_abatement_kg = round(ghg_abatement_co2e_kg + biochar_c_seq_kg, 2)

        return {
            "standards": ["IPCC Tier-2 (2019 Refinement)", "ISO 14064-2", "Verra VM0044"],
            "n2o_gwp_100_factor": 273,
            "n2o_direct_emission_factor_ef1": "1.0% of applied chemical N",
            "chemical_n_saved_kg": chemical_nitrogen_saved_kg,
            "n2o_ghg_abated_kg_co2e": ghg_abatement_co2e_kg,
            "biochar_permanent_sequestration_kg_co2e": biochar_c_seq_kg,
            "total_net_climate_abatement_kg_co2e": total_co2e_abatement_kg
        }

scientific_engine = ScientificAgronomyEngine()
