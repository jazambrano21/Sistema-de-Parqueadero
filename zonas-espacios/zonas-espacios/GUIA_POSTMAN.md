# Guía de Pruebas Postman - Sistema de Zonas y Espacios

## Configuración Inicial

**URL Base:** `http://localhost:8080/api`

**Headers:**
```
Content-Type: application/json
```

---

## PASO 1: Crear una Zona

### Endpoint: `POST /api/zonas`

**Body:**
```json
{
  "nombre": "VIP",
  "descripcion": "Zona VIP para clientes premium",
  "capacidad": 200,
  "tipo": "VIP"
}
```

**Respuesta Esperada (201 Created):**
```json
{
  "id": "uuid",
  "nombre": "VIP",
  "codigo": "ZON-VIP-01",
  "descripcion": "Zona VIP para clientes premium",
  "capacidad": 200,
  "tipo": "VIP",
  "estado": "DISPONIBLE",
  "activo": true,
  "fechaCreacion": "2024-01-01T00:00:00",
  "fechaActualizacion": "2024-01-01T00:00:00",
  "espacios": 0
}
```

**Nota:** El nombre se genera automáticamente tomando los primeros 3 caracteres (VIP) y el código se genera como ZON-VIP-01.

---

## PASO 2: Listar todas las Zonas

### Endpoint: `GET /api/zonas`

**Respuesta Esperada (200 OK):**
```json
[
  {
    "id": "uuid",
    "nombre": "VIP",
    "codigo": "ZON-VIP-01",
    "descripcion": "Zona VIP para clientes premium",
    "capacidad": 200,
    "tipo": "VIP",
    "estado": "DISPONIBLE",
    "activo": true,
    "fechaCreacion": "2024-01-01T00:00:00",
    "fechaActualizacion": "2024-01-01T00:00:00",
    "espacios": 0
  }
]
```

---

## PASO 3: Crear el Primer Espacio en la Zona

### Endpoint: `POST /api/espacios`

**Body:**
```json
{
  "descripcion": "Espacio cubierto VIP",
  "tipo": "CUBIERTO",
  "idZona": "uuid-de-la-zona-creada-en-paso-1"
}
```

**Respuesta Esperada (201 Created):**
```json
{
  "id": "uuid",
  "nombre": "ZON-VIP-01-001",
  "descripcion": "Espacio cubierto VIP",
  "tipo": "CUBIERTO",
  "activo": true,
  "nombreZona": "VIP",
  "idZona": "uuid-de-la-zona",
  "estado": "DISPONIBLE",
  "fechaCreacion": "2024-01-01T00:00:00",
  "fechaActualizacion": "2024-01-01T00:00:00"
}
```

**Nota:** El nombre del espacio se genera automáticamente como ZON-VIP-01-001.

---

## PASO 4: Crear el Segundo Espacio en la Zona

### Endpoint: `POST /api/espacios`

**Body:**
```json
{
  "descripcion": "Espacio cubierto VIP 2",
  "tipo": "CUBIERTO",
  "idZona": "uuid-de-la-zona-creada-en-paso-1"
}
```

**Respuesta Esperada (201 Created):**
```json
{
  "id": "uuid",
  "nombre": "ZON-VIP-01-002",
  "descripcion": "Espacio cubierto VIP 2",
  "tipo": "CUBIERTO",
  "activo": true,
  "nombreZona": "VIP",
  "idZona": "uuid-de-la-zona",
  "estado": "DISPONIBLE",
  "fechaCreacion": "2024-01-01T00:00:00",
  "fechaActualizacion": "2024-01-01T00:00:00"
}
```

---

## PASO 5: Intentar Crear un Tercer Espacio (Debe Fallar)

### Endpoint: `POST /api/espacios`

**Body:**
```json
{
  "descripcion": "Espacio cubierto VIP 3",
  "tipo": "CUBIERTO",
  "idZona": "uuid-de-la-zona-creada-en-paso-1"
}
```

**Respuesta Esperada (409 Conflict):**
```json
{
  "timestamp": "2024-01-01T00:00:00",
  "status": 409,
  "error": "Conflicto en la operación",
  "message": "No se pueden crear más de 2 espacios en la misma zona"
}
```

**Nota:** Esto valida la restricción de máximo 2 espacios por zona.

---

## PASO 6: Listar todos los Espacios

### Endpoint: `GET /api/espacios`

**Respuesta Esperada (200 OK):**
```json
[
  {
    "id": "uuid",
    "nombre": "ZON-VIP-01-001",
    "descripcion": "Espacio cubierto VIP",
    "tipo": "CUBIERTO",
    "activo": true,
    "nombreZona": "VIP",
    "idZona": "uuid-de-la-zona",
    "estado": "DISPONIBLE",
    "fechaCreacion": "2024-01-01T00:00:00",
    "fechaActualizacion": "2024-01-01T00:00:00"
  },
  {
    "id": "uuid",
    "nombre": "ZON-VIP-01-002",
    "descripcion": "Espacio cubierto VIP 2",
    "tipo": "CUBIERTO",
    "activo": true,
    "nombreZona": "VIP",
    "idZona": "uuid-de-la-zona",
    "estado": "DISPONIBLE",
    "fechaCreacion": "2024-01-01T00:00:00",
    "fechaActualizacion": "2024-01-01T00:00:00"
  }
]
```

---

## PASO 7: Cambiar Estado de un Espacio a OCUPADO

### Endpoint: `PATCH /api/espacios/{id}/estado?estado=OCUPADO`

**Respuesta Esperada (200 OK):**
```json
{
  "id": "uuid",
  "nombre": "ZON-VIP-01-001",
  "descripcion": "Espacio cubierto VIP",
  "tipo": "CUBIERTO",
  "activo": true,
  "nombreZona": "VIP",
  "idZona": "uuid-de-la-zona",
  "estado": "OCUPADO",
  "fechaCreacion": "2024-01-01T00:00:00",
  "fechaActualizacion": "2024-01-01T00:00:00"
}
```

---

## PASO 8: Intentar Eliminar la Zona con Espacio OCUPADO (Debe Fallar)

### Endpoint: `DELETE /api/zonas/{id-zona}`

**Respuesta Esperada (409 Conflict):**
```json
{
  "timestamp": "2024-01-01T00:00:00",
  "status": 409,
  "error": "Conflicto en la operación",
  "message": "No se puede eliminar la zona porque hay espacios ocupados, reservados o en mantenimiento"
}
```

**Nota:** Esto valida que no se puede eliminar una zona si tiene espacios ocupados.

---

## PASO 9: Cambiar Estado del Espacio de OCUPADO a DISPONIBLE

### Endpoint: `PATCH /api/espacios/{id}/estado?estado=DISPONIBLE`

**Respuesta Esperada (200 OK):**
```json
{
  "id": "uuid",
  "nombre": "ZON-VIP-01-001",
  "descripcion": "Espacio cubierto VIP",
  "tipo": "CUBIERTO",
  "activo": true,
  "nombreZona": "VIP",
  "idZona": "uuid-de-la-zona",
  "estado": "DISPONIBLE",
  "fechaCreacion": "2024-01-01T00:00:00",
  "fechaActualizacion": "2024-01-01T00:00:00"
}
```

---

## PASO 10: Eliminar la Zona (Ahora debe funcionar)

### Endpoint: `DELETE /api/zonas/{id-zona}`

**Respuesta Esperada (204 No Content):**
```
(Sin cuerpo de respuesta)
```

**Nota:** La zona se elimina junto con todos sus espacios (cascade delete).

---

## PASO 11: Buscar Zonas por Nombre

### Endpoint: `GET /api/zonas/buscar?nombre=VIP`

**Respuesta Esperada (200 OK):**
```json
[
  {
    "id": "uuid",
    "nombre": "VIP",
    "codigo": "ZON-VIP-01",
    "descripcion": "Zona VIP para clientes premium",
    "capacidad": 200,
    "tipo": "VIP",
    "estado": "DISPONIBLE",
    "activo": true,
    "fechaCreacion": "2024-01-01T00:00:00",
    "fechaActualizacion": "2024-01-01T00:00:00",
    "espacios": 0
  }
]
```

---

## PASO 12: Obtener Espacios por Estado

### Endpoint: `GET /api/espacios/estado/DISPONIBLE`

**Respuesta Esperada (200 OK):**
```json
[
  {
    "id": "uuid",
    "nombre": "ZON-VIP-01-001",
    "descripcion": "Espacio cubierto VIP",
    "tipo": "CUBIERTO",
    "activo": true,
    "nombreZona": "VIP",
    "idZona": "uuid-de-la-zona",
    "estado": "DISPONIBLE",
    "fechaCreacion": "2024-01-01T00:00:00",
    "fechaActualizacion": "2024-01-01T00:00:00"
  }
]
```

---

## PASO 13: Obtener Espacios por Zona

### Endpoint: `GET /api/espacios/zona/{id-zona}`

**Respuesta Esperada (200 OK):**
```json
[
  {
    "id": "uuid",
    "nombre": "ZON-VIP-01-001",
    "descripcion": "Espacio cubierto VIP",
    "tipo": "CUBIERTO",
    "activo": true,
    "nombreZona": "VIP",
    "idZona": "uuid-de-la-zona",
    "estado": "DISPONIBLE",
    "fechaCreacion": "2024-01-01T00:00:00",
    "fechaActualizacion": "2024-01-01T00:00:00"
  }
]
```

---

## PASO 14: Obtener Espacios por Zona y Estado

### Endpoint: `GET /api/espacios/zona/{id-zona}/estado/DISPONIBLE`

**Respuesta Esperada (200 OK):**
```json
[
  {
    "id": "uuid",
    "nombre": "ZON-VIP-01-001",
    "descripcion": "Espacio cubierto VIP",
    "tipo": "CUBIERTO",
    "activo": true,
    "nombreZona": "VIP",
    "idZona": "uuid-de-la-zona",
    "estado": "DISPONIBLE",
    "fechaCreacion": "2024-01-01T00:00:00",
    "fechaActualizacion": "2024-01-01T00:00:00"
  }
]
```

---

## PASO 15: Actualizar un Espacio

### Endpoint: `PUT /api/espacios/{id-espacio}`

**Body:**
```json
{
  "descripcion": "Espacio actualizado",
  "tipo": "ACCESIBLE",
  "idZona": "uuid-de-la-zona"
}
```

**Respuesta Esperada (200 OK):**
```json
{
  "id": "uuid",
  "nombre": "ZON-VIP-01-001",
  "descripcion": "Espacio actualizado",
  "tipo": "ACCESIBLE",
  "activo": true,
  "nombreZona": "VIP",
  "idZona": "uuid-de-la-zona",
  "estado": "DISPONIBLE",
  "fechaCreacion": "2024-01-01T00:00:00",
  "fechaActualizacion": "2024-01-01T00:00:00"
}
```

---

## PASO 16: Eliminar un Espacio (Soft Delete)

### Endpoint: `DELETE /api/espacios/{id-espacio}`

**Respuesta Esperada (204 No Content):**
```
(Sin cuerpo de respuesta)
```

**Nota:** El espacio no se elimina físicamente, se marca como activo=false.

---

## PASO 17: Actualizar una Zona

### Endpoint: `PUT /api/zonas/{id-zona}`

**Body:**
```json
{
  "nombre": "VIP ACTUALIZADA",
  "descripcion": "Descripción actualizada",
  "capacidad": 250,
  "tipo": "VIP"
}
```

**Respuesta Esperada (200 OK):**
```json
{
  "id": "uuid",
  "nombre": "VIP",
  "codigo": "ZON-VIP-01",
  "descripcion": "Descripción actualizada",
  "capacidad": 250,
  "tipo": "VIP",
  "estado": "DISPONIBLE",
  "activo": true,
  "fechaCreacion": "2024-01-01T00:00:00",
  "fechaActualizacion": "2024-01-01T00:00:00",
  "espacios": 0
}
```

**Nota:** El nombre no se actualiza porque se genera automáticamente.

---

## Validaciones de Negocio Probadas

✅ **Generación automática de código de zona** (ZON-VIP-01)
✅ **Generación de nombre de zona** (primeros 3 caracteres)
✅ **Generación automática de nombre de espacio** (ZON-VIP-01-001)
✅ **Máximo 2 espacios por zona**
✅ **No eliminar zona con espacios ocupados**
✅ **Soft delete de espacios**
✅ **Cambio de estado de espacios**
✅ **Búsqueda por estado y zona**
✅ **Validaciones en DTOs**
✅ **Manejo de excepciones en servicios**
✅ **Respuestas de error sin exponer detalles técnicos**

---

## Tipos de Datos

**TipoZona:** VIP, ESTUDIANTES, GENERAL, PREFERENCIAL

**TipoEspacio:** CUBIERTO, DESCUBIERTO, ACCESIBLE

**EstadoEspacio:** DISPONIBLE, OCUPADO, RESERVADO, MANTENIMIENTO
