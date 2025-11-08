package hack.thegsucoders.speechmate.controller;

import hack.thegsucoders.speechmate.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
}
