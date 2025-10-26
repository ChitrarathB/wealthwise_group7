#!/bin/bash

echo "🚀 LSTM Rate Prediction API Test Suite"
echo "====================================="

BASE_URL="http://localhost:9000"

echo ""
echo "🔍 1. Testing Health Check Endpoint..."
curl -s -X GET "$BASE_URL/api/rates-health" | python3 -m json.tool

echo ""
echo "📊 2. Testing Latest Rates Endpoint..."
curl -s -X GET "$BASE_URL/api/latest-rates" | python3 -m json.tool

echo ""
echo "🔮 3. Testing Default Rate Prediction (60 months)..."
curl -s -X GET "$BASE_URL/api/predict-rates" | python3 -m json.tool

echo ""
echo "🎯 4. Testing Custom Rate Prediction (12 months)..."
curl -s -X POST "$BASE_URL/api/predict-rates" \
  -H "Content-Type: application/json" \
  -d '{"months_ahead": 12}' | python3 -m json.tool

echo ""
echo "✨ Test suite completed!"