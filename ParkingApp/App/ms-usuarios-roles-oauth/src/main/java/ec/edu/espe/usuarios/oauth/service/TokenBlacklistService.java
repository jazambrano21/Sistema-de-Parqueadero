package ec.edu.espe.usuarios.oauth.service;

import ec.edu.espe.usuarios.cache.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private static final String PREFIX =
            "tokens:blacklist:";

    private static final long TOKEN_TTL_SECONDS =
            3600;

    private final CacheService cacheService;

    public void revoke(String token) {
        String cacheKey =
                PREFIX + token;

        cacheService.set(
                cacheKey,
                "revoked",
                TOKEN_TTL_SECONDS
        );

        log.info(
                "Token agregado a blacklist en Redis"
        );
    }

    public boolean isRevoked(String token) {
        String cacheKey =
                PREFIX + token;

        return cacheService.exists(
                cacheKey
        );
    }
}