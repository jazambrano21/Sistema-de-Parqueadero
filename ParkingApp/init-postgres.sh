#!/bin/bash
set -e

# Crea las bases de datos adicionales si no existen
for db in usuarios_db zonas_db audit_db; do
  echo "Creando base de datos: $db"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE $db'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
done
