package ec.edu.espe.usuarios.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration("appSecurityConfig")
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Filter chain para los endpoints de la API REST (/api/users, /api/roles, /api/auth).
     * Sin autenticación requerida — solo para pruebas.
     * @Order(2) garantiza que la cadena OAuth de oauth/config/SecurityConfig
     * (sin @Order, por defecto Order(100)) procese primero los endpoints OAuth.
     */
    @Order(1)
    @Bean(name = "appSecurityFilterChain")
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher(
                "/api/users/**", "/api/roles/**", "/api/auth/**",
                "/health", "/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html"
            )
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
