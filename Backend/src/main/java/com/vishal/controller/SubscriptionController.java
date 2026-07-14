package com.vishal.controller;

import com.vishal.domain.SubscriptionPlan;
import com.vishal.exception.UserException;
import com.vishal.model.Subscription;
import com.vishal.model.SubscriptionHistory;
import com.vishal.model.User;
import com.vishal.response.PaymentResponse;
import com.vishal.service.SubscriptionService;
import com.vishal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscription")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private UserService userService;

    @GetMapping("/current")
    public ResponseEntity<Subscription> getCurrentSubscription(
            @RequestHeader("Authorization") String jwt) throws UserException {
        User user = userService.findUserProfileByJwt(jwt);
        Subscription subscription = subscriptionService.getSubscriptionByUserId(user.getId());
        return new ResponseEntity<>(subscription, HttpStatus.OK);
    }

    @PostMapping("/upgrade/{plan}")
    public ResponseEntity<PaymentResponse> upgradeSubscription(
            @RequestHeader("Authorization") String jwt,
            @PathVariable SubscriptionPlan plan) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        PaymentResponse response = subscriptionService.createRazorpayOrderForUpgrade(user, plan);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/cancel")
    public ResponseEntity<Subscription> cancelSubscription(
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        Subscription subscription = subscriptionService.cancelSubscription(user.getId());
        return new ResponseEntity<>(subscription, HttpStatus.OK);
    }

    @GetMapping("/history")
    public ResponseEntity<List<SubscriptionHistory>> getSubscriptionHistory(
            @RequestHeader("Authorization") String jwt) throws UserException {
        User user = userService.findUserProfileByJwt(jwt);
        List<SubscriptionHistory> history = subscriptionService.getHistoryByUserId(user.getId());
        return new ResponseEntity<>(history, HttpStatus.OK);
    }

    @PutMapping("/callback")
    public ResponseEntity<Subscription> verifyUpgradePayment(
            @RequestHeader("Authorization") String jwt,
            @RequestParam("payment_id") String paymentId,
            @RequestParam("order_id") String orderId) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        Subscription subscription = subscriptionService.processUpgradePayment(user, paymentId, orderId);
        return new ResponseEntity<>(subscription, HttpStatus.OK);
    }

    // -------------------------------------------------------------------------
    // Admin Endpoints
    // -------------------------------------------------------------------------

    @GetMapping("/admin/all")
    public ResponseEntity<List<Subscription>> getAllSubscriptions(
            @RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        if (user.getRole() != com.vishal.domain.USER_ROLE.ROLE_ADMIN) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        List<Subscription> subscriptions = subscriptionService.getAllSubscriptions();
        return new ResponseEntity<>(subscriptions, HttpStatus.OK);
    }

    @PostMapping("/admin/{id}/extend/{days}")
    public ResponseEntity<Subscription> extendSubscription(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Long id,
            @PathVariable int days) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        if (user.getRole() != com.vishal.domain.USER_ROLE.ROLE_ADMIN) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        Subscription subscription = subscriptionService.extendSubscription(id, days);
        return new ResponseEntity<>(subscription, HttpStatus.OK);
    }

    @PostMapping("/admin/{id}/cancel")
    public ResponseEntity<Subscription> forceCancelSubscription(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Long id) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        if (user.getRole() != com.vishal.domain.USER_ROLE.ROLE_ADMIN) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        Subscription subscription = subscriptionService.forceCancelSubscription(id);
        return new ResponseEntity<>(subscription, HttpStatus.OK);
    }
}
