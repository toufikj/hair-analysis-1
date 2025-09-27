import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Download, 
  Upload, 
  Trash2, 
  Save,
  Database,
  Shield,
  Bell,
  Palette,
  User
} from 'lucide-react';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const SettingsPanel = () => {
  const [clinicSettings, setClinicSettings] = useState({
    clinicName: 'HairCare Medical Center',
    address: '123 Medical Plaza, Health City, HC 12345',
    phone: '(555) 123-4567',
    email: 'info@haircare-clinic.com',
    website: 'www.haircare-clinic.com',
    description: 'Leading hair restoration and treatment clinic specializing in advanced dermascopy and personalized treatment plans.'
  });

  const [preferences, setPreferences] = useState({
    autoBackup: true,
    emailNotifications: true,
    darkMode: false,
    compactView: false,
    showProgressPhotos: true
  });

  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleExportData = () => {
    try {
      const exportData = storage.exportData();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `haircare-clinic-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Your clinic data has been exported successfully"
      });
    } catch (error) {
      toast({
        title: "Export Failed", 
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const success = storage.importData(jsonData);
        
        if (success) {
          toast({
            title: "Import Successful",
            description: "Your clinic data has been imported successfully"
          });
          // Refresh the page to reflect imported data
          window.location.reload();
        } else {
          throw new Error('Import failed');
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive"
        });
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    try {
      localStorage.clear();
      toast({
        title: "Data Cleared",
        description: "All clinic data has been cleared successfully"
      });
      // Refresh the page
      window.location.reload();
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('hair-clinic-settings', JSON.stringify(clinicSettings));
      localStorage.setItem('hair-clinic-preferences', JSON.stringify(preferences));
      
      toast({
        title: "Settings Saved",
        description: "Your clinic settings have been saved successfully"
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure your clinic settings and preferences</p>
      </div>

      <Tabs defaultValue="clinic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="clinic" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Clinic
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Clinic Information */}
        <TabsContent value="clinic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-medical-blue" />
                Clinic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic Name</Label>
                  <Input
                    id="clinicName"
                    value={clinicSettings.clinicName}
                    onChange={(e) => setClinicSettings(prev => ({ ...prev, clinicName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={clinicSettings.phone}
                    onChange={(e) => setClinicSettings(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clinicSettings.email}
                    onChange={(e) => setClinicSettings(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={clinicSettings.website}
                    onChange={(e) => setClinicSettings(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={clinicSettings.address}
                  onChange={(e) => setClinicSettings(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Clinic Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={clinicSettings.description}
                  onChange={(e) => setClinicSettings(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <Button onClick={saveSettings} className="bg-medical-blue hover:bg-medical-blue/90">
                <Save className="h-4 w-4 mr-2" />
                Save Clinic Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-medical-blue" />
                Application Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Switch to dark theme</p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, darkMode: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact View</Label>
                  <p className="text-sm text-muted-foreground">Display more content in less space</p>
                </div>
                <Switch
                  checked={preferences.compactView}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, compactView: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Progress Photos</Label>
                  <p className="text-sm text-muted-foreground">Display before/after photos in patient timeline</p>
                </div>
                <Switch
                  checked={preferences.showProgressPhotos}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, showProgressPhotos: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Backup</Label>
                  <p className="text-sm text-muted-foreground">Automatically backup data weekly</p>
                </div>
                <Switch
                  checked={preferences.autoBackup}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, autoBackup: checked }))}
                />
              </div>
              <Button onClick={saveSettings} className="bg-medical-blue hover:bg-medical-blue/90">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-medical-blue" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive appointment reminders via email</p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailNotifications: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Appointment Reminders</Label>
                  <p className="text-sm text-muted-foreground">Send reminders 24 hours before appointments</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Treatment Follow-ups</Label>
                  <p className="text-sm text-muted-foreground">Remind to schedule follow-up appointments</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button onClick={saveSettings} className="bg-medical-blue hover:bg-medical-blue/90">
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-medical-blue" />
                  Data Export & Import
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Export All Data</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Download a backup of all your clinic data including patients, treatments, and images
                  </p>
                  <Button onClick={handleExportData} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Import Data</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Import clinic data from a previously exported backup file
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                      id="import-file"
                      disabled={isImporting}
                    />
                    <label htmlFor="import-file">
                      <Button asChild variant="outline" disabled={isImporting}>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {isImporting ? 'Importing...' : 'Import Data'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Clear All Data</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete all clinic data. This action cannot be undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all clinic data 
                          including patients, treatments, appointments, and images.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAllData} className="bg-destructive hover:bg-destructive/90">
                          Yes, Clear All Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-medical-blue" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Data Storage</Label>
                  <p className="text-sm text-muted-foreground">
                    All clinic data is stored locally in your browser. No data is transmitted to external servers.
                  </p>
                </div>
                
                <div>
                  <Label className="text-base">Image Security</Label>
                  <p className="text-sm text-muted-foreground">
                    Dermascopy images are stored securely in local storage with unique identifiers.
                  </p>
                </div>
                
                <div>
                  <Label className="text-base">Data Backup</Label>
                  <p className="text-sm text-muted-foreground">
                    Regular backups are recommended to prevent data loss. Use the export feature above.
                  </p>
                </div>
                
                <div>
                  <Label className="text-base">Privacy Compliance</Label>
                  <p className="text-sm text-muted-foreground">
                    This application is designed with HIPAA compliance in mind. All patient data remains local.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};