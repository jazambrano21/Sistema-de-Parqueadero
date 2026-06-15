# Script de prueba para crear zona y espacios
$baseUrl = 'http://localhost:8080'

Write-Output "Docker containers:" 
docker ps

Write-Output "\nCreando zona de prueba..."
$zoneBody = @{ nombre = 'VIP-TEST'; descripcion = 'Zona test'; capacidad = 2; tipo = 'VIP' }
$zone = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/zonas" -Body ($zoneBody | ConvertTo-Json) -ContentType 'application/json'
Write-Output "ZONE_JSON:"
$zone | ConvertTo-Json -Depth 5
Write-Output "ZONE_ID: $($zone.id)"

Write-Output "\nListando zonas..."
Invoke-RestMethod -Uri "$baseUrl/api/zonas" | ConvertTo-Json -Depth 5

# Crear 2 espacios
for ($i = 1; $i -le 2; $i++) {
    Write-Output "\nCreando espacio $i..."
    $body = @{ descripcion = "Espacio prueba $i"; tipo = 'CUBIERTO'; idZona = $zone.id }
    $res = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/espacios" -Body ($body | ConvertTo-Json) -ContentType 'application/json'
    Write-Output "CREATED_SPACE_$i: $($res.id)"
}

# Intentar crear tercero
Write-Output "\nIntentando crear tercer espacio (debe fallar)..."
try {
    $body = @{ descripcion = 'Espacio prueba 3'; tipo = 'CUBIERTO'; idZona = $zone.id }
    $res = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/espacios" -Body ($body | ConvertTo-Json) -ContentType 'application/json'
    Write-Output "CREATED_THIRD: $($res.id)"
} catch {
    Write-Output "ERROR_THIRD: $($_.Exception.Message)"
}

Write-Output "\nListando espacios actuales..."
Invoke-RestMethod -Uri "$baseUrl/api/espacios" | ConvertTo-Json -Depth 5
