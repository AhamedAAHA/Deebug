package com.boqmind.service;

import com.boqmind.model.BoqItem;
import com.boqmind.model.Project;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class MockDataService {

    public Project getDefaultProjectSummary() {
        Project p = new Project();
        p.setId("default");
        p.setName("Skyline Residency — Block A");
        p.setLocation("Mumbai, India");
        p.setTotalCost(2847500);
        p.setConcreteVolume(342.5);
        p.setSteelWeight(28.4);
        p.setBrickQuantity(48500);
        p.setBoqItemCount(48);
        p.setSustainabilityScore(72);
        p.setRiskLevel("Medium");
        p.setProgress(34);
        return p;
    }

    public List<BoqItem> getDefaultBoqItems() {
        List<BoqItem> items = new ArrayList<>();
        items.add(item("1", "Earthwork", "Excavation for foundation", 285, "m³", 450));
        items.add(item("2", "Concrete", "M25 grade RCC for foundation", 68, "m³", 8500));
        items.add(item("3", "Concrete", "M25 grade RCC for columns", 42, "m³", 9200));
        items.add(item("4", "Concrete", "M25 grade RCC for slabs", 156, "m³", 8800));
        items.add(item("5", "Steel", "TMT bars Fe500D - foundation", 4.2, "MT", 72000));
        items.add(item("6", "Steel", "TMT bars Fe500D - columns & beams", 18.6, "MT", 72000));
        items.add(item("7", "Steel", "TMT bars Fe500D - slabs", 5.6, "MT", 72000));
        items.add(item("8", "Masonry", "230mm brickwork in CM 1:6", 485, "m²", 1850));
        items.add(item("9", "Plaster", "12mm cement plaster both sides", 970, "m²", 320));
        items.add(item("10", "Flooring", "Vitrified tiles 600x600mm", 420, "m²", 950));
        items.add(item("11", "Painting", "Emulsion paint - internal walls", 1850, "m²", 85));
        items.add(item("12", "Painting", "Weather coat - external walls", 620, "m²", 120));
        items.add(item("13", "Doors", "Teak wood door 900x2100mm", 12, "Nos", 18500));
        items.add(item("14", "Windows", "Aluminium sliding window 1200x1200", 18, "Nos", 14200));
        items.add(item("15", "Roofing", "RCC waterproof terrace", 380, "m²", 680));
        return items;
    }

    private BoqItem item(String id, String category, String desc, double qty, String unit, double rate) {
        BoqItem b = new BoqItem();
        b.setId(id);
        b.setProjectId("default");
        b.setCategory(category);
        b.setDescription(desc);
        b.setQuantity(qty);
        b.setUnit(unit);
        b.setRate(rate);
        b.setAmount(qty * rate);
        return b;
    }

    public String getMockAssistantAnswer(String question) {
        String q = question.toLowerCase(Locale.ROOT);
        if (q.contains("brick")) {
            return "Based on current drawings, you need approximately 48,500 bricks for 230mm brickwork across all floors (including 5% wastage).";
        }
        if (q.contains("concrete")) {
            return "Total estimated concrete volume is 342.5 m³ — Foundation: 68 m³, Columns: 42 m³, Slabs: 156 m³, Beams: 76.5 m³.";
        }
        if (q.contains("cost") || q.contains("estimate") || q.contains("price")) {
            return "Current project estimate is LKR 2,847,500. With 8% inflation buffer, expected final cost is LKR 3,075,300.";
        }
        if (q.contains("steel")) {
            return "Total TMT steel requirement is 28.4 MT (Fe500D grade) distributed across foundation, columns, beams, and slabs.";
        }
        if (q.contains("paint")) {
            return "Paint quantity required: 185 liters emulsion (internal) + 62 liters weather coat (external).";
        }
        return "I can help with quantities, costs, materials, and BOQ details. Try asking about bricks, concrete, steel, paint, or total cost.";
    }
}
