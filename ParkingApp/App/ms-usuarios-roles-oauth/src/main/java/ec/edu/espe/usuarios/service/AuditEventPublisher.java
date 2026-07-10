package ec.edu.espe.usuarios.service;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuditEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    private static final String EXCHANGE = "audit-exchange";

    public void publishUserEvent(String action,
                                 String userId,
                                 String username,
                                 String dni,
                                 String firstName,
                                 String lastName,
                                 String email) {

        try {

            Map<String, Object> datos = new HashMap<>();
            datos.put("id", userId);
            datos.put("dni", dni);
            datos.put("nombre", firstName);
            datos.put("apellido", lastName);
            datos.put("email", email);

            Map<String, Object> event = new HashMap<>();

            event.put("servicio", "ms_usuarios");
            event.put("accion", action);
            event.put("entidad", "USUARIO");
            event.put("datos", datos);
            event.put("usuario", username);
            event.put("ip", "127.0.0.1");
            event.put("mac", "00:00:00:00:00:00");

            String routingKey = "audit.usuario." + action.toLowerCase();

            System.out.println("========== ENVIANDO ==========");
            System.out.println(event);

            rabbitTemplate.convertAndSend(EXCHANGE, routingKey, event);

            System.out.println("========== ENVIADO ==========");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}