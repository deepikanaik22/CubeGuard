'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AlertsPage() {
  return (
    <div>
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="block md:hidden" />
        <h1 className="font-semibold text-2xl">Alerts</h1>
      </div>

      <Separator className="my-4" />

      <div>
        <h2 className="font-semibold text-xl mb-2">Current Alerts</h2>
        <ScrollArea className="h-[400px] w-full rounded-md border">
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>High Temperature Alert</AlertTitle>
              <AlertDescription>
                Internal temperature exceeded threshold.
              </AlertDescription>
            </Alert>
            <Alert className="mt-4">
              <AlertTitle>Low Battery Voltage</AlertTitle>
              <AlertDescription>
                Battery voltage is below the critical level.
              </AlertDescription>
            </Alert>
            <Alert className="mt-4">
              <AlertTitle>Communication Issue</AlertTitle>
              <AlertDescription>
                Signal strength is weak, packet delay is high.
              </AlertDescription>
            </Alert>
            <Alert className="mt-4">
              <AlertTitle>Orientation Drift</AlertTitle>
              <AlertDescription>
                Satellite orientation is drifting outside acceptable parameters.
              </AlertDescription>
            </Alert>
            <Alert className="mt-4">
              <AlertTitle>Solar Panel Degradation</AlertTitle>
              <AlertDescription>
                Solar panel output has decreased significantly.
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
