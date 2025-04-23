/**
 * Represents telemetry data for a CubeSat.
 */
export interface TelemetryData {
  /**
   * Gyroscope data (x, y, z).
   */
  gyroscope: { x: number; y: number; z: number };
  /**
   * Battery voltage.
   */
batteryVoltage: number;
  /**
   * Solar panel output.
   */
solarPanelOutput: number;
  /**
   * Internal temperature.
   */
internalTemperature: number;
  /**
   * External temperature.
   */
externalTemperature: number;
  /**
   * Magnetometer readings.
   */
magnetometer: { x: number; y: number; z: number };
  /**
   * Communication logs (signal strength, packet delay).
   */
communicationLogs: { signalStrength: number; packetDelay: number };
}

/**
 * Asynchronously retrieves the latest telemetry data for a given satellite.
 *
 * @param satelliteId The ID of the satellite to retrieve telemetry data for.
 * @returns A promise that resolves to a TelemetryData object.
 */
export async function getTelemetryData(satelliteId: string): Promise<TelemetryData> {
  if (satelliteId === "sat1") {
    return {
      gyroscope: { x: 0.1, y: -0.2, z: 0.3 },
      batteryVoltage: 4.2,
      solarPanelOutput: 5.1,
      internalTemperature: 25.5,
      externalTemperature: -10.2,
      magnetometer: { x: 0.01, y: 0.02, z: 0.03 },
      communicationLogs: { signalStrength: -80, packetDelay: 150 },
    };
  } else if (satelliteId === "sat2") {
    return {
      gyroscope: { x: 0.5, y: 0.1, z: -0.3 },
      batteryVoltage: 3.8,
      solarPanelOutput: 4.5,
      internalTemperature: 28.0,
      externalTemperature: -15.0,
      magnetometer: { x: 0.05, y: -0.01, z: 0.02 },
      communicationLogs: { signalStrength: -90, packetDelay: 200 },
    };
  } else {
    return {
      gyroscope: { x: 0, y: 0, z: 0 },
      batteryVoltage: 0,
      solarPanelOutput: 0,
      internalTemperature: 0,
      externalTemperature: 0,
      magnetometer: { x: 0, y: 0, z: 0 },
      communicationLogs: { signalStrength: 0, packetDelay: 0 },
    };
  }
}
