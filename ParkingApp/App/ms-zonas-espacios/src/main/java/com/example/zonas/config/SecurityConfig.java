package com.example.zonas.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth

                // GET públicos exactos
                .requestMatchers(HttpMethod.GET, "/api/zonas").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/espacios").permitAll()

                // GET públicos con ID o subrutas
                .requestMatchers(HttpMethod.GET, "/api/zonas/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/espacios/**").permitAll()

                // Swagger público
                .requestMatchers(
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/swagger-ui.html"
                ).permitAll()

                // POST, PUT, PATCH, DELETE protegidos
                .anyRequest().authenticated()
            );

        return http.build();
    }
}