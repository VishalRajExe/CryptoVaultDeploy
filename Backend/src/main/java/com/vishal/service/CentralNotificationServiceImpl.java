package com.vishal.service;

import com.vishal.domain.NotificationType;
import com.vishal.domain.USER_ROLE;
import com.vishal.model.NotificationHistory;
import com.vishal.model.NotificationPreferences;
import com.vishal.model.User;
import com.vishal.repository.NotificationHistoryRepository;
import com.vishal.repository.NotificationPreferencesRepository;
import com.vishal.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CentralNotificationServiceImpl implements CentralNotificationService {

    @Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private NotificationHistoryRepository notificationHistoryRepository;

    @Autowired
    private NotificationPreferencesRepository notificationPreferencesRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailTemplateService emailTemplateService;

    @Override
    public NotificationPreferences getPreferences(User user) {
        NotificationPreferences preferences = notificationPreferencesRepository.findByUserId(user.getId());
        if (preferences == null) {
            preferences = new NotificationPreferences();
            preferences.setUser(user);
            preferences = notificationPreferencesRepository.save(preferences);
        }
        return preferences;
    }

    @Override
    public NotificationPreferences updatePreferences(User user, NotificationPreferences updated) {
        NotificationPreferences preferences = getPreferences(user);
        preferences.setTrading(updated.isTrading());
        preferences.setWallet(updated.isWallet());
        preferences.setReplay(updated.isReplay());
        preferences.setSubscription(updated.isSubscription());
        preferences.setMarketing(updated.isMarketing());
        return notificationPreferencesRepository.save(preferences);
    }

    private boolean shouldSendEmail(User user, NotificationType type) {
        if (type == NotificationType.SECURITY || type == NotificationType.AUTHENTICATION || type == NotificationType.ADMIN) {
            return true; // Security & Admin notifications are always enabled
        }
        NotificationPreferences preferences = getPreferences(user);
        switch (type) {
            case TRADING:
                return preferences.isTrading();
            case WALLET:
                return preferences.isWallet();
            case REPLAY:
                return preferences.isReplay();
            case SUBSCRIPTION:
                return preferences.isSubscription();
            default:
                return false;
        }
    }

    @Override
    @Async
    public void sendNotification(User user, NotificationType type, String subject, String details) {
        if (user == null || user.getEmail() == null) {
            return;
        }

        // Check user preferences
        if (!shouldSendEmail(user, type)) {
            return;
        }

        NotificationHistory history = new NotificationHistory();
        history.setUser(user);
        history.setNotificationType(type);
        history.setSubject(subject);
        history.setRecipient(user.getEmail());
        history.setTimestamp(LocalDateTime.now());

        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            String htmlBody = emailTemplateService.buildHtmlEmail(
                    user.getFullName() != null ? user.getFullName() : "Trader",
                    subject,
                    details,
                    LocalDateTime.now().toString()
            );

            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            helper.setTo(user.getEmail());

            javaMailSender.send(mimeMessage);
            
            history.setStatus("SUCCESS");
            System.out.println("Email sent successfully to " + user.getEmail() + " for " + type);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + user.getEmail() + ": " + e.getMessage());
            history.setStatus("FAILED");
            history.setErrorMessage(e.getMessage());
        } finally {
            notificationHistoryRepository.save(history);
        }
    }

    @Override
    @Async
    public void sendAdminNotification(NotificationType type, String subject, String details) {
        // Send notification to the main requested admin email
        String defaultAdminEmail = "tradingapp.vishal@gmail.com";
        
        NotificationHistory history = new NotificationHistory();
        history.setNotificationType(type);
        history.setSubject(subject);
        history.setRecipient(defaultAdminEmail);
        history.setTimestamp(LocalDateTime.now());

        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            String htmlBody = emailTemplateService.buildHtmlEmail(
                    "Administrator",
                    "[ADMIN ALERT] " + subject,
                    details,
                    LocalDateTime.now().toString()
            );

            helper.setSubject("[ADMIN ALERT] " + subject);
            helper.setText(htmlBody, true);
            helper.setTo(defaultAdminEmail);

            javaMailSender.send(mimeMessage);
            
            history.setStatus("SUCCESS");
            System.out.println("Admin email sent successfully to " + defaultAdminEmail);
        } catch (Exception e) {
            System.err.println("Failed to send admin email to " + defaultAdminEmail + ": " + e.getMessage());
            history.setStatus("FAILED");
            history.setErrorMessage(e.getMessage());
        } finally {
            notificationHistoryRepository.save(history);
        }
    }
}
