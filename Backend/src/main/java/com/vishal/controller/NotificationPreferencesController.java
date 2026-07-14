package com.vishal.controller;

import com.vishal.exception.UserException;
import com.vishal.model.NotificationHistory;
import com.vishal.model.NotificationPreferences;
import com.vishal.model.User;
import com.vishal.repository.NotificationHistoryRepository;
import com.vishal.service.CentralNotificationService;
import com.vishal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationPreferencesController {

    @Autowired
    private CentralNotificationService centralNotificationService;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationHistoryRepository notificationHistoryRepository;

    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferences> getPreferences(
            @RequestHeader("Authorization") String jwt) throws UserException {
        User user = userService.findUserProfileByJwt(jwt);
        NotificationPreferences preferences = centralNotificationService.getPreferences(user);
        return new ResponseEntity<>(preferences, HttpStatus.OK);
    }

    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferences> updatePreferences(
            @RequestHeader("Authorization") String jwt,
            @RequestBody NotificationPreferences updated) throws UserException {
        User user = userService.findUserProfileByJwt(jwt);
        NotificationPreferences preferences = centralNotificationService.updatePreferences(user, updated);
        return new ResponseEntity<>(preferences, HttpStatus.OK);
    }

    @GetMapping("/history")
    public ResponseEntity<List<NotificationHistory>> getMyHistory(
            @RequestHeader("Authorization") String jwt) throws UserException {
        User user = userService.findUserProfileByJwt(jwt);
        List<NotificationHistory> history = notificationHistoryRepository.findByUserIdOrderByTimestampDesc(user.getId());
        return new ResponseEntity<>(history, HttpStatus.OK);
    }

    @GetMapping("/admin/history")
    public ResponseEntity<List<NotificationHistory>> getAdminHistory(
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        if (user.getRole() != com.vishal.domain.USER_ROLE.ROLE_ADMIN) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        List<NotificationHistory> history = notificationHistoryRepository.findAllByOrderByTimestampDesc();
        return new ResponseEntity<>(history, HttpStatus.OK);
    }
}
