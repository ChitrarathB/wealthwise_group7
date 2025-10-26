# LSTM Rate Prediction API Documentation

This API provides LSTM-based forecasting for nominal interest rates and inflation rates using historical financial data.

## Overview

The LSTM Rate Prediction controller uses a trained LSTM neural network to forecast:
- **Nominal Interest Rates**: Government bond rates or central bank rates
- **Inflation Rates**: Year-over-Year inflation percentages

## Endpoints

### 1. Health Check
**GET** `/api/rates-health`

Check if the LSTM service is ready and operational.

**Response:**
```json
{
  "success": true,
  "status": {
    "data_loaded": true,
    "model_trained": true,
    "scaler_ready": true,
    "ready": true,
    "data_shape": [120, 2],
    "data_date_range": {
      "start": "2015-01",
      "end": "2024-12"
    }
  },
  "model_config": {
    "lookback_months": 12,
    "default_forecast_months": 60,
    "variables": ["Nominal_Rate", "YoY_Inflation"]
  }
}
```

### 2. Latest Historical Rates
**GET** `/api/latest-rates`

Get the most recent historical nominal and inflation rates.

**Response:**
```json
{
  "success": true,
  "date": "2024-12",
  "nominal_rate": 4.2500,
  "inflation_rate": 2.8750
}
```

### 3. Rate Predictions (Default)
**GET** `/api/predict-rates`

Generate rate forecasts for the default period (60 months/5 years).

**Response:**
```json
{
  "success": true,
  "forecast_months": 60,
  "forecast_start_date": "2025-01",
  "forecast_end_date": "2029-12",
  "nominal_rates": [
    {"date": "2025-01", "rate": 4.3200},
    {"date": "2025-02", "rate": 4.2800},
    // ... 58 more monthly predictions
  ],
  "inflation_rates": [
    {"date": "2025-01", "rate": 2.9100},
    {"date": "2025-02", "rate": 2.8500},
    // ... 58 more monthly predictions
  ],
  "summary": {
    "avg_nominal_rate": 4.1500,
    "avg_inflation_rate": 2.7500,
    "min_nominal_rate": 3.8200,
    "max_nominal_rate": 4.5600,
    "min_inflation_rate": 2.1500,
    "max_inflation_rate": 3.2800
  }
}
```

### 4. Rate Predictions (Custom Period)
**POST** `/api/predict-rates`

Generate rate forecasts for a custom time period.

**Request Body:**
```json
{
  "months_ahead": 12
}
```

**Parameters:**
- `months_ahead` (integer): Number of months to forecast (1-120)

**Response:** Same format as GET request, but with the specified number of months.

## Usage Examples

### cURL Examples

```bash
# Health check
curl -X GET "http://localhost:9000/api/rates-health"

# Get latest rates
curl -X GET "http://localhost:9000/api/latest-rates"

# Default prediction (60 months)
curl -X GET "http://localhost:9000/api/predict-rates"

# Custom prediction (12 months)
curl -X POST "http://localhost:9000/api/predict-rates" \
  -H "Content-Type: application/json" \
  -d '{"months_ahead": 12}'
```

### Python Examples

```python
import requests

BASE_URL = "http://localhost:9000"

# Health check
response = requests.get(f"{BASE_URL}/api/rates-health")
health_data = response.json()

# Get latest rates
response = requests.get(f"{BASE_URL}/api/latest-rates")
latest_rates = response.json()

# Default prediction
response = requests.get(f"{BASE_URL}/api/predict-rates")
default_prediction = response.json()

# Custom prediction
payload = {"months_ahead": 24}
response = requests.post(f"{BASE_URL}/api/predict-rates", json=payload)
custom_prediction = response.json()
```

### JavaScript/Frontend Examples

```javascript
// Health check
const healthResponse = await fetch('/api/rates-health');
const healthData = await healthResponse.json();

// Get latest rates
const latestResponse = await fetch('/api/latest-rates');
const latestRates = await latestResponse.json();

// Default prediction
const defaultResponse = await fetch('/api/predict-rates');
const defaultPrediction = await defaultResponse.json();

// Custom prediction
const customResponse = await fetch('/api/predict-rates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ months_ahead: 36 })
});
const customPrediction = await customResponse.json();
```

## Model Details

- **Architecture**: LSTM Neural Network
- **Lookback Window**: 12 months of historical data
- **Training Data**: Historical nominal rates and inflation rates
- **Forecast Horizon**: Up to 10 years (120 months)
- **Update Frequency**: Model retrains automatically when new data is available

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Description of the error",
  "details": "Technical error details"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `500`: Internal Server Error (model/data issues)

## Integration Notes

1. **Data Requirements**: Ensure `ai_model_input_data.csv` exists with required columns
2. **Dependencies**: TensorFlow, scikit-learn, pandas, numpy
3. **Performance**: Initial model training may take 30-60 seconds
4. **Memory**: LSTM models require adequate RAM for training and prediction
5. **CORS**: Enabled for all origins in development

## Testing

Run the included test scripts:

```bash
# Python test script
cd python-backend
python test_lstm_api.py

# Bash/curl test script
./test_lstm_curl.sh
```