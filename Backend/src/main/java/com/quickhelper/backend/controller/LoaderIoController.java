package com.quickhelper.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LoaderIoController {

    private static final String TOKEN = "loaderio-355a87edf106e0c251abbe99824a6bba";

    // Loader.io verifies domain by hitting: /loaderio-TOKEN.txt
    // and expecting the token string as the exact response body
    @GetMapping(value = "/loaderio-355a87edf106e0c251abbe99824a6bba.txt",
                produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> loaderIoVerification() {
        return ResponseEntity.ok(TOKEN);
    }
}
