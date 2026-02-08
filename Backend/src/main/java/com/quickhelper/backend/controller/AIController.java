package com.quickhelper.backend.controller;

import com.quickhelper.backend.dto.ProblemAnalysisDto;
import com.quickhelper.backend.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping(value = "/analyze-problem", consumes = { "multipart/form-data" })
    public ResponseEntity<ProblemAnalysisDto> analyzeProblem(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng) {
        try {
            ProblemAnalysisDto response = aiService.analyzeProblem(image, lat, lng);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
