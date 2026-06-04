package com.boqmind.controller;

import com.boqmind.service.MockDataService;
import com.boqmind.service.OpenAiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final OpenAiService openAiService;
    private final MockDataService mockDataService;

    public AiController(OpenAiService openAiService, MockDataService mockDataService) {
        this.openAiService = openAiService;
        this.mockDataService = mockDataService;
    }

    @PostMapping("/assistant")
    public ResponseEntity<Map<String, Object>> assistant(@RequestBody Map<String, String> body) {
        String question = body.getOrDefault("question", "");
        String answer = openAiService.askQuantitySurveyor(question);
        boolean live = answer != null;

        if (!live) {
            answer = mockDataService.getMockAssistantAnswer(question);
        }

        return ResponseEntity.ok(Map.of(
                "answer", answer,
                "liveAi", live,
                "engine", live ? "openai" : "mock"
        ));
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of(
                "openAiEnabled", openAiService.isEnabled(),
                "message", openAiService.isEnabled()
                        ? "OpenAI integration active"
                        : "Using mock AI — set OPENAI_API_KEY and openai.enabled=true"
        );
    }
}
