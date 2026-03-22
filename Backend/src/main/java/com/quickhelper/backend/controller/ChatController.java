package com.quickhelper.backend.controller;

import com.quickhelper.backend.model.ChatMessage;
import com.quickhelper.backend.service.ChatService;
import com.quickhelper.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    private final FileStorageService fileStorageService;

    @PostMapping("/api/chat/upload")
    public ResponseEntity<?> uploadMedia(@RequestParam("file") MultipartFile file) {
        try {
            Set<String> allowedTypes = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
            String url = fileStorageService.storeFile(file, allowedTypes, 10 * 1024 * 1024, "chat-media");
            return ResponseEntity.ok(Map.of("url", url));
        } catch (IOException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // WebSocket endpoint for sending messages
    // Client sends to: /app/chat
    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessage chatMessage) {
        System.out.println("Received chat message: " + chatMessage.getContent() + " from " + chatMessage.getSenderId() + " to " + chatMessage.getReceiverId());
        
        ChatMessage saved = chatService.saveMessage(chatMessage);
        
        // Send to receiver using topic
        String receiverDestination = "/topic/user/" + saved.getReceiverId() + "/chat";
        System.out.println("Sending to receiver: " + receiverDestination);
        messagingTemplate.convertAndSend(receiverDestination, saved);
        
        // Send to sender using topic (similar to receiver) to ensure reliable delivery
        String senderDestination = "/topic/user/" + saved.getSenderId() + "/chat";
        System.out.println("Sending to sender: " + senderDestination);
        messagingTemplate.convertAndSend(senderDestination, saved);
    }

    // REST endpoint for fetching history
    // GET /api/chat/history/{userId1}/{userId2}?page=0&size=20
    @GetMapping("/api/chat/history/{userId1}/{userId2}")
    public ResponseEntity<Page<ChatMessage>> getChatHistory(
            @PathVariable Long userId1,
            @PathVariable Long userId2,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(
            chatService.getConversation(userId1, userId2, PageRequest.of(page, size))
        );
    }
    
    // REST endpoint for unread count
    @GetMapping("/api/chat/unread/{userId}")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long userId) {
        return ResponseEntity.ok(chatService.getUnreadCount(userId));
    }
}
