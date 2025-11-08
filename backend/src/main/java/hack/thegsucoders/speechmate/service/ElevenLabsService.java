package hack.thegsucoders.speechmate.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
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

	/**
	 * Generate speech from request map with validation and defaults
	 * Returns ResponseEntity with proper headers for audio file download
	 */
	public ResponseEntity<byte[]> generateSpeechFromRequest(Map<String, String> params) {
		String text = params.get("text");
		if (text == null || text.isBlank()) {
			throw new IllegalArgumentException("text is required");
		}
		
		String voiceId = params.getOrDefault("voiceId", "21m00Tcm4TlvDq8ikWAM");
		String modelId = params.getOrDefault("modelId", "eleven_monolingual_v1");
		
		Map<String, Object> requestBody = Map.of(
			"text", text,
			"model_id", modelId
		);

		try {
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
			throw new RuntimeException("Failed to generate speech: " + e.getMessage(), e);
		}
	}
}
