package com.quickhelper.backend.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

public class CustomHandshakeHandler extends DefaultHandshakeHandler {
    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler, Map<String, Object> attributes) {
        // The interceptor has already validated the token and put userId in attributes
        if (attributes.containsKey("userId")) {
            String userId = String.valueOf(attributes.get("userId"));
            return new UserPrincipal(userId);
        }
        return null;
    }
}
