package com.vishal.service;

import com.vishal.domain.NotificationType;
import com.vishal.model.NotificationPreferences;
import com.vishal.model.User;

public interface CentralNotificationService {
    void sendNotification(User user, NotificationType type, String subject, String details);
    
    void sendAdminNotification(NotificationType type, String subject, String details);
    
    NotificationPreferences getPreferences(User user);
    
    NotificationPreferences updatePreferences(User user, NotificationPreferences preferences);
}
