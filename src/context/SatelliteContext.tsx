'use client';

import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';

// Define the shape of the context data
interface SatelliteContextProps {
  selectedSatelliteId: string;
  setSelectedSatelliteId: Dispatch<SetStateAction<string>>;
  availableSatellites: string[]; // List of available satellite IDs
}

// Create the context with a default value (or undefined and check in useSatellite)
const SatelliteContext = createContext<SatelliteContextProps | undefined>(undefined);

// Create a provider component
export const SatelliteProvider = ({ children }: { children: ReactNode }) => {
  // Hardcoded list for now, replace with dynamic fetching if needed
  const availableSatellites = ["cubesat-001", "cubesat-002", "cubesat-003"];
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string>(availableSatellites[0]); // Default to the first satellite

  const value = {
    selectedSatelliteId,
    setSelectedSatelliteId,
    availableSatellites,
  };

  return (
    <SatelliteContext.Provider value={value}>
      {children}
    </SatelliteContext.Provider>
  );
};

// Create a custom hook to use the context
export const useSatellite = (): SatelliteContextProps => {
  const context = useContext(SatelliteContext);
  if (context === undefined) {
    throw new Error('useSatellite must be used within a SatelliteProvider');
  }
  return context;
};
