# Hair Clinic CRM - Deployment Guide

## 📁 Complete Directory Structure

```
hair-clinic-crm/
├── frontend/                    # React frontend (your current Lovable project)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   └── AppSidebar.tsx
│   │   │   └── ui/              # shadcn components
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Patients.tsx
│   │   │   ├── Appointments.tsx
│   │   │   ├── Dermascopy.tsx
│   │   │   ├── Treatments.tsx
│   │   │   └── Settings.tsx
│   │   ├── lib/
│   │   │   ├── api.ts           # API client
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── backend/                     # Node.js/Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # PostgreSQL connection
│   │   ├── controllers/
│   │   │   ├── patientController.js
│   │   │   ├── appointmentController.js
│   │   │   ├── dermascopyController.js
│   │   │   └── treatmentController.js
│   │   ├── models/
│   │   │   ├── Patient.js
│   │   │   ├── Appointment.js
│   │   │   ├── Dermascopy.js
│   │   │   └── Treatment.js
│   │   ├── routes/
│   │   │   ├── patients.js
│   │   │   ├── appointments.js
│   │   │   ├── dermascopy.js
│   │   │   └── treatments.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   └── server.js
│   ├── package.json
│   └── Dockerfile
│
├── database/
│   └── init.sql                 # Database schema
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🐳 Docker Setup Files

### 1. docker-compose.yml
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: hair_clinic_db
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-hair_clinic}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - hair_clinic_network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: hair_clinic_api
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-postgres}
      DB_NAME: ${DB_NAME:-hair_clinic}
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - hair_clinic_network

  # Frontend (React/Vite)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://localhost:3001/api
    container_name: hair_clinic_frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - hair_clinic_network

volumes:
  postgres_data:

networks:
  hair_clinic_network:
    driver: bridge
```

### 2. .env.example
```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=hair_clinic
DB_HOST=postgres
DB_PORT=5432

# API Configuration
PORT=3001
NODE_ENV=production

# Frontend Configuration
VITE_API_URL=http://localhost:3001/api
```

## 🗄️ Database Schema

### database/init.sql
```sql
-- Create tables for Hair Clinic CRM

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    medical_history TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP NOT NULL,
    appointment_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'Scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dermascopy Analyses Table
CREATE TABLE IF NOT EXISTS dermascopy_analyses (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    image_url TEXT,
    result VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Treatments Table
CREATE TABLE IF NOT EXISTS treatments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    treatment_type VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Ongoing',
    dosage TEXT,
    frequency TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_dermascopy_patient_id ON dermascopy_analyses(patient_id);
CREATE INDEX idx_treatments_patient_id ON treatments(patient_id);
CREATE INDEX idx_treatments_status ON treatments(status);

-- Insert sample data
INSERT INTO patients (first_name, last_name, email, phone, date_of_birth, gender, status) VALUES
('John', 'Doe', 'john.doe@example.com', '+1234567890', '1989-05-15', 'Male', 'Active'),
('Jane', 'Smith', 'jane.smith@example.com', '+1234567891', '1982-08-22', 'Female', 'Active'),
('Bob', 'Johnson', 'bob.johnson@example.com', '+1234567892', '1996-03-10', 'Male', 'Pending');

INSERT INTO appointments (patient_id, appointment_date, appointment_type, status) VALUES
(1, '2024-02-15 09:00:00', 'Consultation', 'Scheduled'),
(2, '2024-02-15 10:30:00', 'Follow-up', 'Scheduled'),
(3, '2024-02-15 14:00:00', 'Treatment', 'Scheduled');

INSERT INTO dermascopy_analyses (patient_id, analysis_date, analysis_type, result) VALUES
(1, '2024-01-15', 'Scalp Analysis', 'Normal'),
(2, '2024-01-20', 'Hair Density', 'Thinning'),
(3, '2024-01-25', 'Follicle Health', 'Good');

INSERT INTO treatments (patient_id, treatment_type, start_date, status) VALUES
(1, 'Hair Transplant', '2024-01-15', 'Ongoing'),
(2, 'PRP Therapy', '2024-01-10', 'Completed'),
(3, 'Medication', '2024-01-20', 'Ongoing');
```

## 🔧 Backend API Files

### backend/Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
```

### backend/package.json
```json
{
  "name": "hair-clinic-api",
  "version": "1.0.0",
  "description": "Hair Clinic CRM Backend API",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### backend/src/server.js
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const dermascopyRoutes = require('./routes/dermascopy');
const treatmentRoutes = require('./routes/treatments');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/dermascopy', dermascopyRoutes);
app.use('/api/treatments', treatmentRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
});
```

### backend/src/config/database.js
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hair_clinic',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

module.exports = pool;
```

### backend/src/routes/patients.js
```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all patients
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM patients ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get patient by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Create new patient
router.post('/', async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      medical_history,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO patients 
       (first_name, last_name, email, phone, date_of_birth, gender, address, medical_history)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [first_name, last_name, email, phone, date_of_birth, gender, address, medical_history]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update patient
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      medical_history,
      status,
    } = req.body;

    const result = await pool.query(
      `UPDATE patients 
       SET first_name = $1, last_name = $2, email = $3, phone = $4,
           date_of_birth = $5, gender = $6, address = $7, medical_history = $8,
           status = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [first_name, last_name, email, phone, date_of_birth, gender, address, medical_history, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete patient
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### backend/src/routes/appointments.js
```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all appointments
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT a.*, 
             p.first_name, p.last_name, p.phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      ORDER BY a.appointment_date DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Create new appointment
router.post('/', async (req, res, next) => {
  try {
    const { patient_id, appointment_date, appointment_type, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO appointments (patient_id, appointment_date, appointment_type, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [patient_id, appointment_date, appointment_type, notes]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update appointment
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_type, status, notes } = req.body;

    const result = await pool.query(
      `UPDATE appointments 
       SET appointment_date = $1, appointment_type = $2, status = $3, notes = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [appointment_date, appointment_type, status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### backend/src/routes/dermascopy.js
```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all dermascopy analyses
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT d.*, 
             p.first_name, p.last_name
      FROM dermascopy_analyses d
      JOIN patients p ON d.patient_id = p.id
      ORDER BY d.analysis_date DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Create new dermascopy analysis
router.post('/', async (req, res, next) => {
  try {
    const { patient_id, analysis_date, analysis_type, image_url, result, notes } = req.body;

    const queryResult = await pool.query(
      `INSERT INTO dermascopy_analyses 
       (patient_id, analysis_date, analysis_type, image_url, result, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [patient_id, analysis_date, analysis_type, image_url, result, notes]
    );

    res.status(201).json({ success: true, data: queryResult.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### backend/src/routes/treatments.js
```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all treatments
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
             p.first_name, p.last_name
      FROM treatments t
      JOIN patients p ON t.patient_id = p.id
      ORDER BY t.start_date DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Create new treatment
router.post('/', async (req, res, next) => {
  try {
    const {
      patient_id,
      treatment_type,
      start_date,
      end_date,
      status,
      dosage,
      frequency,
      notes,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO treatments 
       (patient_id, treatment_type, start_date, end_date, status, dosage, frequency, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [patient_id, treatment_type, start_date, end_date, status, dosage, frequency, notes]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### backend/src/middleware/errorHandler.js
```javascript
module.exports = (err, req, res, next) => {
  console.error('❌ Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: {
      message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
```

## 🎨 Frontend Dockerfile

### frontend/Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

## 🔌 Frontend API Client

### frontend/src/lib/api.ts
```typescript
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
```

## 🚀 Implementation Steps

### Step 1: Prepare Your Local Environment

```bash
# Clone your GitHub repository
git clone https://github.com/toufikj/hair-analysis-1.git
cd hair-analysis-1

# Switch to a new branch for the Docker setup
git checkout -b docker-postgres-setup
```

### Step 2: Create Directory Structure

```bash
# Create backend directory
mkdir -p backend/src/{config,controllers,models,routes,middleware}

# Create database directory
mkdir -p database

# Create frontend directory (if not exists)
mkdir -p frontend
```

### Step 3: Copy Frontend Files

```bash
# Copy all your current Lovable project files to frontend/
# Or use the improved UI files I created above
```

### Step 4: Create All Backend Files

Create each backend file listed above in the appropriate directory.

### Step 5: Create Docker Files

1. Create `docker-compose.yml` in the root
2. Create `backend/Dockerfile`
3. Create `frontend/Dockerfile`
4. Create `database/init.sql`
5. Create `.env` file from `.env.example`

### Step 6: Start the Application

```bash
# Build and start all containers
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### Step 7: Verify Installation

```bash
# Check if all containers are running
docker-compose ps

# Check logs
docker-compose logs -f

# Test API
curl http://localhost:3001/health

# Access frontend
open http://localhost:5173
```

### Step 8: Stop and Clean Up

```bash
# Stop containers
docker-compose down

# Remove volumes (warning: deletes database data)
docker-compose down -v
```

## 📊 Resource Usage Optimization

This setup is optimized for minimal resource usage:

- **Alpine-based images**: Smaller footprint (Node 18 Alpine ~40MB vs standard ~900MB)
- **Production builds**: Only production dependencies installed
- **Single database instance**: PostgreSQL handles all data efficiently
- **No nginx**: Direct container access reduces overhead
- **Health checks**: Ensures containers start in correct order
- **Connection pooling**: Efficient database connections

Expected resource usage:
- **PostgreSQL**: ~50-100MB RAM
- **Backend API**: ~50-80MB RAM
- **Frontend**: ~50-100MB RAM during development

**Total**: ~200-300MB RAM under normal load

## 🔒 Security Recommendations

1. **Change default passwords** in `.env`
2. **Use secrets management** for production
3. **Enable SSL/TLS** for production deployment
4. **Implement rate limiting** on API endpoints
5. **Add authentication/authorization** middleware
6. **Regular backups** of PostgreSQL data
7. **Keep dependencies updated**

## 🛠️ Development vs Production

### Development Mode
```bash
# Use this for local development
docker-compose up
```

### Production Mode
```bash
# Build optimized production images
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 Additional Notes

- Database data persists in Docker volumes
- Frontend hot-reload enabled in development
- API automatically restarts on crashes
- Health checks ensure proper startup order
- All services on isolated network for security

## 🤝 Support

For issues or questions:
1. Check container logs: `docker-compose logs [service-name]`
2. Verify `.env` configuration
3. Ensure ports 5173, 3001, and 5432 are available
4. Check database connection in Settings page

---

**Made with ❤️ for Hair Clinic CRM**

