import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState("");

  const patients = [
    { id: 1, name: "John Doe", age: 35, phone: "+1234567890", lastVisit: "2024-01-15", status: "Active" },
    { id: 2, name: "Jane Smith", age: 42, phone: "+1234567891", lastVisit: "2024-01-20", status: "Active" },
    { id: 3, name: "Bob Johnson", age: 28, phone: "+1234567892", lastVisit: "2024-01-25", status: "Pending" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">Manage your patient records</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>{patient.lastVisit}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      patient.status === "Active" 
                        ? "bg-primary/10 text-primary" 
                        : "bg-yellow-500/10 text-yellow-600"
                    }`}>
                      {patient.status}
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
