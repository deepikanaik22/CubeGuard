'use client';

import React from 'react';
import { useSatellite } from '@/context/SatelliteContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function SatelliteSelector() {
  const { selectedSatelliteId, setSelectedSatelliteId, availableSatellites } = useSatellite();

  const handleValueChange = (value: string) => {
    setSelectedSatelliteId(value);
    // Optionally trigger data refresh or navigation here if needed globally
    console.log("Selected Satellite:", value);
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="satellite-select" className="text-sm font-medium">Select CubeSat</Label>
      <Select value={selectedSatelliteId} onValueChange={handleValueChange}>
        <SelectTrigger id="satellite-select" className="w-full">
          <SelectValue placeholder="Select Satellite..." />
        </SelectTrigger>
        <SelectContent>
          {availableSatellites.map((id) => (
            <SelectItem key={id} value={id}>
              {id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
