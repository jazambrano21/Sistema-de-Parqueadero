package com.example.zonas.config;

/**
 * Almacena el tenantId del request actual en un ThreadLocal.
 * Cada hilo (request HTTP) tiene su propio valor aislado.
 * Se inicializa en TenantFilter al inicio de cada request
 * y se limpia al finalizar para evitar memory leaks.
 */
public class TenantContext {

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {}

    public static void setTenantId(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static String getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }

    public static boolean hasTenant() {
        String id = CURRENT_TENANT.get();
        return id != null && !id.isBlank();
    }
}
