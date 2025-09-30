import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientSelect } from '@/components/ui/patient-select';
import { Camera, Upload, User, MapPin, X } from 'lucide-react';
import { storage } from '@/lib/storage';
import { DermascopyImage, Patient } from '@/types/patient';
import { useToast } from '@/hooks/use-toast';

interface ImageData {
  file: File;
  preview: string;
  scalpArea: DermascopyImage['scalpArea'];
  quality: DermascopyImage['quality'];
  magnification: string;
  notes: string;
}

interface DermascopyFormProps {
  image?: DermascopyImage;
  onSave: () => void;
  onCancel: () => void;
}

export const DermascopyForm = ({ image, onSave, onCancel }: DermascopyFormProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formData, setFormData] = useState({
    patientId: '',
    treatmentId: ''
  });
  const [imageDataList, setImageDataList] = useState<ImageData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadedPatients = storage.getPatients();
    setPatients(loadedPatients);

    if (image) {
      setFormData({
        patientId: image.patientId,
        treatmentId: image.treatmentId
      });
      
      // Load existing image as single image data
      const existingImageData = storage.getImageFile(image.imageUrl);
      if (existingImageData) {
        setImageDataList([{
          file: new File([], image.fileName),
          preview: existingImageData,
          scalpArea: image.scalpArea,
          quality: image.quality,
          magnification: image.magnification || '',
          notes: image.notes
        }]);
      }
    }
  }, [image]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];

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

    // Create image data objects for each file
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setImageDataList(prev => [...prev, {
          file,
          preview,
          scalpArea: 'crown', // default value
          quality: 'good',
          magnification: '',
          notes: ''
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageDataList(prev => prev.filter((_, i) => i !== index));
  };

  const updateImageData = (index: number, field: keyof ImageData, value: any) => {
    setImageDataList(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || imageDataList.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a patient and upload at least one image",
        variant: "destructive"
      });
      return;
    }

    // Validate that all images have required scalp area
    const invalidImages = imageDataList.filter(img => !img.scalpArea);
    if (invalidImages.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please select a scalp area for all images",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (image) {
        // Update existing image
        const imageData = imageDataList[0];
        let imageUrl = image.imageUrl;
        
        if (imageData.file.size > 0) {
          imageUrl = await storage.saveImageFile(imageData.file);
        }

        const updatedImage: DermascopyImage = {
          ...image,
          patientId: formData.patientId,
          scalpArea: imageData.scalpArea,
          fileName: imageData.file.name || image.fileName,
          notes: imageData.notes,
          magnification: imageData.magnification,
          quality: imageData.quality,
          imageUrl
        };

        storage.saveDermascopyImage(updatedImage);
      } else {
        // Save multiple new images
        for (let i = 0; i < imageDataList.length; i++) {
          const imageData = imageDataList[i];
          const imageUrl = await storage.saveImageFile(imageData.file);
          
          const dermascopyImage: DermascopyImage = {
            id: `img_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
            patientId: formData.patientId,
            treatmentId: formData.treatmentId || '',
            scalpArea: imageData.scalpArea,
            imageUrl,
            fileName: imageData.file.name,
            notes: imageData.notes,
            magnification: imageData.magnification,
            quality: imageData.quality,
            timestamp: new Date().toISOString()
          };

          storage.saveDermascopyImage(dermascopyImage);
        }
      }

      toast({
        title: "Success",
        description: image 
          ? "Image updated successfully" 
          : `${imageDataList.length} image(s) saved successfully`
      });

      onSave();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save images. Please try again.",
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

              {imageDataList.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-sm font-medium">
                    Images ({imageDataList.length})
                  </Label>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {imageDataList.map((imageData, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-20 h-20 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                            <img
                              src={imageData.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs font-medium">Scalp Area *</Label>
                                <Select 
                                  value={imageData.scalpArea} 
                                  onValueChange={(value: DermascopyImage['scalpArea']) => 
                                    updateImageData(index, 'scalpArea', value)
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select area" />
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
                              <div>
                                <Label className="text-xs font-medium">Quality</Label>
                                <Select 
                                  value={imageData.quality} 
                                  onValueChange={(value: DermascopyImage['quality']) => 
                                    updateImageData(index, 'quality', value)
                                  }
                                >
                                  <SelectTrigger className="h-8">
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
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Magnification</Label>
                              <Input
                                placeholder="e.g., 10x, 20x"
                                value={imageData.magnification}
                                onChange={(e) => updateImageData(index, 'magnification', e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Notes</Label>
                              <Textarea
                                placeholder="Notes for this image..."
                                value={imageData.notes}
                                onChange={(e) => updateImageData(index, 'notes', e.target.value)}
                                rows={2}
                                className="text-xs"
                              />
                            </div>
                          </div>
                          {!image && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
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
                <PatientSelect
                  patients={patients}
                  value={formData.patientId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
                  placeholder="Search and select a patient"
                />
              </div>

              {/* Images will be shown above with individual controls */}

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
