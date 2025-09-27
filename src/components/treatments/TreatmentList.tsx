import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar,
  User,
  Camera,
  MoreHorizontal,
  Eye,
  Edit
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/storage';
import { TreatmentRecord, Patient } from '@/types/patient';

interface TreatmentListProps {
  onAddTreatment: () => void;
  onEditTreatment: (treatment: TreatmentRecord) => void;
}

export const TreatmentList = ({ onAddTreatment, onEditTreatment }: TreatmentListProps) => {
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPatient, setFilterPatient] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentRecord | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTreatments(storage.getTreatmentRecords());
    setPatients(storage.getPatients());
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const getPatientInitials = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase() : 'UN';
  };

  const filteredTreatments = treatments.filter(treatment => {
    const patientName = getPatientName(treatment.patientId).toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         treatment.treatmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         treatment.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPatient = filterPatient === 'all' || treatment.patientId === filterPatient;
    const matchesType = filterType === 'all' || treatment.treatmentType.toLowerCase().includes(filterType.toLowerCase());
    
    return matchesSearch && matchesPatient && matchesType;
  });

  const sortedTreatments = filteredTreatments.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('hair transplant') || lowerType.includes('fue') || lowerType.includes('fut')) {
      return 'bg-medical-purple/10 text-medical-purple';
    }
    if (lowerType.includes('prp') || lowerType.includes('platelet')) {
      return 'bg-medical-green/10 text-medical-green';
    }
    if (lowerType.includes('medication') || lowerType.includes('minoxidil') || lowerType.includes('finasteride')) {
      return 'bg-medical-blue/10 text-medical-blue';
    }
    if (lowerType.includes('laser') || lowerType.includes('lllt')) {
      return 'bg-primary/10 text-primary';
    }
    return 'bg-secondary text-secondary-foreground';
  };

  const treatmentTypes = [
    'Hair Transplant (FUE)',
    'Hair Transplant (FUT)', 
    'PRP Treatment',
    'Medication Therapy',
    'Laser Therapy',
    'Scalp Micropigmentation',
    'Consultation',
    'Follow-up'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Treatment Records</h1>
          <p className="text-muted-foreground">Track patient treatments and progress</p>
        </div>
        <Button onClick={onAddTreatment} className="bg-medical-blue hover:bg-medical-blue/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Treatment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient, treatment type, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterPatient} onValueChange={setFilterPatient}>
              <SelectTrigger className="w-48">
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Patient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                {patients.map(patient => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {`${patient.firstName} ${patient.lastName}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <FileText className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Treatment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="transplant">Hair Transplant</SelectItem>
                <SelectItem value="prp">PRP Treatment</SelectItem>
                <SelectItem value="medication">Medication</SelectItem>
                <SelectItem value="laser">Laser Therapy</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Treatments List */}
      {sortedTreatments.length > 0 ? (
        <div className="space-y-4">
          {sortedTreatments.map(treatment => (
            <Card key={treatment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-medical-blue/10 text-medical-blue font-semibold">
                        {getPatientInitials(treatment.patientId)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {getPatientName(treatment.patientId)}
                        </h3>
                        <Badge className={getTypeColor(treatment.treatmentType)}>
                          {treatment.treatmentType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(treatment.date).toLocaleDateString()}
                        </div>
                        {treatment.images.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            {treatment.images.length} image{treatment.images.length !== 1 ? 's' : ''}
                          </div>
                        )}
                        {treatment.nextAppointment && (
                          <div className="text-medical-green">
                            Next: {new Date(treatment.nextAppointment).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {treatment.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {treatment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTreatment(treatment)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Treatment Details</DialogTitle>
                        </DialogHeader>
                        {selectedTreatment && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="font-medium">Patient:</Label>
                                <p>{getPatientName(selectedTreatment.patientId)}</p>
                              </div>
                              <div>
                                <Label className="font-medium">Treatment Type:</Label>
                                <p>{selectedTreatment.treatmentType}</p>
                              </div>
                              <div>
                                <Label className="font-medium">Date:</Label>
                                <p>{new Date(selectedTreatment.date).toLocaleDateString()}</p>
                              </div>
                              {selectedTreatment.nextAppointment && (
                                <div>
                                  <Label className="font-medium">Next Appointment:</Label>
                                  <p>{new Date(selectedTreatment.nextAppointment).toLocaleDateString()}</p>
                                </div>
                              )}
                            </div>
                            {selectedTreatment.notes && (
                              <div>
                                <Label className="font-medium">Notes:</Label>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {selectedTreatment.notes}
                                </p>
                              </div>
                            )}
                            {selectedTreatment.images.length > 0 && (
                              <div>
                                <Label className="font-medium">Associated Images:</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                  {selectedTreatment.images.map(image => (
                                    <div key={image.id} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                                      <Camera className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditTreatment(treatment)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Treatment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Treatment Records Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterPatient !== 'all' || filterType !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Start by recording your first treatment'
                }
              </p>
              <Button onClick={onAddTreatment} className="bg-medical-blue hover:bg-medical-blue/90">
                <Plus className="h-4 w-4 mr-2" />
                Record First Treatment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};