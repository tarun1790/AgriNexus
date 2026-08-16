from backend.models.schemas import FarmProfile, FieldCoordinates, SoilData, WeatherData

DEMO_FARMS = {
    "farm_in_cotton_01": FarmProfile(
        farm_id="farm_in_cotton_01",
        farmer_name="Ramesh Kumar",
        country_code="IN",
        region="Krishna Basin, Andhra Pradesh, India",
        crop="Cotton",
        crop_stage="Boll Development / Peak Vegetative",
        field=FieldCoordinates(latitude=16.5062, longitude=80.6480, area_acres=2.4),
        soil=SoilData(
            ph=6.4,
            nitrogen=135.0,
            phosphorus=21.0,
            potassium=175.0,
            organic_carbon=0.52,
            moisture_percentage=24.0,
            soil_type="Deep Black Cotton Clay (Vertisol)",
            bulk_density=1.38
        ),
        weather=WeatherData(
            temperature_celsius=37.5,
            humidity_percentage=58.0,
            rainfall_forecast_mm=2.5,
            rain_probability_pct=14.0,
            wind_speed_kmh=14.0,
            solar_radiation_mj=22.4
        )
    ),
    "farm_in_rice_02": FarmProfile(
        farm_id="farm_in_rice_02",
        farmer_name="Gurpreet Singh",
        country_code="IN",
        region="Ludhiana District, Punjab, India",
        crop="Rice",
        crop_stage="Tillering & Panicle Initiation",
        field=FieldCoordinates(latitude=30.9010, longitude=75.8573, area_acres=4.0),
        soil=SoilData(
            ph=7.4,
            nitrogen=180.0,
            phosphorus=32.0,
            potassium=190.0,
            organic_carbon=0.48,
            moisture_percentage=38.0,
            soil_type="Indo-Gangetic Alluvial Loam",
            bulk_density=1.30
        ),
        weather=WeatherData(
            temperature_celsius=34.0,
            humidity_percentage=72.0,
            rainfall_forecast_mm=12.0,
            rain_probability_pct=65.0,
            wind_speed_kmh=9.0,
            solar_radiation_mj=19.5
        )
    ),
    "farm_br_soy_03": FarmProfile(
        farm_id="farm_br_soy_03",
        farmer_name="Lucas Silveira",
        country_code="BR",
        region="Sorriso, Mato Grosso, Brazil",
        crop="Soybean",
        crop_stage="Pod Filling (R4-R5)",
        field=FieldCoordinates(latitude=-12.5425, longitude=-55.7211, area_acres=50.0),
        soil=SoilData(
            ph=5.8,
            nitrogen=160.0,
            phosphorus=28.0,
            potassium=210.0,
            organic_carbon=0.82,
            moisture_percentage=29.0,
            soil_type="Oxisol (Red-Yellow Latosol)",
            bulk_density=1.22
        ),
        weather=WeatherData(
            temperature_celsius=32.8,
            humidity_percentage=64.0,
            rainfall_forecast_mm=5.0,
            rain_probability_pct=22.0,
            wind_speed_kmh=11.0,
            solar_radiation_mj=20.8
        )
    ),
    "farm_za_maize_04": FarmProfile(
        farm_id="farm_za_maize_04",
        farmer_name="Sipho Ndlovu",
        country_code="ZA",
        region="Bothaville, Free State, South Africa",
        crop="Maize",
        crop_stage="Silking / Tasseling",
        field=FieldCoordinates(latitude=-27.3833, longitude=26.6167, area_acres=15.0),
        soil=SoilData(
            ph=6.1,
            nitrogen=145.0,
            phosphorus=24.0,
            potassium=165.0,
            organic_carbon=0.61,
            moisture_percentage=22.0,
            soil_type="Sandy Loam (Hutton Form)",
            bulk_density=1.42
        ),
        weather=WeatherData(
            temperature_celsius=31.5,
            humidity_percentage=48.0,
            rainfall_forecast_mm=1.0,
            rain_probability_pct=8.0,
            wind_speed_kmh=16.0,
            solar_radiation_mj=23.1
        )
    )
}
