import joblib
import pandas as pd
import numpy as np
import os
from typing import Dict, Any, List

# --- Deployment Configuration ---
MODEL_DIR = './models/life_stage/'
MLP_MODEL_PATH = os.path.join(MODEL_DIR, 'mlp_unified_expense_predictor.joblib')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler_expense.joblib')

# The exact 11 features expected by the Scaler (MUST remain in this order)
TRAINING_FEATURE_ORDER = [
    'Age', 'Active_Income_Annual', 'Net_Worth', 'Mortgage_Ratio', 'Child_Count',
    'Event_Marriage_Flag', 'Event_ChildBirth_Flag',
    'Marital_Married', 'Marital_Divorced', 'Marital_Widowed', 'Marital_Single'
]

# --- Sample Data (Retained for Context) ---
NEW_CUSTOMERS_DATA = [
    {
        "Customer_ID": 10003,
        "Personal Details": {"Age": 55, "Gender": "Female", "Marital Status": "Widowed"},
        "Dependents": [],
        "Financial Details": {
            "Assets": [{"Asset Type": "Stocks/Bonds", "Current Value": 2000000}],
            "Liabilities": [], 
            "Income": [{"Income_Type": "Active", "Amount": 15000, "Frequency": "Monthly"}], # $180k annual income
            "Derived": {"Total_Networth": 2000000, "Net_Cashflow": 100000}
        }
    }
]

# --- 2. Feature Engineering Replication ---

def feature_engineer_new_record(raw_row: Dict[str, Any], event_type: str) -> pd.DataFrame:
    """
    Replicates the feature engineering and OHE logic, guaranteeing the 11 feature columns exist.
    """
    
    # 1. Calculate Base Numerical Features
    active_income = next((i.get('Amount', 0) * 12 for i in raw_row.get('Financial Details', {}).get('Income', []) if i.get('Income_Type') == 'Active'), 0)
    assets_list = raw_row.get('Financial Details', {}).get('Assets', [])
    property_value = next((a.get('Current Value', 0) for a in assets_list if a.get('Asset Type') == 'Residential Property'), 0)
    mortgage_value = next((l.get('Current Value', 0) for l in raw_row.get('Financial Details', {}).get('Liabilities', []) if l.get('Liability Type') == 'Mortgage'), 0)
    total_assets_val = sum(a.get('Current Value', 0) for a in assets_list)
    mortgage_ratio = mortgage_value / property_value if property_value > 0 else 0
    weighted_return = sum(a.get('Current Value', 0) * float(a.get('Return on Investment', 0) or 0) for a in assets_list) / total_assets_val if total_assets_val > 0 else 0
    child_count_base = sum(1 for d in raw_row.get('Dependents', []) if d.get('Relationship') == 'Child')
    
    
    # 2. Dynamic Event Flagging and Consequence Setting
    is_marriage_event = 1 if event_type == 'Marriage' else 0
    is_childbirth_event = 1 if event_type == 'Child Birth' else 0
    
    child_count_input = child_count_base
    if event_type == 'Child Birth':
        child_count_input += 1 
    
    # 3. Create a DataFrame with core numerical and event features
    data_df = pd.DataFrame({
        'Age': [raw_row['Personal Details']['Age']],
        'Active_Income_Annual': [active_income],
        'Net_Worth': [raw_row['Financial Details']['Derived']['Total_Networth']],
        'Mortgage_Ratio': [mortgage_ratio],
        'Child_Count': [child_count_input],
        'Event_Marriage_Flag': [is_marriage_event],
        'Event_ChildBirth_Flag': [is_childbirth_event],
        'Asset_Return_Weighted': [weighted_return],
        'Net_Cashflow': [raw_row['Financial Details']['Derived']['Net_Cashflow']],
        # Create a single column for the categorical status
        'Marital_Status_Category': [raw_row['Personal Details']['Marital Status']]
    })
    
    # 🎯 FIX: Manually create the OHE columns needed for the final 11-feature list
    # This prevents the KeyError by forcing the columns into existence.
    
    # Map the single category column to the 4 binary columns
    data_df['Marital_Married'] = data_df['Marital_Status_Category'].apply(lambda x: 1 if x == 'Married' else 0)
    data_df['Marital_Divorced'] = data_df['Marital_Status_Category'].apply(lambda x: 1 if x == 'Divorced' else 0)
    data_df['Marital_Widowed'] = data_df['Marital_Status_Category'].apply(lambda x: 1 if x == 'Widowed' else 0)
    data_df['Marital_Single'] = data_df['Marital_Status_Category'].apply(lambda x: 1 if x == 'Single' else 0)
    
    # 4. Filter and Realign columns to the training order (CRITICAL)
    # The columns *must* be passed to the scaler in the 11-feature order it expects.
    return data_df[TRAINING_FEATURE_ORDER]


class ExpensePredictor:
    def __init__(self):
        try:
            self.model = joblib.load(MLP_MODEL_PATH)
            self.scaler = joblib.load(SCALER_PATH)
            self.feature_names = TRAINING_FEATURE_ORDER
            print("MLP and Scaler models loaded successfully.")
        except FileNotFoundError as e:
            print(f"Error loading models: {e}. Please ensure models are saved to {MODEL_DIR}.")
            self.model = None
            self.scaler = None

    def predict_event_expense(self, raw_customer_data: Dict[str, Any], event_type: str):
        if not self.model:
            return "Models not initialized."
        
        # 1. Feature Engineering: Returns a DataFrame with guaranteed column names
        engineered_df = feature_engineer_new_record(raw_customer_data, event_type)
        
        # 2. Robust Cleaning (Needed before scaling)
        engineered_df = engineered_df.replace([np.inf, -np.inf], 0) 
        engineered_df = engineered_df.fillna(0) 

        # 3. Scaling (Apply learned transformation)
        X_new_scaled = self.scaler.transform(engineered_df)

        # 4. Prediction
        prediction = self.model.predict(X_new_scaled)[0]
        
        # 5. Result
        estimated_bump = max(0, prediction)
        
        return {
            'Predicted_Expense_Bump_SGD': f"${estimated_bump:,.2f}",
            'Event_Type': event_type,
            'Customer_ID': raw_customer_data.get('Customer_ID', 'N/A')
        }

# --- EXECUTION ---
if __name__ == '__main__':
    predictor = ExpensePredictor()
    
    CUSTOMER_A = NEW_CUSTOMERS_DATA[0] 
    
    if predictor.model:
        print("\n--- Event-Driven Expense Bump Prediction ---")
        
        # Scenario 1: Predicting for a Marriage event for Customer A (Current Status: Single)
        result_marriage = predictor.predict_event_expense(CUSTOMER_A, 'Marriage')
        
        # Scenario 2: Predicting for a Child Birth event for Customer A (Current Status: Single, 0 Children -> 1 Child)
        result_child = predictor.predict_event_expense(CUSTOMER_A, 'Child Birth')

        print(f"\nProfile: Customer {CUSTOMER_A['Customer_ID']} (Age {CUSTOMER_A['Personal Details']['Age']}, Status: {CUSTOMER_A['Personal Details']['Marital Status']})")
        print("-----------------------------------------------------------------")
        
        print(f"Scenario A: Predicting Bump for **MARRIAGE**:")
        print(f"  -> Input Event: {result_marriage['Event_Type']}")
        print(f"  -> Predicted Annual Expense: {result_marriage['Predicted_Expense_Bump_SGD']}")

        print(f"\nScenario B: Predicting Bump for **CHILD BIRTH** (1st Child):")
        print(f"  -> Input Event: {result_child['Event_Type']}")
        print(f"  -> Predicted Annual Expense: {result_child['Predicted_Expense_Bump_SGD']}")
