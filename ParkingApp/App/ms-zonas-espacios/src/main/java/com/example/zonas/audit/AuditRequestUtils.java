package com.example.zonas.audit;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

public class AuditRequestUtils {

    public static String extractUser(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            Object username = jwt.getClaims().get("preferred_username");
            if (username instanceof String usernameStr && !usernameStr.isBlank()) {
                return usernameStr;
            }
            Object email = jwt.getClaims().get("email");
            if (email instanceof String emailStr && !emailStr.isBlank()) {
                return emailStr;
            }
            Object sub = jwt.getClaims().get("sub");
            if (sub instanceof String subStr && !subStr.isBlank()) {
                return subStr;
            }
        }
        return "anonymous";
    }

    public static String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("x-forwarded-for");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    public static String extractMac(HttpServletRequest request) {
        String mac = request.getHeader("x-client-mac");
        if (mac == null || mac.isBlank()) {
            mac = request.getHeader("x-mac-address");
        }
        return (mac == null || mac.isBlank()) ? "00:00:00:00:00:00" : mac;
    }
}
