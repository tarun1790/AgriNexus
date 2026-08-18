import math
from typing import Dict, Any

class FertigationHydraulicService:
    """
    Sub-Surface Drip Fertigation & Hazen-Williams Hydraulic Fluid Dynamics Service.
    Calculates friction head loss (hf), lateral flow uniformity (Christiansen Coefficient CU / Emission Uniformity EU),
    and venturi differential suction injection rates (L/hr).
    """

    def calculate_fertigation_hydraulics(
        self,
        operating_pressure_bar: float = 1.5,
        lateral_length_meters: float = 100.0,
        emitter_spacing_meters: float = 0.4,
        nominal_emitter_lph: float = 2.2,
        internal_diameter_mm: float = 16.0,
        fertilizer_solution_liters: float = 80.0
    ) -> Dict[str, Any]:
        """
        Hazen-Williams Equation for Pipe Friction Head Loss (hf in meters):
        hf = 10.67 * L * (Q^1.852) / (C^1.852 * D^4.87)
        where:
        - L = lateral length (m)
        - Q = discharge flow rate (m3/s)
        - C = Hazen-Williams roughness coefficient (~145 for smooth polyethylene PE pipes)
        - D = internal pipe diameter (m)
        """
        num_emitters = int(lateral_length_meters / emitter_spacing_meters)
        total_lateral_lph = num_emitters * nominal_emitter_lph
        q_m3_s = (total_lateral_lph / 1000.0) / 3600.0
        d_m = internal_diameter_mm / 1000.0
        c_hw = 145.0  # Smooth PE Pipe

        # Christiansen reduction factor F for multi-outlet lateral lines (~0.36 for large N)
        f_christiansen = 0.36
        hf_full = (10.67 * lateral_length_meters * (q_m3_s ** 1.852)) / ((c_hw ** 1.852) * (d_m ** 4.87))
        hf_actual_meters = round(hf_full * f_christiansen, 2)
        head_loss_bar = round(hf_actual_meters * 0.0981, 3)

        # End of lateral pressure
        end_pressure_bar = round(max(0.4, operating_pressure_bar - head_loss_bar), 2)
        
        # Emission Uniformity (EU) based on pressure variation
        # EU = 100 * (1.0 - 0.5 * (hf_actual_meters / (operating_pressure_bar * 10.197)))
        eu_pct = round(min(98.5, max(75.0, 100.0 * (1.0 - 0.5 * (head_loss_bar / operating_pressure_bar)))), 1)

        # Venturi Differential Injection Rate (L/hr)
        # Higher pressure differential creates greater vacuum suction
        venturi_suction_lph = round(float(25.0 * math.sqrt(max(0.2, operating_pressure_bar * 0.35))), 1)
        injection_time_minutes = round((fertilizer_solution_liters / max(1.0, venturi_suction_lph)) * 60.0, 1)

        return {
            "hydraulic_parameters": {
                "operating_pump_pressure_bar": operating_pressure_bar,
                "inlet_head_meters": round(operating_pressure_bar * 10.197, 1),
                "lateral_length_meters": lateral_length_meters,
                "internal_diameter_mm": internal_diameter_mm,
                "emitter_count_per_lateral": num_emitters,
                "nominal_discharge_per_emitter_lph": nominal_emitter_lph
            },
            "friction_loss_analysis": {
                "pipe_roughness_c_factor": c_hw,
                "hazen_williams_head_loss_meters": hf_actual_meters,
                "pressure_drop_bar": head_loss_bar,
                "tail_end_pressure_bar": end_pressure_bar,
                "emission_uniformity_eu_pct": eu_pct,
                "uniformity_grade": "Excellent (ASABE Class A)" if eu_pct >= 90.0 else "Good (Acceptable)"
            },
            "venturi_fertigation_dosing": {
                "stock_solution_payload_liters": fertilizer_solution_liters,
                "venturi_injection_suction_rate_lph": venturi_suction_lph,
                "required_injection_time_minutes": injection_time_minutes,
                "recommended_flush_time_minutes": 15.0,
                "solute_distribution_advisory": f"Maintain {operating_pressure_bar} bar pump pressure to complete {fertilizer_solution_liters}L fertigation cycle in {injection_time_minutes} minutes with {eu_pct}% lateral emission uniformity."
            }
        }

fertigation_service = FertigationHydraulicService()
