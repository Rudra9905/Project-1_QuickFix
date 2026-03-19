package com.quickhelper.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * Loader.io domain verification endpoint.
 *
 * HOW TO USE:
 * 1. Sign up at https://loader.io and add your Render URL as a host.
 * 2. Loader.io gives you a token like: loaderio-abc123def456
 * 3. Set LOADERIO_TOKEN=loaderio-abc123def456 in Render environment variables.
 * 4. Redeploy the app.
 * 5. Loader.io verifies at: https://your-app.onrender.com/loaderio-abc123def456.txt
 */
@RestController
public class LoaderIoController {

    @Value("${loaderio.token:loaderio-replace-this-token}")
    private String loaderIoToken;

    // Matches any path like /loaderio-XXXX.txt
    @GetMapping(value = "/loaderio-{token}.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> loaderIoVerification(@PathVariable String token) {
        // Return the full token string that Loader.io expects
        return ResponseEntity.ok(loaderIoToken);
    }
}
