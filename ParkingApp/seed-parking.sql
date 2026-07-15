-- Seed para parking_db: vehiculos + tickets historicos

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

-- 20 Motocicletas
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

-- 100 Tickets historicos cerrados
DO $$
DECLARE
  dummy_espacio UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO tickets (
    id, placa, dni,
    "idEspacio", "nombreZona",
    "fechaHoraIngreso", "fechaHoraSalida",
    activo, "valorRecaudado",
    "createdAt", "updatedAt"
  )
  SELECT
    gen_random_uuid(),
    v.placa,
    LPAD((1000000000 + rn)::text, 10, '0'),
    dummy_espacio,
    (ARRAY['Zona General A','Zona VIP 1','Zona Estudiantes A','Zona Preferencial A','Zona General B'])[(( rn - 1) % 5) + 1],
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
