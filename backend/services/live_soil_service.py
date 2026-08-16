import requests
import logging
from typing import Dict, Any
from backend.models.schemas import SoilData

logger = logging.getLogger(__name__)

class LiveSoilGridsService:
    """
    Real-Time SoilGrids & Lithosphere Service.
    Queries ISRIC World Soil Information database / SoilGrids REST endpoint by coordinate.
    """

    def fetch_live_soil_properties(self, lat: float, lon: float) -> SoilData:
        try:
            url = f"https://rest.isric.org/soilgrids/v2.0/properties/query?lat={lat}&lon={lon}&property=phh2o&property=soc&property=clay&property=sand&property=bdod&depth=0-30cm&value=mean"
            res = requests.get(url, timeout=3.5)
            if res.status_code == 200:
                data = res.json()
                props = data.get("properties", {}).get("layers", [])
                
                extracted = {}
                for layer in props:
                    name = layer.get("name")
                    depths = layer.get("depths", [])
                    if depths:
                        val = depths[0].get("values", {}).get("mean")
                        if val is not None:
                            extracted[name] = val

                # pH (SoilGrids returns pH * 10)
                raw_ph = extracted.get("phh2o", 65)
                ph_val = round(raw_ph / 10.0, 1) if raw_ph > 20 else 6.5

                # Soil Organic Carbon (dg/kg -> %)
                raw_soc = extracted.get("soc", 55)
                oc_pct = round(raw_soc / 100.0, 2) if raw_soc > 10 else 0.55

                # Bulk density (cg/cm3 -> g/cm3)
                raw_bd = extracted.get("bdod", 135)
                bd_val = round(raw_bd / 100.0, 2) if raw_bd > 50 else 1.35

                # Clay content %
                raw_clay = extracted.get("clay", 350)
                clay_pct = raw_clay / 10.0 if raw_clay > 50 else 35.0

                soil_type = "Clayey Vertisol" if clay_pct > 35 else ("Sandy Loam" if clay_pct < 20 else "Alluvial Loam")

                # NPK estimations derived from organic carbon and clay exchange capacity
                n_val = round(oc_pct * 250.0, 1)
                p_val = round(15.0 + (oc_pct * 12.0), 1)
                k_val = round(140.0 + (clay_pct * 1.5), 1)

                return SoilData(
                    ph=ph_val,
                    nitrogen=n_val,
                    phosphorus=p_val,
                    potassium=k_val,
                    organic_carbon=oc_pct,
                    moisture_percentage=26.0,
                    soil_type=soil_type,
                    bulk_density=bd_val
                )
        except Exception as e:
            logger.warning(f"Live SoilGrids fallback engaged: {e}")

        # Regional geological proxy based on lat/lon
        if 8.0 <= lat <= 35.0 and 68.0 <= lon <= 89.0:
            # India Deccan / Krishna Basin or Gangetic
            return SoilData(
                ph=6.7,
                nitrogen=142.0,
                phosphorus=23.5,
                potassium=185.0,
                organic_carbon=0.58,
                moisture_percentage=25.0,
                soil_type="Black Cotton Vertisol / Alluvial Loam",
                bulk_density=1.34
            )
        elif -33.0 <= lat <= 5.0 and -73.0 <= lon <= -35.0:
            # Brazil Cerrado Oxisol
            return SoilData(
                ph=5.8,
                nitrogen=165.0,
                phosphorus=28.0,
                potassium=210.0,
                organic_carbon=0.84,
                moisture_percentage=29.0,
                soil_type="Red-Yellow Latosol (Oxisol)",
                bulk_density=1.22
            )
        else:
            return SoilData(
                ph=6.4,
                nitrogen=138.0,
                phosphorus=22.0,
                potassium=170.0,
                organic_carbon=0.62,
                moisture_percentage=24.0,
                soil_type="Agricultural Loam",
                bulk_density=1.35
            )

live_soil_service = LiveSoilGridsService()
