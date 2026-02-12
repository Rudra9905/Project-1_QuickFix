package com.quickhelper.backend.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class RabbitMQConfig {

    private static final Logger logger = LoggerFactory.getLogger(RabbitMQConfig.class);

    @Autowired
    private Environment env;

    @Value("${spring.rabbitmq.uri:}")
    private String rabbitMqUri;

    public static final String QUEUE_NOTIFICATIONS = "q.notifications";
    public static final String EXCHANGE_NOTIFICATIONS = "ex.notifications";
    public static final String ROUTING_KEY_NOTIFICATIONS = "routing.notifications";

    @PostConstruct
    public void logConfig() {
        logger.info("🐰 RabbitMQ Config Initialized");
        logger.info("🐰 RABBIT_URL env: {}", env.getProperty("RABBIT_URL"));
        logger.info("🐰 spring.rabbitmq.uri property: {}", rabbitMqUri);
    }

    @Bean
    public ConnectionFactory connectionFactory() {
        String uri = env.getProperty("RABBIT_URL");
        if (uri == null || uri.isEmpty()) {
            uri = rabbitMqUri;
        }

        if (uri == null || uri.isEmpty()) {
            logger.warn("⚠️ No RabbitMQ URI found! Defaulting to localhost.");
            return new CachingConnectionFactory("localhost");
        }

        try {
            logger.info("🐰 Setting up RabbitMQ connection to: {}", uri.replaceAll(":[^:@]+@", ":****@")); // Mask password
            URI rabbitUri = new URI(uri);
            
            CachingConnectionFactory factory = new CachingConnectionFactory();
            factory.setUri(rabbitUri);
            return factory;
        } catch (URISyntaxException e) {
            logger.error("❌ Invalid RabbitMQ URI: {}", e.getMessage());
            throw new RuntimeException("Invalid RabbitMQ URI", e);
        }
    }

    @Bean
    public Queue notificationQueue() {
        return new Queue(QUEUE_NOTIFICATIONS, true);
    }

    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(EXCHANGE_NOTIFICATIONS);
    }

    @Bean
    public Binding binding(Queue queue, TopicExchange exchange) {
        return BindingBuilder.bind(queue).to(exchange).with(ROUTING_KEY_NOTIFICATIONS);
    }

    @Bean
    public MessageConverter converter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public AmqpTemplate amqpTemplate(ConnectionFactory connectionFactory) {
        final RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(converter());
        return rabbitTemplate;
    }
}
