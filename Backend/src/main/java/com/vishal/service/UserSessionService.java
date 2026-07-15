package com.vishal.service;

import com.vishal.model.User;
import com.vishal.model.UserSession;
import java.util.List;

public interface UserSessionService {
    UserSession createSession(User user, String jwtToken, String userAgent, String ipAddress);
    List<UserSession> getActiveSessions(Long userId);
    void revokeSession(Long sessionId, Long userId) throws Exception;
    boolean isSessionActive(String jwtToken);
}
