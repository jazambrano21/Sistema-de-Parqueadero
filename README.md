# Sistema de Parqueadero

Proyecto académico basado en una arquitectura de microservicios para la gestión de un sistema de parqueadero.  
El sistema permite administrar usuarios, vehículos, zonas, espacios y tickets de parqueo, aplicando autenticación, organización por servicios independientes y configuración base para despliegue con Docker y API Gateway.

---

## Estructura del proyecto

```text
Sistema-de-Parqueadero
│
├── App
│   ├── oauth
│   ├── ms-zonas-espacios
│   ├── ms-usuarios-roles-auth
│   ├── ms-vehiculos
│   ├── ms-tickets
│   └── kong.yml
│
├── Frontend
├── docker-compose.yml
├── package.json
├── pom.xml
├── .env.example
├── .gitignore
├── GUIA_PRUEBAS_TICKETS.md
└── README.md
