// ─── Auth ────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  roles: string[];
}

export interface JwtPayload {
  sub: string;
  roles: string[];
  tenantId?: string;
  iss: string;
  exp: number;
  iat: number;
}

// ─── Tenant ──────────────────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface TenantCreateRequest {
  nombre: string;
  slug: string;
  descripcion?: string;
}

// ─── User / Person ───────────────────────────────────────────────────────────
export interface Person {
  id: string;
  dni: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  nationality: string;
  active: boolean;
}

export interface User {
  id: string;
  username: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
  person: Person;
  tenant?: Tenant;
}

export interface UserCreateRequest {
  dni: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  nationality: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

// ─── Zona ────────────────────────────────────────────────────────────────────
export type TipoZona = 'VIP' | 'ESTUDIANTES' | 'GENERAL' | 'PREFERENCIAL';
export type EstadoEspacio = 'DISPONIBLE' | 'OCUPADO' | 'RESERVADO' | 'MANTENIMIENTO';
export type TipoEspacio = 'CUBIERTO' | 'DESCUBIERTO' | 'ACCESIBLE';

export interface Zona {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  capacidad: number;
  tipo: TipoZona;
  activo: boolean;
  tenantId?: string;
}

export interface ZonaCreateRequest {
  nombre: string;
  descripcion?: string;
  capacidad: number;
  tipo: TipoZona;
}

// ─── Espacio ─────────────────────────────────────────────────────────────────
export interface Espacio {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoEspacio;
  estado: EstadoEspacio;
  activo: boolean;
  zona: Zona;
  tenantId?: string;
}

export interface EspacioCreateRequest {
  descripcion?: string;
  tipo: TipoEspacio;
  idZona: string;
}

// ─── Vehículo ─────────────────────────────────────────────────────────────────
export type TipoVehiculo = 'AUTO' | 'MOTO' | 'CAMIONETA';
export type Clasificacion = 'Eléctrico' | 'Híbrido' | 'Gasolina' | 'Diésel';

export interface VehiculoBase {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  anio: number;
  clasificacion: Clasificacion;
  tenantId?: string;
}

export interface Auto extends VehiculoBase {
  tipo: 'AUTO';
  numeroPuertas: number;
  capacidadMaletero: number;
}

export interface Moto extends VehiculoBase {
  tipo: 'MOTO';
  tipoMoto: 'Deportiva' | 'Crucero' | 'Naked' | 'Scooter' | 'Enduro';
}

export interface Camioneta extends VehiculoBase {
  tipo: 'CAMIONETA';
  cabina: 'Simple' | 'Doble';
  capacidadCarga: number;
}

export type Vehiculo = Auto | Moto | Camioneta;

export interface VehiculoCreateRequest {
  tipo: TipoVehiculo;
  datos: {
    placa: string;
    marca: string;
    modelo: string;
    color: string;
    anio: number;
    clasificacion: Clasificacion;
    // Auto
    numeroPuertas?: number;
    capacidadMaletero?: number;
    // Moto
    tipoMoto?: string;
    // Camioneta
    cabina?: string;
    capacidadCarga?: number;
  };
}

// ─── Ticket ───────────────────────────────────────────────────────────────────
export interface Ticket {
  id: string;
  placa: string;
  dni: string;
  idEspacio: string;
  nombreZona: string;
  fechaHoraIngreso: string;
  fechaHoraSalida?: string;
  activo: boolean;
  valorRecaudado: number;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketCreateRequest {
  placa: string;
  dni: string;
  idEspacio: string;
  nombreZona: string;
}

export interface TicketCloseRequest {
  valorRecaudado?: number;
}

// ─── Auditoría ────────────────────────────────────────────────────────────────
export type AccionAuditoria = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';

export interface EventoAuditoria {
  id: string;
  servicio: string;
  accion: AccionAuditoria;
  entidad: string;
  datos: Record<string, unknown>;
  usuario: string;
  ip: string;
  mac: string;
  timestamp: string;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
export interface PageMeta {
  page: number;
  size: number;
  total: number;
}
