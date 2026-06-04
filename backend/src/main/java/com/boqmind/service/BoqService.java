package com.boqmind.service;

import com.boqmind.model.BoqItem;
import com.boqmind.model.Project;
import com.boqmind.repository.BoqItemRepository;
import com.boqmind.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
@Service
public class BoqService {

    private final BoqItemRepository boqItemRepository;
    private final ProjectRepository projectRepository;
    private final MockDataService mockDataService;

    public BoqService(
            BoqItemRepository boqItemRepository,
            ProjectRepository projectRepository,
            MockDataService mockDataService) {
        this.boqItemRepository = boqItemRepository;
        this.projectRepository = projectRepository;
        this.mockDataService = mockDataService;
    }

    public List<BoqItem> getBoqForProject(String projectId) {
        String pid = normalizeProjectId(projectId);
        List<BoqItem> items = boqItemRepository.findByProjectId(pid);
        if (items.isEmpty()) {
            return mockDataService.getDefaultBoqItems();
        }
        return items;
    }

    public List<BoqItem> syncFromClient(
            String projectId,
            List<Map<String, Object>> itemPayloads,
            Map<String, Object> quantities) {
        String pid = normalizeProjectId(projectId);
        boqItemRepository.deleteByProjectId(pid);

        List<BoqItem> saved = new ArrayList<>();
        double totalCost = 0;

        if (itemPayloads != null) {
            int index = 0;
            for (Map<String, Object> raw : itemPayloads) {
                BoqItem item = mapPayloadToBoqItem(raw, pid, index++);
                saved.add(boqItemRepository.save(item));
                totalCost += item.getAmount();
            }
        }

        updateProjectSummary(pid, saved.size(), totalCost, quantities);
        return saved;
    }

    private BoqItem mapPayloadToBoqItem(Map<String, Object> raw, String projectId, int index) {
        BoqItem item = new BoqItem();
        Object id = raw.get("id");
        item.setId(id != null ? String.valueOf(id) : projectId + "-" + index);
        item.setProjectId(projectId);
        item.setCategory(String.valueOf(raw.getOrDefault("category", "")));
        item.setDescription(String.valueOf(raw.getOrDefault("description", "")));
        item.setQuantity(asDouble(raw.get("quantity")));
        item.setUnit(String.valueOf(raw.getOrDefault("unit", "")));
        item.setRate(asDouble(raw.get("rate")));
        double amount = raw.containsKey("amount") ? asDouble(raw.get("amount")) : item.getQuantity() * item.getRate();
        item.setAmount(amount);
        return item;
    }

    private void updateProjectSummary(String projectId, int boqCount, double totalCost, Map<String, Object> quantities) {
        Project project = projectRepository.findById(projectId)
                .orElseGet(mockDataService::getDefaultProjectSummary);
        project.setId(projectId);
        project.setTotalCost(totalCost > 0 ? totalCost : project.getTotalCost());
        project.setBoqItemCount(boqCount > 0 ? boqCount : project.getBoqItemCount());

        if (quantities != null) {
            if (quantities.get("concreteVolume") != null) {
                project.setConcreteVolume(asDouble(quantities.get("concreteVolume")));
            }
            if (quantities.get("steelQuantity") != null) {
                project.setSteelWeight(asDouble(quantities.get("steelQuantity")));
            }
            if (quantities.get("brickQuantity") != null) {
                project.setBrickQuantity((int) Math.round(asDouble(quantities.get("brickQuantity"))));
            }
        }

        projectRepository.save(project);
    }

    private static String normalizeProjectId(String projectId) {
        return projectId == null || projectId.isBlank() ? "default" : projectId.trim();
    }

    private static double asDouble(Object value) {
        if (value == null) return 0;
        if (value instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
