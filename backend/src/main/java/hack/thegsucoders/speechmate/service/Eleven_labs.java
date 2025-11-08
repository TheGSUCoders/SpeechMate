import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Objects;

public class Eleven_labs {
	private static final String BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech/";
	private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();

	public byte[] generateSpeech(String apiKey, String voiceKey, String text) throws IOException, InterruptedException {
		validateRequired("apiKey", apiKey);
		validateRequired("voiceKey", voiceKey);
		validateRequired("text", text);

		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(BASE_URL + voiceKey))
				.header("xi-api-key", apiKey)
				.header("Content-Type", "application/json")
				.header("Accept", "audio/mpeg")
				.POST(HttpRequest.BodyPublishers.ofString(buildRequestBody(text)))
				.build();

		HttpResponse<byte[]> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofByteArray());

		if (response.statusCode() != 200) {
			throw new IOException("Unexpected response status: " + response.statusCode());
		}

		return response.body();
	}

	public Path generateSpeechToFile(String apiKey, String voiceKey, String text, Path outputPath)
			throws IOException, InterruptedException {
		Objects.requireNonNull(outputPath, "outputPath");
		byte[] audio = generateSpeech(apiKey, voiceKey, text);
		Files.createDirectories(outputPath.getParent());
		return Files.write(outputPath, audio);
	}

	private static void validateRequired(String name, String value) {
		if (value == null || value.isBlank()) {
			throw new IllegalArgumentException(name + " is required");
		}
	}

	private static String buildRequestBody(String text) {
		return "{" +
				"\"text\":\"" + escapeForJson(text) + "\"," +
				"\"model_id\":\"eleven_monolingual_v1\"" +
				"}";
	}

	private static String escapeForJson(String value) {
		StringBuilder escaped = new StringBuilder();
		for (char c : value.toCharArray()) {
			switch (c) {
				case '\\' -> escaped.append("\\\\");
				case '"' -> escaped.append("\\\"");
				case '\b' -> escaped.append("\\b");
				case '\f' -> escaped.append("\\f");
				case '\n' -> escaped.append("\\n");
				case '\r' -> escaped.append("\\r");
				case '\t' -> escaped.append("\\t");
				default -> {
					if (c < 0x20) {
						escaped.append(String.format("\\u%04x", (int) c));
					} else {
						escaped.append(c);
					}
				}
			}
		}
		return escaped.toString();
	}
}
