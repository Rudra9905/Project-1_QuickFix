package com.quickhelper.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
// Cloudinary file storage helper
public class FileStorageService {
    @Autowired
    private Cloudinary cloudinary;

    public String storeFile(MultipartFile file, Set<String> allowedContentTypes, long maxBytes, String subfolder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        
        System.out.println("Uploading file to Cloudinary folder: " + subfolder);
        // Basic validation
        if (!allowedContentTypes.isEmpty() && !allowedContentTypes.contains(file.getContentType())) {
             throw new IllegalArgumentException("Unsupported file type: " + file.getContentType());
        }
        
        if (file.getSize() > maxBytes) {
             throw new IllegalArgumentException("File exceeds maximum size of " + maxBytes + " bytes");
        }

        try {
            // Upload to Cloudinary
            Map params = ObjectUtils.asMap(
                "folder", subfolder,
                "resource_type", "auto"
            );
            
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
            String url = (String) uploadResult.get("secure_url");
            
            System.out.println("File uploaded successfully to Cloudinary. URL: " + url);
            return url;
            
        } catch (IOException e) {
            System.err.println("Cloudinary upload failed: " + e.getMessage());
            throw new IOException("Failed to upload file to Cloudinary", e);
        }
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return;
        }

        try {
            // Extract public ID from URL
            // URL format: https://res.cloudinary.com/cloud_name/image/upload/v12345/folder/filename.jpg
            // We need: folder/filename (without extension)
            
            String publicId = extractPublicIdFromUrl(fileUrl);
            if (publicId != null) {
                System.out.println("Deleting file from Cloudinary. Public ID: " + publicId);
                Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                System.out.println("Cloudinary delete result: " + result);
            }
        } catch (Exception e) {
            System.err.println("Failed to delete file from Cloudinary: " + e.getMessage());
            // We don't throw exception here to avoid failing the transaction/request if only cleanup fails
        }
    }

    private String extractPublicIdFromUrl(String url) {
        try {
            int uploadIndex = url.indexOf("/upload/");
            if (uploadIndex == -1) return null;

            // Start after "/upload/"
            String path = url.substring(uploadIndex + 8);
            
            // Skip version if present (v1234567/)
            if (path.startsWith("v") && path.indexOf("/") > 0) {
                 int slashIndices = path.indexOf("/");
                 // check if dynamic part between v and / is numeric
                 String potentialVersion = path.substring(1, slashIndices);
                 if (potentialVersion.matches("\\d+")) {
                     path = path.substring(slashIndices + 1);
                 }
            }

            // Remove extension
            int lastDot = path.lastIndexOf(".");
            if (lastDot > 0) {
                path = path.substring(0, lastDot);
            }

            return path;
        } catch (Exception e) {
            System.err.println("Error extracting public ID from URL: " + url);
            return null;
        }
    }
}
