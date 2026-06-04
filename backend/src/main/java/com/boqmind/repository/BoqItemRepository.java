package com.boqmind.repository;

import com.boqmind.model.BoqItem;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface BoqItemRepository extends MongoRepository<BoqItem, String> {
    List<BoqItem> findByProjectId(String projectId);
    void deleteByProjectId(String projectId);
}
