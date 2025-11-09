package hack.thegsucoders.speechmate.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class ElevenLabsService {

	@Value("${ELEVENLABS_API_KEY}")
	private String apiKey;

	private final WebClient webClient;

	public ElevenLabsService(WebClient.Builder webClientBuilder) {
		this.webClient = webClientBuilder
			.baseUrl("https://api.elevenlabs.io/v1")
			.build();
	}

	public ResponseEntity<?> generateSpeechFromRequest(Map<String, String> params) {
		try {
			String text = params.get("text");
			if (text == null || text.isBlank()) {
				return ResponseEntity.badRequest().body(Map.of("error", "text is required"));
			}
			
			if (apiKey == null || apiKey.isBlank() || apiKey.equals("${ELEVENLABS_API_KEY}")) {
				return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
						.body(Map.of("error", "Text-to-speech service is not configured"));
			}
			
			String voiceId = params.getOrDefault("voiceId", "21m00Tcm4TlvDq8ikWAM");
			String modelId = params.getOrDefault("modelId", "eleven_monolingual_v1");
			
			Map<String, Object> requestBody = Map.of(
				"text", text,
				"model_id", modelId
			);

			byte[] audioBytes = webClient.post()
				.uri("/text-to-speech/" + voiceId)
				.header("xi-api-key", apiKey)
				.contentType(MediaType.APPLICATION_JSON)
				.accept(MediaType.parseMediaType("audio/mpeg"))
				.bodyValue(requestBody)
				.retrieve()
				.bodyToMono(byte[].class)
				.block();
			
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
			headers.setContentDispositionFormData("attachment", "speech.mp3");
			
			return ResponseEntity.ok()
				.headers(headers)
				.body(audioBytes);
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(Map.of("error", "Failed to generate speech: " + e.getMessage()));
		}
	}
}
