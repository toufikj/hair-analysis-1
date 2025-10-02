const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Patients
  async getPatients() {
    return this.request('/patients');
  }

  async getPatient(id: number) {
    return this.request(`/patients/${id}`);
  }

  async createPatient(data: any) {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePatient(id: number, data: any) {
    return this.request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePatient(id: number) {
    return this.request(`/patients/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointments
  async getAppointments() {
    return this.request('/appointments');
  }

  async createAppointment(data: any) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dermascopy
  async getDermascopyAnalyses() {
    return this.request('/dermascopy');
  }

  async createDermascopyAnalysis(data: any) {
    return this.request('/dermascopy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Treatments
  async getTreatments() {
    return this.request('/treatments');
  }

  async createTreatment(data: any) {
    return this.request('/treatments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
