import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface Treatment {
  id: string;
  patientId: string;
  treatmentType: string;
  description: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

const treatmentTypes = [
  'PRP (Platelet-Rich Plasma)',
  'Hair Transplant - FUE',
  'Hair Transplant - FUT',
  'Mesotherapy',
  'Low-Level Laser Therapy',
  'Scalp Micropigmentation',
  'Topical Treatments',
  'Consultation',
  'Follow-up',
  'Other'
];

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

const Treatments = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    patientId: '',
    treatmentType: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);

  const fetchTreatments = async () => {
    try {
      const data = await api.treatments.getAll();
      setTreatments(data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch treatments');
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await api.patients.getAll();
      setPatients(data);
    } catch (error) {
      toast.error('Failed to fetch patients');
    }
  };

  useEffect(() => {
    fetchTreatments();
    fetchPatients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const treatmentData = {
      id: editingTreatment?.id || `treatment_${Date.now()}`,
      ...formData,
      createdAt: editingTreatment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await api.treatments.create(treatmentData);
      toast.success(editingTreatment ? 'Treatment updated successfully' : 'Treatment added successfully');
      setFormData({
        patientId: '',
        treatmentType: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setEditingTreatment(null);
      setDialogOpen(false);
      fetchTreatments();
    } catch (error) {
      toast.error('Failed to save treatment');
    }
  };

  const handleEdit = (treatment: Treatment) => {
    setFormData({
      patientId: treatment.patientId,
      treatmentType: treatment.treatmentType,
      description: treatment.description,
      date: treatment.date
    });
    setEditingTreatment(treatment);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this treatment?')) return;
    
    try {
      await api.treatments.delete(id);
      toast.success('Treatment deleted');
      fetchTreatments();
    } catch (error) {
      toast.error('Failed to delete treatment');
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      patientId: '',
      treatmentType: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingTreatment(null);
  };

  const filteredTreatments = treatments.filter(treatment => {
    const patient = patients.find(p => p.id === treatment.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}`.toLowerCase() : '';
    const search = searchTerm.toLowerCase();
    return patientName.includes(search) ||
           treatment.treatmentType?.toLowerCase().includes(search) ||
           treatment.date.includes(search);
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Treatment Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTreatment(null);
              setFormData({
                patientId: '',
                treatmentType: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
              });
            }}>
              <Plus className="mr-2 h-4 w-4" /> Add Treatment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTreatment ? 'Edit Treatment' : 'Add New Treatment'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientId">Patient</Label>
                  <select
                    id="patientId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    required
                  >
                    <option value="">Select a patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="treatmentType">Treatment Type</Label>
                  <select
                    id="treatmentType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.treatmentType}
                    onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })}
                    required
                  >
                    <option value="">Select treatment type</option>
                    {treatmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Treatment details, observations, recommendations..."
                />
              </div>

              <Button type="submit" className="w-full">
                {editingTreatment ? 'Update Treatment' : 'Add Treatment'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
        <Input
          placeholder="Search by patient name, treatment type, or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Treatments ({filteredTreatments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTreatments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No treatments found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Treatment Type</TableHead>
                  <TableHead>Next Appointment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTreatments.map((treatment) => {
                  const patient = patients.find(p => p.id === treatment.patientId);
                  return (
                    <TableRow key={treatment.id}>
                      <TableCell className="font-medium">
                        {patient ? `${patient.firstName} ${patient.lastName}` : treatment.patientId}
                      </TableCell>
                      <TableCell>{treatment.treatmentType}</TableCell>
                      <TableCell className="max-w-xs truncate">{treatment.description}</TableCell>
                      <TableCell>{treatment.date}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(treatment)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(treatment.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Treatments;
