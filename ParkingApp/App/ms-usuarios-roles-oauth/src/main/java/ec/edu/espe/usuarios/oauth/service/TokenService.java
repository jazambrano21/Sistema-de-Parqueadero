package ec.edu.espe.usuarios.oauth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private static final long EXPIRY_HOURS = 1;

    @Value("${oauth.server.url:http://localhost:8082}")
    private String issuerUrl;

    public TokenService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    /**
     * Genera un JWT firmado RSA-256 con los roles y el tenantId del usuario.
     * El claim "roles" es leído por todos los Resource Servers para autorizar.
     * El claim "tenantId" es leído por todos los microservicios para filtrar datos.
     */
    public String generate(String username, List<String> roles, String tenantId) {
        Instant now = Instant.now();
        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuer(issuerUrl)
                .issuedAt(now)
                .expiresAt(now.plus(EXPIRY_HOURS, ChronoUnit.HOURS))
                .subject(username)
                .claim("roles", roles);

        // Solo incluir tenantId si el usuario pertenece a un tenant
        if (tenantId != null && !tenantId.isBlank()) {
            claimsBuilder.claim("tenantId", tenantId);
        }

        return jwtEncoder.encode(JwtEncoderParameters.from(claimsBuilder.build())).getTokenValue();
    }

    /** Sobrecarga sin tenantId para compatibilidad con usuarios SUPERADMIN sin tenant */
    public String generate(String username, List<String> roles) {
        return generate(username, roles, null);
    }

    public long getExpirySeconds() {
        return EXPIRY_HOURS * 3600;
    }
}
