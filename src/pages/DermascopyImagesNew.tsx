import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, X, Image as ImageIcon } from 'lucide-react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface ScalpAreaImages {
  scalpArea: string;
  images: string[];
  notes: string;
}

interface DermascopyRecord {
  id: string;
  patientId: string;
  scalpAreas: ScalpAreaImages[];
  date: string;
}

const scalpAreaOptions = [
  'Frontal',
  'Temporal Left',
  'Temporal Right',
  'Vertex',
  'Crown',
  'Occipital',
  'Parietal Left',
  'Parietal Right'
];

const DermascopyImagesNew = () => {
  const [records, setRecords] = useState<DermascopyRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<DermascopyRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    patientId: '',
    scalpAreas: [{ scalpArea: 'Frontal', images: [] as string[], notes: '' }]
  });

  const fetchRecords = async () => {
    try {
      const data = await api.images.getAll();
      // Group images by patient
      const groupedRecords: { [key: string]: DermascopyRecord } = {};
      
      data.forEach((img: any) => {
        if (!groupedRecords[img.patientId]) {
          groupedRecords[img.patientId] = {
            id: img.patientId,
            patientId: img.patientId,
            scalpAreas: [],
            date: img.date || img.timestamp
          };
        }
        
        groupedRecords[img.patientId].scalpAreas.push({
          scalpArea: img.scalpArea,
          images: Array.isArray(img.images) ? img.images : (img.imageUrl ? [img.imageUrl] : []),
          notes: img.notes || ''
        });
      });
      
      setRecords(Object.values(groupedRecords));
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

  const handleImageUpload = (areaIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            const updatedAreas = [...formData.scalpAreas];
            updatedAreas[areaIndex].images = [...updatedAreas[areaIndex].images, ...newImages];
            setFormData({ ...formData, scalpAreas: updatedAreas });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (areaIndex: number, imageIndex: number) => {
    const updatedAreas = [...formData.scalpAreas];
    updatedAreas[areaIndex].images.splice(imageIndex, 1);
    setFormData({ ...formData, scalpAreas: updatedAreas });
  };

  const addScalpArea = () => {
    setFormData({
      ...formData,
      scalpAreas: [...formData.scalpAreas, { scalpArea: 'Frontal', images: [], notes: '' }]
    });
  };

  const removeScalpArea = (index: number) => {
    const updatedAreas = formData.scalpAreas.filter((_, i) => i !== index);
    setFormData({ ...formData, scalpAreas: updatedAreas });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Save each scalp area as a separate record in the backend
      for (const area of formData.scalpAreas) {
        if (area.images.length > 0) {
          await api.images.create({
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            patientId: formData.patientId,
            scalpArea: area.scalpArea,
            images: area.images,
            notes: area.notes,
            date: new Date().toISOString()
          });
        }
      }
      
      toast.success('Dermascopy images saved successfully');
      setFormData({
        patientId: '',
        scalpAreas: [{ scalpArea: 'Frontal', images: [], notes: '' }]
      });
      setDialogOpen(false);
      fetchRecords();
    } catch (error) {
      toast.error('Failed to save images');
    }
  };

  const handleDelete = async (patientId: string) => {
    if (confirm('Are you sure you want to delete all dermascopy records for this patient?')) {
      try {
        const data = await api.images.getAll();
        const patientImages = data.filter((img: any) => img.patientId === patientId);
        
        for (const img of patientImages) {
          await api.images.delete(img.id);
        }
        
        toast.success('Records deleted successfully');
        fetchRecords();
      } catch (error) {
        toast.error('Failed to delete records');
      }
    }
  };

  const viewRecord = (record: DermascopyRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const filteredRecords = records.filter(record => {
    const patient = patients.find(p => p.id === record.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}`.toLowerCase() : '';
    const search = searchTerm.toLowerCase();
    return patientName.includes(search) || record.date.includes(search);
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Dermascopy Images</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setFormData({
                  patientId: '',
                  scalpAreas: [{ scalpArea: 'Frontal', images: [], notes: '' }]
                });
              }}>
                <Plus className="mr-2 h-4 w-4" /> Add Dermascopy Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Dermascopy Images</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="patientId">Patient</Label>
                  <select
                    id="patientId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

                {formData.scalpAreas.map((area, areaIndex) => (
                  <Card key={areaIndex} className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Scalp Area {areaIndex + 1}</h3>
                      {formData.scalpAreas.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeScalpArea(areaIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Scalp Area</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={area.scalpArea}
                          onChange={(e) => {
                            const updated = [...formData.scalpAreas];
                            updated[areaIndex].scalpArea = e.target.value;
                            setFormData({ ...formData, scalpAreas: updated });
                          }}
                        >
                          {scalpAreaOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Images</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleImageUpload(areaIndex, e)}
                        />
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {area.images.map((img, imgIndex) => (
                            <div key={imgIndex} className="relative">
                              <img src={img} alt={`Preview ${imgIndex}`} className="w-full h-24 object-cover rounded" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0"
                                onClick={() => removeImage(areaIndex, imgIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          value={area.notes}
                          onChange={(e) => {
                            const updated = [...formData.scalpAreas];
                            updated[areaIndex].notes = e.target.value;
                            setFormData({ ...formData, scalpAreas: updated });
                          }}
                          placeholder="Add notes for this scalp area..."
                        />
                      </div>
                    </div>
                  </Card>
                ))}

                <Button type="button" variant="outline" onClick={addScalpArea} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Add Another Scalp Area
                </Button>

                <Button type="submit" className="w-full">Save Dermascopy Record</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Input
          placeholder="Search by patient name or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecords.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 col-span-full">No dermascopy records found.</p>
        ) : (
          filteredRecords.map((record) => {
            const patient = patients.find(p => p.id === record.patientId);
            const totalImages = record.scalpAreas.reduce((sum, area) => sum + area.images.length, 0);
            
            return (
              <Card key={record.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(record.date).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-sm">{totalImages} images</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.scalpAreas.length} scalp areas
                    </div>
                  </div>
                  
                  {record.scalpAreas[0]?.images[0] && (
                    <div className="mb-4">
                      <img 
                        src={record.scalpAreas[0].images[0]} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => viewRecord(record)} className="flex-1">
                      View Details
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(record.patientId)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord && patients.find(p => p.id === selectedRecord.patientId) 
                ? `${patients.find(p => p.id === selectedRecord.patientId)?.firstName} ${patients.find(p => p.id === selectedRecord.patientId)?.lastName}`
                : 'Dermascopy Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              {selectedRecord.scalpAreas.map((area, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{area.scalpArea}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {area.images.map((img, imgIndex) => (
                        <img 
                          key={imgIndex}
                          src={img} 
                          alt={`${area.scalpArea} ${imgIndex + 1}`}
                          className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-90"
                          onClick={() => window.open(img, '_blank')}
                        />
                      ))}
                    </div>
                    {area.notes && (
                      <div>
                        <Label>Notes:</Label>
                        <p className="text-sm text-muted-foreground mt-1">{area.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DermascopyImagesNew;
