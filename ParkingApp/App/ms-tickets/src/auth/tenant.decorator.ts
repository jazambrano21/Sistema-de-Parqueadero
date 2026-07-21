import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador que extrae el tenantId del usuario autenticado en el request.
 * Requiere que JwtAuthGuard haya procesado el token previamente.
 *
 * Uso:  constructor(@TenantId() tenantId: string | null) {}
 *       o en método:  create(@TenantId() tenantId: string | null, ...)
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenantId ?? null;
  },
);

/**
 * Helper para extraer tenantId directamente de un objeto request.
 * Útil en servicios donde no se puede usar el decorador.
 */
export function extractTenantId(req: any): string | null {
  return req?.user?.tenantId ?? null;
}
