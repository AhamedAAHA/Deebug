package com.boqmind.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "projects")
public class Project {

    @Id
    private String id;
    private String name;
    private String location;
    private double totalCost;
    private double concreteVolume;
    private double steelWeight;
    private int brickQuantity;
    private int boqItemCount;
    private int sustainabilityScore;
    private String riskLevel;
    private int progress;
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public double getTotalCost() { return totalCost; }
    public void setTotalCost(double totalCost) { this.totalCost = totalCost; }
    public double getConcreteVolume() { return concreteVolume; }
    public void setConcreteVolume(double concreteVolume) { this.concreteVolume = concreteVolume; }
    public double getSteelWeight() { return steelWeight; }
    public void setSteelWeight(double steelWeight) { this.steelWeight = steelWeight; }
    public int getBrickQuantity() { return brickQuantity; }
    public void setBrickQuantity(int brickQuantity) { this.brickQuantity = brickQuantity; }
    public int getBoqItemCount() { return boqItemCount; }
    public void setBoqItemCount(int boqItemCount) { this.boqItemCount = boqItemCount; }
    public int getSustainabilityScore() { return sustainabilityScore; }
    public void setSustainabilityScore(int sustainabilityScore) { this.sustainabilityScore = sustainabilityScore; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = progress; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
