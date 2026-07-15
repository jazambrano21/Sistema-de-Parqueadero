package ec.edu.espe.usuarios.oauth.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Generación/validación de token y registro/login → públicos
                .requestMatchers(
                        "/api/oauth/token/generate",
                        "/api/oauth/token/revoke",
                        "/api/oauth/token/validate",
                        "/.well-known/jwks.json",
                        "/api/auth/**"
                ).permitAll()

                // Swagger / OpenAPI — público
                .requestMatchers(
                        "/swagger-ui/**", "/swagger-ui.html",
                        "/v3/api-docs/**", "/api-docs/**"
                ).permitAll()

                // Crear roles y asignar roles a un usuario → solo ADMIN
                .requestMatchers(HttpMethod.POST, "/api/roles").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/users/*/roles/*").hasRole("ADMIN")

                // Resto de usuarios/roles → requiere JWT válido
                .requestMatchers("/api/users/**", "/api/roles/**").authenticated()

                .anyRequest().authenticated()
            )
            // Aquí estaba el problema principal: nunca se conectaba el JwtDecoder
            // ni el converter, así que ningún token se validaba de verdad
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                        .decoder(jwtDecoder)
                        .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            );

        return http.build();
    }

    // Mapea el claim "roles" del JWT a authorities con prefijo ROLE_.
    // Normaliza el prefijo en vez de asumirlo: si el rol ya viene como
    // "ROLE_ADMIN" no lo duplica, si viene como "ADMIN" se lo agrega.
    // Así funciona sin importar cómo esté guardado el nombre del rol en tu BD.
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            List<String> roles = jwt.getClaimAsStringList("roles");
            if (roles == null) {
                return List.of();
            }
            return roles.stream()
                    .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
                    .map(r -> (GrantedAuthority) new SimpleGrantedAuthority(r))
                    .collect(Collectors.toList());
        });
        return converter;
    }

    // ── RSA Key pair (se regenera en cada arranque; en prod usar keystore) ────
    @Bean
    public RSAKey rsaKey() {
        try {
            KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
            gen.initialize(2048);
            KeyPair kp = gen.generateKeyPair();
            return new RSAKey.Builder((RSAPublicKey) kp.getPublic())
                    .privateKey((RSAPrivateKey) kp.getPrivate())
                    .keyID(UUID.randomUUID().toString())
                    .build();
        } catch (Exception ex) {
            throw new IllegalStateException("Error generando clave RSA", ex);
        }
    }

    @Bean
    public JWKSource<SecurityContext> jwkSource(RSAKey rsaKey) {
        return new ImmutableJWKSet<>(new JWKSet(rsaKey));
    }

    @Bean
    public JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }

    @Bean
    public JwtDecoder jwtDecoder(RSAKey rsaKey) throws Exception {
        return NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey()).build();
    }
}
