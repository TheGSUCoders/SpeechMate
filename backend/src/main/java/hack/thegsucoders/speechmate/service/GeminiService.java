package hack.thegsucoders.speechmate.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Base64;

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

    /**
     * Analyze uploaded speech materials (video, slides, documents, images) using Gemini 2.5 Pro
     * Provides comprehensive feedback on delivery, content, and areas for improvement
     * @param files List of uploaded files (video, ppt, pdf, images, etc.)
     * @param context Optional context (topic, audience, duration, goals)
     * @return Detailed analysis with scores, feedback, and YouTube recommendations
     */
    public Map<String, Object> analyzeSpeechPerformance(List<MultipartFile> files, Map<String, Object> context) {
        try {
            // Extract context information
            String topic = (String) context.getOrDefault("topic", "unknown topic");
            String audience = (String) context.getOrDefault("audience", "general audience");
            Object durationObj = context.get("duration");
            int durationSeconds = durationObj != null ? ((Number) durationObj).intValue() : 0;
            String goals = (String) context.getOrDefault("goals", "improve public speaking skills");

            // Build comprehensive analysis prompt
            String prompt = String.format(
                "You are an expert speech coach and communication analyst. Analyze the provided materials (video, slides, documents, images) " +
                "for a speech/presentation with the following context:\n\n" +
                "Topic: %s\n" +
                "Target Audience: %s\n" +
                "Duration: %d seconds\n" +
                "Speaker's Goals: %s\n\n" +
                "Perform a comprehensive analysis covering:\n\n" +
                "1. **Content Analysis** (if video/audio provided):\n" +
                "   - Topic adherence and focus (how well they stayed on topic)\n" +
                "   - Logical flow and structure\n" +
                "   - Clarity of main points\n" +
                "   - Evidence and examples quality\n\n" +
                "2. **Delivery Analysis** (if video provided):\n" +
                "   - Vocal qualities (pace, volume, tone variation, energy)\n" +
                "   - Filler words (um, uh, like, you know) - count and frequency\n" +
                "   - Body language (posture, gestures, movement)\n" +
                "   - Eye contact and facial expressions\n" +
                "   - Confidence level and stage presence\n\n" +
                "3. **Visual Aids Analysis** (if slides/documents provided):\n" +
                "   - Slide design effectiveness\n" +
                "   - Text-to-visual ratio\n" +
                "   - Readability and clarity\n" +
                "   - Alignment with verbal content\n\n" +
                "4. **Timing & Pacing**:\n" +
                "   - Speaking pace (words per minute if calculable)\n" +
                "   - Use of pauses\n" +
                "   - Time management\n\n" +
                "Return analysis in this exact JSON structure:\n" +
                "{\n" +
                "  \"overall_score\": 0-100,\n" +
                "  \"summary\": \"2-3 sentence overall assessment\",\n" +
                "  \"scores\": {\n" +
                "    \"content_quality\": {\"score\": 0-100, \"label\": \"Excellent/Good/Fair/Needs Work\"},\n" +
                "    \"delivery\": {\"score\": 0-100, \"label\": \"Excellent/Good/Fair/Needs Work\"},\n" +
                "    \"vocal_variety\": {\"score\": 0-100, \"label\": \"Excellent/Good/Fair/Needs Work\"},\n" +
                "    \"body_language\": {\"score\": 0-100, \"label\": \"Excellent/Good/Fair/Needs Work\"},\n" +
                "    \"visual_aids\": {\"score\": 0-100, \"label\": \"Excellent/Good/Fair/Needs Work\"},\n" +
                "    \"engagement\": {\"score\": 0-100, \"label\": \"Excellent/Good/Fair/Needs Work\"}\n" +
                "  },\n" +
                "  \"strengths\": [\n" +
                "    \"Specific strength with example\",\n" +
                "    \"Another strength\"\n" +
                "  ],\n" +
                "  \"areas_for_improvement\": [\n" +
                "    {\n" +
                "      \"category\": \"Filler Words\",\n" +
                "      \"issue\": \"Used 'um' 23 times (approximately once every 15 seconds)\",\n" +
                "      \"impact\": \"Reduces credibility and distracts from message\",\n" +
                "      \"suggestion\": \"Practice pausing instead of using filler words. Record yourself and count fillers to build awareness.\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"category\": \"Pacing\",\n" +
                "      \"issue\": \"Speaking too quickly at ~180 words per minute\",\n" +
                "      \"impact\": \"Audience may struggle to follow complex points\",\n" +
                "      \"suggestion\": \"Slow down to 140-160 wpm. Use strategic pauses after key points.\"\n" +
                "    }\n" +
                "  ],\n" +
                "  \"detailed_feedback\": {\n" +
                "    \"topic_adherence\": \"Detailed analysis of how well speaker stayed on topic, with specific examples\",\n" +
                "    \"filler_words\": {\"count\": 23, \"frequency\": \"once per 15 seconds\", \"most_common\": [\"um\", \"uh\", \"like\"]},\n" +
                "    \"body_language_notes\": \"Specific observations about posture, gestures, movement\",\n" +
                "    \"vocal_analysis\": \"Notes on pace, volume, tone, energy levels\",\n" +
                "    \"slide_feedback\": \"Specific feedback on visual aids if provided\"\n" +
                "  },\n" +
                "  \"youtube_resources\": [\n" +
                "    {\n" +
                "      \"area\": \"Eliminating Filler Words\",\n" +
                "      \"search_query\": \"how to stop saying um and uh public speaking\",\n" +
                "      \"recommended_channels\": [\"Charisma on Command\", \"Stanford Graduate School of Business\"],\n" +
                "      \"why\": \"Your filler word usage is above average. These resources teach awareness and replacement techniques.\"\n" +
                "    },\n" +
                "    {\n" +
                "      \"area\": \"Body Language\",\n" +
                "      \"search_query\": \"confident body language for presentations\",\n" +
                "      \"recommended_channels\": [\"TEDx Talks\", \"Communication Coach Alexander Lyon\"],\n" +
                "      \"why\": \"To build more commanding stage presence and confident posture.\"\n" +
                "    }\n" +
                "  ],\n" +
                "  \"action_plan\": [\n" +
                "    \"Priority 1: Focus on eliminating filler words through awareness and pausing\",\n" +
                "    \"Priority 2: Slow down pacing to 140-160 words per minute\",\n" +
                "    \"Priority 3: Improve body language with more purposeful gestures\"\n" +
                "  ]\n" +
                "}\n\n" +
                "Be specific, constructive, and actionable. Provide exact counts/frequencies where possible. " +
                "Tailor YouTube recommendations to the speaker's specific weaknesses. Return ONLY valid JSON.",
                topic, audience, durationSeconds, goals
            );

            // Build multimodal content parts
            List<Map<String, Object>> parts = new ArrayList<>();
            
            // Add the prompt as first part
            parts.add(Map.of("text", prompt));

            // Process each file and add to parts
            for (MultipartFile file : files) {
                String mimeType = file.getContentType();
                byte[] fileBytes = file.getBytes();
                String base64Data = Base64.getEncoder().encodeToString(fileBytes);

                Map<String, Object> inlineData = new HashMap<>();
                inlineData.put("mime_type", mimeType);
                inlineData.put("data", base64Data);

                parts.add(Map.of("inline_data", inlineData));
            }

            // Build request body
            Map<String, Object> content = Map.of("parts", parts);
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(content));

            // Configuration for detailed analysis
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.4); // Lower temperature for more analytical/consistent output
            generationConfig.put("topK", 40);
            generationConfig.put("topP", 0.95);
            generationConfig.put("maxOutputTokens", 8192); // Allow long detailed response
            requestBody.put("generationConfig", generationConfig);

            // Call Gemini 2.5 Pro (best for multimodal analysis)
            @SuppressWarnings("unchecked")
            Map<String, Object> response = (Map<String, Object>) webClient.post()
                .uri("/v1beta/models/gemini-2.5-pro-002:generateContent?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to analyze speech performance: " + e.getMessage(), e);
        }
    }
}
