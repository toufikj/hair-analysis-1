# Quick Start Guide

## 🚀 Get Your Hair Clinic CRM Running in 5 Minutes

### Prerequisites
- Docker & Docker Compose installed
- Git installed
- Ports 5173, 3001, 5432 available

### Step 1: Clone & Setup (2 min)

```bash
# Clone your repository
git clone https://github.com/toufikj/hair-analysis-1.git
cd hair-analysis-1

# Create directory structure
mkdir -p backend/src/{config,routes,middleware} database

# Copy .env file
cp .env.example .env

# Edit .env and set your database password
nano .env  # or use your preferred editor
```

### Step 2: Create Required Files (1 min)

Copy all files from `DEPLOYMENT_GUIDE.md` to their respective locations:
- Root: `docker-compose.yml`, `.env`
- `database/`: `init.sql`
- `backend/`: All backend files
- `frontend/`: Your React app (already exists from Lovable)

### Step 3: Launch! (2 min)

```bash
# Build and start everything
docker-compose up --build

# Wait for all services to be ready
# You'll see: "Server running on port 3001"
```

### Step 4: Access Your App

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health
- **Database**: localhost:5432

### Testing the Setup

```bash
# Test API connection
curl http://localhost:3001/health

# Test database query
curl http://localhost:3001/api/patients

# Check container status
docker-compose ps
```

### Common Commands

```bash
# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Restart a service
docker-compose restart backend

# Access database
docker-compose exec postgres psql -U postgres -d hair_clinic
```

### Troubleshooting

**Port already in use?**
```bash
# Check what's using the port
lsof -i :5173  # or :3001, :5432

# Kill the process or change port in docker-compose.yml
```

**Database connection failed?**
```bash
# Check if PostgreSQL is ready
docker-compose logs postgres

# Verify .env settings match docker-compose.yml
```

**Frontend can't reach API?**
```bash
# Check VITE_API_URL in .env
# Should be: http://localhost:3001/api

# Restart frontend after changing .env
docker-compose restart frontend
```

### Next Steps

1. ✅ Customize database schema in `database/init.sql`
2. ✅ Add authentication middleware
3. ✅ Configure file upload for dermascopy images
4. ✅ Set up automated backups
5. ✅ Deploy to production server

---

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.

