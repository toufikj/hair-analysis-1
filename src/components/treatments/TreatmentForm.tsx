import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, FileText, User, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/storage';
import { TreatmentRecord, Patient, DermascopyImage } from '@/types/patient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface TreatmentFormProps {
  treatment?: TreatmentRecord;
  onSave: () => void;
  onCancel: () => void;
}

export const TreatmentForm = ({ treatment, onSave, onCancel }: TreatmentFormProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableImages, setAvailableImages] = useState<DermascopyImage[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [nextAppointmentDate, setNextAppointmentDate] = useState<Date>();
  const [formData, setFormData] = useState({
    patientId: '',
    treatmentType: '',
    notes: '',
    selectedImageIds: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadedPatients = storage.getPatients();
    setPatients(loadedPatients);

    if (treatment) {
      setFormData({
        patientId: treatment.patientId,
        treatmentType: treatment.treatmentType,
        notes: treatment.notes,
        selectedImageIds: treatment.images.map(img => img.id)
      });
      setSelectedDate(new Date(treatment.date));
      if (treatment.nextAppointment) {
        setNextAppointmentDate(new Date(treatment.nextAppointment));
      }
      setAvailableImages(storage.getImagesByPatient(treatment.patientId));
    }
  }, [treatment]);

  useEffect(() => {
    if (formData.patientId) {
      setAvailableImages(storage.getImagesByPatient(formData.patientId));
    } else {
      setAvailableImages([]);
    }
  }, [formData.patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formData.patientId || !formData.treatmentType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedImages = availableImages.filter(img => 
        formData.selectedImageIds.includes(img.id)
      );

      const treatmentData: TreatmentRecord = {
        id: treatment?.id || `treatment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patientId: formData.patientId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        treatmentType: formData.treatmentType,
        notes: formData.notes,
        images: selectedImages,
        nextAppointment: nextAppointmentDate ? format(nextAppointmentDate, 'yyyy-MM-dd') : undefined,
        createdAt: treatment?.createdAt || new Date().toISOString()
      };

      storage.saveTreatmentRecord(treatmentData);

      toast({
        title: "Success",
        description: treatment 
          ? "Treatment record updated successfully" 
          : "Treatment record saved successfully"
      });

      onSave();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save treatment record. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleImageSelection = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedImageIds: prev.selectedImageIds.includes(imageId)
        ? prev.selectedImageIds.filter(id => id !== imageId)
        : [...prev.selectedImageIds, imageId]
    }));
  };

  const treatmentTypes = [
    'Hair Transplant (FUE)',
    'Hair Transplant (FUT)',
    'PRP Treatment',
    'Medication Therapy - Minoxidil',
    'Medication Therapy - Finasteride',
    'Laser Therapy (LLLT)',
    'Scalp Micropigmentation',
    'Consultation',
    'Follow-up Assessment',
    'Progress Evaluation',
    'Custom Treatment'
  ];

  const getPatientDisplay = (patient: Patient) => 
    `${patient.firstName} ${patient.lastName} - ${patient.email}`;

  const getAreaColor = (area: DermascopyImage['scalpArea']) => {
    const colors = {
      crown: 'bg-medical-blue/10 text-medical-blue',
      temples: 'bg-medical-green/10 text-medical-green',
      frontal: 'bg-medical-purple/10 text-medical-purple',
      vertex: 'bg-primary/10 text-primary',
      occipital: 'bg-accent text-accent-foreground',
      sides: 'bg-secondary text-secondary-foreground'
    };
    return colors[area] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {treatment ? 'Edit Treatment Record' : 'New Treatment Record'}
        </h1>
        <p className="text-muted-foreground">
          {treatment ? 'Update treatment details and progress notes' : 'Record a new patient treatment session'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-medical-blue" />
                Treatment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label htmlFor="patient" className="text-sm font-medium">
                  Patient *
                </Label>
                <Select 
                  value={formData.patientId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select a patient" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {getPatientDisplay(patient)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Treatment Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Treatment Type *</Label>
                <Select 
                  value={formData.treatmentType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, treatmentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select treatment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {treatmentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Treatment Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Treatment Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Next Appointment */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Next Appointment (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !nextAppointmentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nextAppointmentDate ? format(nextAppointmentDate, "PPP") : "Schedule next visit"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={nextAppointmentDate}
                      onSelect={setNextAppointmentDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {nextAppointmentDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setNextAppointmentDate(undefined)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Treatment Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Treatment Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Detailed notes about the treatment session, progress, observations, etc..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* Associated Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-medical-blue" />
                Associate Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.patientId ? (
                availableImages.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select images to associate with this treatment:
                    </p>
                    <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                      {availableImages.map(image => (
                        <div 
                          key={image.id}
                          className={cn(
                            "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                            formData.selectedImageIds.includes(image.id)
                              ? "border-medical-blue bg-medical-blue/5"
                              : "hover:bg-accent/20"
                          )}
                          onClick={() => toggleImageSelection(image.id)}
                        >
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium">IMG</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getAreaColor(image.scalpArea)}>
                                {image.scalpArea}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(image.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium truncate">
                              {image.fileName}
                            </p>
                            {image.notes && (
                              <p className="text-xs text-muted-foreground truncate">
                                {image.notes}
                              </p>
                            )}
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center",
                            formData.selectedImageIds.includes(image.id)
                              ? "border-medical-blue bg-medical-blue"
                              : "border-muted-foreground"
                          )}>
                            {formData.selectedImageIds.includes(image.id) && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.selectedImageIds.length} of {availableImages.length} images selected
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-2">
                      No images available for this patient
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Upload dermascopy images to associate them with treatments
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Select a patient first to view available images
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-medical-blue hover:bg-medical-blue/90"
          >
            {isSubmitting ? 'Saving...' : treatment ? 'Update Treatment' : 'Save Treatment'}
          </Button>
        </div>
      </form>
    </div>
  );
};