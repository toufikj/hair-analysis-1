import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Camera, 
  Upload, 
  Search, 
  Filter,
  Download,
  Eye,
  Trash2,
  Plus,
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { storage } from '@/lib/storage';
import { DermascopyImage, Patient } from '@/types/patient';
import { useToast } from '@/hooks/use-toast';

interface DermascopyViewerProps {
  onAddImage: () => void;
}

export const DermascopyViewer = ({ onAddImage }: DermascopyViewerProps) => {
  const [images, setImages] = useState<DermascopyImage[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPatient, setFilterPatient] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterQuality, setFilterQuality] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<DermascopyImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setImages(storage.getDermascopyImages());
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const imageId = await storage.saveImageFile(file);
      onAddImage();
      
      toast({
        title: "Success",
        description: "Image uploaded successfully. Please complete the details."
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    // Note: In a real app, you'd also delete the actual image file
    // For now, we'll just remove it from the list
    setImages(updatedImages);
    
    toast({
      title: "Success",
      description: "Image deleted successfully"
    });
  };

  const filteredImages = images.filter(image => {
    const patientName = getPatientName(image.patientId).toLowerCase();
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         image.scalpArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPatient = filterPatient === 'all' || image.patientId === filterPatient;
    const matchesArea = filterArea === 'all' || image.scalpArea === filterArea;
    const matchesQuality = filterQuality === 'all' || image.quality === filterQuality;
    
    return matchesSearch && matchesPatient && matchesArea && matchesQuality;
  });

  const groupedImages = filteredImages.reduce((groups, image) => {
    const patientId = image.patientId;
    if (!groups[patientId]) {
      groups[patientId] = [];
    }
    groups[patientId].push(image);
    return groups;
  }, {} as Record<string, DermascopyImage[]>);

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

  const getQualityColor = (quality: DermascopyImage['quality']) => {
    switch (quality) {
      case 'excellent':
        return 'bg-medical-green/10 text-medical-green border-medical-green/20';
      case 'good':
        return 'bg-medical-blue/10 text-medical-blue border-medical-blue/20';
      case 'fair':
        return 'bg-warning-light text-foreground border-border';
      case 'poor':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dermascopy Images</h1>
          <p className="text-muted-foreground">Manage and categorize scalp area images</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            disabled={isUploading}
          />
          <label htmlFor="image-upload">
            <Button asChild className="bg-medical-green hover:bg-medical-green/90" disabled={isUploading}>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Quick Upload'}
              </span>
            </Button>
          </label>
          <Button onClick={onAddImage} className="bg-medical-blue hover:bg-medical-blue/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient, area, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterPatient} onValueChange={setFilterPatient}>
              <SelectTrigger>
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
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                <SelectItem value="crown">Crown</SelectItem>
                <SelectItem value="temples">Temples</SelectItem>
                <SelectItem value="frontal">Frontal</SelectItem>
                <SelectItem value="vertex">Vertex</SelectItem>
                <SelectItem value="occipital">Occipital</SelectItem>
                <SelectItem value="sides">Sides</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterQuality} onValueChange={setFilterQuality}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quality</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      {Object.keys(groupedImages).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedImages).map(([patientId, patientImages]) => (
            <Card key={patientId}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-medical-blue/10 text-medical-blue font-semibold">
                      {getPatientInitials(patientId)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{getPatientName(patientId)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {patientImages.length} image{patientImages.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {patientImages
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map(image => (
                      <div key={image.id} className="group border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-muted relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Camera className="h-12 w-12 text-muted-foreground" />
                          </div>
                          <div className="absolute top-2 left-2">
                            <Badge className={getAreaColor(image.scalpArea)}>
                              {image.scalpArea}
                            </Badge>
                          </div>
                          <div className="absolute top-2 right-2">
                            <Badge className={getQualityColor(image.quality)}>
                              {image.quality}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium truncate">
                              {image.fileName}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => setSelectedImage(image)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Image Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedImage && (
                                    <div className="space-y-4">
                                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                                        <Camera className="h-16 w-16 text-muted-foreground" />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <Label className="font-medium">Patient:</Label>
                                          <p>{getPatientName(selectedImage.patientId)}</p>
                                        </div>
                                        <div>
                                          <Label className="font-medium">Scalp Area:</Label>
                                          <p className="capitalize">{selectedImage.scalpArea}</p>
                                        </div>
                                        <div>
                                          <Label className="font-medium">Quality:</Label>
                                          <p className="capitalize">{selectedImage.quality}</p>
                                        </div>
                                        <div>
                                          <Label className="font-medium">Date:</Label>
                                          <p>{new Date(selectedImage.timestamp).toLocaleDateString()}</p>
                                        </div>
                                        {selectedImage.magnification && (
                                          <div>
                                            <Label className="font-medium">Magnification:</Label>
                                            <p>{selectedImage.magnification}</p>
                                          </div>
                                        )}
                                      </div>
                                      {selectedImage.notes && (
                                        <div>
                                          <Label className="font-medium">Notes:</Label>
                                          <p className="text-sm text-muted-foreground">{selectedImage.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => deleteImage(image.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {new Date(image.timestamp).toLocaleDateString()}
                          </p>
                          {image.notes && (
                            <p className="text-xs text-muted-foreground truncate">
                              {image.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Images Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterPatient !== 'all' || filterArea !== 'all' || filterQuality !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Start by adding your first dermascopy image'
                }
              </p>
              <Button onClick={onAddImage} className="bg-medical-blue hover:bg-medical-blue/90">
                <Plus className="h-4 w-4 mr-2" />
                Add First Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};