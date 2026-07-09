package ec.edu.espe.usuarios.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    @Bean
    public TopicExchange auditExchange() {
        return new TopicExchange("audit-exchange", true, false);
    }
}