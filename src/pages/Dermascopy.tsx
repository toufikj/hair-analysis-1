import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image as ImageIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Dermascopy() {
  const analyses = [
    { id: 1, patient: "John Doe", date: "2024-01-15", type: "Scalp Analysis", result: "Normal" },
    { id: 2, patient: "Jane Smith", date: "2024-01-20", type: "Hair Density", result: "Thinning" },
    { id: 3, patient: "Bob Johnson", date: "2024-01-25", type: "Follicle Health", result: "Good" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dermascopy</h1>
          <p className="text-muted-foreground">Hair and scalp analysis</p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          New Analysis
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center p-6 min-h-[200px]">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium">Upload Image</p>
            <p className="text-xs text-muted-foreground mt-1">Click to upload dermascopy image</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Analyses</span>
                <span className="font-medium">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="font-medium">23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pending Review</span>
                <span className="font-medium">5</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analysis Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Scalp Analysis</span>
                <span className="font-medium">89</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Hair Density</span>
                <span className="font-medium">45</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Follicle Health</span>
                <span className="font-medium">22</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyses.map((analysis) => (
                <TableRow key={analysis.id}>
                  <TableCell className="font-medium">{analysis.patient}</TableCell>
                  <TableCell>{analysis.date}</TableCell>
                  <TableCell>{analysis.type}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded text-xs bg-primary/10 text-primary">
                      {analysis.result}
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
