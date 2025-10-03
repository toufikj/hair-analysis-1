import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Image, FileText } from 'lucide-react';

interface Stats {
  patients: number;
  appointments: number;
  treatments: number;
  images: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    patients: 0,
    appointments: 0,
    treatments: 0,
    images: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patients, appointments, treatments, images] = await Promise.all([
          api.patients.getAll(),
          api.appointments.getAll(),
          api.treatments.getAll(),
          api.images.getAll()
        ]);

        setStats({
          patients: patients.length,
          appointments: appointments.length,
          treatments: treatments.length,
          images: images.length
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.patients,
      icon: Users,
      description: 'Registered patients'
    },
    {
      title: 'Appointments',
      value: stats.appointments,
      icon: Calendar,
      description: 'Scheduled appointments'
    },
    {
      title: 'Treatments',
      value: stats.treatments,
      icon: FileText,
      description: 'Treatment records'
    },
    {
      title: 'Dermascopy Images',
      value: stats.images,
      icon: Image,
      description: 'Captured images'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your hair clinic</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
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
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Activity timeline coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
