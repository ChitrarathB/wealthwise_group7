import pandas as pd
import numpy as np
import json
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.optimizers import Adam
import os

class LSTMRateController:
    """
    Controller class for LSTM rate prediction that provides nominal rate and inflation rate forecasts
    """
    
    def __init__(self, data_file_path='ai_model_input_data.csv'):
        self.data_file_path = data_file_path
        self.model = None
        self.scaler = None
        self.model_vars = ['Nominal_Rate', 'YoY_Inflation']
        self.lookback = 12  # 12 months of history
        self.forecast_steps = 60  # 5 years forecast
        self.is_trained = False
        
        # Try to load and prepare data
        self._load_data()
        
    def _load_data(self):
        """Load and prepare the data for LSTM model"""
        try:
            if not os.path.exists(self.data_file_path):
                print(f"Warning: Data file '{self.data_file_path}' not found.")
                self.data = None
                return False
                
            self.data = pd.read_csv(self.data_file_path, index_col='Date', parse_dates=True)
            
            # Check if required columns exist
            missing_cols = [col for col in self.model_vars if col not in self.data.columns]
            if missing_cols:
                print(f"Warning: Missing columns in data: {missing_cols}")
                return False
                
            self.data_for_model = self.data[self.model_vars].values
            
            # Initialize scaler
            self.scaler = MinMaxScaler(feature_range=(0, 1))
            self.scaled_data = self.scaler.fit_transform(self.data_for_model)
            
            return True
            
        except Exception as e:
            print(f"Error loading data: {str(e)}")
            self.data = None
            return False
    
    def _create_sequences(self, data, lookback):
        """Create sequences for LSTM training"""
        X, y = [], []
        for i in range(lookback, len(data)):
            X.append(data[i-lookback:i, :])
            y.append(data[i, :])
        return np.array(X), np.array(y)
    
    def _train_model(self):
        """Train the LSTM model"""
        if self.data is None:
            raise Exception("No data available for training")
            
        # Create sequences
        X, y = self._create_sequences(self.scaled_data, self.lookback)
        
        # Split data for training
        total_sequences = len(X)
        test_size = int(0.10 * total_sequences)
        validation_size = int(0.10 * total_sequences)
        train_size = total_sequences - test_size - validation_size
        
        X_train = X[:train_size]
        y_train = y[:train_size]
        X_val = X[train_size:train_size+validation_size]
        y_val = y[train_size:train_size+validation_size]
        
        # Build model
        features = self.scaled_data.shape[1]
        self.model = Sequential([
            LSTM(50, activation='relu', input_shape=(self.lookback, features)),
            Dense(features)
        ])
        
        self.model.compile(optimizer=Adam(learning_rate=0.005), loss='mse')
        
        # Train model
        self.model.fit(X_train, y_train, epochs=30, batch_size=32, verbose=0,
                      validation_data=(X_val, y_val))
        
        # Retrain with full data for final forecasting
        X_full_train = X[:train_size+validation_size]
        y_full_train = y[:train_size+validation_size]
        self.model.fit(X_full_train, y_full_train, epochs=30, batch_size=32, verbose=0)
        
        self.is_trained = True
        self.last_sequence = X_full_train[-1].copy()
        
    def predict_rates(self, months_ahead=None):
        """
        Generate rate predictions for the specified number of months
        
        Args:
            months_ahead (int): Number of months to forecast (default: 60 months/5 years)
            
        Returns:
            dict: JSON response with nominal rates and inflation rates
        """
        try:
            if months_ahead is None:
                months_ahead = self.forecast_steps
                
            # Train model if not already trained
            if not self.is_trained:
                self._train_model()
            
            # Generate forecasts
            last_known_sequence = self.last_sequence.copy()
            forecasted_scaled = []
            
            for _ in range(months_ahead):
                input_seq = last_known_sequence.reshape(1, self.lookback, len(self.model_vars))
                predicted_step = self.model.predict(input_seq, verbose=0)[0]
                forecasted_scaled.append(predicted_step)
                
                # Recursive update
                last_known_sequence = np.roll(last_known_sequence, -1, axis=0)
                last_known_sequence[-1] = predicted_step
            
            # Transform back to original scale
            forecasted_scaled = np.array(forecasted_scaled)
            forecasted_actual = self.scaler.inverse_transform(forecasted_scaled)
            
            # Create date index for forecast
            last_historical_date = self.data.index[-1]
            forecast_index = pd.date_range(start=last_historical_date, periods=months_ahead + 1, freq='MS')[1:]
            
            # Create forecast dataframe
            forecast_df = pd.DataFrame(forecasted_actual, index=forecast_index, columns=self.model_vars)
            forecast_df['Nominal_Rate'] = forecast_df['Nominal_Rate'].round(4)
            forecast_df['YoY_Inflation'] = forecast_df['YoY_Inflation'].round(4)
            
            # Format output as JSON arrays
            forecast_df['date'] = forecast_df.index.strftime('%Y-%m')
            
            # Nominal rate array
            nominal_rate_array = forecast_df[['date', 'Nominal_Rate']].copy()
            nominal_rate_array.rename(columns={'Nominal_Rate': 'rate'}, inplace=True)
            nominal_rate_list = nominal_rate_array.to_dict('records')
            
            # Inflation rate array
            inflation_array = forecast_df[['date', 'YoY_Inflation']].copy()
            inflation_array.rename(columns={'YoY_Inflation': 'rate'}, inplace=True)
            inflation_list = inflation_array.to_dict('records')
            
            return {
                "success": True,
                "forecast_months": months_ahead,
                "forecast_start_date": forecast_index[0].strftime('%Y-%m'),
                "forecast_end_date": forecast_index[-1].strftime('%Y-%m'),
                "nominal_rates": nominal_rate_list,
                "inflation_rates": inflation_list,
                "summary": {
                    "avg_nominal_rate": float(forecast_df['Nominal_Rate'].mean().round(4)),
                    "avg_inflation_rate": float(forecast_df['YoY_Inflation'].mean().round(4)),
                    "min_nominal_rate": float(forecast_df['Nominal_Rate'].min().round(4)),
                    "max_nominal_rate": float(forecast_df['Nominal_Rate'].max().round(4)),
                    "min_inflation_rate": float(forecast_df['YoY_Inflation'].min().round(4)),
                    "max_inflation_rate": float(forecast_df['YoY_Inflation'].max().round(4))
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": "Rate prediction failed",
                "details": str(e)
            }
    
    def get_latest_rates(self):
        """
        Get the most recent historical rates
        
        Returns:
            dict: Latest nominal rate and inflation rate
        """
        try:
            if self.data is None:
                return {
                    "success": False,
                    "error": "No historical data available"
                }
            
            latest_data = self.data.iloc[-1]
            
            return {
                "success": True,
                "date": self.data.index[-1].strftime('%Y-%m'),
                "nominal_rate": round(float(latest_data['Nominal_Rate']), 4),
                "inflation_rate": round(float(latest_data['YoY_Inflation']), 4)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": "Failed to get latest rates",
                "details": str(e)
            }
    
    def health_check(self):
        """
        Check if the controller is ready to make predictions
        
        Returns:
            dict: Health status
        """
        status = {
            "data_loaded": self.data is not None,
            "model_trained": self.is_trained,
            "scaler_ready": self.scaler is not None
        }
        
        status["ready"] = all(status.values())
        
        if self.data is not None:
            status["data_shape"] = self.data.shape
            status["data_date_range"] = {
                "start": self.data.index[0].strftime('%Y-%m'),
                "end": self.data.index[-1].strftime('%Y-%m')
            }
        
        return {
            "success": True,
            "status": status,
            "model_config": {
                "lookback_months": self.lookback,
                "default_forecast_months": self.forecast_steps,
                "variables": self.model_vars
            }
        }