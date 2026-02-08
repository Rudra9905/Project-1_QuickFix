package com.quickhelper.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickhelper.backend.dto.ProblemAnalysisDto;
import com.quickhelper.backend.model.ProviderProfile;
import com.quickhelper.backend.model.ServiceType;
import com.quickhelper.backend.repository.ProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AIService {

    private final FileStorageService fileStorageService;
    private final ProviderProfileRepository providerProfileRepository;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    // Using gemini-1.5-flash for speed and cost efficiency
    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=";

    public ProblemAnalysisDto analyzeProblem(MultipartFile image, Double lat, Double lng) throws IOException {
        // Debug logging
        System.out.println("Analyze Problem Request Received.");
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            System.err.println("CRITICAL: GEMINI_API_KEY is missing or empty in AIService. Check your .env file and application.properties.");
        } else {
            System.out.println("GEMINI_API_KEY is present (Length: " + geminiApiKey.length() + ")");
        }

        // 1. Upload image to Cloudinary (for reference/storage)
        try {
             fileStorageService.storeFile(image, Set.of("image/jpeg", "image/png", "image/jpg", "image/webp"), 10 * 1024 * 1024, "ai-problems");
        } catch (Exception e) {
            System.err.println("Warning: Cloudinary upload failed, but proceeding with analysis: " + e.getMessage());
        }

        // 2. Call Gemini
        AnalyzedResult analysis;
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            System.out.println("Using Mock Data because API Key is null/empty.");
            analysis = getMockAnalysis();
        } else {
            try {
                System.out.println("Calling Gemini API...");
                analysis = callGemini(image);
                System.out.println("Gemini API returned successfully.");
            } catch (Exception e) {
                System.err.println("Gemini API call failed with exception: " + e.getMessage());
                e.printStackTrace();
                analysis = getMockAnalysis();
                analysis = new AnalyzedResult(analysis.issueDescription() + " (AI Analysis Failed - Using Fallback)", analysis.serviceType());
            }
        }

        // 3. Find Providers
        List<ProviderProfile> providers;
        if (lat != null && lng != null) {
            // Search within 50km
            providers = providerProfileRepository.findByServiceTypeAndDistance(analysis.serviceType(), lat, lng, 50.0);
        } else {
            providers = providerProfileRepository.findByServiceTypeAndIsAvailableTrue(analysis.serviceType());
        }

        return new ProblemAnalysisDto(analysis.issueDescription(), analysis.serviceType(), providers);
    }

    private AnalyzedResult callGemini(MultipartFile image) throws IOException {
        RestClient restClient = RestClient.create();

        String base64Image = Base64.getEncoder().encodeToString(image.getBytes());
        String mimeType = image.getContentType() != null ? image.getContentType() : "image/jpeg";

        // Construct Request Body
        Map<String, Object> inlineData = new HashMap<>();
        inlineData.put("mime_type", mimeType);
        inlineData.put("data", base64Image);

        Map<String, Object> imagePart = new HashMap<>();
        imagePart.put("inline_data", inlineData);

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", "Analyze this image. Identify the household maintenance issue (e.g., leaking pipe, spark, broken furniture). " +
                "Then, determine the best service provider type for this issue from this exact list: [PLUMBER, ELECTRICIAN, CLEANER, LAUNDRY, OTHER]. " +
                "Return result strictly as JSON with keys: 'description' (short text) and 'serviceType' (enum value). " +
                "Do NOT use markdown code blocks.");

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(textPart, imagePart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));

        // Execute Request
        String response = restClient.post()
                .uri(GEMINI_URL + geminiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        return parseGeminiResponse(response);
    }

    private AnalyzedResult parseGeminiResponse(String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            // Navigate: candidates[0].content.parts[0].text
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode content = candidates.get(0).path("content");
                JsonNode parts = content.path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    String text = parts.get(0).path("text").asText();
                    
                    // Clean markdown if present (```json ... ```)
                    text = text.replaceAll("```json", "").replaceAll("```", "").trim();
                    
                    JsonNode resultNode = objectMapper.readTree(text);
                    String description = resultNode.path("description").asText("Unknown Issue");
                    String serviceTypeStr = resultNode.path("serviceType").asText("OTHER").toUpperCase();
                    
                    ServiceType serviceType;
                    try {
                        serviceType = ServiceType.valueOf(serviceTypeStr);
                    } catch (IllegalArgumentException e) {
                        serviceType = ServiceType.OTHER;
                    }
                    
                    return new AnalyzedResult(description, serviceType);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini response: " + e.getMessage());
        }
        return getMockAnalysis();
    }

    private record AnalyzedResult(String issueDescription, ServiceType serviceType) {}

    private AnalyzedResult getMockAnalysis() {
        return new AnalyzedResult("Detected a potential water leakage or plumbing issue based on visual analysis.", ServiceType.PLUMBER);
    }
}
