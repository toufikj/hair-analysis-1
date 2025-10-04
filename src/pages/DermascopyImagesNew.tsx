import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { X, Plus, Trash2 } from 'lucide-react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface ImageEntry {
  scalpArea: string;
  images: string[];
}

interface DermascopyRecord {
  id: string;
  patientId: string;
  scalpArea: string;
  images: string[];
  notes: string;
  date: string;
}

const scalpAreas = [
  'Frontal',
  'Crown',
  'Vertex',
  'Temporal (Left)',
  'Temporal (Right)',
  'Occipital',
  'Parietal (Left)',
  'Parietal (Right)'
];

const DermascopyImagesNew = () => {
  const [records, setRecords] = useState<DermascopyRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    patientId: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [imageEntries, setImageEntries] = useState<ImageEntry[]>([
    { scalpArea: '', images: [] }
  ]);

  const fetchRecords = async () => {
    try {
      const data = await api.images.getAll();
      setRecords(data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch records');
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
    fetchRecords();
    fetchPatients();
  }, []);

  const addImageEntry = () => {
    setImageEntries([...imageEntries, { scalpArea: '', images: [] }]);
  };

  const removeImageEntry = (index: number) => {
    setImageEntries(imageEntries.filter((_, i) => i !== index));
  };

  const updateScalpArea = (index: number, scalpArea: string) => {
    const updated = [...imageEntries];
    updated[index].scalpArea = scalpArea;
    setImageEntries(updated);
  };

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const updated = [...imageEntries];
        updated[index].images.push(base64);
        setImageEntries(updated);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (entryIndex: number, imageIndex: number) => {
    const updated = [...imageEntries];
    updated[entryIndex].images = updated[entryIndex].images.filter((_, i) => i !== imageIndex);
    setImageEntries(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId) {
      toast.error('Please select a patient');
      return;
    }

    const validEntries = imageEntries.filter(e => e.scalpArea && e.images.length > 0);
    
    if (validEntries.length === 0) {
      toast.error('Please add at least one scalp area with images');
      return;
    }

    try {
      // Save each entry separately
      for (const entry of validEntries) {
        const record = {
          id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          patientId: formData.patientId,
          scalpArea: entry.scalpArea,
          images: entry.images,
          notes: formData.notes,
          date: formData.date,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await api.images.create(record);
      }

      toast.success('Dermascopy images saved successfully');
      
      // Reset form
      setFormData({
        patientId: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
      setImageEntries([{ scalpArea: '', images: [] }]);
      setDialogOpen(false);
      fetchRecords();
    } catch (error) {
      toast.error('Failed to save images');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      await api.images.delete(id);
      toast.success('Record deleted');
      fetchRecords();
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dermascopy Images</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setFormData({
                patientId: '',
                notes: '',
                date: new Date().toISOString().split('T')[0]
              });
              setImageEntries([{ scalpArea: '', images: [] }]);
            }}>
              <Plus className="mr-2 h-4 w-4" /> Add Images
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Dermascopy Images</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Overall observations and notes"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Scalp Areas & Images</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addImageEntry}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Scalp Area
                  </Button>
                </div>

                {imageEntries.map((entry, entryIndex) => (
                  <Card key={entryIndex} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label htmlFor={`scalpArea-${entryIndex}`}>Scalp Area</Label>
                          <select
                            id={`scalpArea-${entryIndex}`}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={entry.scalpArea}
                            onChange={(e) => updateScalpArea(entryIndex, e.target.value)}
                          >
                            <option value="">Select scalp area</option>
                            {scalpAreas.map((area) => (
                              <option key={area} value={area}>
                                {area}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1">
                          <Label htmlFor={`images-${entryIndex}`}>Upload Images</Label>
                          <Input
                            id={`images-${entryIndex}`}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUpload(entryIndex, e)}
                            className="cursor-pointer"
                          />
                        </div>

                        {imageEntries.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeImageEntry(entryIndex)}
                            className="mt-6"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {entry.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {entry.images.map((img, imgIndex) => (
                            <div key={imgIndex} className="relative group">
                              <img 
                                src={img} 
                                alt={`Preview ${imgIndex + 1}`}
                                className="w-full h-24 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(entryIndex, imgIndex)}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <Button type="submit" className="w-full">Save All Records</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dermascopy Records ({records.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No dermascopy records yet.</p>
          ) : (
            <div className="space-y-4">
              {records.map((record) => {
                const patient = patients.find(p => p.id === record.patientId);
                return (
                  <Card key={record.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">
                            {patient ? `${patient.firstName} ${patient.lastName}` : record.patientId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.scalpArea} • {record.date}
                          </p>
                          {record.notes && (
                            <p className="text-sm mt-1">{record.notes}</p>
                          )}
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(record.id)}
                        >
                          Delete
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {record.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`${record.scalpArea} ${idx + 1}`}
                            className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(img, '_blank')}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DermascopyImagesNew;
