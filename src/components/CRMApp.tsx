import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Dashboard } from './Dashboard';
import { PatientList } from './patients/PatientList';
import { PatientForm } from './patients/PatientForm';
import { AppointmentList } from './appointments/AppointmentList';
import { AppointmentForm } from './appointments/AppointmentForm';
import { DermascopyViewer } from './dermascopy/DermascopyViewer';
import { DermascopyForm } from './dermascopy/DermascopyForm';
import { TreatmentList } from './treatments/TreatmentList';
import { TreatmentForm } from './treatments/TreatmentForm';
import { SettingsPanel } from './settings/SettingsPanel';
import { Patient, Appointment, DermascopyImage, TreatmentRecord } from '@/types/patient';

export const CRMApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingImage, setEditingImage] = useState<DermascopyImage | null>(null);
  const [editingTreatment, setEditingTreatment] = useState<TreatmentRecord | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showImageForm, setShowImageForm] = useState(false);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedPatient(null);
    setEditingPatient(null);
    setShowPatientForm(false);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('patient-detail');
  };

  const handleAddPatient = () => {
    setEditingPatient(null);
    setShowPatientForm(true);
    setActiveTab('patient-form');
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setShowPatientForm(true);
    setActiveTab('patient-form');
  };

  const handleSavePatient = () => {
    setShowPatientForm(false);
    setEditingPatient(null);
    setActiveTab('patients');
  };

  const handleCancelPatientForm = () => {
    setShowPatientForm(false);
    setEditingPatient(null);
    setActiveTab('patients');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleTabChange} />;
      
      case 'patients':
        return (
          <PatientList
            onSelectPatient={handleSelectPatient}
            onAddPatient={handleAddPatient}
            onEditPatient={handleEditPatient}
          />
        );
      
      case 'patient-form':
        return (
          <PatientForm
            patient={editingPatient || undefined}
            onSave={handleSavePatient}
            onCancel={handleCancelPatientForm}
          />
        );
      
      case 'appointments':
        return showAppointmentForm ? (
          <AppointmentForm
            appointment={editingAppointment || undefined}
            onSave={() => { setShowAppointmentForm(false); setEditingAppointment(null); setActiveTab('appointments'); }}
            onCancel={() => { setShowAppointmentForm(false); setEditingAppointment(null); setActiveTab('appointments'); }}
          />
        ) : (
          <AppointmentList
            onAddAppointment={() => { setEditingAppointment(null); setShowAppointmentForm(true); }}
            onEditAppointment={(appointment) => { setEditingAppointment(appointment); setShowAppointmentForm(true); }}
          />
        );
      
      case 'dermascopy':
        return showImageForm ? (
          <DermascopyForm
            image={editingImage || undefined}
            onSave={() => { setShowImageForm(false); setEditingImage(null); setActiveTab('dermascopy'); }}
            onCancel={() => { setShowImageForm(false); setEditingImage(null); setActiveTab('dermascopy'); }}
          />
        ) : (
          <DermascopyViewer
            onAddImage={() => { setEditingImage(null); setShowImageForm(true); }}
          />
        );
      
      case 'treatments':
        return showTreatmentForm ? (
          <TreatmentForm
            treatment={editingTreatment || undefined}
            onSave={() => { setShowTreatmentForm(false); setEditingTreatment(null); setActiveTab('treatments'); }}
            onCancel={() => { setShowTreatmentForm(false); setEditingTreatment(null); setActiveTab('treatments'); }}
          />
        ) : (
          <TreatmentList
            onAddTreatment={() => { setEditingTreatment(null); setShowTreatmentForm(true); }}
            onEditTreatment={(treatment) => { setEditingTreatment(treatment); setShowTreatmentForm(true); }}
          />
        );
      
      case 'settings':
        return <SettingsPanel />;
      
      default:
        return <Dashboard onNavigate={handleTabChange} />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};