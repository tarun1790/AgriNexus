# AgriNexus — Autonomous Climate-Resilient Agricultural Intelligence Platform

> **Digital Public Infrastructure (DPI) for Climate-Resilient, Precision & Regenerative Agriculture**  
> *From Earth Observation Satellites to Field-Level Variable Rate Application across Global & Indian Farming Systems.*

---

## 🌟 Executive Overview

**AgriNexus** is an open-standard, AI-powered Digital Public Infrastructure that converts earth observation satellite data, high-resolution drone multispectral imagery, physical lithosphere profiles, and meteorological streams into localized, field-specific agricultural action plans.

Built with cross-border interoperability and specialized regional depth, AgriNexus provides end-to-end coverage across India's agro-climatic zones (Krishna Basin vertisols, Indo-Gangetic alluvium, Punjab wheat-paddy belts, Deccan plateau) and global agricultural hubs (Brazil Cerrado, South Africa Highveld).

---

## 🏛️ System & Technology Architecture

AgriNexus integrates multi-spectral remote sensing, physical hydrology, deep learning, and sovereign data governance:

| Domain | Systems & Protocols | Functional Role in AgriNexus |
| :--- | :--- | :--- |
| **Generative AI & Agentic Core** | **Autonomous Multi-Agent Orchestrator** | Coordinates specialized sub-agents (Satellite Scout, Soil Microbiome, Hydrology Forecaster) with autonomous tool execution. |
| **Physical Hydrology Modelling** | **FAO-56 Penman-Monteith Evapotranspiration** | Calculates reference $ET_0$, dual crop $ET_c$, Vapor Pressure Deficit (VPD), and volumetric net irrigation deficits (L/acre). |
| **Geospatial & Remote Sensing** | **Copernicus Sentinel-2 MSI (10m) & Micro-UAV Drones** | Cloud-masked multispectral indexing computing NDVI, NDWI, EVI, SAVI, Thermal Infrared (TIR), and NDRE RedEdge. |
| **3D Geospatial Digital Twin** | **WebGL / Canvas Elevation & Canopy Mesh** | Interactive 3D micro-topography slope, sunlight angle, and root-zone water percolation visualization. |
| **Vision Pathology Diagnostics** | **Deep Residual Neural Network on PyTorch CUDA** | Real-time foliar disease diagnostics with Grad-CAM visual lesion localization and integrated pest management (IPM). |
| **Indian Agricultural Data Hub** | **ICAR, Soil Health Card, Agmarknet, IMD & ISRO** | 12-parameter Soil Health Card benchmarks, live APMC Mandi commodity prices with CACP MSP, and DAMU weather bulletins. |
| **Decentralized Privacy** | **Federated Learning (FedAvg) with $(\epsilon, \delta)$-DP** | Decentralized weight aggregation across sovereign agricultural nodes without moving raw farm records. |

---

## 🇮🇳 Bharat AgData & Indian Agricultural Intelligence Suite

AgriNexus deeply integrates the official Indian agricultural data infrastructure:

1. **📋 National Soil Health Card (SHC) 12-Parameter Assessment**:
   - Complete benchmarking across **Macronutrients** (N, P, K), **Secondary Nutrients** (S), **Micronutrients** (Zn, Fe, Cu, Mn, B), and **Physical Parameters** (pH, Electrical Conductivity, Organic Carbon) categorized by ICAR soil fertility standards.
2. **🌾 Agmarknet & e-NAM Real-Time APMC Mandi Prices**:
   - Live mandi commodity rates (Guntur Cotton/Chilli, Warangal, Rajkot, Khanna) tracking Modal, Minimum, and Maximum prices against the official **CACP Minimum Support Price (MSP)**.
3. **🌦️ IMD Agromet (Gramin Krishi Mausam Sewa & Meghdoot)**:
   - District Agro-Meteorological Unit (DAMU) weekly forecast advisories, heatwave warnings, and crop stage recommendations.
4. **🛰️ ISRO Bhuvan & VEDAS Agro-Informatics**:
   - Integration of ISRO Bhuvan Krishi remote sensing soil moisture indices and Cartosat-3 elevation baselines.
5. **🏛️ Government Subsidy & Welfare Calculator**:
   - Direct benefit eligibility for **PM-KISAN** (₹6,000/yr DBT), **PMKSY** (55-70% Micro-irrigation subsidy), and **PMFBY** crop insurance sum-insured payouts.

---

## 🚀 Key Modules & Capabilities

### 1. 🛰️ Satellite Field Digital Twin & Drone UAV Mode
- Computes **NDVI** (Canopy Vigour), **NDWI** (Water Moisture), **EVI** (Biomass), **SAVI** (Soil-Adjusted), **TIR** (Thermal Stress), and **NDRE** (Chlorophyll RedEdge).
- Interactive 8x8 spatial grid zonation identifying localized crop stress before visual canopy degradation.

### 2. 🎯 Precision Variable Rate Application (VRA) Fertilizer Prescription
- Partitions fields into 4 precision management zones based on multispectral deficits.
- Calculates exact localized dosages of Urea, DAP, Biochar, and Vermicompost, achieving $\sim 28.5\%$ chemical fertilizer savings.

### 3. 🌐 3D Canopy & Topographic Digital Twin
- Real-time 3D terrain and crop canopy mesh simulating micro-topography slope, sunlight angles, and root-zone water percolation.

### 4. 🪙 BRICS Soil Carbon MRV Tokenized Ledger
- Verifiable carbon offset ledger compliant with ISO 14064-2.
- Multi-currency valuation in INR (₹), USD ($), and BRL (R$) with cryptographic verification hashes.

### 5. 🌦️ "What-If" Climate Resilience Simulator
- Interactive stress testing for $\Delta T$, $\Delta \text{Rainfall}$, consecutive heat days, and Soil Organic Matter shifts.
- Quantifies projected **Yield Impact (%)**, **Water Deficit (L/acre)**, and 5-year adaptation ROI.

### 6. 🦠 AI Crop Disease Diagnostics (Grad-CAM Vision)
- Diagnoses foliar pathogens with confidence scores, cultural management practices, biological solutions, and approved treatments with Grad-CAM heatmaps.

### 7. 🗣️ Multilingual Voice Interface
- Natural speech narration in **Telugu (తెలుగు)**, **Hindi (हिन्दी)**, and **English (EN)** with live audio waveform visualizer.

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

## 👥 Contributors & Core Team

| Contributor | GitHub Profile | Role |
| :--- | :--- | :--- |
| **Tarun Jampani** | [@tarun1790](https://github.com/tarun1790) | Lead Architect & Full-Stack AI Engineer |
| **Varun Teja** | [@varunteja75](https://github.com/varunteja75) | Core Contributor & Agronomic Intelligence Systems |
| **Nahin Khan Pattan** | [@Nahinkhanpattan](https://github.com/Nahinkhanpattan) | Core Contributor & Geospatial AI Systems |

---

## 📄 License
This project is licensed under the Apache 2.0 License - see the LICENSE file for details.
