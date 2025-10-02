import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function Appointments() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const appointments = [
    { id: 1, time: "09:00 AM", patient: "John Doe", type: "Consultation" },
    { id: 2, time: "10:30 AM", patient: "Jane Smith", type: "Follow-up" },
    { id: 3, time: "02:00 PM", patient: "Bob Johnson", type: "Treatment" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Schedule and manage appointments</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Appointments for {date?.toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between border-l-4 border-primary pl-4 py-3 bg-secondary/50 rounded"
                >
                  <div>
                    <p className="font-medium">{apt.patient}</p>
                    <p className="text-sm text-muted-foreground">{apt.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{apt.time}</p>
                    <Button variant="ghost" size="sm" className="mt-1">
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
