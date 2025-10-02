import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Treatments() {
  const treatments = [
    { id: 1, patient: "John Doe", type: "Hair Transplant", startDate: "2024-01-15", status: "Ongoing" },
    { id: 2, patient: "Jane Smith", type: "PRP Therapy", startDate: "2024-01-10", status: "Completed" },
    { id: 3, patient: "Bob Johnson", type: "Medication", startDate: "2024-01-20", status: "Ongoing" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Treatments</h1>
          <p className="text-muted-foreground">Manage patient treatments</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Treatment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hair Transplant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">45</p>
            <p className="text-sm text-muted-foreground">Active cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">PRP Therapy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">28</p>
            <p className="text-sm text-muted-foreground">Active cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medication</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">16</p>
            <p className="text-sm text-muted-foreground">Active cases</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Treatments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Treatment Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treatments.map((treatment) => (
                <TableRow key={treatment.id}>
                  <TableCell className="font-medium">{treatment.patient}</TableCell>
                  <TableCell>{treatment.type}</TableCell>
                  <TableCell>{treatment.startDate}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      treatment.status === "Ongoing" 
                        ? "bg-primary/10 text-primary" 
                        : "bg-green-500/10 text-green-600"
                    }`}>
                      {treatment.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
