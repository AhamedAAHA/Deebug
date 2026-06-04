package com.boqmind.service;

import com.boqmind.model.BoqItem;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class BoqExtractionService {

    private final MockDataService mockDataService;

    public BoqExtractionService(MockDataService mockDataService) {
        this.mockDataService = mockDataService;
    }

    public boolean supportsExtraction(String fileName) {
        if (fileName == null) return false;
        String lower = fileName.toLowerCase(Locale.ROOT);
        return lower.endsWith(".dwg");
    }

    public Map<String, Object> extractFromDrawing(String fileName) {
        List<BoqItem> items = mockDataService.getDefaultBoqItems();
        Map<String, Object> quantities = new HashMap<>();
        quantities.put("wallArea", 1240);
        quantities.put("floorArea", 420);
        quantities.put("concreteVolume", 342.5);
        quantities.put("brickQuantity", 48500);
        quantities.put("paintQuantity", 185);
        quantities.put("tileQuantity", 420);
        quantities.put("steelQuantity", 28.4);

        Map<String, Object> result = new HashMap<>();
        result.put("extractionAvailable", true);
        result.put("status", "EXTRACTED");
        result.put("boqItems", items);
        result.put("quantities", quantities);
        result.put("message", "BOQ generated for " + fileName + " (server template — use browser upload for CAD-based quantities).");
        return result;
    }
}
