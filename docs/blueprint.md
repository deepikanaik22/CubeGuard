# **App Name**: CubeSense

## Core Features:

- Telemetry Dashboard: Display real-time telemetry data in charts and graphs using dummy data. (Gyroscope, battery voltage, temperature, magnetometer, communication logs)
- Anomaly Alerts: Display color-coded anomaly alerts based on predefined thresholds.
- Anomaly Risk Score: Simulate an Anomaly Risk Score (%) display based on the dummy data, indicating the likelihood of failure (thermal, comm, power, orientation). The displayed risk is determined by evaluating the dummy data with a tool that simulates the reasoning of an AI model.

## Style Guidelines:

- Primary color: Dark blue (#0E1C2B) for a professional, space-themed feel.
- Secondary color: Light gray (#E0E0E0) for backgrounds and neutral elements.
- Accent: Teal (#008080) for interactive elements and key data points.
- Clean, card-based layout for modularity and easy readability.
- Use simple, outlined icons for telemetry data and alerts.
- Subtle transitions and animations for a smooth user experience.

## Original User Request:
Create a full-stack web app called "CubeGuard" – a Satellite Anomaly Detection Dashboard for CubeSats.

**Frontend**:
- Use React with Tailwind CSS.
- Build a dashboard to display real-time telemetry streams from CubeSats:
  - Gyroscope data (x, y, z)
  - Battery voltage
  - Solar panel output
  - Internal + external temperature
  - Magnetometer readings
  - Communication logs (signal strength, packet delay)
- Include charts (e.g. LineChart, HeatMap) and anomaly alerts using color-coded indicators.
- Create a panel showing Anomaly Risk Score (%) and likely failure type (thermal, comm, power, orientation).

**Backend (Firebase Functions)**:
- Ingest telemetry data via REST API or simulated real-time feed.
- Store incoming data in Firestore as time-series documents (one per satellite).
- Call a Python Cloud Function (via Cloud Run or HTTPS callable) that:
  - Loads a pretrained anomaly detection ML model (LSTM or Autoencoder)
  - Returns anomaly score and predicted failure type

**ML Integration**:
- Use Python to develop and serve the model (can run externally if Firebase Studio can’t serve Python natively).
- Allow model training on synthetic or real datasets, and periodically update based on new data.

**Extras**:
- Admin login to register satellites and manage API keys (Firebase Auth).
- Push alerts to subscribed users (Firebase Cloud Messaging) if high anomaly score is detected.
- Optional: Use Firebase Storage to archive telemetry logs daily.

This app should be clean, minimal, real-time focused, and scalable for university CubeSat teams or aerospace hackathons.
  