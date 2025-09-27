export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentRecord {
  id: string;
  patientId: string;
  date: string;
  treatmentType: string;
  notes: string;
  images: DermascopyImage[];
  nextAppointment?: string;
  createdAt: string;
}

export interface DermascopyImage {
  id: string;
  patientId: string;
  treatmentId: string;
  scalpArea: 'crown' | 'temples' | 'frontal' | 'vertex' | 'occipital' | 'sides';
  imageUrl: string;
  fileName: string;
  notes: string;
  timestamp: string;
  magnification?: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  type: 'consultation' | 'followup' | 'treatment' | 'dermascopy';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: string;
}