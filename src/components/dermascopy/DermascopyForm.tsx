import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, User, MapPin, X } from 'lucide-react';
import { storage } from '@/lib/storage';
import { DermascopyImage, Patient } from '@/types/patient';
import { useToast } from '@/hooks/use-toast';

interface DermascopyFormProps {
  image?: DermascopyImage;
  onSave: () => void;
  onCancel: () => void;
}

export const DermascopyForm = ({ image, onSave, onCancel }: DermascopyFormProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState({
    patientId: '',
    treatmentId: '',
    scalpArea: '' as DermascopyImage['scalpArea'],
    fileName: '',
    notes: '',
    magnification: '',
    quality: 'good' as DermascopyImage['quality']
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadedPatients = storage.getPatients();
    setPatients(loadedPatients);

    if (image) {
      setFormData({
        patientId: image.patientId,
        treatmentId: image.treatmentId,
        scalpArea: image.scalpArea,
        fileName: image.fileName,
        notes: image.notes,
        magnification: image.magnification || '',
        quality: image.quality
      });
      
      // Load existing image
      const existingImageData = storage.getImageFile(image.imageUrl);
      if (existingImageData) {
        setPreviewUrls([existingImageData]);
      }
    }
  }, [image]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [...previewUrls];

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not an image file`,
          variant: "destructive"
        });
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Update filename if it's the first file
    if (selectedFiles.length === 0 && validFiles.length > 0) {
      setFormData(prev => ({ 
        ...prev, 
        fileName: validFiles[0].name 
      }));
    }

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.scalpArea || (selectedFiles.length === 0 && !image)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select at least one image",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (image) {
        // Update existing image
        let imageUrl = image.imageUrl;
        
        if (selectedFiles.length > 0) {
          imageUrl = await storage.saveImageFile(selectedFiles[0]);
        }

        const imageData: DermascopyImage = {
          ...image,
          patientId: formData.patientId,
          scalpArea: formData.scalpArea,
          fileName: formData.fileName,
          notes: formData.notes,
          magnification: formData.magnification,
          quality: formData.quality,
          imageUrl
        };

        storage.saveDermascopyImage(imageData);
      } else {
        // Save multiple new images
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const imageUrl = await storage.saveImageFile(file);
          
          const imageData: DermascopyImage = {
            id: `img_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
            patientId: formData.patientId,
            treatmentId: formData.treatmentId || '',
            scalpArea: formData.scalpArea,
            imageUrl,
            fileName: i === 0 ? formData.fileName : file.name,
            notes: formData.notes,
            magnification: formData.magnification,
            quality: formData.quality,
            timestamp: new Date().toISOString()
          };

          storage.saveDermascopyImage(imageData);
        }
      }

      toast({
        title: "Success",
        description: image 
          ? "Image updated successfully" 
          : `${selectedFiles.length} image(s) saved successfully`
      });

      onSave();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPatientDisplay = (patient: Patient) => 
    `${patient.firstName} ${patient.lastName} - ${patient.email}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {image ? 'Edit Dermascopy Image' : 'Add New Dermascopy Image'}
        </h1>
        <p className="text-muted-foreground">
          {image ? 'Update image details and metadata' : 'Upload and categorize a new scalp area image'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Upload/Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-medical-blue" />
              Image {image ? 'Preview' : 'Upload'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!image && (
                <div>
                  <Label htmlFor="image" className="text-sm font-medium">
                    Select Image *
                  </Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="image"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/20 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, JPEG up to 10MB</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {previewUrls.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Preview{previewUrls.length > 1 ? 's' : ''} ({previewUrls.length})
                  </Label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {!image && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {!image && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image')?.click()}
                    >
                      Add More Images
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-medical-blue" />
              Image Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Scalp Area */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Scalp Area *</Label>
                <Select 
                  value={formData.scalpArea} 
                  onValueChange={(value: DermascopyImage['scalpArea']) => 
                    setFormData(prev => ({ ...prev, scalpArea: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scalp area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crown">Crown</SelectItem>
                    <SelectItem value="temples">Temples</SelectItem>
                    <SelectItem value="frontal">Frontal</SelectItem>
                    <SelectItem value="vertex">Vertex</SelectItem>
                    <SelectItem value="occipital">Occipital</SelectItem>
                    <SelectItem value="sides">Sides</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quality */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Image Quality</Label>
                  <Select 
                    value={formData.quality} 
                    onValueChange={(value: DermascopyImage['quality']) => 
                      setFormData(prev => ({ ...prev, quality: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Magnification */}
                <div className="space-y-2">
                  <Label htmlFor="magnification" className="text-sm font-medium">
                    Magnification
                  </Label>
                  <Input
                    id="magnification"
                    placeholder="e.g., 10x, 20x"
                    value={formData.magnification}
                    onChange={(e) => setFormData(prev => ({ ...prev, magnification: e.target.value }))}
                  />
                </div>
              </div>

              {/* File Name */}
              <div className="space-y-2">
                <Label htmlFor="fileName" className="text-sm font-medium">
                  File Name
                </Label>
                <Input
                  id="fileName"
                  placeholder="Image file name"
                  value={formData.fileName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fileName: e.target.value }))}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this image..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-medical-blue hover:bg-medical-blue/90"
                >
                  {isSubmitting ? 'Saving...' : image ? 'Update Image' : 'Save Image'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};