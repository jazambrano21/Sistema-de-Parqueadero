package com.example.zonas.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // GET públicos
                .requestMatchers(HttpMethod.GET, "/api/zonas").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/zonas/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/espacios").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/espacios/**").permitAll()

                // TEMPORAL: POST públicos para validar auditoría
                .requestMatchers(HttpMethod.POST, "/api/zonas").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/espacios").permitAll()

                // Swagger público
                .requestMatchers(
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/swagger-ui.html"
                ).permitAll()

                // Lo demás protegido
                .anyRequest().authenticated()
            );

        return http.build();
    }
}