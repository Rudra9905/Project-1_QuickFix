# Video Upload Troubleshooting Guide

## Common Issues and Solutions

### 1. Directory Permissions Issue
**Problem**: The uploads directory doesn't exist or doesn't have write permissions.
**Solution**: 
- Ensure the `uploads` directory exists in the backend root folder
- Create subdirectories: `uploads/resumes` and `uploads/videos`
- Ensure the application has write permissions to these directories

### 2. File Size Limit Exceeded
**Problem**: The uploaded file exceeds the maximum allowed size.
**Solution**:
- Resume files: Maximum 5MB
- Demo video files: Maximum 20MB
- Compress or reduce the quality of your files if they're too large

### 3. Unsupported File Format
**Problem**: The uploaded file has an unsupported format.
**Solution**:
- Resume: Only PDF files are accepted
- Demo video: Only MP4 and MOV (QuickTime) files are accepted

### 4. Multipart Configuration Issues
**Problem**: Spring's multipart configuration is not properly set.
**Solution**:
- Ensure the following properties are in `application.properties`:
  ```
  spring.servlet.multipart.enabled=true
  spring.servlet.multipart.max-file-size=20MB
  spring.servlet.multipart.max-request-size=20MB
  ```

### 5. Path Resolution Issues
**Problem**: The application can't resolve the correct path for file storage.
**Solution**:
- The application now uses absolute paths based on the application's working directory
- Check the backend logs for path resolution messages

## Debugging Steps

### 1. Check Backend Logs
Look for error messages in the backend console output:
- File upload attempts
- Path resolution issues
- Permission errors
- File size violations

### 2. Verify File Properties
Before uploading, check:
- File size (should be within limits)
- File extension (should be .pdf, .mp4, or .mov)
- File content type (should match the extension)

### 3. Test with Small Files
Try uploading small test files first:
- Create a small PDF document
- Create or download a small MP4 video

### 4. Check Network Connection
Ensure there are no network interruptions during upload:
- Stable internet connection
- Sufficient bandwidth for file transfer

## Technical Details

### Accepted File Types and Sizes
- **Resumes**: PDF format, maximum 5MB
- **Demo Videos**: MP4 or MOV format, maximum 20MB

### Storage Locations
- Resumes: `uploads/resumes/`
- Videos: `uploads/videos/`

### URL Access
Uploaded files are accessible at:
- Resumes: `http://localhost:8080/uploads/resumes/filename`
- Videos: `http://localhost:8080/uploads/videos/filename`

## If Problems Persist

1. Restart the backend server after making any configuration changes
2. Clear any cached data in your browser
3. Check that the backend server is running on port 8080
4. Verify that no firewall is blocking file upload requests