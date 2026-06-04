package com.boqmind.controller;

import com.boqmind.service.UploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping("/drawing")
    public ResponseEntity<Map<String, Object>> uploadDrawing(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "default") String projectId) {
        try {
            return ResponseEntity.ok(uploadService.saveDrawing(file, projectId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}
