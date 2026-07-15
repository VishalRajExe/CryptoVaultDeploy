package com.vishal.service;

import com.vishal.model.User;
import com.vishal.model.UserSession;
import com.vishal.repository.UserSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserSessionServiceImpl implements UserSessionService {

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Override
    public UserSession createSession(User user, String jwtToken, String userAgent, String ipAddress) {
        UserSession session = new UserSession();
        session.setUser(user);
        session.setJwtToken(jwtToken);
        session.setDeviceType(getDeviceType(userAgent));
        session.setIpAddress(ipAddress != null ? ipAddress : "Unknown");
        session.setLastActive(LocalDateTime.now());
        session.setActive(true);

        return userSessionRepository.save(session);
    }

    @Override
    public List<UserSession> getActiveSessions(Long userId) {
        return userSessionRepository.findByUserIdAndActiveTrue(userId);
    }

    @Override
    public void revokeSession(Long sessionId, Long userId) throws Exception {
        Optional<UserSession> optional = userSessionRepository.findById(sessionId);
        if (optional.isEmpty()) {
            throw new Exception("Session not found");
        }
        UserSession session = optional.get();
        if (!session.getUser().getId().equals(userId)) {
            throw new Exception("Unauthorized to revoke this session");
        }
        session.setActive(false);
        userSessionRepository.save(session);
    }

    @Override
    public boolean isSessionActive(String jwtToken) {
        // Strip Bearer prefix if present
        String token = jwtToken;
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        Optional<UserSession> optional = userSessionRepository.findByJwtToken(token);
        return optional.map(UserSession::isActive).orElse(true); 
        // If session isn't in db yet (like initial migration), default to true so users aren't locked out
    }

    private String getDeviceType(String userAgent) {
        if (userAgent == null) return "Windows";
        String ua = userAgent.toLowerCase();
        if (ua.contains("android")) return "Android";
        if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ipod")) return "iOS";
        if (ua.contains("macintosh") || ua.contains("mac os")) return "Mac";
        if (ua.contains("windows")) return "Windows";
        return "Web Browser";
    }
}
