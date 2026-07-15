package com.vishal.service;

import com.vishal.domain.NotificationType;
import com.vishal.domain.SubscriptionPlan;
import com.vishal.model.Coin;
import com.vishal.model.PriceAlert;
import com.vishal.model.Subscription;
import com.vishal.model.User;
import com.vishal.repository.CoinRepository;
import com.vishal.repository.PriceAlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PriceAlertServiceImpl implements PriceAlertService {

    @Autowired
    private PriceAlertRepository priceAlertRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private CoinRepository coinRepository;

    @Autowired
    private CentralNotificationService centralNotificationService;

    @Autowired
    private NotificationService notificationService;

    @Override
    public PriceAlert createAlert(User user, String symbol, BigDecimal targetPrice, String condition) throws Exception {
        Subscription subscription = subscriptionService.getSubscriptionByUserId(user.getId());
        
        // Enforce 3 price alerts limit for Free plan
        if (subscription.getPlan() == SubscriptionPlan.FREE) {
            List<PriceAlert> existingAlerts = priceAlertRepository.findByUserId(user.getId());
            long activeCount = existingAlerts.stream().filter(PriceAlert::isActive).count();
            if (activeCount >= 3) {
                throw new Exception("Free plan users are restricted to a maximum of 3 price alerts. Upgrade to Pro or Elite for unlimited alerts!");
            }
        }

        PriceAlert alert = new PriceAlert();
        alert.setUser(user);
        alert.setSymbol(symbol.toLowerCase());
        alert.setTargetPrice(targetPrice);
        alert.setAlertCondition(condition.toUpperCase());
        alert.setActive(true);
        alert.setCreatedAt(LocalDateTime.now());

        return priceAlertRepository.save(alert);
    }

    @Override
    public List<PriceAlert> getAlertsByUserId(Long userId) {
        return priceAlertRepository.findByUserId(userId);
    }

    @Override
    public void deleteAlert(Long alertId, Long userId) throws Exception {
        Optional<PriceAlert> optional = priceAlertRepository.findById(alertId);
        if (optional.isEmpty()) {
            throw new Exception("Price alert not found");
        }
        PriceAlert alert = optional.get();
        if (!alert.getUser().getId().equals(userId)) {
            throw new Exception("Unauthorized to delete this price alert");
        }
        priceAlertRepository.delete(alert);
    }

    // Run price alert checks every 30 seconds
    @Override
    @Scheduled(fixedDelay = 30000)
    public void checkAlerts() {
        List<PriceAlert> activeAlerts = priceAlertRepository.findByActiveTrue();
        if (activeAlerts.isEmpty()) {
            return;
        }

        List<Coin> coins = coinRepository.findAll();
        for (PriceAlert alert : activeAlerts) {
            Optional<Coin> coinOpt = coins.stream()
                    .filter(c -> c.getId().equalsIgnoreCase(alert.getSymbol()) || c.getSymbol().equalsIgnoreCase(alert.getSymbol()))
                    .findFirst();

            if (coinOpt.isPresent()) {
                Coin coin = coinOpt.get();
                double currentPrice = coin.getCurrentPrice();
                double target = alert.getTargetPrice().doubleValue();

                boolean trigger = false;
                if ("ABOVE".equalsIgnoreCase(alert.getAlertCondition()) && currentPrice >= target) {
                    trigger = true;
                } else if ("BELOW".equalsIgnoreCase(alert.getAlertCondition()) && currentPrice <= target) {
                    trigger = true;
                }

                if (trigger) {
                    alert.setActive(false);
                    priceAlertRepository.save(alert);

                    // Send email alert
                    centralNotificationService.sendNotification(
                            alert.getUser(),
                            NotificationType.TRADING,
                            "🔔 Price Alert Triggered",
                            "The price of " + coin.getName() + " has gone " + alert.getAlertCondition() + " your target price of $" + target + ". Current price: $" + currentPrice + "."
                    );

                    // Send in-app notification
                    notificationService.create(
                            alert.getUser(),
                            "PRICE_ALERT",
                            "Price of " + coin.getName() + " went " + alert.getAlertCondition().toLowerCase() + " $" + target,
                            BigDecimal.valueOf(currentPrice)
                    );
                }
            }
        }
    }
}
