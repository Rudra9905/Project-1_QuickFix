package com.quickhelper.backend.service;

import com.quickhelper.backend.config.RabbitMQConfig;
import com.quickhelper.backend.dto.NotificationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NOTIFICATIONS)
    public void receiveNotification(NotificationEvent event) {
        System.out.println("Message received from queue: " + event.getTitle());
        
        try {
            notificationService.createAndSendNotification(
                event.getUserId(),
                event.getUserRole(),
                event.getType(),
                event.getTitle(),
                event.getMessage(),
                event.isHighPriority(),
                event.getReferenceId()
            );
        } catch (Exception e) {
            System.err.println("Error processing notification from queue: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
