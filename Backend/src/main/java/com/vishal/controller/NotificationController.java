package com.vishal.controller;

import com.vishal.model.Notification;
import com.vishal.model.User;
import com.vishal.service.NotificationService;
import com.vishal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.vishal.domain.USER_ROLE;
import java.util.List;

@RestController
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserService userService;

    @GetMapping("/api/notifications")
    public ResponseEntity<List<Notification>> getMyNotifications(
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        return new ResponseEntity<>(notificationService.getForUser(user), HttpStatus.OK);
    }

    @PatchMapping("/api/notifications/mark-read")
    public ResponseEntity<String> markAllRead(
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        notificationService.markAllReadForUser(user);
        return new ResponseEntity<>("Notifications marked as read.", HttpStatus.OK);
    }

    @PostMapping("/api/admin/notifications/global")
    public ResponseEntity<List<Notification>> sendGlobalNotification(
            @RequestHeader("Authorization") String jwt,
            @RequestParam("type") String type,
            @RequestParam("message") String message,
            @RequestParam(value = "scheduledTime", required = false) String scheduledTimeStr) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        if (user.getRole() != USER_ROLE.ROLE_ADMIN) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        java.time.LocalDateTime scheduledTime = null;
        if (scheduledTimeStr != null && !scheduledTimeStr.isEmpty()) {
            scheduledTime = java.time.LocalDateTime.parse(scheduledTimeStr);
        }
        List<Notification> created = notificationService.createForGlobalAnnouncement(type, message, java.math.BigDecimal.ZERO, scheduledTime);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/api/admin/notifications/users")
    public ResponseEntity<List<Notification>> sendUsersNotification(
            @RequestHeader("Authorization") String jwt,
            @RequestBody java.util.List<Long> userIds,
            @RequestParam("type") String type,
            @RequestParam("message") String message,
            @RequestParam(value = "scheduledTime", required = false) String scheduledTimeStr) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        if (user.getRole() != USER_ROLE.ROLE_ADMIN) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        java.time.LocalDateTime scheduledTime = null;
        if (scheduledTimeStr != null && !scheduledTimeStr.isEmpty()) {
            scheduledTime = java.time.LocalDateTime.parse(scheduledTimeStr);
        }
        List<Notification> created = notificationService.createForMultipleUsers(userIds, type, message, java.math.BigDecimal.ZERO, scheduledTime);
        return ResponseEntity.ok(created);
    }
}
