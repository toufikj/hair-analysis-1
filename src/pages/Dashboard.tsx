import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Image, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '@/components/ui/table';

interface Stats {
  patients: number;
  appointments: number;
  treatments: number;
  images: number;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  patientId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

interface Treatment {
  id: string;
  patientId: string;
  date: string;
  treatmentType: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    patients: 0,
    appointments: 0,
    treatments: 0,
    images: 0
  });
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [recentTreatments, setRecentTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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

        setRecentPatients(patients.slice(0, 5));
        setRecentAppointments(appointments.slice(0, 5));
        setRecentTreatments(treatments.slice(0, 5));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };

    fetchData();
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPatients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No patients yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>{patient.firstName} {patient.lastName}</TableCell>
                      <TableCell>{patient.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No appointments scheduled</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{appointment.appointmentDate}</TableCell>
                      <TableCell>{appointment.appointmentTime}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Treatments</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTreatments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No treatments recorded</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Treatment Type</TableHead>
                    <TableHead>Patient ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTreatments.map((treatment) => (
                    <TableRow key={treatment.id}>
                      <TableCell>{treatment.date}</TableCell>
                      <TableCell className="capitalize">{treatment.treatmentType}</TableCell>
                      <TableCell className="font-mono text-xs">{treatment.patientId.substring(0, 12)}...</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
