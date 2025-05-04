import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, DocumentData, Unsubscribe, Timestamp } from "firebase/firestore";

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
  timestamp?: Timestamp | Date; // Firestore timestamp or JS Date
}

const defaultTelemetry: Partial<TelemetryData> = {
  gyroscope: { x: 0, y: 0, z: 0 },
  batteryVoltage: 0,
  solarPanelOutput: 0,
  internalTemperature: 0,
  externalTemperature: 0,
  magnetometer: { x: 0, y: 0, z: 0 },
  communicationLogs: { signalStrength: -120, packetDelay: 999 }, // Use default values indicating no signal/contact
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
      // Convert Firestore Timestamp to JS Date if necessary
      const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp;
      return { ...defaultTelemetry, ...data, id: docSnap.id, timestamp } as TelemetryData;
    } else {
      console.log(`No such document: satellites/${satelliteId}`);
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
 * @param errorCallback A function to be called if there's an error during subscription.
 * @returns An unsubscribe function to stop listening to updates.
 */
export function subscribeToTelemetryData(
    satelliteId: string,
    callback: (data: TelemetryData | null) => void,
    errorCallback?: (error: Error) => void // Optional error callback
  ): Unsubscribe {
    const docRef = doc(db, "satellites", satelliteId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DocumentData;
         // Convert Firestore Timestamp to JS Date if necessary
         const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp;
         // Combine default structure with fetched data
        callback({ ...defaultTelemetry, ...data, id: docSnap.id, timestamp } as TelemetryData);
      } else {
        console.log(`Document satellites/${satelliteId} does not exist.`);
        callback(null); // Notify callback that data is not available
      }
    }, (error) => {
      console.error(`Error listening to document satellites/${satelliteId}:`, error);
      // Call the error callback if provided
      if (errorCallback) {
        errorCallback(error);
      } else {
         // Default behavior if no error callback is provided
         callback(null); // Indicate data unavailability on error
      }
    });

    return unsubscribe; // Return the unsubscribe function
}

// Example function to simulate updating data in Firestore (for testing)
// You would typically have a separate process/function writing real data.
// import { setDoc, serverTimestamp } from "firebase/firestore";
// export async function simulateTelemetryUpdate(satelliteId: string) {
//   const docRef = doc(db, "satellites", satelliteId);
//   const randomData: Omit<TelemetryData, 'id'> = { // Omit id as it's the document key
//     gyroscope: { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 2 - 1 }, // Range -1 to 1
//     batteryVoltage: 3.6 + Math.random() * 0.6, // Range 3.6 to 4.2
//     solarPanelOutput: Math.random() * 6, // Range 0 to 6 W
//     internalTemperature: 15 + Math.random() * 20, // Range 15 to 35 C
//     externalTemperature: -20 + Math.random() * 50, // Range -20 to 30 C
//     magnetometer: { x: Math.random()*0.2-0.1, y: Math.random()*0.2-0.1, z: Math.random()*0.2-0.1 }, // Example range
//     communicationLogs: { signalStrength: -100 + Math.random() * 40, packetDelay: 50 + Math.random() * 300 }, // Range -100 to -60 dBm, 50 to 350 ms
//     timestamp: serverTimestamp() // Use server timestamp for consistency
//   };
//   try {
//     await setDoc(docRef, randomData, { merge: true }); // Use setDoc with merge to create/update
//     console.log("Simulated update for", satelliteId);
//   } catch (error) {
//     console.error("Error simulating update:", error);
//   }
// }

// // To run the simulation e.g., every 5 seconds:
// // setInterval(() => simulateTelemetryUpdate("cubesat-001"), 5000);
