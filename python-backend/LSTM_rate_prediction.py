import pandas as pd
import numpy as np
import json
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.optimizers import Adam
import matplotlib.pyplot as plt

# ==============================================================================
# PART 1: DATA SETUP AND SEQUENCE CREATION
# ==============================================================================

print("--- Part 1: Starting Data Preparation and Splitting ---")

# Load the prepared data (from previous steps)
try:
    data = pd.read_csv('ai_model_input_data.csv', index_col='Date', parse_dates=True)
except FileNotFoundError:
    print("Error: The file 'ai_model_input_data.csv' was not found.")
    print("Please ensure all data preparation steps were run successfully to create this file.")
    exit()

model_vars = ['Nominal_Rate', 'YoY_Inflation']
data_for_model = data[model_vars].values

# --- 2. Data Scaling (Crucial for Neural Networks) ---
scaler = MinMaxScaler(feature_range=(0, 1))
scaled_data = scaler.fit_transform(data_for_model)

# --- 3. Sequence Formatting (Lookback Window) ---
def create_sequences(data, lookback):
    X, y = [], []
    for i in range(lookback, len(data)):
        X.append(data[i-lookback:i, :])
        y.append(data[i, :])
    return np.array(X), np.array(y)

# Hyperparameter: We use 12 months of history to predict the next month
LOOKBACK = 12 
features = scaled_data.shape[1] 

X, y = create_sequences(scaled_data, LOOKBACK)

# --- 4. Data Splitting (80% Train, 10% Validation, 10% Test) ---
TOTAL_SEQUENCES = len(X)
TEST_SIZE = int(0.10 * TOTAL_SEQUENCES)
VALIDATION_SIZE = int(0.10 * TOTAL_SEQUENCES)
TRAIN_SIZE = TOTAL_SEQUENCES - TEST_SIZE - VALIDATION_SIZE

X_train, X_val, X_test = X[:TRAIN_SIZE], X[TRAIN_SIZE:TRAIN_SIZE+VALIDATION_SIZE], X[TRAIN_SIZE+VALIDATION_SIZE:]
y_train, y_val, y_test = y[:TRAIN_SIZE], y[TRAIN_SIZE:TRAIN_SIZE+VALIDATION_SIZE], y[TRAIN_SIZE+VALIDATION_SIZE:]

print(f"Total sequences: {TOTAL_SEQUENCES}")
print(f"Training sequences: {len(X_train)} | Validation: {len(X_val)} | Test: {len(X_test)}")


# ==============================================================================
# PART 2: LSTM MODEL DEFINITION, TRAINING, AND EVALUATION
# ==============================================================================

# --- 5. Model Definition ---
model = Sequential([
    LSTM(50, activation='relu', input_shape=(LOOKBACK, features)),
    Dense(features) 
])

model.compile(optimizer=Adam(learning_rate=0.005), loss='mse')

print("\n--- Training and Evaluation ---")

# --- 6. Training ---
# Use the validation set to monitor loss and prevent overfitting
history = model.fit(X_train, y_train, epochs=30, batch_size=32, verbose=0, 
                    validation_data=(X_val, y_val))
print("Training Complete.")


# --- 7. Performance Metrics on Test Set ---
# Use the Test Set (unseen data) to measure final performance
y_pred_scaled = model.predict(X_test)

# Inverse transform predictions and actuals to original scale (rates/percentages)
y_test_actual = scaler.inverse_transform(y_test)
y_pred_actual = scaler.inverse_transform(y_pred_scaled)

# Calculate RMSE and MAE for both variables
rmse_nominal = np.sqrt(mean_squared_error(y_test_actual[:, 0], y_pred_actual[:, 0]))
mae_nominal = mean_absolute_error(y_test_actual[:, 0], y_pred_actual[:, 0])

rmse_inflation = np.sqrt(mean_squared_error(y_test_actual[:, 1], y_pred_actual[:, 1]))
mae_inflation = mean_absolute_error(y_test_actual[:, 1], y_pred_actual[:, 1])

print("\n--- Model Performance on Test Set (Unseen Data) ---")
print(f"Nominal Rate (RMSE): {rmse_nominal:.4f} | MAE: {mae_nominal:.4f}")
print(f"YoY Inflation (RMSE): {rmse_inflation:.4f} | MAE: {mae_inflation:.4f}")


# ==============================================================================
# PART 3: FINAL FORECASTING AND OUTPUT
# ==============================================================================

# --- 8. Retrain with Full Data (Train + Validation) ---
# For the final 5-year prediction, we retrain the model using ALL available historical data 
# (Train + Validation) to maximize the information content, using the test set performance as assurance.
X_full_train = X[:TRAIN_SIZE+VALIDATION_SIZE]
y_full_train = y[:TRAIN_SIZE+VALIDATION_SIZE]
model.fit(X_full_train, y_full_train, epochs=30, batch_size=32, verbose=0)


# --- 9. Recursive Forecasting ---
forecast_steps = 60 # 5 years
# Start with the last sequence from the full training set (X_full_train)
last_known_sequence = X_full_train[-1].copy() 
forecasted_scaled = []

for _ in range(forecast_steps):
    input_seq = last_known_sequence.reshape(1, LOOKBACK, features)
    predicted_step = model.predict(input_seq, verbose=0)[0]
    forecasted_scaled.append(predicted_step)
    
    # Recursive update
    last_known_sequence = np.roll(last_known_sequence, -1, axis=0)
    last_known_sequence[-1] = predicted_step

# --- 10. Final Output Processing ---
forecasted_scaled = np.array(forecasted_scaled)
forecasted_actual = scaler.inverse_transform(forecasted_scaled)

last_historical_date = data.index[-1]
forecast_index = pd.date_range(start=last_historical_date, periods=forecast_steps + 1, freq='MS')[1:]

lstm_forecast_df = pd.DataFrame(forecasted_actual, index=forecast_index, columns=model_vars)
lstm_forecast_df['Nominal_Rate'] = lstm_forecast_df['Nominal_Rate'].round(4)
lstm_forecast_df['YoY_Inflation'] = lstm_forecast_df['YoY_Inflation'].round(4)

# Generate JSON Array Output (Full List)
lstm_forecast_df['date'] = lstm_forecast_df.index.strftime('%Y-%m')
nominal_rate_array = lstm_forecast_df[['date', 'Nominal_Rate']].copy()
nominal_rate_array.rename(columns={'Nominal_Rate': 'rate'}, inplace=True)
nominal_rate_list = nominal_rate_array.to_dict('records')

inflation_array = lstm_forecast_df[['date', 'YoY_Inflation']].copy()
inflation_array.rename(columns={'YoY_Inflation': 'rate'}, inplace=True)
inflation_list = inflation_array.to_dict('records')

# --- Plotting and Export ---
plt.figure(figsize=(14, 7))
plt.plot(data.index, data['YoY_Inflation'], label='Historical YoY Inflation (%)', color='red')
plt.plot(lstm_forecast_df.index, lstm_forecast_df['YoY_Inflation'], label='Forecasted YoY Inflation (LSTM)', color='lightcoral', linestyle='--')
plt.plot(data.index, data['Nominal_Rate'], label='Historical Nominal Rate (%)', color='blue')
plt.plot(lstm_forecast_df.index, lstm_forecast_df['Nominal_Rate'], label='Forecasted Nominal Rate (%)', color='skyblue', linestyle='--')
plt.title(f'LSTM Model Forecast (80/10/10 Split) vs. History', fontsize=14)
plt.xlabel('Date', fontsize=12)
plt.ylabel('Rate (%)', fontsize=12)
plt.axvline(last_historical_date, color='k', linestyle=':', label='Forecast Start')
plt.legend()
plt.grid(True, linestyle='--', alpha=0.7)
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('lstm_forecast_evaluated.png')

lstm_forecast_df.to_csv('lstm_forecasted_rates_5_years_evaluated.csv')

print("\n--- FULL Nominal Rate Forecast Array (60 Months) ---")
print(json.dumps(nominal_rate_list, indent=2))

print("\n--- FULL Inflation Rate Forecast Array (60 Months) ---")
print(json.dumps(inflation_list, indent=2))
