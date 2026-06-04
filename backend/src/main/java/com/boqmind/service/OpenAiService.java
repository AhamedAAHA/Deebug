package com.boqmind.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * AI-ready OpenAI integration. Set openai.enabled=true and OPENAI_API_KEY to use live AI.
 */
@Service
public class OpenAiService {

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${aiml.model.chat}")
    private String model;

    @Value("${openai.enabled:false}")
    private boolean enabled;

    private final RestTemplate restTemplate = new RestTemplate();

    public String askQuantitySurveyor(String question) {
        if (!enabled || apiKey == null || apiKey.isBlank()) {
            return null;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content",
                                    "You are DaiBoq AI, an expert Quantity Surveyor assistant. " +
                                    "Answer concisely about construction quantities, BOQ, materials, and costs."),
                            Map.of("role", "user", "content", question)
                    ),
                    "max_tokens", 300
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, Map.class);
            Map<?, ?> responseBody = response.getBody();
            if (responseBody == null) {
                return null;
            }

            Object choicesObj = responseBody.get("choices");
            if (!(choicesObj instanceof List<?> choices) || choices.isEmpty()) {
                return null;
            }

            Object firstChoice = choices.get(0);
            if (!(firstChoice instanceof Map<?, ?> choice)) {
                return null;
            }

            Object messageObj = choice.get("message");
            if (!(messageObj instanceof Map<?, ?> message)) {
                return null;
            }

            Object content = message.get("content");
            return content instanceof String text ? text : null;
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isEnabled() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }
}
