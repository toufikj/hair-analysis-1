import { Patient, TreatmentRecord, DermascopyImage, Appointment } from '@/types/patient';

class LocalStorageManager {
  private getStorageKey(type: string): string {
    return `hair-clinic-${type}`;
  }

  // Generic storage methods
  private getItems<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return [];
    }
  }

  private setItems<T>(key: string, items: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }

  // Patient management
  getPatients(): Patient[] {
    return this.getItems<Patient>(this.getStorageKey('patients'));
  }

  savePatient(patient: Patient): void {
    const patients = this.getPatients();
    const existingIndex = patients.findIndex(p => p.id === patient.id);
    
    if (existingIndex >= 0) {
      patients[existingIndex] = { ...patient, updatedAt: new Date().toISOString() };
    } else {
      patients.push({ ...patient, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    
    this.setItems(this.getStorageKey('patients'), patients);
  }

  deletePatient(patientId: string): void {
    const patients = this.getPatients().filter(p => p.id !== patientId);
    this.setItems(this.getStorageKey('patients'), patients);
    
    // Also delete related data
    this.deleteTreatmentsByPatient(patientId);
    this.deleteImagesByPatient(patientId);
    this.deleteAppointmentsByPatient(patientId);
  }

  // Treatment records
  getTreatmentRecords(): TreatmentRecord[] {
    return this.getItems<TreatmentRecord>(this.getStorageKey('treatments'));
  }

  saveTreatmentRecord(treatment: TreatmentRecord): void {
    const treatments = this.getTreatmentRecords();
    const existingIndex = treatments.findIndex(t => t.id === treatment.id);
    
    if (existingIndex >= 0) {
      treatments[existingIndex] = treatment;
    } else {
      treatments.push({ ...treatment, createdAt: new Date().toISOString() });
    }
    
    this.setItems(this.getStorageKey('treatments'), treatments);
  }

  getTreatmentsByPatient(patientId: string): TreatmentRecord[] {
    return this.getTreatmentRecords().filter(t => t.patientId === patientId);
  }

  deleteTreatmentsByPatient(patientId: string): void {
    const treatments = this.getTreatmentRecords().filter(t => t.patientId !== patientId);
    this.setItems(this.getStorageKey('treatments'), treatments);
  }

  // Dermascopy images
  getDermascopyImages(): DermascopyImage[] {
    return this.getItems<DermascopyImage>(this.getStorageKey('images'));
  }

  saveDermascopyImage(image: DermascopyImage): void {
    const images = this.getDermascopyImages();
    const existingIndex = images.findIndex(i => i.id === image.id);
    
    if (existingIndex >= 0) {
      images[existingIndex] = image;
    } else {
      images.push({ ...image, timestamp: new Date().toISOString() });
    }
    
    this.setItems(this.getStorageKey('images'), images);
  }

  getImagesByPatient(patientId: string): DermascopyImage[] {
    return this.getDermascopyImages().filter(i => i.patientId === patientId);
  }

  getImagesByScalpArea(patientId: string, scalpArea: string): DermascopyImage[] {
    return this.getDermascopyImages().filter(i => 
      i.patientId === patientId && i.scalpArea === scalpArea
    );
  }

  deleteImagesByPatient(patientId: string): void {
    const images = this.getDermascopyImages().filter(i => i.patientId !== patientId);
    this.setItems(this.getStorageKey('images'), images);
  }

  // Appointments
  getAppointments(): Appointment[] {
    return this.getItems<Appointment>(this.getStorageKey('appointments'));
  }

  saveAppointment(appointment: Appointment): void {
    const appointments = this.getAppointments();
    const existingIndex = appointments.findIndex(a => a.id === appointment.id);
    
    if (existingIndex >= 0) {
      appointments[existingIndex] = appointment;
    } else {
      appointments.push({ ...appointment, createdAt: new Date().toISOString() });
    }
    
    this.setItems(this.getStorageKey('appointments'), appointments);
  }

  getAppointmentsByPatient(patientId: string): Appointment[] {
    return this.getAppointments().filter(a => a.patientId === patientId);
  }

  deleteAppointmentsByPatient(patientId: string): void {
    const appointments = this.getAppointments().filter(a => a.patientId !== patientId);
    this.setItems(this.getStorageKey('appointments'), appointments);
  }

  // Image file handling
  saveImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imageData = e.target?.result as string;
          const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem(`hair-clinic-image-${imageId}`, imageData);
          resolve(imageId);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  getImageFile(imageId: string): string | null {
    return localStorage.getItem(`hair-clinic-image-${imageId}`);
  }

  // Export/Import functionality
  exportData(): string {
    const data = {
      patients: this.getPatients(),
      treatments: this.getTreatmentRecords(),
      images: this.getDermascopyImages(),
      appointments: this.getAppointments(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.patients) this.setItems(this.getStorageKey('patients'), data.patients);
      if (data.treatments) this.setItems(this.getStorageKey('treatments'), data.treatments);
      if (data.images) this.setItems(this.getStorageKey('images'), data.images);
      if (data.appointments) this.setItems(this.getStorageKey('appointments'), data.appointments);
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

export const storage = new LocalStorageManager();