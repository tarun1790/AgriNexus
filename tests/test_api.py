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

    print("\n>>> ALL 10 REAL-TIME LIVE AGRINEXUS DPI TEST SUITES PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
