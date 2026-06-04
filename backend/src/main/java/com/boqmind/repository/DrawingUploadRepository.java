package com.boqmind.repository;

import com.boqmind.model.DrawingUpload;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DrawingUploadRepository extends MongoRepository<DrawingUpload, String> {
    List<DrawingUpload> findByProjectIdOrderByUploadedAtDesc(String projectId);
}
