package com.vishal.controller;

import com.vishal.model.User;
import com.vishal.model.UserSession;
import com.vishal.service.UserSessionService;
import com.vishal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users/sessions")
public class SessionController {

    @Autowired
    private UserSessionService userSessionService;

    @Autowired
    private UserService userService;

    @Autowired
    private com.vishal.repository.UserSessionRepository userSessionRepository;

    @GetMapping
    public ResponseEntity<List<UserSession>> getSessions(
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        List<UserSession> sessions = userSessionService.getActiveSessions(user.getId());
        
        String currentToken = jwt;
        if (currentToken != null && currentToken.startsWith("Bearer ")) {
            currentToken = currentToken.substring(7);
        }
        
        for (UserSession s : sessions) {
            if (s.getJwtToken() != null && s.getJwtToken().equals(currentToken)) {
                s.setCurrent(true);
            }
        }
        return ResponseEntity.ok(sessions);
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<String> revokeSession(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Long sessionId) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        userSessionService.revokeSession(sessionId, user.getId());
        return ResponseEntity.ok("Session revoked successfully");
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserSession>> getAllSessions(
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        List<UserSession> sessions = userSessionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        
        String currentToken = jwt;
        if (currentToken != null && currentToken.startsWith("Bearer ")) {
            currentToken = currentToken.substring(7);
        }
        
        for (UserSession s : sessions) {
            if (s.getJwtToken() != null && s.getJwtToken().equals(currentToken)) {
                s.setCurrent(true);
            }
        }
        return ResponseEntity.ok(sessions);
    }
}
