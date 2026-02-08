package com.quickhelper.backend.service;

import com.quickhelper.backend.config.RabbitMQConfig;
import com.quickhelper.backend.dto.NotificationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendNotification(NotificationEvent event) {
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.EXCHANGE_NOTIFICATIONS,
            RabbitMQConfig.ROUTING_KEY_NOTIFICATIONS,
            event
        );
        System.out.println("Message sent to queue: " + event.getTitle());
    }
}
