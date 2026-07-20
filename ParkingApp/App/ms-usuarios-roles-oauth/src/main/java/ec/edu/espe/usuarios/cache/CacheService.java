package ec.edu.espe.usuarios.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class CacheService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public <T> T get(
            String key,
            Class<T> type
    ) {
        try {
            String json = redisTemplate
                    .opsForValue()
                    .get(key);

            if (json == null) {
                log.info(
                        "Cache get: {} -> MISS",
                        key
                );

                return null;
            }

            log.info(
                    "Cache get: {} -> HIT",
                    key
            );

            return objectMapper.readValue(
                    json,
                    type
            );

        } catch (Exception exception) {
            log.error(
                    "Error obteniendo la clave {}: {}",
                    key,
                    exception.getMessage()
            );

            return null;
        }
    }

    public <T> T get(
            String key,
            TypeReference<T> type
    ) {
        try {
            String json = redisTemplate
                    .opsForValue()
                    .get(key);

            if (json == null) {
                log.info(
                        "Cache get: {} -> MISS",
                        key
                );

                return null;
            }

            log.info(
                    "Cache get: {} -> HIT",
                    key
            );

            return objectMapper.readValue(
                    json,
                    type
            );

        } catch (Exception exception) {
            log.error(
                    "Error obteniendo la clave {}: {}",
                    key,
                    exception.getMessage()
            );

            return null;
        }
    }

    public void set(
            String key,
            Object value,
            long ttlSeconds
    ) {
        try {
            String json = objectMapper
                    .writeValueAsString(value);

            redisTemplate
                    .opsForValue()
                    .set(
                            key,
                            json,
                            Duration.ofSeconds(
                                    ttlSeconds
                            )
                    );

            log.info(
                    "Cache set: {} (TTL: {}s)",
                    key,
                    ttlSeconds
            );

        } catch (Exception exception) {
            log.error(
                    "Error guardando la clave {}: {}",
                    key,
                    exception.getMessage()
            );
        }
    }

    public void delete(String key) {
        try {
            redisTemplate.delete(key);

            log.info(
                    "Cache del: {}",
                    key
            );

        } catch (Exception exception) {
            log.error(
                    "Error eliminando la clave {}: {}",
                    key,
                    exception.getMessage()
            );
        }
    }

    public boolean exists(String key) {
        try {
            Boolean exists =
                    redisTemplate.hasKey(key);

            boolean result =
                    Boolean.TRUE.equals(exists);

            log.info(
                    "Cache exists: {} -> {}",
                    key,
                    result ? "HIT" : "MISS"
            );

            return result;

        } catch (Exception exception) {
            log.error(
                    "Error comprobando la clave {}: {}",
                    key,
                    exception.getMessage()
            );

            return false;
        }
    }
}