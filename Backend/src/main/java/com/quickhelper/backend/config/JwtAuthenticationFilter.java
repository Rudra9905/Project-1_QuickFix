package com.quickhelper.backend.config;

import com.quickhelper.backend.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
// JWT authentication filter that validates tokens and sets up Spring Security context
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        // Skip JWT validation for authentication endpoints and WebSocket
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth") || path.startsWith("/ws")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract JWT token from Authorization header
        String authorizationHeader = request.getHeader("Authorization");
        String token = null;
        Long userId = null;
        String role = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            token = authorizationHeader.substring(7); // Remove "Bearer " prefix
            
            try {
                // Validate token and extract user information
                if (jwtUtil.validateToken(token) && !jwtUtil.isTokenExpired(token)) {
                    userId = jwtUtil.getUserIdFromToken(token);
                    role = jwtUtil.getRoleFromToken(token);
                }
            } catch (Exception e) {
                // Invalid token - will be treated as unauthenticated
                logger.debug("Invalid JWT token: " + e.getMessage());
            }
        }

        // If we have a valid token and no authentication is set yet
        if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Create authentication token and set it in Spring Security context
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userId, // principal
                    null, // credentials
                    role != null ? Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role)) : Collections.emptyList()
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        // Continue with the filter chain
        filterChain.doFilter(request, response);
    }
}
