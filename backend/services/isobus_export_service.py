import json
from typing import Dict, Any, List

class ISOBUSExportService:
    """
    ISO 11783-10 (ISOBUS / ISO-XML) & GeoJSON Tractor Task Map Generator.
    Formats 4-zone precision VRA fertilizer and seed prescriptions for onboard terminals
    including John Deere GreenStar (GS4/G5), Trimble Ag TMX-2050, Topcon, and Case IH AFS.
    """

    def generate_isobus_task_file(self, farm_id: str, crop: str, area_acres: float, zones_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generates standard ISO-11783 XML string and GeoJSON shapefile payload.
        """
        if not zones_data:
            zones_data = [
                {"zone_id": "Zone 1 (Depleted Carbon/N)", "rate_kg_ha": 140, "area_pct": 28.0, "nitrogen_rec": "140 kg/ha Urea + Biochar"},
                {"zone_id": "Zone 2 (Moderate Vigour)", "rate_kg_ha": 110, "area_pct": 34.0, "nitrogen_rec": "110 kg/ha Urea + VAM"},
                {"zone_id": "Zone 3 (Optimal Fertility)", "rate_kg_ha": 85, "area_pct": 26.0, "nitrogen_rec": "85 kg/ha Maintenance NPK"},
                {"zone_id": "Zone 4 (High Biomass)", "rate_kg_ha": 60, "area_pct": 12.0, "nitrogen_rec": "60 kg/ha Micro-dosing"}
            ]

        # Construct ISO 11783-10 Task Data XML
        xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<ISO11783_TaskData VersionMajor="4" VersionMinor="2" ManagementSoftwareManufacturer="AgriVeda" DataTransferOrigin="1">
  <CTR A="CTR1" B="Tarun Jampani Precision Agriculture" C="Guntur Andhra Pradesh" />
  <FRM A="FRM1" B="Smart Digital Twin Farm" I="CTR1" />
  <PFD A="PFD1" B="{farm_id}" C="{round(area_acres * 0.404686, 2)}" D="FRM1">
    <PDT A="PDT1" B="{crop} Seed / Fertilizer VRA Prescription" />
  </PFD>
  <TSK A="TSK1" B="VRA Nitrogen Prescription Task" G="1" I="PFD1">
    <TZN A="0" B="Default Base Rate" G="95.00" />
"""
        for idx, z in enumerate(zones_data):
            xml_content += f"""    <TZN A="{idx+1}" B="{z['zone_id']}" G="{z['rate_kg_ha']:.2f}">
      <PDV A="PDT1" B="1" C="{z['rate_kg_ha']:.2f}" />
    </TZN>
"""
        xml_content += """  </TSK>
</ISO11783_TaskData>"""

        # Construct GeoJSON FeatureCollection
        geojson_features = []
        for idx, z in enumerate(zones_data):
            geojson_features.append({
                "type": "Feature",
                "properties": {
                    "zone_id": z["zone_id"],
                    "prescribed_rate_kg_ha": z["rate_kg_ha"],
                    "area_percentage": z["area_pct"],
                    "recommendation": z["nitrogen_rec"]
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [80.640 + idx*0.002, 16.500],
                        [80.642 + idx*0.002, 16.500],
                        [80.642 + idx*0.002, 16.504],
                        [80.640 + idx*0.002, 16.504],
                        [80.640 + idx*0.002, 16.500]
                    ]]
                }
            })

        geojson_payload = {
            "type": "FeatureCollection",
            "metadata": {
                "format": "ISOBUS ISO-11783 & OGC GeoJSON",
                "farm_id": farm_id,
                "crop": crop,
                "area_acres": area_acres,
                "total_zones": len(zones_data)
            },
            "features": geojson_features
        }

        return {
            "format_standard": "ISO 11783-10 (ISOBUS XML) & OGC GeoJSON TaskData",
            "compatible_terminals": [
                "John Deere Generation 4 / G5 CommandCenter (GS4/G5)",
                "Trimble Ag TMX-2050 / GFX-750",
                "Topcon X35 Precision Console",
                "Case IH AFS Pro 700 / Pro 1200",
                "Mahindra / Sonalika Precision VRA Controller"
            ],
            "iso_xml_string": xml_content,
            "geojson_task_map": geojson_payload
        }

isobus_service = ISOBUSExportService()
