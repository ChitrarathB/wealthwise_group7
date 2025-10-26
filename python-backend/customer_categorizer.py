import joblib
import pandas as pd
import numpy as np
import os
from typing import Dict, Any, List

MODEL_DIR = './deployment_models/'
GMM_MODEL_PATH = os.path.join(MODEL_DIR, 'gmm_k8_segmenter.joblib')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler_transform.joblib')

ARCHETYPE_MAP = {
    0: "High-Debt Leverage (Maximum Risk)",
    1: "Affluent Professional",
    2: "Career Starter (Emerging Affluent)",
    3: "Mid-Career/Transitional",
    4: "Legacy Planner (Highest Wealth)",
    5: "Young Family/Protector",
    6: "Atypical/Investment Earner",
    7: "Pre-Retirement Accumulator",
}

def feature_engineer_new_record(raw_row: Dict[str, Any]) -> pd.Series:
    active_income = next((i.get('Amount', 0) * 12 for i in raw_row.get('Financial Details', {}).get('Income', []) if i.get('Income_Type') == 'Active'), 0)
    assets_list = raw_row.get('Financial Details', {}).get('Assets', [])
    liabilities_list = raw_row.get('Financial Details', {}).get('Liabilities', [])
    property_value = next((a.get('Current Value', 0) for a in assets_list if a.get('Asset Type') == 'Residential Property'), 0)
    mortgage_value = next((l.get('Current Value', 0) for l in liabilities_list if l.get('Liability Type') == 'Mortgage'), 0)
    total_assets_val = sum(a.get('Current Value', 0) for a in assets_list)
    mortgage_ratio = mortgage_value / property_value if property_value > 0 else 0
    weighted_return = sum(
        a.get('Current Value', 0) * float(a.get('Return on Investment', 0) or 0)
        for a in assets_list
    ) / total_assets_val if total_assets_val > 0 else 0
    child_count = sum(1 for d in raw_row.get('Dependents', []) if d.get('Relationship') == 'Child')
    return pd.Series({
        'Age': raw_row['Personal Details']['Age'],
        'Net_Worth': raw_row['Financial Details']['Derived']['Total_Networth'],
        'Net_Cashflow': raw_row['Financial Details']['Derived']['Net_Cashflow'],
        'Active_Income_Annual': active_income,
        'Mortgage_Ratio': mortgage_ratio,
        'Asset_Return_Weighted': weighted_return,
        'Child_Count': child_count,
        'Marital_Status_Married': 1 if raw_row['Personal Details']['Marital Status'] == 'Married' else 0,
        'Marital_Status_Single': 1 if raw_row['Personal Details']['Marital Status'] == 'Single' else 0,
        'Marital_Status_Widowed': 1 if raw_row['Personal Details']['Marital Status'] == 'Widowed' else 0,
        'Gender_Male': 1 if raw_row['Personal Details']['Gender'] == 'Male' else 0,
    })

class NewCustomerCategorizer:
    def __init__(self):
        try:
            model_dir = os.path.join(os.path.dirname(__file__), 'models', 'cluster')
            self.gmm = joblib.load(os.path.join(model_dir, 'gmm_k8_segmenter.joblib'))
            self.scaler = joblib.load(os.path.join(model_dir, 'scaler_transform.joblib'))
            self.feature_names = [
                'Age', 'Net_Worth', 'Net_Cashflow', 'Active_Income_Annual', 'Mortgage_Ratio', 
                'Asset_Return_Weighted', 'Child_Count', 
                'Marital_Status_Married', 'Marital_Status_Single', 'Marital_Status_Widowed', 
                'Gender_Male' 
            ]
        except Exception as e:
            print(f"Error loading models: {e}. Ensure models are saved to ./models/ directory.")
            self.gmm = None
            self.scaler = None
    def preprocess_and_categorize(self, new_raw_data: List[Dict[str, Any]]):
        if not self.gmm:
            return "Models not initialized."
        engineered_features_list = [feature_engineer_new_record(record) for record in new_raw_data]
        engineered_df = pd.DataFrame(engineered_features_list, columns=self.feature_names)
        X_new_scaled = self.scaler.transform(engineered_df)
        segment_ids = self.gmm.predict(X_new_scaled)
        probabilities = self.gmm.predict_proba(X_new_scaled)
        confidence_scores = np.max(probabilities, axis=1)
        results = []
        for i, segment_id in enumerate(segment_ids):
            results.append({
                'Customer_ID': new_raw_data[i].get('Customer_ID', 'N/A'),
                'Segment_ID': int(segment_id),
                'Confidence': float(f"{confidence_scores[i]:.8f}"),
                'Archetype': ARCHETYPE_MAP.get(int(segment_id), "Unidentified Archetype")
            })
        return results
