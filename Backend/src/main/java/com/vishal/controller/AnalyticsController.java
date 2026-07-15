package com.vishal.controller;

import com.vishal.model.User;
import com.vishal.scheduler.DailyAnalyticsScheduler;
import com.vishal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private DailyAnalyticsScheduler dailyAnalyticsScheduler;

    @Autowired
    private UserService userService;

    @PostMapping("/trigger-daily-report")
    public ResponseEntity<String> triggerDailyReport(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        dailyAnalyticsScheduler.generateAndSendDailyReport(user);
        return ResponseEntity.ok("Daily trading report compiled and dispatched to " + user.getEmail());
    }
}
