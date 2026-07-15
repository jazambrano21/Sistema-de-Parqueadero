-- =============================================================
-- SEED DATA — Sistema de Parqueadero
-- 100 registros por tabla principal para probar caché Redis
-- =============================================================

-- ---------------------------------------------------------------
-- 1. USUARIOS (usuarios_db) — 100 Personas + 100 Usuarios
-- ---------------------------------------------------------------
\c usuarios_db;

INSERT INTO person (id, dni, first_name, last_name, email, phone, nationality)
SELECT
  gen_random_uuid(),
  LPAD((1000000000 + i)::text, 10, '0'),
  (ARRAY['Ana','Carlos','Diana','Eduardo','Fanny','Gabriel','Helena','Ivan','Julia','Kevin',
         'Laura','Mario','Natalia','Oscar','Patricia','Quito','Rosa','Santiago','Teresa','Ulises',
         'Valeria','Wilson','Ximena','Yolanda','Zoila','Andres','Beatriz','Cesar','Daniela','Ernesto'])[((i-1) % 30) + 1],
  (ARRAY['Torres','Perez','Gomez','Ruiz','Lopez','Mora','Vega','Cruz','Diaz','Reyes',
         'Salazar','Herrera','Jimenez','Castillo','Mendoza','Ortiz','Vargas','Romero','Flores','Guerrero',
         'Alvarado','Cabrera','Delgado','Espinoza','Fuentes','Guzman','Hidalgo','Ibarra','Jara','Lara'])[((i-1) % 30) + 1],
  'user' || LPAD(i::text, 3, '0') || '@parqueadero.com',
  '09' || LPAD((10000000 + i)::text, 8, '0'),
  'Ecuatoriana'
FROM generate_series(1, 100) AS i
ON CONFLICT (dni) DO NOTHING;

INSERT INTO users (person_id, username, password_hash, active, created_at)
SELECT
  p.id,
  'user' || LPAD(ROW_NUMBER() OVER (ORDER BY p.dni)::text, 3, '0'),
  '1234567890',
  true,
  NOW()
FROM person p
WHERE p.dni != '1234567890'
ORDER BY p.dni
LIMIT 100
ON CONFLICT (username) DO NOTHING;


-- ---------------------------------------------------------------
-- 2. ZONAS (zonas_db) — 10 zonas
-- ---------------------------------------------------------------
\c zonas_db;

INSERT INTO zonas (id, nombre, codigo, descripcion, capacidad, tipo, espacio, activo, fecha_creacion, fecha_actualizacion)
VALUES
  (gen_random_uuid(), 'Zona General A',      'ZN-GEN-01', 'Zona general norte',       10, 'GENERAL',      'DISPONIBLE', true, NOW(), NOW()),
  (gen_random_uuid(), 'Zona General B',      'ZN-GEN-02', 'Zona general sur',          10, 'GENERAL',      'DISPONIBLE', true, NOW(), NOW()),
  (gen_random_uuid(), 'Zona VIP 1',          'ZN-VIP-01', 'Zona VIP principal',        10, 'VIP',          'DISPONIBLE', true, NOW(), NOW()),
  (gen_random_uuid(), 'Zona VIP 2',          'ZN-VIP-02', 'Zona VIP secundaria',       10, 'VIP',          'DISPONIBLE', true, NOW(), NOW()),
  (gen_random_uuid(), 'Zona Estudiantes A',  'ZN-EST-01', 'Zona para estudiantes',     10, 'ESTUDIANTES',  'DISPONIBLE', true, NOW(), NOW()),
  (gen_random_uuid(), 'Zona Estudiantes B',  'ZN-EST-02', 'Zona estudiantil ext',      10, 'ESTUDIANTES',  'DISPONIBLE', true, NOW(), NOW()),
  (gen_random_uuid(), 'Zona Preferencial A', 'ZN-PRE-01', 'Zona preferencial 1',       10, 'PREFERENCIAL', 'DISPONIBLE', true, NOW(), NOW()),
  (gen_random_uuid(), 'Zona Preferencial B', 'ZN-PRE-02', 'Zona preferencial 2',       10, 'PREFERENCIAL', 'DISPONIBLE', true, NOW(), NOW()),
  (gen_random_uuid(), 'Zona General C',      'ZN-GEN-03', 'Zona general este',         10, 'GENERAL',      'DISPONIBLE', true, NOW(), NOW()),
  (gen_random_uuid(), 'Zona General D',      'ZN-GEN-04', 'Zona general oeste',        10, 'GENERAL',      'DISPONIBLE', true, NOW(), NOW())
ON CONFLICT (nombre) DO NOTHING;

-- 100 Espacios: 10 por zona (solo si no existen ya)
INSERT INTO espacio (id, codigo, nombre, descripcion, tipo, estado, activo, id_zona, fecha_creacion, fecha_actualizacion)
SELECT
  gen_random_uuid(),
  LEFT(z.codigo, 8) || LPAD(esp::text, 2, '0'),
  LEFT(z.nombre, 15) || LPAD(esp::text, 3, '0'),
  'Espacio ' || esp || ' de ' || z.nombre,
  (ARRAY['CUBIERTO','DESCUBIERTO','ACCESIBLE'])[((esp - 1) % 3) + 1],
  'DISPONIBLE',
  true,
  z.id,
  NOW(),
  NOW()
FROM zonas z
CROSS JOIN generate_series(1, 10) AS esp
WHERE NOT EXISTS (
  SELECT 1 FROM espacio e WHERE e.id_zona = z.id
);


-- ---------------------------------------------------------------
-- 3. VEHÍCULOS (parking_db)
-- ---------------------------------------------------------------
\c parking_db;

-- 50 Autos
INSERT INTO vehiculo (id, placa, marca, modelo, color, anio, clasificacion, tipo, "numeroPuertas", "capacidadMaletero")
SELECT
  gen_random_uuid(),
  CHR(65 + ((i-1) % 26)) || CHR(65 + ((i) % 26)) || CHR(65 + ((i+1) % 26)) || '-' || LPAD(i::text, 4, '0'),
  (ARRAY['Toyota','Chevrolet','Hyundai','Kia','Mazda','Ford','Volkswagen','Nissan','Honda','Suzuki'])[((i-1) % 10) + 1],
  (ARRAY['Corolla','Aveo','Elantra','Rio','Mazda3','Focus','Jetta','Sentra','Civic','Swift'])[((i-1) % 10) + 1],
  (ARRAY['Blanco','Negro','Gris','Rojo','Azul','Verde','Plata','Cafe','Amarillo','Naranja'])[((i-1) % 10) + 1],
  2015 + (i % 10),
  (ARRAY['Gasolina','Diesel','Electrico','Hibrido'])[((i-1) % 4) + 1],
  'Auto',
  4,
  300 + i
FROM generate_series(1, 50) AS i
ON CONFLICT (placa) DO NOTHING;

-- 30 Camionetas
INSERT INTO vehiculo (id, placa, marca, modelo, color, anio, clasificacion, tipo, cabina, "capacidadCarga")
SELECT
  gen_random_uuid(),
  'CM' || CHR(65 + ((i-1) % 26)) || CHR(65 + (i % 26)) || '-' || LPAD(i::text, 4, '0'),
  (ARRAY['Ford','Chevrolet','Toyota','Mitsubishi','Nissan','Dodge','Ram','Isuzu','Mazda','Volkswagen'])[((i-1) % 10) + 1],
  (ARRAY['Ranger','D-MAX','Hilux','L200','Frontier','1500','1500','D-Max','BT-50','Amarok'])[((i-1) % 10) + 1],
  (ARRAY['Blanco','Negro','Gris','Rojo','Azul'])[((i-1) % 5) + 1],
  2016 + (i % 8),
  (ARRAY['Gasolina','Diesel'])[((i-1) % 2) + 1],
  'Camioneta',
  (ARRAY['Simple','Doble','Extra'])[((i-1) % 3) + 1],
  1000.00 + (i * 50)
FROM generate_series(1, 30) AS i
ON CONFLICT (placa) DO NOTHING;

-- 20 Motocicletas  (tipo varchar, columnas de auto/camioneta = NULL)
INSERT INTO vehiculo (id, placa, marca, modelo, color, anio, clasificacion, tipo)
SELECT
  gen_random_uuid(),
  'MT' || CHR(65 + ((i-1) % 26)) || CHR(65 + (i % 26)) || '-' || LPAD(i::text, 4, '0'),
  (ARRAY['Honda','Yamaha','Suzuki','Kawasaki','KTM','BMW','Bajaj','TVS','Royal Enfield','Ducati'])[((i-1) % 10) + 1],
  (ARRAY['CB500','MT07','GSX-R','Ninja','Duke','GS','Pulsar','Apache','Meteor','Monster'])[((i-1) % 10) + 1],
  (ARRAY['Negro','Rojo','Azul','Blanco','Naranja'])[((i-1) % 5) + 1],
  2018 + (i % 6),
  (ARRAY['Gasolina','Electrico'])[((i-1) % 2) + 1],
  'Motocicleta'
FROM generate_series(1, 20) AS i
ON CONFLICT (placa) DO NOTHING;

-- ---------------------------------------------------------------
-- 4. TICKETS históricos (parking_db) — 100 tickets cerrados
-- Usamos un UUID fijo de placeholder para idEspacio porque los
-- espacios reales viven en zonas_db (diferente base de datos).
-- En producción este UUID vendría del ms-zonas via API.
-- ---------------------------------------------------------------
DO $$
DECLARE
  dummy_espacio_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO tickets (id, placa, dni, "idEspacio", "nombreZona", "fechaHoraIngreso", "fechaHoraSalida", activo, "valorRecaudado", "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    v.placa,
    LPAD((1000000000 + rn)::text, 10, '0'),
    dummy_espacio_id,
    (ARRAY['Zona General A','Zona VIP 1','Zona Estudiantes A','Zona Preferencial A','Zona General B'])[((rn-1) % 5) + 1],
    NOW() - INTERVAL '1 day' * (101 - rn),
    NOW() - INTERVAL '1 day' * (101 - rn) + INTERVAL '1 hour' * (1 + (rn % 5)),
    false,
    ROUND(((1 + (rn % 5)) * 1.5)::numeric, 2),
    NOW() - INTERVAL '1 day' * (101 - rn),
    NOW() - INTERVAL '1 day' * (101 - rn) + INTERVAL '1 hour' * (1 + (rn % 5))
  FROM (
    SELECT placa, ROW_NUMBER() OVER (ORDER BY placa) AS rn
    FROM vehiculo
    LIMIT 100
  ) v;
END $$;
