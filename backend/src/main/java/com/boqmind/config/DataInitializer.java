package com.boqmind.config;

import com.boqmind.repository.BoqItemRepository;
import com.boqmind.repository.ProjectRepository;
import com.boqmind.service.MockDataService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    private final ProjectRepository projectRepository;
    private final BoqItemRepository boqItemRepository;
    private final MockDataService mockDataService;

    public DataInitializer(
            ProjectRepository projectRepository,
            BoqItemRepository boqItemRepository,
            MockDataService mockDataService) {
        this.projectRepository = projectRepository;
        this.boqItemRepository = boqItemRepository;
        this.mockDataService = mockDataService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (projectRepository.count() == 0) {
            projectRepository.save(mockDataService.getDefaultProjectSummary());
        }
        if (boqItemRepository.count() == 0) {
            boqItemRepository.saveAll(mockDataService.getDefaultBoqItems());
        }
    }
}
