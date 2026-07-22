import type { JwtPayload } from '../types';

/** Decodifica el payload de un JWT sin verificar la firma (la verificación la hace Kong). */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now();
}
