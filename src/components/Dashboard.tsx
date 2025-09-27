import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  Camera, 
  FileText, 
  TrendingUp, 
  Clock,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Patient, Appointment, TreatmentRecord } from '@/types/patient';
import { storage } from '@/lib/storage';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    totalTreatments: 0,
    thisWeekImages: 0
  });
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const patients = storage.getPatients();
    const appointments = storage.getAppointments();
    const treatments = storage.getTreatmentRecords();
    const images = storage.getDermascopyImages();

    // Calculate stats
    const today = new Date().toDateString();
    const todayAppointments = appointments.filter(apt => 
      new Date(apt.date).toDateString() === today && apt.status === 'scheduled'
    ).length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekImages = images.filter(img => 
      new Date(img.timestamp) > weekAgo
    ).length;

    setStats({
      totalPatients: patients.length,
      todayAppointments,
      totalTreatments: treatments.length,
      thisWeekImages
    });

    // Recent patients (last 5)
    const sortedPatients = patients
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    setRecentPatients(sortedPatients);

    // Upcoming appointments (next 5)
    const now = new Date();
    const upcoming = appointments
      .filter(apt => new Date(`${apt.date} ${apt.time}`) > now && apt.status === 'scheduled')
      .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
      .slice(0, 5);
    setUpcomingAppointments(upcoming);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getPatientName = (patientId: string) => {
    const patients = storage.getPatients();
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'text-medical-blue',
      bgColor: 'bg-medical-blue/10',
      onClick: () => onNavigate('patients')
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: Calendar,
      color: 'text-medical-green',
      bgColor: 'bg-medical-green/10',
      onClick: () => onNavigate('appointments')
    },
    {
      title: 'Total Treatments',
      value: stats.totalTreatments,
      icon: FileText,
      color: 'text-medical-purple',
      bgColor: 'bg-medical-purple/10',
      onClick: () => onNavigate('treatments')
    },
    {
      title: 'Images This Week',
      value: stats.thisWeekImages,
      icon: Camera,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      onClick: () => onNavigate('dermascopy')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to HairCare CRM - Your clinic overview</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onNavigate('patients')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
          <Button onClick={() => onNavigate('appointments')} className="bg-medical-blue hover:bg-medical-blue/90">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={stat.onClick}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Recent Patients</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('patients')}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentPatients.length > 0 ? (
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-medical-blue/10 text-medical-blue font-semibold text-sm">
                        {getInitials(patient.firstName, patient.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{patient.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No patients yet</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => onNavigate('patients')}
                >
                  Add First Patient
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Upcoming Appointments</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('appointments')}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-medical-green/10 rounded-full">
                        <Clock className="h-4 w-4 text-medical-green" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {getPatientName(appointment.patientId)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {appointment.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {appointment.time}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appointment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => onNavigate('appointments')}
                >
                  Schedule Appointment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => onNavigate('patients')}
            >
              <Users className="h-5 w-5" />
              <span className="text-sm">Add Patient</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => onNavigate('appointments')}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-sm">Schedule</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => onNavigate('dermascopy')}
            >
              <Camera className="h-5 w-5" />
              <span className="text-sm">Take Photos</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => onNavigate('treatments')}
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm">Record Treatment</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};