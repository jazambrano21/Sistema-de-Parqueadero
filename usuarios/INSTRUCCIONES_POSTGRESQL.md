# Instrucciones para Configurar PostgreSQL y Ejecutar la Aplicación

## 📋 Requisitos Previos

1. **Java 17** instalado
2. **Maven** instalado
3. **PostgreSQL** instalado y corriendo

## 🗄️ Configuración de PostgreSQL

### 1. Instalar PostgreSQL (si no lo tienes)
- **Windows**: Descargar desde https://www.postgresql.org/download/windows/
- **MacOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### 2. Iniciar PostgreSQL
```bash
# Windows (Services)
net start postgresql-x64-15

# MacOS/Linux
brew services start postgresql
# o
sudo systemctl start postgresql
```

### 3. Crear Base de Datos y Usuario con pgAdmin

#### Opción A: Usando pgAdmin (Recomendado)

1. **Conectar al Servidor Existente**
   - En pgAdmin, tu servidor "PostgreSQL 17" ya está configurado
   - Si necesitas agregarlo: **Nombre**: "PostgreSQL 17"
   - **Conexión**:
     - Host: `localhost`
     - Port: `5432`
     - Maintenance database: `postgres`
     - Username: `postgres`
     - Password: `123`

2. **Crear Base de Datos**
   - Right-click en "Databases" → "Create" → "Database..."
   - **Database name**: `usuarios_db`
   - **Owner**: `usuarios_db`
   - Click "Save"

3. **Crear Usuario**
   - Right-click en "Login/Group Roles" → "Create" → "Login/Group Role..."
   - **Name**: `postgrest`
   - **Password**: `qwerty12`
   - **Privileges**: Marcar "Can login?"
   - Click "Save"

4. **Otorgar Permisos**
   - Right-click en `usuarios_db` → "Properties"
   - **Privileges** tab → Click "+"
   - **Grantee**: `postgrest`
   - **Privileges**: Marcar "ALL"
   - Click "Save"

#### Opción B: Usando Terminal (SQL)
```sql
-- Conéctate a PostgreSQL como superusuario
psql -U postgres

-- Crea la base de datos
CREATE DATABASE usuarios_db;

-- Crea el usuario (si no existe)
CREATE USER postgrest WITH PASSWORD 'qwerty12';

-- Otorga permisos
GRANT ALL PRIVILEGES ON DATABASE usuarios_db TO postgrest;

-- Sal de psql
\q
```

### 4. Verificar Conexión

#### Opción A: Con pgAdmin
- Right-click en `usuarios_db` → "Query Tool"
- Ejecuta: `SELECT current_database(), current_user;`

#### Opción B: Con Terminal
```bash
psql -h localhost -p 5432 -U postgrest -d usuarios_db
```

## 🚀 Ejecutar la Aplicación

### 1. Compilar el Proyecto
```bash
cd "c:\Arquitectura\PARCIAL 1\Usuarios, ultimo\usuarios\usuarios"
mvn clean compile
```

### 2. Ejecutar la Aplicación
```bash
mvn spring-boot:run
```

### 3. Verificar Creación de Tablas
Cuando la aplicación inicie, verás en la consola:
```
Hibernate: create table person ...
Hibernate: create table role ...
Hibernate: create table user ...
Hibernate: create table user_role ...
```

## 🔍 Verificación Post-Ejecución

### 1. Conéctate a la Base de Datos
```bash
psql -h localhost -p 5432 -U postgrest -d usuarios_db
```

### 2. Lista las Tablas Creadas

#### Con pgAdmin
- Right-click en `usuarios_db` → "Query Tool"
- Ejecuta: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`

#### Con Terminal
```sql
\dt
```
Deberías ver:
- `person`
- `role` 
- `user`
- `user_role`

### 3. Estructura de las Tablas

#### Con pgAdmin
- Expande `usuarios_db` → "Schemas" → "public" → "Tables"

#### Con Terminal
```sql
\d person
\d role
\d "user"
\d user_role
```

## 🛠️ Solución de Problemas Comunes

### Error: "Connection refused"
- Verifica que PostgreSQL esté corriendo
- Verifica el puerto (5432 por defecto)

### Error: "FATAL: database does not exist"
- Crea la base de datos: `CREATE DATABASE usuarios_db;`

### Error: "FATAL: password authentication failed for user"
- Verifica el usuario y contraseña en `application.yml`
- Asegúrate de crear el usuario `postgrest` con la contraseña `qwerty12`

### Error: "Relation does not exist"
- Las tablas se crean automáticamente al iniciar la aplicación
- Verifica que `ddl-auto: update` esté configurado

## 📝 Configuración Actual (application.yml)
```yaml
spring:
    datasource:
        url: jdbc:postgresql://localhost:5432/usuarios_db
        username: postgrest
        password: qwerty12
        driver-class-name: org.postgresql.Driver

    jpa:
        hibernate:
          ddl-auto: update  # Crea/actualiza tablas automáticamente
        show-sql: true     # Muestra las consultas SQL
        properties:
          hibernate:
            dialect: org.hibernate.dialect.PostgreSQLDialect
            format_sql: true
```

## ✅ Checklist Final
- [ ] **Java 17** instalado y configurado
- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `usuarios_db` creada
- [ ] Usuario `postgrest` con contraseña `qwerty12` creado
- [ ] Aplicación compila sin errores
- [ ] Aplicación inicia correctamente
- [ ] Tablas creadas automáticamente
- [ ] Sin errores de conexión en la consola
