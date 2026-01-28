package com.quickhelper.backend.service;

import com.quickhelper.backend.model.ServiceType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class CacheWarmupService {

    private static final Logger logger = LoggerFactory.getLogger(CacheWarmupService.class);

    @Autowired
    private ProviderService providerService;

    @EventListener(ApplicationReadyEvent.class)
    @Async
    public void warmUpCaches() {
        logger.info("🔥 Cache warmup started...");
        long startTime = System.currentTimeMillis();

        try {
            // Warm up global provider list
            logger.info("Warming up all providers cache...");
            providerService.getAllProviders(null);
            
            // Warm up specific service types
            for (ServiceType type : ServiceType.values()) {
                providerService.getAvailableProviders(type, null);
            }

            long duration = System.currentTimeMillis() - startTime;
            logger.info("✅ Cache warmup completed in {} ms", duration);
        } catch (Exception e) {
            logger.error("❌ Cache warmup failed", e);
        }
    }
}
