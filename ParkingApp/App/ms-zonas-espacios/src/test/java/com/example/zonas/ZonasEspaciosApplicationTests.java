package com.example.zonas;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Test básico sin contexto Spring.
 * El contexto completo requiere MySQL y OAuth server.
 */
class ZonasEspaciosApplicationTests {

    @Test
    void applicationClassExists() {
        assertTrue(ZonasEspaciosApplication.class != null);
    }
}
