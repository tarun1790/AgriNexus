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

        # 2. List Farms
        res = await client.get("/api/v1/farms")
        assert res.status_code == 200
        farms = res.json()
        assert len(farms) >= 3
        print(f"[PASS] List Farms Passed ({len(farms)} regions loaded)")

        # 3. Satellite Indices
        res = await client.post("/api/v1/satellite/indices", params={"lat": 16.5062, "lon": 80.6480, "crop": "Cotton", "stress_factor": 0.25})
        assert res.status_code == 200
        sat = res.json()
        assert "mean_ndvi" in sat
        assert len(sat["grid_matrix"]) == 8
        print(f"[PASS] Satellite 10m Grid Passed (Mean NDVI: {sat['mean_ndvi']}, Vigour: {sat['healthy_area_pct']}%)")

        # 4. Soil Health
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

        # 5. What-If Climate Simulator
        sim_payload = {
            "crop": "Cotton",
            "delta_temperature_c": 2.0,
            "delta_rainfall_pct": -20.0,
            "extreme_heat_days": 5,
            "soil_organic_matter_delta": 0.0
        }
        res = await client.post("/api/v1/climate/simulate", json=sim_payload)
        assert res.status_code == 200
        sim = res.json()
        assert sim["simulated_yield_change_pct"] < 0
        assert len(sim["alternative_resilient_crops"]) >= 3
        print(f"[PASS] 'What-If' Climate Simulator Passed (Yield Delta: {sim['simulated_yield_change_pct']}%, Stress Index: {sim['projected_stress_index']})")

        # 6. Disease Detection
        res = await client.post("/api/v1/disease/detect", data={"crop_hint": "Cotton"})
        assert res.status_code == 200
        dis = res.json()
        assert "disease_name" in dis
        assert "PyTorch" in dis["inference_device"] or "Google" in dis["inference_device"]
        print(f"[PASS] Leaf Pathology Diagnostic Passed (Diagnosis: {dis['disease_name']}, Confidence: {dis['confidence_pct']}%)")

        # 7. Localized Multilingual Advisory
        res = await client.post("/api/v1/advisory/generate?farm_id=farm_in_cotton_01")
        assert res.status_code == 200
        adv = res.json()
        assert "te" in adv["multilingual_versions"]
        assert "hi" in adv["multilingual_versions"]
        assert "en" in adv["multilingual_versions"]
        print(f"[PASS] Evidence Layer Fusion & Localization Passed (Prescribed: {adv['irrigation_prescription']['liters_per_acre']:,} L/acre)")

        # 8. Cross-Border Federated Learning
        res = await client.post("/api/v1/federated/aggregate")
        assert res.status_code == 200
        fed = res.json()
        assert fed["round_number"] >= 5
        print(f"[PASS] Federated Learning Aggregation Passed (Round #{fed['round_number']}, Global Acc: {fed['global_model_accuracy_pct']}%)")

    print("\n>>> ALL AGRINEXUS DPI TEST SUITES PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
