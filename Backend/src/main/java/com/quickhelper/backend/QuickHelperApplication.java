package com.quickhelper.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
// Application entry point enabling async execution for notifications
public class QuickHelperApplication {
    public static void main(String[] args) {
        SpringApplication.run(QuickHelperApplication.class, args);
    }
}