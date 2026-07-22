package com.example.zonas.config;

import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Extrae el claim "tenantId" del JWT Bearer de cada request
 * y lo almacena en TenantContext para que los servicios puedan
 * filtrar los datos por tenant sin recibir el parámetro explícitamente.
 *
 * Se ejecuta una sola vez por request (OncePerRequestFilter)
 * y siempre limpia el contexto en el bloque finally para evitar
 * contaminación entre requests en el mismo hilo.
 */
@Slf4j
@Component
@Order(1)
public class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String tenantId = extractTenantIdFromRequest(request);
            if (tenantId != null && !tenantId.isBlank()) {
                TenantContext.setTenantId(tenantId);
                log.debug("TenantFilter → tenantId={} para {}", tenantId, request.getRequestURI());
            }
            filterChain.doFilter(request, response);
        } finally {
            // Siempre limpiar para evitar memory leaks en el pool de hilos
            TenantContext.clear();
        }
    }

    private String extractTenantIdFromRequest(HttpServletRequest request) {
        // 1. Intentar desde header X-Tenant-ID (lo inyecta Kong)
        String headerTenant = request.getHeader("X-Tenant-ID");
        if (headerTenant != null && !headerTenant.isBlank()) {
            return headerTenant;
        }

        // 2. Fallback: extraer directamente del JWT (sin re-validar firma,
        //    Spring Security ya lo valida antes de llegar aquí)
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // También aceptar token por query string (SSE)
            String queryToken = request.getParameter("token");
            if (queryToken != null) {
                return parseTenantFromToken(queryToken);
            }
            return null;
        }
        return parseTenantFromToken(authHeader.substring(7));
    }

    private String parseTenantFromToken(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            return claims.getStringClaim("tenantId");
        } catch (Exception e) {
            log.debug("No se pudo parsear tenantId del token: {}", e.getMessage());
            return null;
        }
    }
}
