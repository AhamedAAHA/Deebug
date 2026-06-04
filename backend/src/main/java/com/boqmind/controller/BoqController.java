package com.boqmind.controller;

import com.boqmind.model.BoqItem;
import com.boqmind.service.BoqService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/boq")
public class BoqController {

    private final BoqService boqService;

    public BoqController(BoqService boqService) {
        this.boqService = boqService;
    }

    @GetMapping
    public List<BoqItem> getBoq(@RequestParam(defaultValue = "default") String projectId) {
        return boqService.getBoqForProject(projectId);
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncBoq(@RequestBody Map<String, Object> body) {
        String projectId = String.valueOf(body.getOrDefault("projectId", "default"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");
        @SuppressWarnings("unchecked")
        Map<String, Object> quantities = (Map<String, Object>) body.get("quantities");

        List<BoqItem> saved = boqService.syncFromClient(projectId, items, quantities);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "itemCount", saved.size(),
                "projectId", projectId
        ));
    }
}
