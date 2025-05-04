
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, DocumentData, Unsubscribe } from "firebase/firestore";

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
  timestamp?: any; // Firestore timestamp
}

const defaultTelemetry: TelemetryData = {
  gyroscope: { x: 0, y: 0, z: 0 },
  batteryVoltage: 0,
  solarPanelOutput: 0,
  internalTemperature: 0,
  externalTemperature: 0,
  magnetometer: { x: 0, y: 0, z: 0 },
  communicationLogs: { signalStrength: 0, packetDelay: 0 },
};

/**
 * Asynchronously retrieves the latest telemetry data for a given satellite from Firestore.
 *
 * @param satelliteId The ID of the satellite to retrieve telemetry data for.
 * @returns A promise that resolves to a TelemetryData object or null if not found.
 */
export async function getTelemetryData(satelliteId: string): Promise<TelemetryData | null> {
  try {
    const docRef = doc(db, "satellites", satelliteId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Combine default structure with fetched data to ensure all fields exist
      const data = docSnap.data() as DocumentData;
      return { ...defaultTelemetry, ...data, id: docSnap.id } as TelemetryData;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
    throw error; // Re-throw the error for handling upstream
  }
}

/**
 * Subscribes to real-time telemetry data updates for a given satellite from Firestore.
 *
 * @param satelliteId The ID of the satellite to subscribe to.
 * @param callback A function to be called with the new TelemetryData whenever it updates.
 * @returns An unsubscribe function to stop listening to updates.
 */
export function subscribeToTelemetryData(
    satelliteId: string,
    callback: (data: TelemetryData | null) => void
  ): Unsubscribe {
    const docRef = doc(db, "satellites", satelliteId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DocumentData;
         // Combine default structure with fetched data
        callback({ ...defaultTelemetry, ...data, id: docSnap.id } as TelemetryData);
      } else {
        console.log(`Document ${satelliteId} does not exist.`);
        callback(null); // Notify callback that data is not available
      }
    }, (error) => {
      console.error("Error listening to document:", error);
      // Optionally call callback with an error state or null
      callback(null);
    });

    return unsubscribe; // Return the unsubscribe function
}

// Example function to simulate updating data in Firestore (for testing)
// You would typically have a separate process/function writing real data.
// import { setDoc, serverTimestamp } from "firebase/firestore";
// export async function simulateTelemetryUpdate(satelliteId: string) {
//   const docRef = doc(db, "satellites", satelliteId);
//   const randomData: TelemetryData = {
//     gyroscope: { x: Math.random(), y: Math.random(), z: Math.random() },
//     batteryVoltage: 3.8 + Math.random() * 0.4,
//     solarPanelOutput: 4.5 + Math.random(),
//     internalTemperature: 20 + Math.random() * 10,
//     externalTemperature: -15 + Math.random() * 10,
//     magnetometer: { x: Math.random()*0.1, y: Math.random()*0.1, z: Math.random()*0.1 },
//     communicationLogs: { signalStrength: -85 + Math.random() * 10, packetDelay: 100 + Math.random() * 50 },
//     timestamp: serverTimestamp()
//   };
//   try {
//     await setDoc(docRef, randomData, { merge: true }); // Use setDoc with merge to create/update
//     console.log("Simulated update for", satelliteId);
//   } catch (error) {
//     console.error("Error simulating update:", error);
//   }
// }
