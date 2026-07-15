package com.vishal.service;

import com.razorpay.Payment;
import com.razorpay.PaymentLink;
import com.razorpay.RazorpayClient;
import com.vishal.domain.SubscriptionPlan;
import com.vishal.domain.SubscriptionStatus;
import com.vishal.domain.NotificationType;
import com.vishal.exception.UserException;
import com.vishal.model.Subscription;
import com.vishal.model.SubscriptionHistory;
import com.vishal.model.User;
import com.vishal.model.Wallet;
import com.vishal.model.WalletTransaction;
import com.vishal.domain.WalletTransactionType;
import com.vishal.repository.SubscriptionHistoryRepository;
import com.vishal.repository.SubscriptionRepository;
import com.vishal.repository.WalletTransactionRepository;
import com.vishal.response.PaymentResponse;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private SubscriptionHistoryRepository subscriptionHistoryRepository;

    @Autowired
    private WalletService walletService;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @Autowired
    private CentralNotificationService centralNotificationService;

    @Value("${razorpay.api.key}")
    private String apiKey;

    @Value("${razorpay.api.secret}")
    private String apiSecret;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public Subscription getSubscriptionByUserId(Long userId) {
        Subscription subscription = subscriptionRepository.findByUserId(userId);
        if (subscription == null) {
            subscription = new Subscription();
            subscription.setUser(new User(userId, null, null, null, null, null, false, null, null, null, null));
            subscription.setPlan(SubscriptionPlan.FREE);
            subscription.setActive(true);
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setStartDate(LocalDateTime.now());
            subscription = subscriptionRepository.save(subscription);
        } else {
            // Check if subscription has expired
            if (subscription.getPlan() != SubscriptionPlan.FREE && 
                subscription.getExpiryDate() != null && 
                subscription.getExpiryDate().isBefore(LocalDateTime.now())) {
                
                // Log expired plan to history
                SubscriptionHistory history = new SubscriptionHistory();
                history.setUser(subscription.getUser());
                history.setPlan(subscription.getPlan());
                history.setAmount(0L);
                history.setCurrency("INR");
                history.setPaymentDate(LocalDateTime.now());
                history.setStatus("EXPIRED");
                subscriptionHistoryRepository.save(history);

                // Revert to FREE
                subscription.setPlan(SubscriptionPlan.FREE);
                subscription.setExpiryDate(null);
                subscription.setActive(true);
                subscription.setStatus(SubscriptionStatus.ACTIVE);
                subscription = subscriptionRepository.save(subscription);

                // Notify user
                centralNotificationService.sendNotification(
                        subscription.getUser(),
                        NotificationType.SUBSCRIPTION,
                        "Subscription Expired",
                        "Your premium subscription has expired. Your account has been reverted to the Free plan. Upgrade today to continue enjoying premium benefits."
                );
            }
        }
        return subscription;
    }

    @Override
    public PaymentResponse createRazorpayOrderForUpgrade(User user, SubscriptionPlan plan) throws Exception {
        if (plan == SubscriptionPlan.FREE) {
            throw new IllegalArgumentException("Cannot create payment order for FREE plan.");
        }

        // Determine price based on plan
        long amountInInr = (plan == SubscriptionPlan.PRO) ? 850L : 4250L;
        long amountInPaise = amountInInr * 100L;

        // Prevent multiple active subscriptions
        Subscription current = getSubscriptionByUserId(user.getId());
        if (current.getPlan() == plan && current.getExpiryDate() != null && current.getExpiryDate().isAfter(LocalDateTime.now())) {
            throw new Exception("You already have an active subscription for " + plan + " plan.");
        }

        RazorpayClient razorpay = new RazorpayClient(apiKey, apiSecret);

        JSONObject paymentLinkRequest = new JSONObject();
        paymentLinkRequest.put("amount", amountInPaise);
        paymentLinkRequest.put("currency", "INR");

        JSONObject customer = new JSONObject();
        customer.put("name", user.getFullName());
        customer.put("email", user.getEmail());
        paymentLinkRequest.put("customer", customer);

        JSONObject notify = new JSONObject();
        notify.put("email", true);
        paymentLinkRequest.put("notify", notify);

        paymentLinkRequest.put("reminder_enable", true);
        
        // Callback URL to redirect back to user's subscription page
        paymentLinkRequest.put("callback_url", frontendUrl + "/app/subscription");
        paymentLinkRequest.put("callback_method", "get");

        PaymentLink payment = razorpay.paymentLink.create(paymentLinkRequest);

        String paymentLinkId = payment.get("id");
        String paymentLinkUrl = payment.get("short_url");

        // Log pending transaction
        SubscriptionHistory history = new SubscriptionHistory();
        history.setUser(user);
        history.setPlan(plan);
        history.setAmount(amountInInr);
        history.setCurrency("INR");
        history.setRazorpayOrderId(paymentLinkId);
        history.setPaymentDate(LocalDateTime.now());
        history.setStatus("PENDING");
        subscriptionHistoryRepository.save(history);

        PaymentResponse res = new PaymentResponse();
        res.setPayment_url(paymentLinkUrl);
        return res;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
    public Subscription upgradeSubscriptionWithWallet(User user, SubscriptionPlan plan) throws Exception {
        if (plan == SubscriptionPlan.FREE) {
            throw new IllegalArgumentException("Cannot purchase FREE plan.");
        }

        double priceInUsd = (plan == SubscriptionPlan.PRO) ? 10.0 : 50.0;
        java.math.BigDecimal priceBigDecimal = java.math.BigDecimal.valueOf(priceInUsd);

        // Get user's wallet
        Wallet wallet = walletService.getUserWallet(user);

        // Check and deduct
        try {
            walletService.withdrawBalanceFromWallet(wallet, priceBigDecimal);
        } catch (Exception e) {
            throw new Exception("Insufficient wallet balance. You need $" + priceInUsd + " USD to purchase " + plan + ".");
        }

        // Log wallet transaction
        WalletTransaction walletTransaction = new WalletTransaction();
        walletTransaction.setWallet(wallet);
        walletTransaction.setPurpose("Subscription Purchase - " + plan);
        walletTransaction.setDate(java.time.LocalDate.now());
        walletTransaction.setTransferId("SUB_" + plan);
        walletTransaction.setType(WalletTransactionType.WITHDRAWAL);
        walletTransaction.setAmount(priceBigDecimal.negate());
        walletTransactionRepository.save(walletTransaction);

        // Update main subscription
        Subscription subscription = subscriptionRepository.findByUserId(user.getId());
        if (subscription == null) {
            subscription = new Subscription();
            subscription.setUser(user);
        }

        subscription.setPlan(plan);
        subscription.setStartDate(LocalDateTime.now());
        subscription.setExpiryDate(LocalDateTime.now().plusDays(30)); // 30-day billing cycle
        subscription.setActive(true);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setAmount((long) priceInUsd); // Store USD amount
        subscription.setCurrency("USD");
        subscription.setPaymentId("WALLET_" + System.currentTimeMillis());
        subscription.setRazorpayOrderId(null);
        Subscription updated = subscriptionRepository.save(subscription);

        // Log transaction history
        SubscriptionHistory history = new SubscriptionHistory();
        history.setUser(user);
        history.setPlan(plan);
        history.setAmount((long) priceInUsd);
        history.setCurrency("USD");
        history.setPaymentId(subscription.getPaymentId());
        history.setPaymentDate(LocalDateTime.now());
        history.setStatus("SUCCESS");
        subscriptionHistoryRepository.save(history);

        // Send subscription purchased notifications
        centralNotificationService.sendNotification(
                user,
                NotificationType.SUBSCRIPTION,
                "Subscription Purchased Successfully",
                "Thank you for upgrading! Your account has been upgraded to the " + plan + " plan using your wallet balance."
        );
        centralNotificationService.sendAdminNotification(
                NotificationType.ADMIN,
                "Subscription Purchase Completed",
                "User " + user.getEmail() + " purchased subscription plan " + plan + " ($" + priceInUsd + " USD) via wallet."
        );

        return updated;
    }

    @Override
    public Subscription processUpgradePayment(User user, String paymentId, String razorpayOrderId) throws Exception {
        RazorpayClient razorpay = new RazorpayClient(apiKey, apiSecret);
        Payment payment = razorpay.payments.fetch(paymentId);
        String paymentStatus = payment.get("status");

        if (!"captured".equals(paymentStatus) && !"authorized".equals(paymentStatus)) {
            throw new Exception("Payment verification failed. Status: " + paymentStatus);
        }

        // Find the pending transaction log
        List<SubscriptionHistory> historyList = subscriptionHistoryRepository.findByUserId(user.getId());
        SubscriptionHistory pendingHistory = null;
        for (SubscriptionHistory history : historyList) {
            if ("PENDING".equals(history.getStatus()) && razorpayOrderId.equals(history.getRazorpayOrderId())) {
                pendingHistory = history;
                break;
            }
        }

        if (pendingHistory == null) {
            throw new Exception("Transaction record not found or already processed.");
        }

        SubscriptionPlan newPlan = pendingHistory.getPlan();

        // Update main subscription
        Subscription subscription = subscriptionRepository.findByUserId(user.getId());
        if (subscription == null) {
            subscription = new Subscription();
            subscription.setUser(user);
        }

        subscription.setPlan(newPlan);
        subscription.setStartDate(LocalDateTime.now());
        subscription.setExpiryDate(LocalDateTime.now().plusDays(30)); // 30-day billing cycle
        subscription.setActive(true);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setAmount(pendingHistory.getAmount());
        subscription.setCurrency("INR");
        subscription.setPaymentId(paymentId);
        subscription.setRazorpayOrderId(razorpayOrderId);
        Subscription updated = subscriptionRepository.save(subscription);

        pendingHistory.setStatus("SUCCESS");
        pendingHistory.setPaymentId(paymentId);
        subscriptionHistoryRepository.save(pendingHistory);

        // Send notifications
        centralNotificationService.sendNotification(
                user,
                NotificationType.SUBSCRIPTION,
                "Subscription Upgraded Successfully",
                "Thank you for upgrading! Your account has been upgraded to the " + newPlan + " plan."
        );
        centralNotificationService.sendAdminNotification(
                NotificationType.ADMIN,
                "Subscription Upgrade Completed",
                "User " + user.getEmail() + " successfully upgraded to " + newPlan + " plan via Razorpay."
        );

        return updated;
    }

    @Override
    public Subscription cancelSubscription(Long userId) throws Exception {
        Subscription subscription = subscriptionRepository.findByUserId(userId);
        if (subscription == null || subscription.getPlan() == SubscriptionPlan.FREE) {
            throw new Exception("No active premium subscription found to cancel.");
        }
        if (subscription.getStatus() == SubscriptionStatus.CANCELLED) {
            throw new Exception("Subscription is already cancelled.");
        }
        subscription.setStatus(SubscriptionStatus.CANCELLED);
        Subscription saved = subscriptionRepository.save(subscription);

        // Notify user
        centralNotificationService.sendNotification(
                saved.getUser(),
                NotificationType.SUBSCRIPTION,
                "Subscription Cancelled",
                "Your premium subscription has been successfully cancelled. You will continue to have access to your plan benefits until " + saved.getExpiryDate() + "."
        );

        return saved;
    }

    @Override
    public List<SubscriptionHistory> getHistoryByUserId(Long userId) {
        return subscriptionHistoryRepository.findByUserId(userId);
    }

    @Override
    public void checkPremiumFeatureAccess(User user, SubscriptionPlan requiredPlan) throws Exception {
        if (user.getRole() == com.vishal.domain.USER_ROLE.ROLE_ADMIN) {
            return; // Admins bypass gating checks
        }
        Subscription subscription = getSubscriptionByUserId(user.getId());
        if (!subscription.isActive() || subscription.getStatus() == SubscriptionStatus.EXPIRED) {
            throw new Exception("Your subscription has expired. Please renew your plan.");
        }
        if (subscription.getPlan().ordinal() < requiredPlan.ordinal()) {
            throw new Exception("This feature is premium. Please upgrade your subscription to the " + requiredPlan + " plan to access it.");
        }
    }

    @Override
    public List<Subscription> getAllSubscriptions() {
        return subscriptionRepository.findAll();
    }

    @Override
    public Subscription extendSubscription(Long subscriptionId, int days) throws Exception {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new Exception("Subscription not found."));
        if (subscription.getExpiryDate() == null) {
            subscription.setExpiryDate(LocalDateTime.now().plusDays(days));
        } else {
            subscription.setExpiryDate(subscription.getExpiryDate().plusDays(days));
        }
        subscription.setActive(true);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        Subscription saved = subscriptionRepository.save(subscription);

        // Notify user
        centralNotificationService.sendNotification(
                saved.getUser(),
                NotificationType.SUBSCRIPTION,
                "Subscription Extended",
                "Your premium subscription has been extended by " + days + " days by an administrator. Your new expiry date is " + saved.getExpiryDate() + "."
        );

        return saved;
    }

    @Override
    public Subscription forceCancelSubscription(Long subscriptionId) throws Exception {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new Exception("Subscription not found."));
        
        // Log to history
        SubscriptionHistory history = new SubscriptionHistory();
        history.setUser(subscription.getUser());
        history.setPlan(subscription.getPlan());
        history.setAmount(0L);
        history.setCurrency("INR");
        history.setPaymentDate(LocalDateTime.now());
        history.setStatus("FORCE_CANCELLED");
        subscriptionHistoryRepository.save(history);

        subscription.setPlan(SubscriptionPlan.FREE);
        subscription.setExpiryDate(null);
        subscription.setActive(true);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        Subscription saved = subscriptionRepository.save(subscription);

        // Notify user
        centralNotificationService.sendNotification(
                saved.getUser(),
                NotificationType.SUBSCRIPTION,
                "Subscription Cancelled By Admin",
                "Your premium subscription has been cancelled by an administrator. Your account has been reverted to the Free plan."
        );

        return saved;
    }
}
