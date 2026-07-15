package com.vishal.service;

import com.vishal.model.Notification;
import com.vishal.model.User;
import com.vishal.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private com.vishal.repository.UserRepository userRepository;

    @Override
    public Notification create(User user, String type, String message, java.math.BigDecimal amount) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setMessage(message);
        notification.setAmount(amount);
        notification.setTimestamp(LocalDateTime.now());
        notification.setRead(false);
        return notificationRepository.save(notification);
    }

    @Override
    public List<Notification> getForUser(User user) {
        List<Notification> all = notificationRepository.findByUserIdOrderByTimestampDesc(user.getId());
        return all.stream()
                .filter(n -> n.getScheduledTime() == null || n.getScheduledTime().isBefore(LocalDateTime.now()))
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public List<Notification> getAll() {
        return notificationRepository.findAllByOrderByTimestampDesc();
    }

    @Override
    public void markAllReadForUser(User user) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByTimestampDesc(user.getId());
        for (Notification n : notifications) {
            if (!n.isRead()) {
                n.setRead(true);
            }
        }
        notificationRepository.saveAll(notifications);
    }

    @Override
    public Notification createScheduled(User user, String type, String message, java.math.BigDecimal amount, java.time.LocalDateTime scheduledTime) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setMessage(message);
        notification.setAmount(amount);
        notification.setTimestamp(LocalDateTime.now());
        notification.setRead(false);
        notification.setScheduledTime(scheduledTime);
        return notificationRepository.save(notification);
    }

    @Override
    public List<Notification> createForMultipleUsers(List<Long> userIds, String type, String message, java.math.BigDecimal amount, java.time.LocalDateTime scheduledTime) {
        java.util.List<Notification> list = new java.util.ArrayList<>();
        for (Long id : userIds) {
            java.util.Optional<User> u = userRepository.findById(id);
            if (u.isPresent()) {
                Notification n = new Notification();
                n.setUser(u.get());
                n.setType(type);
                n.setMessage(message);
                n.setAmount(amount);
                n.setTimestamp(LocalDateTime.now());
                n.setRead(false);
                n.setScheduledTime(scheduledTime);
                list.add(n);
            }
        }
        return notificationRepository.saveAll(list);
    }

    @Override
    public List<Notification> createForGlobalAnnouncement(String type, String message, java.math.BigDecimal amount, java.time.LocalDateTime scheduledTime) {
        java.util.List<User> users = userRepository.findAll();
        java.util.List<Notification> list = new java.util.ArrayList<>();
        for (User u : users) {
            Notification n = new Notification();
            n.setUser(u);
            n.setType(type);
            n.setMessage(message);
            n.setAmount(amount);
            n.setTimestamp(LocalDateTime.now());
            n.setRead(false);
            n.setScheduledTime(scheduledTime);
            list.add(n);
        }
        return notificationRepository.saveAll(list);
    }
}
