package hack.thegsucoders.speechmate.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;

import java.util.Map;
import java.util.HashMap;
import java.util.List;

@Service
public class GeminiService {

    @Value("${GEMINI_API_KEY}")
    private String apiKey;

    private final WebClient webClient;

    public GeminiService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
            .baseUrl("https://generativelanguage.googleapis.com")
            .build();
    }

    /**
     * Generate speech outline using Gemini 2.0 Flash
     * Frontend fields: topic, tone, style, audience, keyMessage, seconds
     */
    public Map<String, Object> generateOutline(Map<String, Object> params) {
        // Extract parameters from frontend
        String topic = (String) params.getOrDefault("topic", "A speech topic");
        String tone = (String) params.getOrDefault("tone", "professional");
        String style = (String) params.getOrDefault("style", "informative");
        String audience = (String) params.getOrDefault("audience", "general audience");
        String keyMessage = (String) params.getOrDefault("keyMessage", "");
        
        Object secondsObj = params.get("seconds");
        int seconds = secondsObj != null ? ((Number) secondsObj).intValue() : 300; // Default 5 minutes
        int minutes = seconds / 60;
        
        // Build comprehensive prompt for outline generation
        String prompt = String.format(
            "You are a professional speech coach. Generate a detailed speech outline for the following specifications:\n\n" +
            "Topic: %s\n" +
            "Audience: %s\n" +
            "Duration: %d minutes (%d seconds)\n" +
            "Tone: %s\n" +
            "Style: %s\n" +
            "%s" +
            "\n" +
            "Generate a structured speech outline in JSON format with this exact structure:\n" +
            "{\n" +
            "  \"title\": \"compelling speech title\",\n" +
            "  \"goal_minutes\": %d,\n" +
            "  \"thesis\": \"clear main thesis statement\",\n" +
            "  \"sections\": [\n" +
            "    {\n" +
            "      \"heading\": \"Introduction\",\n" +
            "      \"purpose\": \"Hook the audience and present thesis\",\n" +
            "      \"talking_points\": [\"attention grabber\", \"thesis statement\", \"preview main points\"],\n" +
            "      \"evidence\": [\"relevant statistic or anecdote\"],\n" +
            "      \"time_hint_sec\": 45\n" +
            "    },\n" +
            "    {\n" +
            "      \"heading\": \"Main Point 1\",\n" +
            "      \"purpose\": \"develop first key argument\",\n" +
            "      \"talking_points\": [\"specific points to cover\"],\n" +
            "      \"evidence\": [\"supporting facts, examples, or data\"],\n" +
            "      \"time_hint_sec\": 90\n" +
            "    }\n" +
            "    // Include 2-4 main sections based on duration\n" +
            "  ],\n" +
            "  \"closing\": {\n" +
            "    \"call_to_action\": \"what you want audience to do\",\n" +
            "    \"takeaway\": \"memorable final thought\"\n" +
            "  }\n" +
            "}\n\n" +
            "Ensure time_hint_sec values add up to approximately %d seconds total. " +
            "Make the outline specific, actionable, and tailored to the %s tone and %s style. " +
            "Return ONLY valid JSON, no additional text.",
            topic, 
            audience, 
            minutes, 
            seconds, 
            tone, 
            style, 
            keyMessage.isEmpty() ? "" : "Key Message: " + keyMessage + "\n",
            minutes, 
            seconds, 
            tone, 
            style
        );
        
        // Build request body for Gemini API with explicit types
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(textPart));
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));
        
        // Add generation config for better JSON output
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.7);
        generationConfig.put("topK", 40);
        generationConfig.put("topP", 0.95);
        generationConfig.put("maxOutputTokens", 2048);
        requestBody.put("generationConfig", generationConfig);
        
        try {
            // Call Gemini 2.0 Flash API
            @SuppressWarnings("unchecked")
            Map<String, Object> response = (Map<String, Object>) webClient.post()
                .uri("/v1beta/models/gemini-2.0-flash-exp:generateContent?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate outline: " + e.getMessage(), e);
        }
    }

    
    /**
     * Generate quick speech tips using Gemini 2.0 Flash-Lite (fastest, cheapest model)
     * Perfect for pre-generating on login and caching
     * @param count Number of tips to generate (default 20)
     * @return List of speech tips
     */
    public Map<String, Object> generateSpeechTips(Integer count) {
        int tipCount = count != null ? count : 20;
        
        String prompt = String.format(
            "Generate %d practical, actionable public speaking tips. " +
            "Each tip should be 1-2 sentences, covering areas like: " +
            "body language, vocal variety, pacing, confidence, audience engagement, " +
            "storytelling, slide design, handling nerves, time management, and delivery techniques.\n\n" +
            "Return as a JSON array:\n" +
            "{\n" +
            "  \"tips\": [\n" +
            "    \"Maintain eye contact with different sections of the audience for 3-5 seconds at a time.\",\n" +
            "    \"Pause for 2-3 seconds after making a key point to let it sink in.\",\n" +
            "    ...\n" +
            "  ]\n" +
            "}\n\n" +
            "Make tips specific, memorable, and immediately actionable. Return ONLY valid JSON.",
            tipCount
        );
        
        // Build request body with explicit types
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(textPart));
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));
        
        // Optimize for speed
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.8);
        generationConfig.put("maxOutputTokens", 1024);
        requestBody.put("generationConfig", generationConfig);
        
        try {
            // Call Gemini 2.0 Flash-Lite (fastest model)
            @SuppressWarnings("unchecked")
            Map<String, Object> response = (Map<String, Object>) webClient.post()
                .uri("/v1beta/models/gemini-2.0-flash-lite:generateContent?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate speech tips: " + e.getMessage(), e);
        }
    }
}
