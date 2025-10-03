import express from 'express';
import cors from 'cors';
import pg from 'pg';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection with retry logic
const dbConfig = {
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hair_clinic',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  // Add connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Database connection retry function
async function connectWithRetry(maxRetries = 10, delay = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempting to connect to database (attempt ${i + 1}/${maxRetries})...`);
      const client = await pool.connect();
      console.log('✓ Successfully connected to PostgreSQL database');
      client.release();
      return true;
    } catch (error) {
      console.error(`✗ Database connection failed (attempt ${i + 1}/${maxRetries}):`, error.message);
      if (i < maxRetries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error('Failed to connect to database after multiple attempts');
      }
    }
  }
}

// Initialize database
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Starting database initialization...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id VARCHAR(255) PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        date_of_birth DATE,
        gender VARCHAR(20),
        address JSONB,
        emergency_contact JSONB,
        medical_history TEXT,
        allergies TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS treatments (
        id VARCHAR(255) PRIMARY KEY,
        patient_id VARCHAR(255) REFERENCES patients(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        treatment_type VARCHAR(255),
        notes TEXT,
        next_appointment DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS dermascopy_images (
        id VARCHAR(255) PRIMARY KEY,
        patient_id VARCHAR(255) REFERENCES patients(id) ON DELETE CASCADE,
        treatment_id VARCHAR(255),
        scalp_area VARCHAR(50),
        image_url TEXT,
        file_name VARCHAR(255),
        notes TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        magnification VARCHAR(50),
        quality VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(255) PRIMARY KEY,
        patient_id VARCHAR(255) REFERENCES patients(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time VARCHAR(20),
        type VARCHAR(50),
        status VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✓ Database tables initialized successfully');
    
    // Log table counts
    const patientCount = await client.query('SELECT COUNT(*) FROM patients');
    const treatmentCount = await client.query('SELECT COUNT(*) FROM treatments');
    console.log(`Current records - Patients: ${patientCount.rows[0].count}, Treatments: ${treatmentCount.rows[0].count}`);
    
  } catch (error) {
    console.error('✗ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Patient endpoints
app.get('/api/patients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
    console.log(`Retrieved ${result.rows.length} patients`);
    res.json(result.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      address: row.address,
      emergencyContact: row.emergency_contact,
      medicalHistory: row.medical_history,
      allergies: row.allergies,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })));
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const patient = req.body;
    console.log('Attempting to save patient:', patient.firstName, patient.lastName);
    
    const result = await pool.query(
      `INSERT INTO patients (id, first_name, last_name, email, phone, date_of_birth, gender, address, emergency_contact, medical_history, allergies, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO UPDATE SET
       first_name = $2, last_name = $3, email = $4, phone = $5, date_of_birth = $6,
       gender = $7, address = $8, emergency_contact = $9, medical_history = $10, allergies = $11, notes = $12, updated_at = $14
       RETURNING *`,
      [patient.id, patient.firstName, patient.lastName, patient.email, patient.phone,
       patient.dateOfBirth, patient.gender, JSON.stringify(patient.address),
       JSON.stringify(patient.emergencyContact), patient.medicalHistory,
       patient.allergies, patient.notes, patient.createdAt, patient.updatedAt]
    );
    
    console.log('✓ Patient saved successfully:', result.rows[0].id);
    res.json({ success: true, patient: result.rows[0] });
  } catch (error) {
    console.error('✗ Error saving patient:', error);
    res.status(500).json({ error: error.message, details: error.stack });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const patient = req.body;
    console.log('Updating patient:', req.params.id);
    
    const result = await pool.query(
      `UPDATE patients SET
       first_name = $1, last_name = $2, email = $3, phone = $4, date_of_birth = $5,
       gender = $6, medical_history = $7, allergies = $8, notes = $9, updated_at = $10
       WHERE id = $11
       RETURNING *`,
      [patient.firstName, patient.lastName, patient.email, patient.phone,
       patient.dateOfBirth, patient.gender, patient.medicalHistory,
       patient.allergies, patient.notes, patient.updatedAt, req.params.id]
    );
    
    console.log('✓ Patient updated successfully');
    res.json({ success: true, patient: result.rows[0] });
  } catch (error) {
    console.error('✗ Error updating patient:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    console.log('Deleting patient:', req.params.id);
    await pool.query('DELETE FROM patients WHERE id = $1', [req.params.id]);
    console.log('✓ Patient deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('✗ Error deleting patient:', error);
    res.status(500).json({ error: error.message });
  }
});

// Treatment endpoints
app.get('/api/treatments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM treatments ORDER BY date DESC');
    const treatments = await Promise.all(result.rows.map(async (row) => {
      const images = await pool.query(
        'SELECT * FROM dermascopy_images WHERE treatment_id = $1',
        [row.id]
      );
      return {
        id: row.id,
        patientId: row.patient_id,
        date: row.date,
        treatmentType: row.treatment_type,
        notes: row.notes,
        nextAppointment: row.next_appointment,
        createdAt: row.created_at,
        images: images.rows.map(img => ({
          id: img.id,
          patientId: img.patient_id,
          treatmentId: img.treatment_id,
          scalpArea: img.scalp_area,
          imageUrl: img.image_url,
          fileName: img.file_name,
          notes: img.notes,
          timestamp: img.timestamp,
          magnification: img.magnification,
          quality: img.quality
        }))
      };
    }));
    console.log(`Retrieved ${treatments.length} treatments`);
    res.json(treatments);
  } catch (error) {
    console.error('Error fetching treatments:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/treatments', async (req, res) => {
  try {
    const treatment = req.body;
    console.log('Saving treatment for patient:', treatment.patientId);
    
    await pool.query(
      `INSERT INTO treatments (id, patient_id, date, treatment_type, notes, next_appointment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
       patient_id = $2, date = $3, treatment_type = $4, notes = $5, next_appointment = $6`,
      [treatment.id, treatment.patientId, treatment.date, treatment.treatmentType,
       treatment.description, treatment.nextAppointment, treatment.createdAt]
    );
    
    console.log('✓ Treatment saved successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('✗ Error saving treatment:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/treatments/:id', async (req, res) => {
  try {
    console.log('Deleting treatment:', req.params.id);
    await pool.query('DELETE FROM treatments WHERE id = $1', [req.params.id]);
    console.log('✓ Treatment deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('✗ Error deleting treatment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dermascopy images endpoints
app.get('/api/images', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dermascopy_images ORDER BY timestamp DESC');
    res.json(result.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      treatmentId: row.treatment_id,
      scalpArea: row.scalp_area,
      images: typeof row.image_url === 'string' ? JSON.parse(row.image_url) : row.image_url,
      imageUrl: row.image_url, // Keep for backward compatibility
      fileName: row.file_name,
      notes: row.notes,
      date: row.timestamp,
      timestamp: row.timestamp,
      magnification: row.magnification,
      quality: row.quality
    })));
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/images', async (req, res) => {
  try {
    const image = req.body;
    console.log('Saving dermascopy image for patient:', image.patientId);
    
    // Store images as JSON array
    await pool.query(
      `INSERT INTO dermascopy_images (id, patient_id, treatment_id, scalp_area, image_url, file_name, notes, timestamp, magnification, quality)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
       patient_id = $2, treatment_id = $3, scalp_area = $4, image_url = $5, file_name = $6, notes = $7, magnification = $9, quality = $10`,
      [image.id, image.patientId, image.treatmentId, image.scalpArea, 
       JSON.stringify(image.images || [image.imageUrl]), // Store as JSON array
       image.fileName, image.notes, image.timestamp || image.date, image.magnification, image.quality]
    );
    
    console.log('✓ Image saved successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('✗ Error saving image:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/images/:id', async (req, res) => {
  try {
    console.log('Deleting image:', req.params.id);
    await pool.query('DELETE FROM dermascopy_images WHERE id = $1', [req.params.id]);
    console.log('✓ Image deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('✗ Error deleting image:', error);
    res.status(500).json({ error: error.message });
  }
});

// Image file upload
app.post('/api/upload-image', async (req, res) => {
  try {
    const { imageData } = req.body;
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uploadsDir = join(__dirname, 'uploads');

    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(join(uploadsDir, imageId), imageData);

    console.log('✓ Image uploaded:', imageId);
    res.json({ imageId });
  } catch (error) {
    console.error('✗ Error uploading image:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/image/:id', async (req, res) => {
  try {
    const imageData = await fs.readFile(join(__dirname, 'uploads', req.params.id), 'utf8');
    res.send(imageData);
  } catch (error) {
    console.error('Error reading image:', error);
    res.status(404).json({ error: 'Image not found' });
  }
});

// Appointments endpoints
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appointments ORDER BY date DESC, time DESC');
    res.json(result.rows.map(row => ({
      id: row.id,
      patientId: row.patient_id,
      date: row.date,
      time: row.time,
      type: row.type,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at
    })));
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const appointment = req.body;
    console.log('Saving appointment for patient:', appointment.patientId);
    
    await pool.query(
      `INSERT INTO appointments (id, patient_id, date, time, type, status, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
       patient_id = $2, date = $3, time = $4, type = $5, status = $6, notes = $7`,
      [appointment.id, appointment.patientId, appointment.date, appointment.time,
       appointment.type, appointment.status, appointment.notes, appointment.createdAt]
    );
    
    console.log('✓ Appointment saved successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('✗ Error saving appointment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export/Import
app.get('/api/export', async (req, res) => {
  try {
    const patients = await pool.query('SELECT * FROM patients');
    const treatments = await pool.query('SELECT * FROM treatments');
    const images = await pool.query('SELECT * FROM dermascopy_images');
    const appointments = await pool.query('SELECT * FROM appointments');

    res.json({
      patients: patients.rows,
      treatments: treatments.rows,
      images: images.rows,
      appointments: appointments.rows,
      exportDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// Start server with proper error handling
async function startServer() {
  try {
    console.log('========================================');
    console.log('Hair Clinic Backend Starting...');
    console.log('========================================');
    console.log('Database configuration:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user
    });
    
    // Wait for database connection
    await connectWithRetry();
    
    // Initialize database tables
    await initializeDatabase();
    
    // Start Express server
    app.listen(PORT, '0.0.0.0', () => {
      console.log('========================================');
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('========================================');
    console.error('✗ Failed to start server:', error);
    console.error('========================================');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

startServer();
