# AgriNexus — AI-Powered Climate-Resilient Agriculture Network

> **Digital Public Infrastructure (DPI) for Climate-Resilient & Regenerative Agriculture**  
> *From Satellite Data to Field-Level Decisions across Global & BRICS Agricultural Regions.*

---

## 🌟 Executive Overview

**AgriNexus** is an open-standard, AI-powered Digital Public Infrastructure that converts earth observation satellite data, soil health profiles, and predictive climate hazard models into localized, field-specific agricultural action plans.

Built with cross-border applicability in mind, AgriNexus scales across diverse agro-climatic zones (e.g., India's Krishna Basin & Punjab Alluvium, Brazil's Cerrado Oxisols, South Africa's Free State Maize Triangle, and Egypt's Nile Delta), enabling sovereign data governance paired with decentralized global intelligence sharing.

---

## 🧠 Google AI & Technology Architecture

AgriNexus deeply integrates the Google AI ecosystem across every analytical layer:

| Domain | Google AI & Cloud Services | Functional Role in AgriNexus |
| :--- | :--- | :--- |
| **Generative AI & Reasoning** | **Google Gemini API (1.5 Pro / Flash) & Vertex AI** | Translates multi-sensor telemetry into field-specific action plans with actionable natural language instructions. |
| **Predictive Modelling** | **Vertex AI — AutoML & Custom Model Serving** | Predicts crop yield anomalies, heat stress vulnerabilities, and calculates localized irrigation demands. |
| **Vision & Multimodal** | **Gemini Multimodal Vision & Vertex AI Vision** | Diagnoses foliar crop diseases from leaf photographs, assessing pathogen severity and generating biological/chemical remedies. |
| **Language & Voice** | **Cloud Text-to-Speech, Speech-to-Text & Translation** | Delivers voice-first advisory in regional languages (English, Telugu, Hindi, Brazilian Portuguese, etc.). |
| **Geospatial Intelligence** | **Google Earth Engine & Google Maps Platform** | Cloud-masked multispectral satellite indexing (Sentinel-2, Landsat-9) computing NDVI, NDWI, and EVI field heatmaps. |
| **Cross-Border Warehouse** | **Google Cloud BigQuery & Firebase Realtime DB** | Petabyte-scale agronomic analytics, satellite timeseries queries, and live advisory telemetry broadcasts. |
| **Public Data Ingestion** | **Copernicus, FAOSTAT, IMD, BRICS Open Portals** | Global crop water footprints, weather grids, and sovereign soil property benchmarks. |

---

## 🏗️ System Architecture

```text
                               ┌──────────────────────────────────────────────────────────┐
                               │                    FARMER & AGRONOMIST                   │
                               │               Web / Mobile / Voice Interface             │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
                                                            ▼
                               ┌──────────────────────────────────────────────────────────┐
                               │                 AGRINEXUS DPI DASHBOARD                  │
                               │  - Field Digital Twin & 10m NDVI/NDWI Zonation Heatmaps  │
                               │  - Soil Health & Regenerative Carbon Optimizer           │
                               │  - "What-If" Climate Simulator (ΔT, ΔRainfall, SOM)      │
                               │  - AI Foliar Pathology Scanner (Gemini Multimodal/Torch) │
                               │  - Multilingual Voice Assistant (Telugu, Hindi, English) │
                               │  - Cross-Border Federated Learning Network Telemetry     │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │ REST / JSON (Agri-DPI Specs)
                                                            ▼
                               ┌──────────────────────────────────────────────────────────┐
                               │                     FASTAPI BACKEND                      │
                               │  /api/v1/farms               /api/v1/satellite/indices   │
                               │  /api/v1/soil/health         /api/v1/climate/simulate    │
                               │  /api/v1/disease/detect      /api/v1/advisory/generate   │
                               │  /api/v1/vertex-ai/predict   /api/v1/federated/aggregate │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
                 ┌──────────────────────────────────────────┼──────────────────────────────────────────┐
                 ▼                                          ▼                                          ▼
   ┌───────────────────────────┐              ┌───────────────────────────┐              ┌───────────────────────────┐
   │    GEOSPATIAL & SATELLITE │              │      AGRONOMIC AI CORE    │              │    FEDERATED DPI NETWORK  │
   │  - Google Earth Engine    │              │  - Google Gemini 1.5 Pro  │              │  - Sovereign Nodes        │
   │  - Copernicus Sentinel-2  │              │  - Vertex AI AutoML       │              │    (India, Brazil, SA)    │
   │  - NDVI / NDWI / EVI      │              │  - Soil Health Scorer     │              │  - FedAvg Aggregator      │
   │  - 8x8 Spatial Zonation   │              │  - What-If Sim Engine     │              │  - (ε, δ)-Differential   │
   │  - Google Maps Platform   │              │  - Disease Diagnostics    │              │    Privacy Guarantees     │
   └───────────────────────────┘              └───────────────────────────┘              └───────────────────────────┘
```

---

## 🚀 Key Modules & Capabilities

### 1. 🛰️ Satellite Field Digital Twin (10m Resolution)
- Computes **NDVI** (Normalized Difference Vegetation Index), **NDWI** (Water Stress), and **EVI** (Enhanced Vegetation Index).
- Interactive 8x8 spatial grid zonation identifying localized crop stress before canopy damage becomes irreversible.

### 2. 🌱 Soil Intelligence & Regenerative Optimizer
- Calculates composite **Soil Health Score (0-100)** across pH, Available NPK, Organic Carbon, and Water Retention Capacity.
- Prescribes regenerative practices (Biochar & Compost Co-Application, Legume Intercropping, Zero-Tillage Residue Management) and estimates **Soil Carbon Credit Monetization ($/year)**.

### 3. 🌦️ "What-If" Climate Resilience Simulator
- Interactive scenario testing:
  - $\Delta T \in [-3^\circ\text{C}, +5^\circ\text{C}]$
  - $\Delta \text{Rainfall} \in [-60\%, +60\%]$
  - Consecutive Extreme Heat Days ($>40^\circ\text{C}$)
  - Regenerative Soil Organic Matter shift
- Quantifies projected **Yield Delta (%)**, **Evapotranspiration Deficit (Liters/Acre)**, and ranks **Climate-Smart Alternative Crops** (Pearl Millet, Sorghum, Pigeonpea, Native Drought-Tolerant Cotton).

### 4. 🦠 AI Crop Disease Diagnostics (Multimodal Vision)
- Diagnoses foliar pathogens (Bacterial Blight, Rice Blast, Stripe Rust, Leaf Blight) with confidence scores, cultural management practices, biological solutions, and approved treatments.

### 5. 🗣️ Localized Multilingual Advisory & Voice Interface
- Fuses all sensor and satellite evidence into field instructions.
- Instant translation into **Telugu (తెలుగు)**, **Hindi (हिन्दी)**, and **English (EN)** with natural speech narration.

### 6. 🔐 Cross-Border Federated Learning (BRICS Data Network)
- Decentralized parameter aggregation using **FedAvg** and **$(\epsilon, \delta)$-Differential Privacy**.
- Allows regional models across India, Brazil, South Africa, and Egypt to continuously learn from global agricultural patterns without moving raw farmer records out of sovereign territory.

---

## ⚡ Quickstart Guide

### Prerequisites
- Python 3.10+
- PyTorch with CUDA (or optimized CPU)

### Installation
```bash
# Clone the repository
git clone https://github.com/tarun1790/AgriNexus.git
cd AgriNexus

# Install dependencies
pip install -r requirements.txt
```

### Run Local Server
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Open your browser at:
- **Interactive UI**: [http://localhost:8000](http://localhost:8000)
- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Run Test Suite
```bash
python tests/test_api.py
```

---

## 🔌 Standardized Agri-DPI REST Endpoints

```http
GET  /api/v1/health                  # System health & Google AI service status
GET  /api/v1/farms                   # List sovereign farm digital twin profiles
GET  /api/v1/farms/{id}              # Fetch individual farm telemetry
POST /api/v1/satellite/indices       # Calculate 10m multispectral field grid
POST /api/v1/soil/health             # Compute Soil Health Score & Carbon Credits
POST /api/v1/climate/risk            # Predict multi-hazard climate stress
POST /api/v1/climate/simulate        # Run "What-If" climate scenario simulation
POST /api/v1/disease/detect          # Multimodal leaf pathology classification
POST /api/v1/advisory/generate       # Evidence fusion & multilingual advisory
POST /api/v1/vertex-ai/predict-yield # Vertex AI AutoML yield forecasting
GET  /api/v1/bigquery/analytics      # BigQuery cross-border benchmark query
POST /api/v1/federated/aggregate     # Execute FedAvg decentralized round
```

---

## 👥 Contributors & Core Team

| Contributor | GitHub Profile | Role |
| :--- | :--- | :--- |
| **Tarun Jampani** | [@tarun1790](https://github.com/tarun1790) | Lead Architect & Full-Stack AI Engineer |
| **Varun Teja** | [@varunteja75](https://github.com/varunteja75) | Core Contributor & Agronomic Intelligence Systems |

---

## 📄 License
This project is licensed under the Apache 2.0 License - see the LICENSE file for details.
