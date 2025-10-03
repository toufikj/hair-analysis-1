#!/bin/bash

# Hair Clinic Connection Test Script
# Tests all connections and displays status

echo "=========================================="
echo "  Connection Test"
echo "=========================================="
echo ""

# Test Frontend
echo -n "Testing Frontend (http://localhost)... "
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    echo "✓ OK"
else
    echo "❌ FAILED"
fi

# Test Backend Health
echo -n "Testing Backend Health (http://localhost:3001/health)... "
response=$(curl -s http://localhost:3001/health 2>/dev/null)
if echo "$response" | grep -q '"status":"ok"'; then
    echo "✓ OK"
    echo "  Response: $response"
else
    echo "❌ FAILED"
    echo "  Response: $response"
fi

# Test Backend API
echo -n "Testing Backend Patients API (http://localhost:3001/api/patients)... "
if curl -s http://localhost:3001/api/patients | grep -q '\[\]'; then
    echo "✓ OK (no patients yet)"
elif curl -s http://localhost:3001/api/patients | grep -q '\['; then
    count=$(curl -s http://localhost:3001/api/patients | grep -o '"id"' | wc -l)
    echo "✓ OK ($count patients found)"
else
    echo "❌ FAILED"
fi

# Test Database
echo -n "Testing Database Connection... "
if docker-compose exec -T db pg_isready -U postgres -d hair_clinic > /dev/null 2>&1; then
    echo "✓ OK"
    
    # Count records
    echo ""
    echo "Database Statistics:"
    patients=$(docker-compose exec -T db psql -U postgres -d hair_clinic -t -c "SELECT COUNT(*) FROM patients;" 2>/dev/null | tr -d ' \n')
    treatments=$(docker-compose exec -T db psql -U postgres -d hair_clinic -t -c "SELECT COUNT(*) FROM treatments;" 2>/dev/null | tr -d ' \n')
    images=$(docker-compose exec -T db psql -U postgres -d hair_clinic -t -c "SELECT COUNT(*) FROM dermascopy_images;" 2>/dev/null | tr -d ' \n')
    appointments=$(docker-compose exec -T db psql -U postgres -d hair_clinic -t -c "SELECT COUNT(*) FROM appointments;" 2>/dev/null | tr -d ' \n')
    
    echo "  Patients: $patients"
    echo "  Treatments: $treatments"
    echo "  Images: $images"
    echo "  Appointments: $appointments"
else
    echo "❌ FAILED"
fi

echo ""
echo "=========================================="
echo ""

# Test saving data
read -p "Do you want to test saving patient data? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Creating test patient..."
    
    test_patient=$(cat <<EOF
{
  "id": "test_$(date +%s)",
  "firstName": "Test",
  "lastName": "Patient",
  "email": "test@example.com",
  "phone": "1234567890",
  "dateOfBirth": "1990-01-01",
  "gender": "other",
  "address": {},
  "emergencyContact": {},
  "medicalHistory": {},
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "updatedAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")"
}
EOF
)
    
    response=$(curl -s -X POST http://localhost:3001/api/patients \
        -H "Content-Type: application/json" \
        -d "$test_patient")
    
    if echo "$response" | grep -q '"success":true'; then
        echo "✓ Test patient saved successfully!"
        echo "Response: $response"
        
        # Verify in database
        sleep 1
        count=$(docker-compose exec -T db psql -U postgres -d hair_clinic -t -c "SELECT COUNT(*) FROM patients WHERE first_name='Test';" 2>/dev/null | tr -d ' \n')
        echo "✓ Verified in database: $count test patient(s) found"
    else
        echo "❌ Failed to save test patient"
        echo "Response: $response"
        echo ""
        echo "Check backend logs:"
        echo "  docker-compose logs backend"
    fi
fi

echo ""
