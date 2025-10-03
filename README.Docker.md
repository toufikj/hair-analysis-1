# Hair Clinic CRM - Docker Setup

## Prerequisites
- Docker (version 20.10+)
- Docker Compose (version 2.0+)

## Quick Start

### 1. Build and start all services:
```bash
docker-compose up -d --build
```

### 2. Monitor the logs:
```bash
docker-compose logs -f
```

### 3. Access the application:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **Backend Health**: http://localhost:3001/health
- **PostgreSQL**: localhost:5432

## Architecture

### Services

#### Frontend (React + Vite + Nginx)
- **Container**: `hair_clinic_frontend`
- **Port**: 80
- **Technology**: React, TypeScript, Tailwind CSS
- **Web Server**: Nginx (Alpine)
- **Features**: 
  - Static file serving
  - API proxy to backend
  - Optimized production build

#### Backend (Node.js + Express)
- **Container**: `hair_clinic_backend`
- **Port**: 3001
- **Technology**: Node.js 20, Express, PostgreSQL driver
- **Features**:
  - REST API
  - Database connection with retry logic
  - File upload handling
  - Health check endpoint
  - Comprehensive logging

#### Database (PostgreSQL)
- **Container**: `hair_clinic_db`
- **Port**: 5432
- **Version**: PostgreSQL 15 (Alpine)
- **Database**: `hair_clinic`
- **User**: `postgres`
- **Password**: `postgres` (⚠️ **change in production!**)

## Database Schema

### Tables:
1. **patients**: Patient demographic and medical information
2. **treatments**: Treatment records and notes
3. **dermascopy_images**: Scalp images and analysis data
4. **appointments**: Appointment scheduling

## Docker Commands

### Start services (detached mode):
```bash
docker-compose up -d
```

### Start services with build:
```bash
docker-compose up -d --build
```

### Stop services:
```bash
docker-compose down
```

### Stop services and remove volumes (⚠️ deletes all data):
```bash
docker-compose down -v
```

### View logs (all services):
```bash
docker-compose logs -f
```

### View logs (specific service):
```bash
docker-compose logs -f backend
docker-compose logs -f db
docker-compose logs -f frontend
```

### Check service status:
```bash
docker-compose ps
```

### Restart a service:
```bash
docker-compose restart backend
```

### Rebuild after code changes:
```bash
docker-compose up -d --build backend
```

### Execute commands in container:
```bash
# Access PostgreSQL CLI
docker-compose exec db psql -U postgres -d hair_clinic

# Access backend container shell
docker-compose exec backend sh

# Access frontend container shell
docker-compose exec frontend sh
```

## Troubleshooting

### Issue: Patient data not saving

**Symptoms**: Frontend shows success but data doesn't persist

**Solution**:
1. Check backend logs:
   ```bash
   docker-compose logs backend | grep -i error
   ```

2. Verify database connectivity:
   ```bash
   curl http://localhost:3001/health
   ```

3. Check PostgreSQL logs:
   ```bash
   docker-compose logs db
   ```

4. Verify database has data:
   ```bash
   docker-compose exec db psql -U postgres -d hair_clinic -c "SELECT COUNT(*) FROM patients;"
   ```

### Issue: Backend can't connect to database

**Symptoms**: Backend shows "database connection failed" errors

**Solution**:
1. Ensure database is healthy:
   ```bash
   docker-compose ps
   ```
   Look for "healthy" status on db service

2. Check database logs:
   ```bash
   docker-compose logs db
   ```

3. Restart services in order:
   ```bash
   docker-compose restart db
   sleep 10
   docker-compose restart backend
   ```

### Issue: Port already in use

**Symptoms**: "bind: address already in use"

**Solution**:
1. Check what's using the port:
   ```bash
   # Linux/Mac
   lsof -i :80
   lsof -i :3001
   lsof -i :5432
   
   # Windows
   netstat -ano | findstr :80
   netstat -ano | findstr :3001
   netstat -ano | findstr :5432
   ```

2. Either stop the conflicting service or change the port in `docker-compose.yml`

### Issue: Database data lost after restart

**Symptoms**: All patients/data disappear after `docker-compose down`

**Solution**:
- Use `docker-compose down` (without `-v` flag) to preserve volumes
- The `-v` flag removes volumes and **deletes all data**

### Issue: Frontend shows "Network Error" or "API not found"

**Solution**:
1. Check if backend is running:
   ```bash
   curl http://localhost:3001/health
   ```

2. Check nginx proxy configuration:
   ```bash
   docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
   ```

3. Verify frontend can reach backend:
   ```bash
   docker-compose exec frontend wget -O- http://backend:3001/health
   ```

## Data Persistence

### Volumes:
- **postgres_data**: Database files (persistent)
- **./backend/uploads**: Uploaded images (bind mount)

### Backup Database:
```bash
# Create backup
docker-compose exec db pg_dump -U postgres hair_clinic > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker-compose exec -T db psql -U postgres -d hair_clinic < backup_20250101_120000.sql
```

### Export Application Data:
```bash
curl http://localhost:3001/api/export > data_export.json
```

## Development Workflow

### Local Development (without Docker):

1. **Start only PostgreSQL with Docker**:
   ```bash
   docker-compose up -d db
   ```

2. **Backend development**:
   ```bash
   cd backend
   npm install
   export DB_HOST=localhost
   npm run dev
   ```

3. **Frontend development**:
   ```bash
   npm install
   export VITE_API_URL=http://localhost:3001/api
   npm run dev
   ```

### Making Code Changes:

**Frontend changes**:
```bash
# Rebuild frontend only
docker-compose up -d --build frontend
```

**Backend changes**:
```bash
# Rebuild backend only
docker-compose up -d --build backend
```

**Database schema changes**:
```bash
# Reset database (⚠️ deletes all data)
docker-compose down -v
docker-compose up -d
```

## Production Deployment

### Security Checklist:
- [ ] Change PostgreSQL password
- [ ] Use environment variables file (`.env`)
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Set up proper firewall rules
- [ ] Configure backup automation
- [ ] Set up monitoring and logging
- [ ] Limit database access
- [ ] Use secrets management
- [ ] Enable container security scanning

### Example Production `.env`:
```env
# Database
POSTGRES_DB=hair_clinic
POSTGRES_USER=hair_clinic_user
POSTGRES_PASSWORD=<strong-random-password>

# Backend
DB_HOST=db
DB_PORT=5432
DB_NAME=hair_clinic
DB_USER=hair_clinic_user
DB_PASSWORD=<strong-random-password>
PORT=3001
NODE_ENV=production
```

### Using `.env` file:
```bash
docker-compose --env-file .env up -d
```

## Performance Tuning

### PostgreSQL Configuration:
Edit `docker-compose.yml` to add PostgreSQL tuning:
```yaml
environment:
  POSTGRES_SHARED_BUFFERS: "256MB"
  POSTGRES_EFFECTIVE_CACHE_SIZE: "1GB"
  POSTGRES_MAX_CONNECTIONS: "100"
```

### Backend Connection Pool:
Already configured in `server.js`:
- Max connections: 20
- Idle timeout: 30s
- Connection timeout: 10s

## Monitoring

### Check Service Health:
```bash
# All services status
docker-compose ps

# Backend health endpoint
curl http://localhost:3001/health

# Database connection test
docker-compose exec db pg_isready -U postgres
```

### View Resource Usage:
```bash
docker stats
```

## Network

All services are connected via `hair_clinic_network` bridge network, allowing:
- Service-to-service communication using container names
- Isolated network environment
- DNS resolution between containers

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify health checks: `docker-compose ps`
3. Test endpoints: `curl http://localhost:3001/health`
4. Review this troubleshooting guide

## Version Information

- Docker: 20.10+
- Docker Compose: 2.0+
- Node.js: 20 (Alpine)
- PostgreSQL: 15 (Alpine)
- Nginx: Alpine (latest)
