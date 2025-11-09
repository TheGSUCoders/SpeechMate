package hack.thegsucoders.speechmate.controller;

import hack.thegsucoders.speechmate.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/gemini")
@RequiredArgsConstructor
public class GeminiController {
    
    private final GeminiService geminiService;

    @PostMapping("/generate-outline")
    public ResponseEntity<Map<String, Object>> generateOutline(@RequestBody Map<String, Object> request) {
        Map<String, Object> outline = geminiService.generateOutline(request);
        return ResponseEntity.ok(outline);
    }

    @GetMapping("/speech-tips")
    public ResponseEntity<Map<String, Object>> getSpeechTips(@RequestParam(required = false) Integer count) {
        Map<String, Object> tips = geminiService.generateSpeechTips(count);
        return ResponseEntity.ok(tips);
    }

    @PostMapping(value = "/analyze-speech", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, Object>> analyzeSpeech(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String audience,
            @RequestParam(required = false) Integer duration,
            @RequestParam(required = false) String goals
    ) {
        try {
            Map<String, Object> analysis = geminiService.analyzeSpeechPerformance(files, topic, audience, duration, goals);
            return ResponseEntity.ok(analysis);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/generate-encouragement")
    public ResponseEntity<Map<String, String>> generateEncouragement(@RequestBody Map<String, String> request) {
        String userName = request.getOrDefault("userName", "");
        String encouragement = geminiService.generateEncouragement(userName);
        return ResponseEntity.ok(Map.of("message", encouragement));
    }
}
