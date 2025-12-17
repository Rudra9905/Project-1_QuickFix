package com.quickhelper.backend.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.function.Supplier;

@Component
// Lightweight logging helper with levels, timing, and retry utilities
public class DebugUtil {
    private static final Logger logger = LoggerFactory.getLogger(DebugUtil.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    // Debug levels
    public enum DebugLevel {
        NONE(0),
        ERROR(1),
        WARN(2),
        INFO(3),
        DEBUG(4),
        TRACE(5);

        private final int level;

        DebugLevel(int level) {
            this.level = level;
        }

        public int getLevel() {
            return level;
        }
    }

    // Current debug level - can be adjusted based on environment
    private static final DebugLevel CURRENT_DEBUG_LEVEL = DebugLevel.DEBUG;

    /**
     * Log a message with a specific level
     */
    public static void log(DebugLevel level, String message, Object... args) {
        if (level.getLevel() <= CURRENT_DEBUG_LEVEL.getLevel()) {
            String timestamp = LocalDateTime.now().format(formatter);
            String levelStr = level.name();
            String formattedMessage = String.format("[%s] [%s] %s", timestamp, levelStr, message);

            switch (level) {
                case ERROR:
                    logger.error(formattedMessage, args);
                    break;
                case WARN:
                    logger.warn(formattedMessage, args);
                    break;
                case INFO:
                    logger.info(formattedMessage, args);
                    break;
                case DEBUG:
                case TRACE:
                    logger.debug(formattedMessage, args);
                    break;
                default:
                    logger.info(formattedMessage, args);
            }
        }
    }

    /**
     * Log an error message
     */
    public static void logError(String message, Object... args) {
        log(DebugLevel.ERROR, message, args);
    }

    /**
     * Log a warning message
     */
    public static void logWarn(String message, Object... args) {
        log(DebugLevel.WARN, message, args);
    }

    /**
     * Log an info message
     */
    public static void logInfo(String message, Object... args) {
        log(DebugLevel.INFO, message, args);
    }

    /**
     * Log a debug message
     */
    public static void logDebug(String message, Object... args) {
        log(DebugLevel.DEBUG, message, args);
    }

    /**
     * Log a trace message
     */
    public static void logTrace(String message, Object... args) {
        log(DebugLevel.TRACE, message, args);
    }

    /**
     * Measure execution time of a block of code
     */
    public static <T> T measureExecutionTime(Supplier<T> supplier, String operationName) {
        long start = System.currentTimeMillis();
        try {
            T result = supplier.get();
            long end = System.currentTimeMillis();
            logDebug("Operation '{}' executed in {}ms", operationName, (end - start));
            return result;
        } catch (Exception e) {
            long end = System.currentTimeMillis();
            logError("Operation '{}' failed after {}ms", operationName, (end - start));
            throw e;
        }
    }

    /**
     * Retry a function with exponential backoff
     */
    public static <T> T retryWithBackoff(Supplier<T> supplier, int maxRetries, long baseDelay) {
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logDebug("Attempt {}/{}", attempt, maxRetries);
                return supplier.get();
            } catch (Exception e) {
                lastException = e;
                logWarn("Attempt {} failed: {}", attempt, e.getMessage());

                if (attempt < maxRetries) {
                    long delay = baseDelay * (long) Math.pow(2, attempt - 1);
                    logDebug("Waiting {}ms before retrying...", delay);
                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Interrupted during retry", ie);
                    }
                }
            }
        }

        logError("All {} attempts failed", maxRetries);
        throw new RuntimeException("Operation failed after " + maxRetries + " attempts", lastException);
    }
}