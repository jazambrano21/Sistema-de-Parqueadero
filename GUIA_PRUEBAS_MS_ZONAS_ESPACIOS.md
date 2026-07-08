# 📋 Guía de Pruebas: ms-zonas-espacios

## 1️⃣ Verificar que los contenedores estén corriendo

```powershell
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

**Debes ver:**
- `parking-postgres` → PostgreSQL en puerto 5433
- `parking-rabbitmq` → RabbitMQ en puerto 5672

Si no están corriendo:
```powershell
cd "c:\Users\User\Documents\GitHub\Sistema-de-Parqueadero\ParkingApp"
docker-compose up -d postgres rabbitmq
```

---

## 2️⃣ Arrancar ms-audit primero (escuchador de eventos)

```powershell
cd "c:\Users\User\Documents\GitHub\Sistema-de-Parqueadero\ParkingApp\App\ms-audit"

$env:DB_HOST='localhost'
$env:DB_PORT='5433'
$env:DB_USER='postgrest'
$env:DB_PASSWORD='qwerty12'
$env:DB_NAME='audit_db'
$env:RABBITMQ_HOST='localhost'
$env:RABBITMQ_PORT='5672'
$env:RABBITMQ_USER='guest'
$env:RABBITMQ_PASSWORD='guest'
$env:RABBITMQ_QUEUE='audit-queue'
$env:RABBITMQ_EXCHANGE='audit-exchange'
$env:RABBITMQ_ROUTING_KEY='audit.#'

npm run start
```

**Verifica en consola:**
```
[Nest] 12345  - 07/08/2026, 2:30:00 PM     LOG [NestFactory] Starting Nest application...
Conectado a RabbitMQ en localhost:5672
```

---

## 3️⃣ Arrancar ms-zonas-espacios (en otra terminal PowerShell)

```powershell
cd "c:\Users\User\Documents\GitHub\Sistema-de-Parqueadero\ParkingApp\App\ms-zonas-espacios"

$env:DB_URL='jdbc:mysql://localhost:3308/parking_db'
$env:DB_USERNAME='parkin_user'
$env:DB_PASSWORD='parkin_password'
$env:RABBITMQ_HOST='localhost'
$env:RABBITMQ_PORT='5672'
$env:RABBITMQ_USER='guest'
$env:RABBITMQ_PASSWORD='guest'
$env:RABBITMQ_EXCHANGE='audit-exchange'

mvn spring-boot:run
```

**Verifica en consola:**
```
Started ZonasEspaciosApplication in X.XXX seconds (JVM running for X.XXX)
Tomcat started on port(s): 8081
```

---

## 4️⃣ Pruebas con Postman/curl

### 4.1 - Crear una Zona

**URL:** `POST http://localhost:8081/api/zonas`

**Headers:**
```
Content-Type: application/json
x-forwarded-for: 192.168.1.100
x-client-mac: AA:BB:CC:DD:EE:FF
```

**Body:**
```json
{
  "nombre": "Zona VIP Principal",
  "descripcion": "Zona de parqueo VIP",
  "capacidad": 50,
  "tipo": "VIP"
}
```

**Respuesta esperada (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "ZON-VIP-01",
  "codigo": "ZON-VIP-01",
  "descripcion": "Zona de parqueo VIP",
  "capacidad": 50,
  "tipo": "VIP",
  "estado": "DISPONIBLE",
  "activo": true,
  "fechaCreacion": "2026-07-08T14:30:00",
  "fechaActualizacion": "2026-07-08T14:30:00",
  "espacios": 0
}
```

---

### 4.2 - Crear un Espacio dentro de la Zona

**URL:** `POST http://localhost:8081/api/espacios`

**Headers:**
```
Content-Type: application/json
x-forwarded-for: 192.168.1.100
x-client-mac: AA:BB:CC:DD:EE:FF
```

**Body:**
```json
{
  "idZona": "550e8400-e29b-41d4-a716-446655440000",
  "descripcion": "Espacio VIP #1",
  "tipo": "REGULAR"
}
```

**Respuesta esperada (201):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "nombre": "ZON-VIP-01-001",
  "descripcion": "Espacio VIP #1",
  "tipo": "REGULAR",
  "activo": true,
  "nombreZona": "ZON-VIP-01",
  "idZona": "550e8400-e29b-41d4-a716-446655440000",
  "estado": "DISPONIBLE",
  "fechaCreacion": "2026-07-08T14:30:01",
  "fechaActualizacion": "2026-07-08T14:30:01"
}
```

---

### 4.3 - Actualizar una Zona

**URL:** `PUT http://localhost:8081/api/zonas/550e8400-e29b-41d4-a716-446655440000`

**Headers:**
```
Content-Type: application/json
x-forwarded-for: 192.168.1.100
x-client-mac: AA:BB:CC:DD:EE:FF
```

**Body:**
```json
{
  "nombre": "Zona VIP Actualizada",
  "descripcion": "Nueva descripción",
  "capacidad": 100,
  "tipo": "VIP"
}
```

---

### 4.4 - Cambiar estado de un Espacio

**URL:** `PATCH http://localhost:8081/api/espacios/660e8400-e29b-41d4-a716-446655440001/estado?estado=OCUPADO`

**Headers:**
```
x-forwarded-for: 192.168.1.100
x-client-mac: AA:BB:CC:DD:EE:FF
```

---

### 4.5 - Listar Zonas

**URL:** `GET http://localhost:8081/api/zonas`

**Respuesta esperada (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombre": "ZON-VIP-01",
    "codigo": "ZON-VIP-01",
    ...
  }
]
```

---

### 4.6 - Listar Espacios

**URL:** `GET http://localhost:8081/api/espacios`

**Respuesta esperada (200):**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "nombre": "ZON-VIP-01-001",
    ...
  }
]
```

---

## 5️⃣ Verificar eventos en ms-audit

### 5.1 - Consultar todos los eventos guardados

**URL:** `GET http://localhost:3001/api/audit`

**Respuesta esperada (200):**
```json
[
  {
    "id": 1,
    "servicio": "ms-zonas-espacios",
    "accion": "CREATE",
    "entidad": "ZONA",
    "datos": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nombre": "ZON-VIP-01",
      "tipo": "VIP",
      "codigo": "ZON-VIP-01"
    },
    "usuario": "anonymous",
    "ip": "192.168.1.100",
    "mac": "AA:BB:CC:DD:EE:FF",
    "timestamp": "2026-07-08T14:30:00"
  },
  {
    "id": 2,
    "servicio": "ms-zonas-espacios",
    "accion": "CREATE",
    "entidad": "ESPACIO",
    "datos": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "nombre": "ZON-VIP-01-001",
      "zonaId": "550e8400-e29b-41d4-a716-446655440000"
    },
    "usuario": "anonymous",
    "ip": "192.168.1.100",
    "mac": "AA:BB:CC:DD:EE:FF",
    "timestamp": "2026-07-08T14:30:01"
  }
]
```

### 5.2 - Consultar evento específico

**URL:** `GET http://localhost:3001/api/audit/1`

---

## 6️⃣ Verificar RabbitMQ Management UI

Abre en navegador: http://localhost:15672

**Credenciales:** guest / guest

### Verificar en RabbitMQ:
- **Exchanges:** Debe existir `audit-exchange` de tipo `topic`
- **Queues:** Debe existir `audit-queue` con mensajes consumidos
- **Bindings:** Debe haber binding entre `audit-exchange` → `audit-queue` con patrón `audit.#`

---

## 7️⃣ Verificar datos en PostgreSQL

```powershell
docker exec -i parking-postgres psql -U postgrest -d parking_db -c "SELECT * FROM zonas LIMIT 5;"
docker exec -i parking-postgres psql -U postgrest -d parking_db -c "SELECT * FROM espacio LIMIT 5;"
docker exec -i parking-postgres psql -U postgrest -d audit_db -c "SELECT * FROM evento_auditoria LIMIT 5;"
```

---

## ✅ Checklist de Validación

- [ ] ms-audit arranca sin errores
- [ ] ms-zonas-espacios arranca en puerto 8081
- [ ] Crear zona devuelve 201 y evento se guarda en ms-audit
- [ ] Crear espacio devuelve 201 y evento se guarda en ms-audit
- [ ] Actualizar zona devuelve 200 y evento se guarda en ms-audit
- [ ] GET /api/audit devuelve todos los eventos
- [ ] RabbitMQ muestra exchange `audit-exchange` y cola `audit-queue`
- [ ] PostgreSQL tiene registros en tabla `zonas`, `espacio` y `evento_auditoria`

---

## 🔧 Troubleshooting

### Error de conexión a RabbitMQ
```
Connection refused: connect
```
→ Verifica que RabbitMQ esté corriendo: `docker ps`

### Error de conexión a PostgreSQL
```
Connection refused: getsockname
```
→ Verifica que PostgreSQL esté corriendo en puerto 5433

### Los eventos no aparecen en ms-audit
→ Revisa los logs de ms-audit buscando errores de validación del DTO
→ Verifica que los headers `x-forwarded-for` y `x-client-mac` sean válidos
