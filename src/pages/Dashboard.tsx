import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, Activity } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { title: "Total Patients", value: "1,234", icon: Users, change: "+12%" },
    { title: "Appointments Today", value: "23", icon: Calendar, change: "+5%" },
    { title: "Active Treatments", value: "89", icon: Activity, change: "+8%" },
    { title: "Success Rate", value: "94%", icon: TrendingUp, change: "+2%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your hair clinic management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">Patient {i}</p>
                    <p className="text-sm text-muted-foreground">
                      Consultation - {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                    Scheduled
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Treatment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Hair Transplant</span>
                <span className="font-medium">45</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">PRP Therapy</span>
                <span className="font-medium">28</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Medication</span>
                <span className="font-medium">16</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
