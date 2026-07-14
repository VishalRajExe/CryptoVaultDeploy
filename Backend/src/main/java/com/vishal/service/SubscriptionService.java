package com.vishal.service;

import com.vishal.domain.SubscriptionPlan;
import com.vishal.model.Subscription;
import com.vishal.model.SubscriptionHistory;
import com.vishal.model.User;
import com.vishal.response.PaymentResponse;

import java.util.List;

public interface SubscriptionService {
    Subscription getSubscriptionByUserId(Long userId);
    
    PaymentResponse createRazorpayOrderForUpgrade(User user, SubscriptionPlan plan) throws Exception;

    Subscription upgradeSubscriptionWithWallet(User user, SubscriptionPlan plan) throws Exception;
    
    Subscription processUpgradePayment(User user, String paymentId, String razorpayOrderId) throws Exception;
    
    Subscription cancelSubscription(Long userId) throws Exception;
    
    List<SubscriptionHistory> getHistoryByUserId(Long userId);
    
    void checkPremiumFeatureAccess(User user, SubscriptionPlan requiredPlan) throws Exception;

    // Admin methods
    List<Subscription> getAllSubscriptions();
    
    Subscription extendSubscription(Long subscriptionId, int days) throws Exception;
    
    Subscription forceCancelSubscription(Long subscriptionId) throws Exception;
}
