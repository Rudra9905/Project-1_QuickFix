// Debug utilities for the Quick Helper application
// Provides structured logging with different severity levels

// Enable/disable debug mode based on environment
// In development mode, more verbose logging is enabled
// @ts-ignore
const DEBUG_MODE = import.meta.env ? import.meta.env.DEV || false : false;

// Debug levels enum: defines severity levels for logging
// Lower numbers = more critical, higher numbers = more verbose
export enum DebugLevel {
  NONE = 0, // No logging
  ERROR = 1, // Only error messages
  WARN = 2, // Warnings and errors
  INFO = 3, // Informational messages, warnings, and errors
  DEBUG = 4, // Debug messages and all above
  TRACE = 5 // Very verbose trace messages (most detailed)
}

// Current debug level: set based on environment
// Development mode uses DEBUG level, production uses ERROR level only
const CURRENT_DEBUG_LEVEL = DEBUG_MODE ? DebugLevel.DEBUG : DebugLevel.ERROR;

/**
 * Core logging function that logs a message with a specific level
 * Only logs if the message level is at or below the current debug level
 * @param level The debug level of the message (ERROR, WARN, INFO, DEBUG, TRACE)
 * @param message The message string to log
 * @param data Optional additional data to log (objects, arrays, etc.)
 */
export const log = (level: DebugLevel, message: string, ...data: any[]) => {
  // Only log if the message level is at or below the current debug level threshold
  if (level <= CURRENT_DEBUG_LEVEL) {
    const timestamp = new Date().toISOString(); // Get current timestamp in ISO format
    const levelStr = DebugLevel[level]; // Get string representation of debug level
    
    // Use appropriate console method based on severity level
    switch (level) {
      case DebugLevel.ERROR:
        // Errors are always shown, even in production
        console.error(`[${timestamp}] [${levelStr}] ${message}`, ...data);
        break;
      case DebugLevel.WARN:
        // Warnings are shown in development and production
        console.warn(`[${timestamp}] [${levelStr}] ${message}`, ...data);
        break;
      case DebugLevel.INFO:
        // Info messages are shown in development
        console.info(`[${timestamp}] [${levelStr}] ${message}`, ...data);
        break;
      case DebugLevel.DEBUG:
      case DebugLevel.TRACE:
        // Debug and trace messages are only shown in development
        console.debug(`[${timestamp}] [${levelStr}] ${message}`, ...data);
        break;
      default:
        // Fallback to console.log for any other level
        console.log(`[${timestamp}] [${levelStr}] ${message}`, ...data);
    }
  }
};

/**
 * Convenience function to log an error message
 * Errors are always logged, even in production mode
 * @param message The error message to log
 * @param data Optional additional error data
 */
export const logError = (message: string, ...data: any[]) => {
  log(DebugLevel.ERROR, message, ...data);
};

/**
 * Convenience function to log a warning message
 * Warnings are logged in both development and production
 * @param message The warning message to log
 * @param data Optional additional warning data
 */
export const logWarn = (message: string, ...data: any[]) => {
  log(DebugLevel.WARN, message, ...data);
};

/**
 * Convenience function to log an info message
 * Info messages are only logged in development mode
 * @param message The info message to log
 * @param data Optional additional info data
 */
export const logInfo = (message: string, ...data: any[]) => {
  log(DebugLevel.INFO, message, ...data);
};

/**
 * Convenience function to log a debug message
 * Debug messages are only logged in development mode
 * @param message The debug message to log
 * @param data Optional additional debug data
 */
export const logDebug = (message: string, ...data: any[]) => {
  log(DebugLevel.DEBUG, message, ...data);
};

/**
 * Convenience function to log a trace message
 * Trace messages are the most verbose and only logged in development mode
 * @param message The trace message to log
 * @param data Optional additional trace data
 */
export const logTrace = (message: string, ...data: any[]) => {
  log(DebugLevel.TRACE, message, ...data);
};

/**
 * Measures the execution time of an async function
 * Useful for performance profiling and identifying slow operations
 * @param fn The async function to measure
 * @param functionName Name of the function (for logging purposes)
 * @returns The result of the function execution
 * @throws Re-throws any error that occurs during function execution
 */
export const measureExecutionTime = async <T>(
  fn: () => Promise<T>,
  functionName: string
): Promise<T> => {
  const start = performance.now(); // Record start time using high-resolution timer
  try {
    const result = await fn(); // Execute the function
    const end = performance.now(); // Record end time
    // Log execution time in milliseconds (rounded to 2 decimal places)
    logDebug(`Function '${functionName}' executed in ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    // Log error with execution time if function fails
    logError(`Function '${functionName}' failed after ${(end - start).toFixed(2)}ms`, error);
    throw error; // Re-throw the error
  }
};

/**
 * Retries a function with exponential backoff on failure
 * Useful for handling transient network errors or temporary service unavailability
 * @param fn The async function to retry
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param baseDelay Base delay in milliseconds before first retry (default: 1000ms)
 * @returns The result of the function execution
 * @throws The last error if all retry attempts fail
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any; // Store the last error encountered
  
  // Attempt the function up to maxRetries times
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logDebug(`Attempt ${attempt}/${maxRetries}`);
      return await fn(); // If successful, return the result
    } catch (error) {
      lastError = error;
      logWarn(`Attempt ${attempt} failed:`, error);
      
      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        // Exponential backoff: delay doubles with each attempt (1s, 2s, 4s, etc.)
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logDebug(`Waiting ${delay}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay)); // Wait before next attempt
      }
    }
  }
  
  // All attempts failed, throw the last error
  logError(`All ${maxRetries} attempts failed`);
  throw lastError;
};

/**
 * Provides a fallback mechanism for API calls
 * Tries the primary function first, and if it fails, tries a fallback function
 * Useful for implementing backup strategies (e.g., cache fallback, alternative endpoint)
 * @param primaryFn The primary function to try first
 * @param fallbackFn The fallback function to try if primary fails
 * @param errorMessage Error message to include if both functions fail
 * @returns The result from either primary or fallback function
 * @throws Error if both primary and fallback functions fail
 */
export const withFallback = async <T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  errorMessage: string
): Promise<T> => {
  try {
    logDebug('Trying primary function');
    return await primaryFn(); // Try primary function first
  } catch (primaryError) {
    logWarn(`Primary function failed: ${errorMessage}`, primaryError);
    
    try {
      logDebug('Trying fallback function');
      return await fallbackFn(); // If primary fails, try fallback
    } catch (fallbackError) {
      // Both functions failed, log error and throw
      logError(`Fallback function also failed: ${errorMessage}`, fallbackError);
      throw new Error(`${errorMessage}. Both primary and fallback mechanisms failed.`);
    }
  }
};