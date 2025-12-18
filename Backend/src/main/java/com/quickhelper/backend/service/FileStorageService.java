package com.quickhelper.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
// Minimal file storage helper with content-type and size validation
public class FileStorageService {
    @Value("${app.upload.dir:#{systemProperties['user.dir']}/uploads}")
    private String uploadDir;

    public String storeFile(MultipartFile file, Set<String> allowedContentTypes, long maxBytes, String subfolder) throws IOException {
        System.out.println("Attempting to store file in directory: " + uploadDir);
        
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        
        System.out.println("File content type: " + file.getContentType());
        System.out.println("File size: " + file.getSize());
        
        if (!allowedContentTypes.isEmpty() && !allowedContentTypes.contains(file.getContentType())) {
            System.out.println("Unsupported file type. Allowed types: " + allowedContentTypes);
            throw new IllegalArgumentException("Unsupported file type: " + file.getContentType());
        }
        
        if (file.getSize() > maxBytes) {
            System.out.println("File exceeds maximum size. File size: " + file.getSize() + ", Max size: " + maxBytes);
            throw new IllegalArgumentException("File exceeds maximum size of " + maxBytes + " bytes");
        }

        String cleanName = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = "";
        int dotIdx = cleanName.lastIndexOf('.');
        if (dotIdx > -1) {
            extension = cleanName.substring(dotIdx);
        }

        String newName = UUID.randomUUID() + extension;
        Path targetDir = Paths.get(uploadDir, subfolder).toAbsolutePath().normalize();
        
        System.out.println("Target directory: " + targetDir);
        
        Files.createDirectories(targetDir);
        Path target = targetDir.resolve(newName);
        
        System.out.println("Target file path: " + target);
        
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        
        String url = "/uploads/" + subfolder + "/" + newName;
        System.out.println("File uploaded successfully. URL: " + url);
        
        return url;
    }
}
