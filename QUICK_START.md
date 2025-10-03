# Quick Start Guide - Hair Clinic Application

## Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)

## 🚀 Start the Application

### Option 1: Using the startup script (Recommended)

```bash
# Make scripts executable (first time only)
chmod +x start.sh stop.sh logs.sh test-connection.sh

# Start everything
./start.sh
```

The script will:
- ✓ Check Docker is running
- ✓ Build all services
- ✓ Wait for database to be ready
- ✓ Wait for backend to be ready
- ✓ Wait for frontend to be ready
- ✓ Display access URLs

### Option 2: Manual start

```bash
# Build and start
docker-compose up -d --build

# Wait 20-30 seconds for services to initialize

# Check status
docker-compose ps
```

## 📱 Access the Application

Once started, access:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🧪 Test the Setup

Run the connection test:
```bash
./test-connection.sh
```

This will:
- Test frontend accessibility
- Test backend health
- Test API endpoints
- Show database statistics
- Optionally test saving patient data

## 📋 Common Tasks

### View Logs

```bash
# All services
./logs.sh

# Specific service
./logs.sh backend
./logs.sh db
./logs.sh frontend

# Or manually
docker-compose logs -f
```

### Stop the Application

```bash
# Using script (asks about keeping data)
./stop.sh

# Or manually (keeps data)
docker-compose down

# Or remove data (⚠️ DELETES EVERYTHING)
docker-compose down -v
```

### Restart a Service

```bash
# Restart backend
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend
```

## 🔍 Verify Everything is Working

### 1. Check service status:
```bash
docker-compose ps
```

All services should show "Up" and "healthy".

### 2. Test backend health:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","database":"connected"}
```

### 3. Test frontend:
```bash
curl -I http://localhost
```

Should return `200 OK` or `304 Not Modified`.

### 4. Check database:
```bash
docker-compose exec db psql -U postgres -d hair_clinic -c "SELECT version();"
```

Should display PostgreSQL version.

## ⚠️ Troubleshooting

If something isn't working:

1. **Run the test script**:
   ```bash
   ./test-connection.sh
   ```

2. **Check logs for errors**:
   ```bash
   docker-compose logs backend | grep -i error
   docker-compose logs db | grep -i error
   ```

3. **Verify ports aren't in use**:
   ```bash
   lsof -i :80    # Frontend
   lsof -i :3001  # Backend
   lsof -i :5432  # Database
   ```

4. **Complete restart**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   sleep 30
   ./test-connection.sh
   ```

5. **Read detailed troubleshooting**:
   ```
   See TROUBLESHOOTING.md for specific issues and solutions
   ```

## 📊 Using the Application

### Add a Patient

1. Open http://localhost
2. Navigate to Patients section
3. Click "Add Patient"
4. Fill in patient details
5. Click "Save"

### Verify Patient was Saved

Option 1: Check in UI (refresh page)

Option 2: Via API
```bash
curl http://localhost:3001/api/patients
```

Option 3: Via Database
```bash
docker-compose exec db psql -U postgres -d hair_clinic -c "SELECT * FROM patients;"
```

## 🗄️ Database Access

### Using psql CLI:
```bash
docker-compose exec db psql -U postgres -d hair_clinic
```

Common queries:
```sql
-- List all tables
\dt

-- Count patients
SELECT COUNT(*) FROM patients;

-- View all patients
SELECT id, first_name, last_name, email FROM patients;

-- View recent patients
SELECT first_name, last_name, created_at 
FROM patients 
ORDER BY created_at DESC 
LIMIT 10;

-- Exit psql
\q
```

## 💾 Backup & Restore

### Backup Database:
```bash
# Via pg_dump
docker-compose exec db pg_dump -U postgres hair_clinic > backup_$(date +%Y%m%d).sql

# Via API (JSON format)
curl http://localhost:3001/api/export > data_backup.json
```

### Restore Database:
```bash
# From pg_dump backup
docker-compose exec -T db psql -U postgres -d hair_clinic < backup_20251001.sql
```

## 🔧 Development Mode

### Frontend Development:
```bash
# Stop Docker frontend
docker-compose stop frontend

# Run locally with hot reload
npm install
npm run dev

# Access at http://localhost:5173
```

### Backend Development:
```bash
# Stop Docker backend
docker-compose stop backend

# Run locally
cd backend
npm install
export DB_HOST=localhost
npm run dev

# Access at http://localhost:3001
```

### Keep only Database running:
```bash
docker-compose up -d db
```

## 📚 Next Steps

- Read `README.Docker.md` for complete documentation
- Review `TROUBLESHOOTING.md` if you encounter issues
- Customize `docker-compose.yml` for production deployment
- Set up regular backups
- Configure monitoring

## 🎯 Quick Command Reference

```bash
# Start
./start.sh                    # or: docker-compose up -d

# Stop (keep data)
./stop.sh                     # or: docker-compose down

# View logs
./logs.sh                     # or: docker-compose logs -f

# Test connections
./test-connection.sh

# Rebuild after changes
docker-compose up -d --build

# Check status
docker-compose ps

# Restart service
docker-compose restart backend

# Access database
docker-compose exec db psql -U postgres -d hair_clinic

# Backup
docker-compose exec db pg_dump -U postgres hair_clinic > backup.sql

# Complete reset (⚠️ deletes data)
docker-compose down -v && docker-compose up -d --build
```

## 🆘 Getting Help

1. Run diagnostics: `./test-connection.sh`
2. Check logs: `./logs.sh backend`
3. Read troubleshooting: `TROUBLESHOOTING.md`
4. Verify health: `curl http://localhost:3001/health`

---

**Ready to go!** Start with `./start.sh` and open http://localhost 🎉
