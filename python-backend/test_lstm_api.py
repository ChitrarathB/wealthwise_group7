#!/usr/bin/env python3
"""
Test script for LSTM Rate Prediction API
This script demonstrates how to use the new rate prediction endpoints
"""

import requests
import json

BASE_URL = "http://localhost:9000"

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing LSTM Rate Prediction Health Check...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/rates-health")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check successful!")
            print(f"Service Ready: {data['status']['ready']}")
            print(f"Data Loaded: {data['status']['data_loaded']}")
            print(f"Model Trained: {data['status']['model_trained']}")
            
            if 'data_date_range' in data['status']:
                print(f"Data Range: {data['status']['data_date_range']['start']} to {data['status']['data_date_range']['end']}")
        else:
            print(f"❌ Health check failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing health check: {e}")

def test_latest_rates():
    """Test getting latest historical rates"""
    print("\n📊 Testing Latest Rates Endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/latest-rates")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Latest rates retrieved!")
            print(f"Date: {data['date']}")
            print(f"Nominal Rate: {data['nominal_rate']}%")
            print(f"Inflation Rate: {data['inflation_rate']}%")
        else:
            print(f"❌ Failed to get latest rates: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing latest rates: {e}")

def test_default_prediction():
    """Test default rate prediction (60 months)"""
    print("\n🔮 Testing Default Rate Prediction (60 months)...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/predict-rates")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Rate prediction successful!")
            print(f"Forecast Period: {data['forecast_months']} months")
            print(f"Forecast Range: {data['forecast_start_date']} to {data['forecast_end_date']}")
            
            print("\n📈 Summary Statistics:")
            summary = data['summary']
            print(f"Average Nominal Rate: {summary['avg_nominal_rate']}%")
            print(f"Average Inflation Rate: {summary['avg_inflation_rate']}%")
            print(f"Nominal Rate Range: {summary['min_nominal_rate']}% - {summary['max_nominal_rate']}%")
            print(f"Inflation Rate Range: {summary['min_inflation_rate']}% - {summary['max_inflation_rate']}%")
            
            print(f"\n📝 First 5 Nominal Rate Predictions:")
            for rate in data['nominal_rates'][:5]:
                print(f"  {rate['date']}: {rate['rate']}%")
            
            print(f"\n📝 First 5 Inflation Rate Predictions:")
            for rate in data['inflation_rates'][:5]:
                print(f"  {rate['date']}: {rate['rate']}%")
                
        else:
            print(f"❌ Prediction failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing prediction: {e}")

def test_custom_prediction():
    """Test custom rate prediction (12 months)"""
    print("\n🎯 Testing Custom Rate Prediction (12 months)...")
    
    try:
        payload = {"months_ahead": 12}
        response = requests.post(
            f"{BASE_URL}/api/predict-rates",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Custom prediction successful!")
            print(f"Forecast Period: {data['forecast_months']} months")
            
            print(f"\n📊 All Nominal Rate Predictions:")
            for rate in data['nominal_rates']:
                print(f"  {rate['date']}: {rate['rate']}%")
            
            print(f"\n📊 All Inflation Rate Predictions:")
            for rate in data['inflation_rates']:
                print(f"  {rate['date']}: {rate['rate']}%")
                
        else:
            print(f"❌ Custom prediction failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing custom prediction: {e}")

def main():
    """Run all tests"""
    print("🚀 LSTM Rate Prediction API Test Suite")
    print("=" * 50)
    
    # Run tests
    test_health_check()
    test_latest_rates()
    test_default_prediction()
    test_custom_prediction()
    
    print("\n" + "=" * 50)
    print("✨ Test suite completed!")

if __name__ == "__main__":
    main()