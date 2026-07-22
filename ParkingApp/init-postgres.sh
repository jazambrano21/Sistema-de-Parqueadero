#!/bin/bash
set -e
set -u

# Crea las bases de datos adicionales si no existen
for db in usuarios_db zonas_db audit_db; do
  echo "Creando base de datos: $db"

  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
  CREATE DATABASE usuarios_db;
  CREATE DATABASE zonas_db;
  CREATE DATABASE audit_db;
EOSQL
done
