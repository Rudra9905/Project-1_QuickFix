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

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    public ProblemAnalysisDto analyzeProblem(MultipartFile image, Double lat, Double lng) throws IOException {
        System.out.println("=== AI Analysis Request Received ===");
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            System.err.println("CRITICAL: GEMINI_API_KEY is missing or empty. Check your .env file.");
        } else {
            System.out.println("GEMINI_API_KEY is present (Length: " + geminiApiKey.length() + ")");
        }

        // 1. Upload image to Cloudinary (for reference/storage)
        try {
             fileStorageService.storeFile(image, Set.of("image/jpeg", "image/png", "image/jpg", "image/webp"), 10 * 1024 * 1024, "ai-problems");
        } catch (Exception e) {
            System.err.println("Warning: Cloudinary upload failed, proceeding with analysis: " + e.getMessage());
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
                System.out.println("Gemini API returned: description='" + analysis.issueDescription() + "', serviceType=" + analysis.serviceType());
            } catch (Exception e) {
                System.err.println("Gemini API call failed: " + e.getMessage());
                e.printStackTrace();
                analysis = getMockAnalysis();
                analysis = new AnalyzedResult(analysis.issueDescription() + " (AI Analysis Failed - Using Fallback)", analysis.serviceType());
            }
        }

        // 3. Find Providers
        List<ProviderProfile> providers;
        if (lat != null && lng != null) {
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

        // --- Build request body ---

        // Image part
        Map<String, Object> inlineData = new HashMap<>();
        inlineData.put("mime_type", mimeType);
        inlineData.put("data", base64Image);

        Map<String, Object> imagePart = new HashMap<>();
        imagePart.put("inline_data", inlineData);

        // Text prompt — explicitly specify the exact JSON key names
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text",
                "You are a household maintenance diagnosis AI assistant. " +
                "Carefully analyze this image and identify the specific household maintenance or repair issue visible in it. " +
                "Provide a clear, helpful description of the problem you see. " +
                "Then determine which type of service professional would best handle this issue. " +
                "Respond with a JSON object containing exactly these two fields:\n" +
                "- \"description\": a clear 1-2 sentence description of the issue you identified\n" +
                "- \"serviceType\": exactly one of these values: PLUMBER, ELECTRICIAN, CLEANER, CARPENTER, PAINTER, LAUNDRY, OTHER\n\n" +
                "Examples:\n" +
                "- Leaking faucet/pipe → {\"description\": \"Leaking faucet with water dripping from the spout\", \"serviceType\": \"PLUMBER\"}\n" +
                "- Broken switch/wiring → {\"description\": \"Damaged electrical outlet with exposed wiring\", \"serviceType\": \"ELECTRICIAN\"}\n" +
                "- Broken furniture → {\"description\": \"Cracked wooden chair leg needing repair\", \"serviceType\": \"CARPENTER\"}\n" +
                "- Dirty/messy room → {\"description\": \"Room requires deep cleaning\", \"serviceType\": \"CLEANER\"}\n" +
                "- Wall paint peeling → {\"description\": \"Paint peeling off the wall due to moisture\", \"serviceType\": \"PAINTER\"}"
        );

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(textPart, imagePart));

        // Generation config — force JSON output with exact schema
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("responseSchema", Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "description", Map.of("type", "STRING"),
                        "serviceType", Map.of(
                                "type", "STRING",
                                "enum", List.of("PLUMBER", "ELECTRICIAN", "CLEANER", "CARPENTER", "PAINTER", "LAUNDRY", "OTHER")
                        )
                ),
                "required", List.of("description", "serviceType")
        ));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));
        requestBody.put("generationConfig", generationConfig);

        // Execute Request
        String response = restClient.post()
                .uri(GEMINI_URL + geminiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        System.out.println("Raw Gemini response: " + (response != null ? response.substring(0, Math.min(response.length(), 500)) : "null"));

        return parseGeminiResponse(response);
    }

    private AnalyzedResult parseGeminiResponse(String jsonResponse) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);

            // Navigate: candidates[0].content.parts[0].text
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode content = candidates.get(0).path("content");
                JsonNode parts = content.path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    String text = parts.get(0).path("text").asText();
                    System.out.println("Gemini text output: " + text);

                    // Clean markdown if present (```json ... ```)
                    text = text.replaceAll("```json", "").replaceAll("```", "").trim();

                    JsonNode resultNode = mapper.readTree(text);

                    // Try multiple possible key names for the description
                    String description = tryGetString(resultNode, "Unknown Issue",
                            "description", "issue", "problem", "issueDescription",
                            "issue_description", "diagnosis", "finding");

                    // Try multiple possible key names for the service type
                    String serviceTypeStr = tryGetString(resultNode, "OTHER",
                            "serviceType", "service_type", "expertise", "category",
                            "provider_type", "providerType", "service", "type").toUpperCase();

                    System.out.println("Parsed: description='" + description + "', serviceType='" + serviceTypeStr + "'");

                    ServiceType serviceType;
                    try {
                        serviceType = ServiceType.valueOf(serviceTypeStr);
                    } catch (IllegalArgumentException e) {
                        System.err.println("Unknown service type: '" + serviceTypeStr + "', falling back to OTHER");
                        serviceType = ServiceType.OTHER;
                    }

                    return new AnalyzedResult(description, serviceType);
                }
            }

            // If candidates are empty, check for error
            JsonNode error = root.path("error");
            if (!error.isMissingNode()) {
                System.err.println("Gemini API returned error: " + error.path("message").asText());
            }
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini response: " + e.getMessage());
            e.printStackTrace();
        }
        return getMockAnalysis();
    }

    /**
     * Try multiple JSON key names and return the first non-missing value.
     */
    private String tryGetString(JsonNode node, String defaultValue, String... keys) {
        for (String key : keys) {
            JsonNode value = node.path(key);
            if (!value.isMissingNode() && !value.asText().isEmpty()) {
                return value.asText();
            }
        }
        return defaultValue;
    }

    private record AnalyzedResult(String issueDescription, ServiceType serviceType) {}

    private AnalyzedResult getMockAnalysis() {
        return new AnalyzedResult("Detected a potential water leakage or plumbing issue based on visual analysis.", ServiceType.PLUMBER);
    }
}
