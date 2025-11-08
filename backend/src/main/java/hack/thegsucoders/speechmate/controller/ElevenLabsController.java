package hack.thegsucoders.speechmate.controller;

import hack.thegsucoders.speechmate.service.ElevenLabsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/elevenlabs")
@RequiredArgsConstructor
public class ElevenLabsController {

    private final ElevenLabsService elevenLabsService;

    @PostMapping("/text-to-speech")
    public ResponseEntity<byte[]> textToSpeech(@RequestBody Map<String, String> request) {
        return elevenLabsService.generateSpeechFromRequest(request);
    }
}
