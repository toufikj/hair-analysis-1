#!/bin/bash
set -e

# This script runs when the PostgreSQL container is first initialized
# It ensures the database is properly set up

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Ensure the database exists
    SELECT 'Database hair_clinic is ready' AS status;
    
    -- Set proper encoding
    ALTER DATABASE hair_clinic SET client_encoding TO 'UTF8';
    ALTER DATABASE hair_clinic SET timezone TO 'UTC';
    
    -- Log initialization
    SELECT version();
EOSQL

echo "Database initialization completed successfully"
