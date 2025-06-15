
import type { Timestamp } from "firebase/firestore"; // Keep for type if needed, or remove if Timestamp not used

/**
 * Represents telemetry data for a CubeSat.
 */
export interface TelemetryData {
  id?: string; // Add id field
  gyroscope: { x: number; y: number; z: number };
  batteryVoltage: number;
  solarPanelOutput: number;
  internalTemperature: number;
  externalTemperature: number;
  magnetometer: { x: number; y: number; z: number };
  communicationLogs: { signalStrength: number; packetDelay: number };
  timestamp?: Date; // Use JS Date for simulation
}

// Store the latest simulated data per satellite
const latestDataStore: Record<string, TelemetryData> = {};
// Store listeners per satellite
const listeners: Record<string, Array<(data: TelemetryData | null) => void>> = {};

// Known satellite IDs for simulation
const knownSatelliteIds = ["cubesat-001", "cubesat-002", "cubesat-003"];

/**
 * Generates random telemetry data for simulation.
 * @param satelliteId The ID of the satellite.
 * @returns A TelemetryData object with simulated values.
 */
function generateSimulatedTelemetry(satelliteId: string): TelemetryData {
  const now = new Date();
  return {
    id: satelliteId,
    gyroscope: { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 2 - 1 }, // Range -1 to 1
    batteryVoltage: 3.6 + Math.random() * 0.6, // Range 3.6 to 4.2 V
    solarPanelOutput: Math.random() * 6, // Range 0 to 6 W
    internalTemperature: 15 + Math.random() * 25, // Range 15 to 40 °C
    externalTemperature: -20 + Math.random() * 50, // Range -20 to 30 °C
    magnetometer: { x: Math.random() * 0.2 - 0.1, y: Math.random() * 0.2 - 0.1, z: Math.random() * 0.2 - 0.1 }, // Example range μT
    communicationLogs: { signalStrength: -100 + Math.random() * 45, packetDelay: 50 + Math.random() * 300 }, // Range -100 to -55 dBm, 50 to 350 ms
    timestamp: now,
  };
}

// Initialize data store with initial values for all known satellites at module load time
knownSatelliteIds.forEach(id => {
    latestDataStore[id] = generateSimulatedTelemetry(id);
});
console.log("Telemetry data store initialized at module load.");


/**
 * Notifies all listeners for a specific satellite with new data.
 * @param satelliteId The ID of the satellite.
 * @param data The new telemetry data or null.
 */
function notifyListeners(satelliteId: string, data: TelemetryData | null) {
  if (listeners[satelliteId]) {
    // Create a copy of the listeners array to avoid issues if unsubscribe happens during iteration
    const currentListeners = [...listeners[satelliteId]];
    currentListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in telemetry listener callback for ${satelliteId}:`, error);
      }
    });
  }
}

/**
 * Updates the simulated data for all known satellites and notifies listeners.
 */
function updateAllSatellites() {
  knownSatelliteIds.forEach(id => {
    const newData = generateSimulatedTelemetry(id);
    latestDataStore[id] = newData;
    notifyListeners(id, newData);
    // console.log(`Simulated update for ${id}:`, newData.timestamp?.toLocaleTimeString()); // Optional logging
  });
}

// Initialize simulation interval (only run on client-side)
let simulationInterval: NodeJS.Timeout | null = null;
if (typeof window !== 'undefined' && !simulationInterval) {
    // Data store is already initialized above.
    // Start the simulation loop for client-side updates
    simulationInterval = setInterval(updateAllSatellites, 2000); // Update every 2 seconds
    console.log("Client-side telemetry simulation interval started.");

    // Initial notification for any early client-side subscribers
     setTimeout(() => {
        knownSatelliteIds.forEach(id => {
            // Only notify if there are listeners, to avoid issues if this runs before components mount
            if (listeners[id] && listeners[id].length > 0) {
                notifyListeners(id, latestDataStore[id]);
            }
        });
     }, 100);
}

/**
 * Retrieves the latest simulated telemetry data for a given satellite.
 * Retains async signature for potential future API integration.
 *
 * @param satelliteId The ID of the satellite.
 * @returns A promise that resolves to the latest TelemetryData or null if not found.
 */
export async function getTelemetryData(satelliteId: string): Promise<TelemetryData | null> {
  // Simulate async fetch if needed, otherwise return directly
  // await new Promise(resolve => setTimeout(resolve, 10)); // Optional small delay
  return latestDataStore[satelliteId] || null;
}

/**
 * Subscribes to simulated real-time telemetry data updates for a given satellite.
 *
 * @param satelliteId The ID of the satellite to subscribe to.
 * @param callback A function to be called with the new TelemetryData whenever it updates.
 * @param errorCallback A function to be called if there's an error (primarily for initial callback).
 * @returns An unsubscribe function to stop listening to updates.
 */
export function subscribeToTelemetryData(
  satelliteId: string,
  callback: (data: TelemetryData | null) => void,
  errorCallback?: (error: Error) => void
): () => void { // Return type is a simple unsubscribe function

  // Ensure the satellite ID is known for simulation
  if (!knownSatelliteIds.includes(satelliteId)) {
     console.warn(`Attempted to subscribe to unknown satellite ID: ${satelliteId}. No simulation data available.`);
     // Immediately call back with null for unknown IDs
     setTimeout(() => callback(null), 0);
     // Return a no-op unsubscribe function
     return () => {};
   }


  if (!listeners[satelliteId]) {
    listeners[satelliteId] = [];
  }
  listeners[satelliteId].push(callback);

  // Immediately call back with the current data (using setTimeout for safety)
  const currentData = latestDataStore[satelliteId] || null;
  setTimeout(() => {
    try {
      // Check if the listener still exists before calling back
      if (listeners[satelliteId]?.includes(callback)) {
          callback(currentData);
      }
    } catch (err) {
      console.error(`Error in initial telemetry callback for ${satelliteId}:`, err);
      if (errorCallback) {
        errorCallback(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, 0);

  // Return the unsubscribe function
  const unsubscribe = () => {
    if (listeners[satelliteId]) {
      listeners[satelliteId] = listeners[satelliteId].filter(cb => cb !== callback);
      // Optional: Clean up if no listeners left
      // if (listeners[satelliteId].length === 0) {
      //   delete listeners[satelliteId];
      // }
    }
  };

  return unsubscribe;
}

// Clean up interval on module unload (e.g., during development hot-reloads)
if (typeof window !== 'undefined') {
    // This is a basic approach. More robust HMR cleanup might be needed in complex setups.
    // For production, this isn't strictly necessary as the interval stops when the window closes.
    const currentModule = (module as any); // Use 'any' if types are strict
    if (currentModule.hot) {
        currentModule.hot.dispose(() => {
            if (simulationInterval) {
                clearInterval(simulationInterval);
                simulationInterval = null;
                console.log("Telemetry simulation stopped on HMR dispose.");
            }
        });
    }
}

