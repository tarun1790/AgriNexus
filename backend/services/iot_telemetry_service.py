from datetime import datetime
import numpy as np
from backend.models.schemas import IoTProbeTelemetry

class IoTFieldSensorService:
    """
    Simulates live multi-depth LoRaWAN / NB-IoT field soil telemetry probes.
    Monitors root-zone stratification at 15cm (topsoil), 30cm (mid root), and 60cm (subsoil taproot).
    """

    def __init__(self):
        self.probe_id = "PROBE_IN_AP_VERTISOL_09"

    def get_live_probe_reading(self, baseline_moisture: float = 24.0) -> IoTProbeTelemetry:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        
        # Subtle real-time sensor fluctuation
        fluctuation = np.random.uniform(-0.4, 0.4)
        m15 = round(max(10.0, baseline_moisture - 3.5 + fluctuation), 1)
        m30 = round(max(12.0, baseline_moisture + fluctuation), 1)
        m60 = round(max(15.0, baseline_moisture + 5.2 + (fluctuation * 0.5)), 1)

        soil_temp = round(29.5 + np.random.uniform(-0.3, 0.5), 1)
        ec = round(0.85 + np.random.uniform(-0.05, 0.05), 2)  # dS/m
        kpa = round(-1 * (100 - m30) * 1.8, 1)  # Soil matric potential in kPa

        status = "Active & Calibrated" if m30 > 18.0 else "Moisture Depletion Warning (<20%)"

        return IoTProbeTelemetry(
            probe_id=self.probe_id,
            timestamp=now_str,
            battery_level_pct=94.0,
            depth_15cm_moisture_pct=m15,
            depth_30cm_moisture_pct=m30,
            depth_60cm_moisture_pct=m60,
            soil_temp_celsius=soil_temp,
            electrical_conductivity_ds_m=ec,
            root_zone_water_potential_kpa=kpa,
            probe_status=status
        )

iot_service = IoTFieldSensorService()
