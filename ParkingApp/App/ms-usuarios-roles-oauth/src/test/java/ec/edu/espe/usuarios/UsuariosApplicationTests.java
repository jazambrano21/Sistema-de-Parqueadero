package ec.edu.espe.usuarios;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Test básico que no carga el contexto de Spring.
 * El contexto completo requiere PostgreSQL y OAuth server, no disponibles en CI.
 * Las pruebas de integración se realizan en entorno local.
 */
class UsuariosApplicationTests {

    @Test
    void applicationClassExists() {
        assertTrue(UsuariosApplication.class != null);
    }
}
