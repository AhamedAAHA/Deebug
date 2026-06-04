package com.boqmind.service;

import com.boqmind.model.DrawingUpload;
import com.boqmind.repository.DrawingUploadRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class UploadService {

    private final DrawingUploadRepository uploadRepository;
    private final BoqExtractionService boqExtractionService;

    @Value("${boqmind.upload.dir}")
    private String uploadDir;

    public UploadService(DrawingUploadRepository uploadRepository, BoqExtractionService boqExtractionService) {
        this.uploadRepository = uploadRepository;
        this.boqExtractionService = boqExtractionService;
    }

    public Map<String, Object> saveDrawing(MultipartFile file, String projectId) throws IOException {
        Path dir = Paths.get(uploadDir);
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }

        String storedName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path target = dir.resolve(storedName);
        Files.copy(file.getInputStream(), target);

        DrawingUpload upload = new DrawingUpload();
        upload.setProjectId(projectId != null ? projectId : "default");
        upload.setFileName(file.getOriginalFilename());
        upload.setFilePath(target.toString());
        upload.setContentType(file.getContentType());
        upload.setFileSize(file.getSize());
        upload.setStatus("UPLOADED_AWAITING_EXTRACTION");
        uploadRepository.save(upload);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("id", upload.getId());
        result.put("fileName", upload.getFileName());
        result.put("status", upload.getStatus());

        if (boqExtractionService.supportsExtraction(upload.getFileName())) {
            result.putAll(boqExtractionService.extractFromDrawing(upload.getFileName()));
            upload.setStatus("EXTRACTED");
            uploadRepository.save(upload);
        } else {
            result.put("extractionAvailable", false);
            result.put("message", "Drawing uploaded. BOQ extraction requires a DWG file with parseable geometry in the browser.");
        }
        return result;
    }
}
