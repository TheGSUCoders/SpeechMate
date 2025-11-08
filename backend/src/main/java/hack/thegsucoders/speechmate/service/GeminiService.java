package hack.thegsucoders.speechmate.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Value;

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
}
