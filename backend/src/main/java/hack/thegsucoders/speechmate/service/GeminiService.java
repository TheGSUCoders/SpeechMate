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
     * Generate a short encouraging message for the user before recording
     * Uses Gemini 2.0 Flash-Lite for fastest response
     * @param userName User's first name
     * @return Encouraging message
     */
    public String generateEncouragement(String userName) {
        String name = userName != null && !userName.isEmpty() ? userName : "there";
        
        String prompt = String.format(
            "Generate a very short (5-8 words maximum), encouraging message for %s who is about to record their speech. " +
            "Be positive, warm, and motivating. Examples: 'You got this, %s!', 'Good luck, %s! You'll do great!', 'Shine bright, %s!'. " +
            "Return ONLY the encouragement message, nothing else.",
            name, name, name, name
        );
        
        // Build request body
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(textPart));
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));
        
        // Fast generation config
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.9);
        generationConfig.put("maxOutputTokens", 32);
        requestBody.put("generationConfig", generationConfig);
        
        try {
            // Call Gemini 2.0 Flash-Lite for fastest response
            @SuppressWarnings("unchecked")
            Map<String, Object> response = (Map<String, Object>) webClient.post()
                .uri("/v1beta/models/gemini-2.0-flash-lite:generateContent?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            
            // Extract text from response
            if (response != null && response.containsKey("candidates")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> candidate = candidates.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> contentMap = (Map<String, Object>) candidate.get("content");
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
                    if (!parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
            
            return "You got this, " + name + "!";
        } catch (Exception e) {
            System.err.println("Failed to generate encouragement: " + e.getMessage());
            return "You got this, " + name + "!";
        }
    }

    /**
     * Analyze uploaded speech materials (video, slides, documents, images) using Gemini 2.5 Pro
     * Provides comprehensive feedback on delivery, content, and areas for improvement
     * @param files List of uploaded files (video, ppt, pdf, images, etc.)
     * @param topic Optional speech topic
     * @param audience Optional target audience
     * @param duration Optional speech duration in seconds
     * @param goals Optional speaker's improvement goals
     * @return Detailed analysis with scores, feedback, and YouTube recommendations
     */
    public Map<String, Object> analyzeSpeechPerformance(
            List<MultipartFile> files, 
            String topic, 
            String audience, 
            Integer duration, 
            String goals) {
        try {
            // Validate file types - Gemini 2.5 Pro supports: audio, images, video, PDF
            List<String> supportedMimeTypes = List.of(
                "audio/", "image/", "video/", "application/pdf"
            );
            
            for (MultipartFile file : files) {
                String mimeType = file.getContentType();
                if (mimeType == null || supportedMimeTypes.stream().noneMatch(mimeType::startsWith)) {
                    throw new IllegalArgumentException(
                        "Unsupported file type: " + mimeType + ". " +
                        "Supported types: audio files (mp3, wav, etc.), images (jpg, png, etc.), " +
                        "video files (mp4, webm, etc.), and PDF documents. " +
                        "Word documents (.docx) are not supported - please convert to PDF first."
                    );
                }
            }
            
            // Set defaults for optional parameters
            String speechTopic = topic != null ? topic : "unknown topic";
            String targetAudience = audience != null ? audience : "general audience";
            int durationSeconds = duration != null ? duration : 0;
            String speakerGoals = goals != null ? goals : "improve public speaking skills";

            // Build comprehensive analysis prompt
            String prompt = String.format(
                "You are an expert speech coach and communication analyst with expertise in linguistics, accent analysis, and cross-cultural communication. " +
                "Analyze the provided materials (video, slides, documents, images) for a speech/presentation with the following context:\n\n" +
                "Topic: %s\n" +
                "Target Audience: %s\n" +
                "Duration: %d seconds\n" +
                "Speaker's Goals: %s\n\n" +
                "Perform a comprehensive and detailed analysis covering:\n\n" +
                "1. **Speech Content & Message Analysis**:\n" +
                "   - Provide a detailed summary of what the speech was about - capture the main theme, key arguments, and central message\n" +
                "   - Identify and quote 3-5 specific statements or phrases the speaker used (use actual quotes from the video)\n" +
                "   - Analyze how well they stayed on topic and maintained focus\n" +
                "   - Evaluate the logical flow, structure, and organization of ideas\n" +
                "   - Assess the quality and relevance of evidence, examples, and supporting details\n" +
                "   - Comment on the opening and closing effectiveness\n\n" +
                "2. **Language & Accent Analysis**:\n" +
                "   - Identify the primary language(s) spoken (e.g., English, Spanish, French, code-switching)\n" +
                "   - If speaking in a non-native or different language, note this explicitly\n" +
                "   - Detect and describe the speaker's accent (e.g., American Southern, British RP, Indian English, Spanish accent in English, native accent)\n" +
                "   - Analyze pronunciation clarity and any pronunciation challenges\n" +
                "   - Comment on vocabulary richness and appropriateness for the audience\n\n" +
                "3. **Intonation & Vocal Analysis**:\n" +
                "   - Analyze intonation patterns (rising, falling, flat, varied)\n" +
                "   - Evaluate pitch variation and monotone vs. dynamic delivery\n" +
                "   - Assess vocal qualities: pace, volume, tone, energy, enthusiasm\n" +
                "   - Identify emotional inflection and emphasis on key points\n" +
                "   - Note any vocal strengths or weaknesses (e.g., 'rising intonation made questions engaging', 'flat tone during key statistics')\n\n" +
                "4. **Filler Words & Speech Patterns**:\n" +
                "   - Count and list filler words with frequency (um, uh, like, you know, so, actually, etc.)\n" +
                "   - Identify any repeated phrases or verbal tics\n" +
                "   - Note where in the speech fillers appeared most frequently\n\n" +
                "5. **Delivery & Non-Verbal Communication** (if video provided):\n" +
                "   - Body language: posture, gestures, movement, use of space\n" +
                "   - Eye contact patterns and engagement with audience/camera\n" +
                "   - Facial expressions and emotional authenticity\n" +
                "   - Confidence level, nervousness indicators, stage presence\n" +
                "   - Hand gestures: purposeful vs. distracting\n\n" +
                "6. **Visual Aids Analysis** (if slides/documents provided):\n" +
                "   - Slide design effectiveness and professional appearance\n" +
                "   - Text-to-visual ratio and readability\n" +
                "   - Alignment with verbal content and timing\n\n" +
                "7. **Timing & Pacing**:\n" +
                "   - Speaking pace (estimate words per minute)\n" +
                "   - Strategic use of pauses and silence\n" +
                "   - Time management and pacing throughout speech\n\n" +
                "8. **Specific Statement Feedback**:\n" +
                "   - Quote at least 3-5 specific statements from the speech\n" +
                "   - For each statement, provide feedback on: effectiveness, impact, delivery quality, and suggestions for improvement\n" +
                "   - Example: 'When you said \"[exact quote]\", this was effective because... However, consider...'\n\n" +
                "Return analysis in this exact JSON structure:\n" +
                "{\n" +
                "  \"overall_score\": 0-100,\n" +
                "  \"summary\": \"2-3 sentence overall assessment\",\n" +
                "  \"speech_content_summary\": \"Detailed 3-4 sentence summary of what the speech was actually about, including main theme and key points discussed\",\n" +
                "  \"language_detected\": \"Primary language(s) spoken (e.g., 'English', 'Spanish', 'English with Spanish code-switching')\",\n" +
                "  \"accent_analysis\": {\n" +
                "    \"accent_type\": \"Specific accent description (e.g., 'American Southern', 'British RP', 'Indian English', 'Native Spanish accent when speaking English', 'Standard American')\",\n" +
                "    \"clarity\": \"Assessment of pronunciation clarity\",\n" +
                "    \"notes\": \"Detailed notes on accent impact and any pronunciation strengths or challenges\"\n" +
                "  },\n" +
                "  \"intonation_analysis\": {\n" +
                "    \"pattern\": \"Overall intonation pattern (e.g., 'varied and dynamic', 'mostly flat', 'rising at sentence ends')\",\n" +
                "    \"pitch_variation\": \"High/Medium/Low pitch variation\",\n" +
                "    \"emotional_inflection\": \"Quality of emotional expression through tone\",\n" +
                "    \"specific_examples\": \"Examples of strong or weak intonation moments with timestamps if possible\"\n" +
                "  },\n" +
                "  \"scores\": {\n" +
                "    \"content_quality\": {\"score\": 0-100, \"label\": \"Excellent/Good/Fair/Needs Work\"},\n" +
                "    \"delivery\": {\"score\": 0-100, \"label\": \"Excellent/Good/Fair/Needs Work\"},\n" +
                "    \"vocal_variety\": {\"score\": 0-100, \"label\": \"Excellent/Good/Fair/Needs Work\"},\n" +
                "    \"intonation\": {\"score\": 0-100, \"label\": \"Excellent/Good/Fair/Needs Work\"},\n" +
                "    \"body_language\": {\"score\": 0-100, \"label\": \"Excellent/Good/Fair/Needs Work\"},\n" +
                "    \"visual_aids\": {\"score\": 0-100, \"label\": \"Excellent/Good/Fair/Needs Work\"},\n" +
                "    \"engagement\": {\"score\": 0-100, \"label\": \"Excellent/Good/Fair/Needs Work\"}\n" +
                "  },\n" +
                "  \"strengths\": [\n" +
                "    \"Specific strength with example from the speech\",\n" +
                "    \"Another strength with concrete evidence\"\n" +
                "  ],\n" +
                "  \"specific_statements_feedback\": [\n" +
                "    {\n" +
                "      \"quote\": \"Exact quote from the speaker\",\n" +
                "      \"timestamp\": \"Approximate time in speech (if determinable)\",\n" +
                "      \"effectiveness\": \"What worked well about this statement\",\n" +
                "      \"delivery_notes\": \"How it was delivered (tone, emphasis, body language)\",\n" +
                "      \"suggestion\": \"How this statement could be improved or built upon\"\n" +
                "    }\n" +
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
                "    \"content_summary\": \"What the speech was about - main theme, arguments, and message in detail\",\n" +
                "    \"topic_adherence\": \"Detailed analysis of how well speaker stayed on topic, with specific examples\",\n" +
                "    \"filler_words\": {\"count\": 23, \"frequency\": \"once per 15 seconds\", \"most_common\": [\"um\", \"uh\", \"like\"], \"context\": \"Where fillers appeared most (e.g., during transitions, technical explanations)\"},\n" +
                "    \"vocal_analysis\": \"Detailed notes on pace (estimate WPM), volume, tone, energy levels, and vocal strengths/weaknesses\",\n" +
                "    \"intonation_details\": \"Specific analysis of pitch patterns, emphasis, emotional expression through voice\",\n" +
                "    \"body_language_notes\": \"Specific observations about posture, gestures, movement, eye contact\",\n" +
                "    \"slide_feedback\": \"Specific feedback on visual aids if provided\",\n" +
                "    \"language_notes\": \"Notes on language use, vocabulary level, any non-native language observations\"\n" +
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
                "IMPORTANT INSTRUCTIONS:\n" +
                "- Be HIGHLY SPECIFIC about what the speech was actually about - don't just say 'the topic', describe the actual content and arguments\n" +
                "- ALWAYS include at least 3-5 direct quotes from the speaker with detailed feedback on each\n" +
                "- MUST identify the language(s) spoken and provide detailed accent analysis\n" +
                "- MUST provide comprehensive intonation analysis with specific examples\n" +
                "- If the speaker uses a different language or has a non-native accent, explicitly note this with supportive details\n" +
                "- Provide exact counts and frequencies for filler words, not just estimates\n" +
                "- Reference specific moments, statements, or sections of the speech in your feedback\n" +
                "- Be constructive and actionable - every criticism should include a specific suggestion\n" +
                "- Tailor YouTube recommendations to address the speaker's most critical weaknesses\n" +
                "- Return ONLY valid JSON with no additional text or markdown formatting.",
                speechTopic, targetAudience, durationSeconds, speakerGoals
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
                .uri("/v1/models/gemini-2.5-pro:generateContent?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(
                    status -> status.is4xxClientError() || status.is5xxServerError(),
                    clientResponse -> clientResponse.bodyToMono(String.class)
                        .map(errorBody -> new RuntimeException("Gemini API error: " + errorBody))
                )
                .bodyToMono(Map.class)
                .block();

            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to analyze speech performance: " + e.getMessage(), e);
        }
    }
}
