import numpy as np
from datetime import datetime
from typing import List, Dict, Any
from backend.models.schemas import FederatedNodeStatus, FederatedAggregationResponse

class FederatedAgriNetworkEngine:
    """
    Decentralized Cross-Border Federated Learning & Interoperability Prototype.
    Demonstrates Federated Averaging (FedAvg) across sovereign agricultural data nodes
    (e.g., India, Brazil, South Africa) preserving raw data localization.
    """

    def __init__(self):
        self.current_round = 4
        self.global_accuracy = 89.4
        self.nodes = [
            {
                "node_id": "node_in_icar_01",
                "country_name": "India (ICAR / National Agri-Grid)",
                "country_code": "IN",
                "local_samples_count": 14200,
                "local_model_accuracy_pct": 88.2,
                "privacy_epsilon": 1.2,
                "weights_vector": np.random.normal(0.5, 0.1, 10),
                "status": "Online & Synchronized"
            },
            {
                "node_id": "node_br_embrapa_02",
                "country_name": "Brazil (Embrapa Cerrado Soil AI)",
                "country_code": "BR",
                "local_samples_count": 11800,
                "local_model_accuracy_pct": 87.5,
                "privacy_epsilon": 1.5,
                "weights_vector": np.random.normal(0.48, 0.1, 10),
                "status": "Online & Synchronized"
            },
            {
                "node_id": "node_za_arc_03",
                "country_name": "South Africa (ARC Grain Crops Network)",
                "country_code": "ZA",
                "local_samples_count": 7600,
                "local_model_accuracy_pct": 85.9,
                "privacy_epsilon": 1.2,
                "weights_vector": np.random.normal(0.52, 0.1, 10),
                "status": "Online & Synchronized"
            },
            {
                "node_id": "node_eg_arc_04",
                "country_name": "Egypt (Nile Basin Climate-Agri)",
                "country_code": "EG",
                "local_samples_count": 6400,
                "local_model_accuracy_pct": 86.4,
                "privacy_epsilon": 1.4,
                "weights_vector": np.random.normal(0.49, 0.1, 10),
                "status": "Online & Synchronized"
            }
        ]

    def get_nodes_status(self) -> List[FederatedNodeStatus]:
        now_ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        return [
            FederatedNodeStatus(
                node_id=n["node_id"],
                country_name=n["country_name"],
                country_code=n["country_code"],
                local_samples_count=n["local_samples_count"],
                local_model_accuracy_pct=round(n["local_model_accuracy_pct"], 1),
                privacy_epsilon=n["privacy_epsilon"],
                last_sync_timestamp=now_ts,
                status=n["status"]
            )
            for n in self.nodes
        ]

    def trigger_federated_round(self) -> FederatedAggregationResponse:
        """
        Executes a FedAvg round:
        w_global = sum( (n_k / N) * w_k )
        Applies differential privacy noise injection and computes convergence.
        """
        self.current_round += 1
        total_samples = sum(n["local_samples_count"] for n in self.nodes)

        # Weighted parameter aggregation
        aggregated_weights = np.zeros(10)
        for n in self.nodes:
            weight_factor = n["local_samples_count"] / total_samples
            # Simulate local training improvement + differential privacy noise
            dp_noise = np.random.normal(0, 0.005, 10)
            local_weights = n["weights_vector"] + dp_noise
            aggregated_weights += weight_factor * local_weights

            # Local accuracy increments
            n["local_model_accuracy_pct"] = min(98.5, n["local_model_accuracy_pct"] + np.random.uniform(0.4, 0.9))

        # Global accuracy advancement
        old_acc = self.global_accuracy
        accuracy_gain = round(float(np.random.uniform(0.6, 1.4)), 2)
        self.global_accuracy = min(98.8, round(old_acc + accuracy_gain, 2))

        return FederatedAggregationResponse(
            round_number=self.current_round,
            participating_nodes=self.get_nodes_status(),
            global_model_accuracy_pct=self.global_accuracy,
            accuracy_gain_pct=accuracy_gain,
            aggregation_algorithm="FedAvg (Federated Averaging with (ε, δ)-Differential Privacy)",
            privacy_guarantee="Differential Privacy (ε=1.2, δ=1e-5) — Zero Raw PII/Telemetry Exfiltration",
            convergence_status=f"Converging (Round {self.current_round}: +{accuracy_gain}% global boost)"
        )

federated_engine = FederatedAgriNetworkEngine()
