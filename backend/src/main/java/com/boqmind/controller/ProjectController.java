package com.boqmind.controller;

import com.boqmind.model.Project;
import com.boqmind.repository.ProjectRepository;
import com.boqmind.service.MockDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final MockDataService mockDataService;

    public ProjectController(ProjectRepository projectRepository, MockDataService mockDataService) {
        this.projectRepository = projectRepository;
        this.mockDataService = mockDataService;
    }

    @GetMapping("/summary")
    public ResponseEntity<Project> getSummary() {
        return projectRepository.findAll().stream()
                .findFirst()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(mockDataService.getDefaultProjectSummary()));
    }

    @GetMapping
    public List<Project> list() {
        List<Project> projects = projectRepository.findAll();
        if (projects.isEmpty()) {
            projects.add(mockDataService.getDefaultProjectSummary());
        }
        return projects;
    }
}
