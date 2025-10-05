// API configuration
const API_BASE_URL = '/api'; // Proxied through nginx

export const api = {
  // Patient endpoints
  patients: {
    getAll: () => fetch(`${API_BASE_URL}/patients`).then(r => r.json()),
    create: (patient: any) => fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient)
    }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'DELETE'
    }).then(r => r.json()),
  },
  
  // Treatment endpoints
  treatments: {
    getAll: () => fetch(`${API_BASE_URL}/treatments`).then(r => r.json()),
    create: (treatment: any) => fetch(`${API_BASE_URL}/treatments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(treatment)
    }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE_URL}/treatments/${id}`, {
      method: 'DELETE'
    }).then(r => r.json()),
  },
  
  // Image endpoints
  images: {
    getAll: () => fetch(`${API_BASE_URL}/images`).then(r => r.json()),
    create: (image: any) => fetch(`${API_BASE_URL}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(image)
    }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE_URL}/images/${id}`, {
      method: 'DELETE'
    }).then(r => r.json()),
    upload: (imageData: string) => fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData })
    }).then(r => r.json()),
  },
  
  // Appointment endpoints
  appointments: {
    getAll: () => fetch(`${API_BASE_URL}/appointments`).then(r => r.json()),
    create: (appointment: any) => fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment)
    }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE'
    }).then(r => r.json()),
  },
  
  // Export/Import
  export: () => fetch(`${API_BASE_URL}/export`).then(r => r.json()),
  
  // Health check
  health: () => fetch(`${API_BASE_URL}/health`).then(r => r.json()),
};
