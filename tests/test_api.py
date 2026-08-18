import sys
import os
import asyncio
import httpx
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app

async def run_all_tests():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/api/v1/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "online"
        print("[PASS] Health Check Passed | CUDA:", data["cuda_available"])

        # 2. Real-Time Dynamic Field Intelligence (Live Weather + SoilGrids)
        realtime_res = await client.post("/api/v1/realtime/field-intel", params={
            "lat": 16.5062,
            "lon": 80.6480,
            "crop": "Cotton",
            "area_acres": 2.4
        })
        assert realtime_res.status_code == 200
        rt = realtime_res.json()
        assert "field_profile" in rt
        assert "satellite" in rt
        assert "soil_health" in rt
        assert "advisory" in rt
        print(f"[PASS] Real-Time Dynamic Ingestion Passed (Live Weather Temp: {rt['field_profile']['weather']['temperature_celsius']}°C, Soil pH: {rt['soil_health']['soil_health_score']}/100)")

        # 3. List Farms
        res = await client.get("/api/v1/farms")
        assert res.status_code == 200
        farms = res.json()
        assert len(farms) >= 3
        print(f"[PASS] List Farms Passed ({len(farms)} regions loaded)")

        # 4. Satellite Indices (NDVI, NDWI, EVI, SAVI)
        res = await client.post("/api/v1/satellite/indices", params={"lat": 16.5062, "lon": 80.6480, "crop": "Cotton", "stress_factor": 0.25})
        assert res.status_code == 200
        sat = res.json()
        assert "mean_ndvi" in sat
        assert "mean_savi" in sat
        print(f"[PASS] Satellite 10m Grid Passed (NDVI: {sat['mean_ndvi']}, SAVI: {sat['mean_savi']})")

        # 5. Soil Health
        soil_payload = {
            "ph": 6.4,
            "nitrogen": 135.0,
            "phosphorus": 21.0,
            "potassium": 175.0,
            "organic_carbon": 0.52,
            "moisture_percentage": 24.0,
            "soil_type": "Black Cotton Clay",
            "bulk_density": 1.38
        }
        res = await client.post("/api/v1/soil/health", json=soil_payload)
        assert res.status_code == 200
        soil = res.json()
        assert 0 <= soil["soil_health_score"] <= 100
        print(f"[PASS] Soil Health Scoring Passed (Score: {soil['soil_health_score']}/100, Carbon Credits: ${soil['carbon_credit_potential_est_usd']})")

        # 6. What-If Climate Simulator & Multi-Year ROI
        sim_payload = {
            "crop": "Cotton",
            "delta_temperature_c": 2.0,
            "delta_rainfall_pct": -20.0,
            "extreme_heat_days": 5,
            "soil_organic_matter_delta": 0.0,
            "simulation_years": 5
        }
        res = await client.post("/api/v1/climate/simulate", json=sim_payload)
        assert res.status_code == 200
        sim = res.json()
        assert sim["simulated_yield_change_pct"] < 0
        print(f"[PASS] 'What-If' Climate Simulator Passed (Yield Delta: {sim['simulated_yield_change_pct']}%)")

        # 7. Disease Detection
        res = await client.post("/api/v1/disease/detect", data={"crop_hint": "Cotton"})
        assert res.status_code == 200
        dis = res.json()
        assert "disease_name" in dis
        print(f"[PASS] Leaf Pathology Diagnostic Passed (Diagnosis: {dis['disease_name']}, Confidence: {dis['confidence_pct']}%)")

        # 8. Localized Multilingual Advisory
        res = await client.post("/api/v1/advisory/generate?farm_id=farm_in_cotton_01")
        assert res.status_code == 200
        adv = res.json()
        assert "te" in adv["multilingual_versions"]
        assert "hi" in adv["multilingual_versions"]
        assert "en" in adv["multilingual_versions"]
        print(f"[PASS] Evidence Layer Localization Passed (Prescribed: {adv['irrigation_prescription']['liters_per_acre']:,} L/acre)")

        # 9. Gemini Multi-Agent Autonomous Copilot
        copilot_res = await client.post("/api/v1/copilot/chat", json={
            "message": "How much water should I apply if temperature hits 40°C tomorrow?",
            "farm_id": "farm_in_cotton_01",
            "language": "en"
        })
        assert copilot_res.status_code == 200
        cop = copilot_res.json()
        assert len(cop["participating_agents"]) == 3
        print(f"[PASS] Gemini Multi-Agent Copilot Passed (3 sub-agents collaborated)")

        # 10. Cross-Border Federated Learning
        res = await client.post("/api/v1/federated/aggregate")
        assert res.status_code == 200
        fed = res.json()
        assert fed["round_number"] >= 5
        print(f"[PASS] Federated Learning Aggregation Passed (Round #{fed['round_number']}, Global Acc: {fed['global_model_accuracy_pct']}%)")

        # 11. Autonomous UAV Flight Mission Generator
        uav_res = await client.get("/api/v1/uav/flight-plan", params={"lat": 16.5062, "lon": 80.6480, "area_acres": 2.4, "crop": "Cotton"})
        assert uav_res.status_code == 200
        uav = uav_res.json()
        assert uav["waypoint_count"] > 0
        assert "flight_parameters" in uav
        print(f"[PASS] UAV Precision Spray Mission Passed ({uav['waypoint_count']} Waypoints, {uav['spray_prescription']['flow_rate_liters_per_hectare']} L/ha VRA Payload)")

        # 12. 100-Band Hyperspectral Spectrogram
        spec_res = await client.get("/api/v1/spectrogram/hyperspectral", params={"crop": "Cotton", "mean_ndvi": 0.61})
        assert spec_res.status_code == 200
        spec = spec_res.json()
        assert spec["bands_sampled"] == 101
        print(f"[PASS] 100-Band Hyperspectral Spectrogram Passed ({spec['spectral_range_nm']})")

        # 13. Growing Degree Days (GDD) Phenological Tracker
        gdd_res = await client.get("/api/v1/phenology/gdd-tracker", params={"crop": "Cotton", "mean_temp_c": 30.5, "days_since_sowing": 48})
        assert gdd_res.status_code == 200
        gdd = gdd_res.json()
        assert "accumulated_thermal_gdd" in gdd
        print(f"[PASS] Thermal Time GDD Phenology Engine Passed ({gdd['accumulated_thermal_gdd']} GDD accumulated, Stage: {gdd['active_stage']['name']})")

        # 14. Sentinel-1 C-Band SAR Radar Telemetry
        sar_res = await client.get("/api/v1/sar/radar-telemetry", params={"lat": 16.5062, "lon": 80.6480, "crop": "Cotton"})
        assert sar_res.status_code == 200
        sar = sar_res.json()
        assert "telemetry" in sar
        print(f"[PASS] Sentinel-1 SAR Radar Polarization Passed (VV: {sar['telemetry']['sigma0_vv_mean_db']} dB, VH: {sar['telemetry']['sigma0_vh_mean_db']} dB, eps_r: {sar['telemetry']['dielectric_permittivity_epsilon_r']})")

        # 15. Precision Agrochemical WALES Tank-Mix Compatibility Lab
        tm_res = await client.post("/api/v1/tankmix/check-compatibility", json=["copper_oxychloride", "streptocycline"])
        assert tm_res.status_code == 200
        tm = tm_res.json()
        assert "wales_mixing_protocol" in tm
        assert len(tm["wales_mixing_protocol"]) == 5
        print(f"[PASS] WALES Tank-Mix Laboratory Passed (Stability: {tm['jar_test_stability_rating_pct']}%, Compatible: {tm['is_physically_compatible']})")

        # 16. Hydrus-1D 4-Layer Unsaturated Soil Moisture Profile
        hyd_res = await client.get("/api/v1/soil/hydrus-profile", params={"surface_moisture_pct": 24.0})
        assert hyd_res.status_code == 200
        hyd = hyd_res.json()
        assert len(hyd["layers"]) == 4
        print(f"[PASS] Hydrus-1D 4-Layer Soil Physics Passed (Total AWC: {hyd['total_profile_water_storage_mm']} mm, Model: {hyd['hydraulic_model']})")

        # 17. APMC Mandi Spatial Arbitrage & Net Freight Optimizer
        arb_res = await client.get("/api/v1/market/spatial-arbitrage", params={"lat": 16.5062, "lon": 80.6480, "crop": "Cotton", "harvest_quintals": 24.0})
        assert arb_res.status_code == 200
        arb = arb_res.json()
        assert len(arb["mandi_arbitrage_leaderboard"]) >= 3
        print(f"[PASS] Mandi Spatial Arbitrage Passed (Best: {arb['best_destination']['mandi_name']}, Net Rate: INR {arb['best_destination']['net_price_per_q']}/Q)")

        # 18. Solar-Induced Chlorophyll Fluorescence (SIF & Fv/Fm)
        sif_res = await client.get("/api/v1/sif/telemetry", params={"lat": 16.5062, "lon": 80.6480, "crop": "Cotton", "ndvi": 0.61, "temp_c": 30.5})
        assert sif_res.status_code == 200
        sif = sif_res.json()
        assert "telemetry" in sif
        print(f"[PASS] SIF Photochemical Quantum Yield Passed (740nm: {sif['telemetry']['sif_radiance_740nm_mw_m2_sr_nm']} mW/m2, Fv/Fm: {sif['telemetry']['fv_fm_photosystem_ii_quantum_efficiency']})")

        # 19. Tractor ISOBUS ISO-11783 Task Map Generator
        iso_res = await client.post("/api/v1/isobus/export-task", json={"farm_id": "realtime_custom_field", "crop": "Cotton", "area_acres": 2.4})
        assert iso_res.status_code == 200
        iso = iso_res.json()
        assert "iso_xml_string" in iso
        assert "geojson_task_map" in iso
        print(f"[PASS] Tractor ISOBUS TaskData Passed (Standard: {iso['format_standard']}, Zones: {iso['geojson_task_map']['metadata']['total_zones']})")

        # 20. Sub-Surface Drip Fertigation & Hazen-Williams Hydraulic Engine
        fert_res = await client.get("/api/v1/fertigation/hydraulic-calc", params={"operating_pressure_bar": 1.5, "lateral_length_meters": 100.0, "nominal_emitter_lph": 2.2, "fertilizer_solution_liters": 80.0})
        assert fert_res.status_code == 200
        fert = fert_res.json()
        assert "friction_loss_analysis" in fert
        print(f"[PASS] Hazen-Williams Drip Fertigation Passed (Head Loss: {fert['friction_loss_analysis']['hazen_williams_head_loss_meters']}m, DU: {fert['friction_loss_analysis']['emission_uniformity_eu_pct']}%)")

        # 21. Thermal Degree-Day Biofix Pest Instar Forecaster
        pest_res = await client.get("/api/v1/pest/biofix-forecast", params={"crop": "Cotton", "mean_temp_c": 30.5, "days_since_biofix": 6})
        assert pest_res.status_code == 200
        pest = pest_res.json()
        assert "active_instar_stage" in pest
        print(f"[PASS] Pest Instar Biofix Forecaster Passed (Pest: {pest['target_pest']}, Instar: {pest['active_instar_stage']['stage_name']})")

    print("\n>>> ALL 21 REAL-TIME FRONTIER DEEP-TECH AGRIVEDA AI TEST SUITES PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
