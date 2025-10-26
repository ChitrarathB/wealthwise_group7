
from flask import Flask, request, jsonify
from flask_cors import CORS
from customer_categorizer import NewCustomerCategorizer
from life_stage_expense_prediction import ExpensePredictor
from lstm_rate_controller import LSTMRateController

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

categorizer = NewCustomerCategorizer()
expense_predictor = ExpensePredictor()
lstm_controller = LSTMRateController()

@app.route('/')
def index():
    return jsonify({"message": "WealthWise Python backend is running!"})

@app.route('/api/categorize', methods=['POST'])
def categorize():
    data = request.get_json()
    if not data or not isinstance(data, list):
        return jsonify({"error": "Input must be a list of customer records."}), 400
    results = categorizer.preprocess_and_categorize(data)
    return jsonify({"results": results})

@app.route('/api/cluster-customer', methods=['POST'])
def cluster_customer():
    """
    New endpoint that accepts a single customer record in the specified format
    and returns clustering results
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Convert single customer record to list format for existing categorizer
        if not isinstance(data, list):
            customer_data = [data]  # Wrap single customer in list
        else:
            customer_data = data
        
        # Validate required structure
        for customer in customer_data:
            if not isinstance(customer, dict):
                return jsonify({"error": "Invalid customer data format"}), 400
            
            # Check for required top-level keys
            required_keys = ["Customer_ID", "Personal Details", "Financial Details"]
            for key in required_keys:
                if key not in customer:
                    return jsonify({"error": f"Missing required field: {key}"}), 400
        
        # Use existing categorizer
        results = categorizer.preprocess_and_categorize(customer_data)
        
        # Return single result if single customer was sent
        if len(customer_data) == 1:
            return jsonify({
                "success": True,
                "customer_id": customer_data[0].get("Customer_ID"),
                "cluster_result": results[0] if results else None,
                "message": "Customer successfully clustered"
            })
        else:
            return jsonify({
                "success": True,
                "results": results,
                "message": f"Successfully clustered {len(results)} customers"
            })
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Clustering failed",
            "details": str(e)
        }), 500

@app.route('/api/predict-expense', methods=['POST'])
def predict_expense():
    """
    New endpoint for life stage expense prediction
    Accepts customer data and life event type, returns predicted expense bump
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Validate required fields
        if "customer_data" not in data:
            return jsonify({"error": "Missing 'customer_data' field"}), 400
        
        if "event_type" not in data:
            return jsonify({"error": "Missing 'event_type' field"}), 400
        
        customer_data = data["customer_data"]
        event_type = data["event_type"]
        
        # Validate event type
        valid_events = ["Marriage", "Child Birth"]
        if event_type not in valid_events:
            return jsonify({
                "error": f"Invalid event type. Must be one of: {valid_events}"
            }), 400
        
        # Validate customer data structure
        required_keys = ["Customer_ID", "Personal Details", "Financial Details"]
        for key in required_keys:
            if key not in customer_data:
                return jsonify({"error": f"Missing required field in customer_data: {key}"}), 400
        
        # Check if models are loaded
        if not expense_predictor.model:
            return jsonify({
                "error": "Expense prediction models not available"
            }), 500
        
        # Make prediction
        prediction_result = expense_predictor.predict_event_expense(customer_data, event_type)
        
        return jsonify({
            "success": True,
            "prediction": prediction_result,
            "message": f"Successfully predicted expense bump for {event_type} event"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Expense prediction failed",
            "details": str(e)
        }), 500

@app.route('/api/predict-rates', methods=['GET', 'POST'])
def predict_rates():
    """
    LSTM Rate Prediction endpoint
    Returns JSON response with nominal rate and inflation rate forecasts
    
    GET: Uses default forecast period (60 months)
    POST: Accepts {"months_ahead": number} for custom forecast period
    """
    try:
        months_ahead = None
        
        if request.method == 'POST':
            data = request.get_json()
            if data and 'months_ahead' in data:
                months_ahead = data['months_ahead']
                
                # Validate months_ahead parameter
                if not isinstance(months_ahead, int) or months_ahead <= 0 or months_ahead > 120:
                    return jsonify({
                        "success": False,
                        "error": "months_ahead must be a positive integer between 1 and 120"
                    }), 400
        
        # Generate predictions
        result = lstm_controller.predict_rates(months_ahead)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Rate prediction request failed",
            "details": str(e)
        }), 500

@app.route('/api/latest-rates', methods=['GET'])
def get_latest_rates():
    """
    Get the most recent historical nominal and inflation rates
    """
    try:
        result = lstm_controller.get_latest_rates()
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Failed to retrieve latest rates",
            "details": str(e)
        }), 500

@app.route('/api/rates-health', methods=['GET'])
def rates_health_check():
    """
    Health check endpoint for LSTM rate prediction service
    """
    try:
        result = lstm_controller.health_check()
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Health check failed",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000, debug=True)
