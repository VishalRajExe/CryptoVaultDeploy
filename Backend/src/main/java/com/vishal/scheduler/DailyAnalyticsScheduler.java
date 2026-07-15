package com.vishal.scheduler;

import com.vishal.domain.NotificationType;
import com.vishal.model.Order;
import com.vishal.model.OrderItem;
import com.vishal.model.User;
import com.vishal.repository.OrderRepository;
import com.vishal.repository.UserRepository;
import com.vishal.service.CentralNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class DailyAnalyticsScheduler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CentralNotificationService centralNotificationService;

    // Run every night at 10:00 PM (22:00)
    @Scheduled(cron = "0 0 22 * * *")
    public void runDailyReports() {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            generateAndSendDailyReport(user);
        }
    }

    public void generateAndSendDailyReport(User user) {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        // Fetch all orders for this user completed today
        List<Order> todayOrders = orderRepository.findByUserId(user.getId()).stream()
                .filter(o -> o.getTimestamp().isAfter(startOfDay) && o.getTimestamp().isBefore(endOfDay) && "SUCCESS".equalsIgnoreCase(o.getStatus().name()))
                .collect(Collectors.toList());

        if (todayOrders.isEmpty()) {
            // Optional: Skip sending if no trades were executed today
            return;
        }

        int tradesCount = todayOrders.size();
        double totalPnL = 0.0;
        double bestTradePnL = -999999.0;
        double worstTradePnL = 999999.0;
        int winTrades = 0;
        int sellCount = 0;

        for (Order order : todayOrders) {
            if ("SELL".equalsIgnoreCase(order.getOrderType().name())) {
                sellCount++;
                OrderItem item = order.getOrderItem();
                if (item != null) {
                    double pnl = (item.getSellPrice() - item.getBuyPrice()) * item.getQuantity();
                    totalPnL += pnl;
                    if (pnl > 0) {
                        winTrades++;
                    }
                    if (pnl > bestTradePnL) {
                        bestTradePnL = pnl;
                    }
                    if (pnl < worstTradePnL) {
                        worstTradePnL = pnl;
                    }
                }
            }
        }

        if (sellCount == 0) {
            bestTradePnL = 0.0;
            worstTradePnL = 0.0;
        }

        double winRate = sellCount > 0 ? ((double) winTrades / sellCount) * 100.0 : 100.0;

        String formattedPnL = (totalPnL >= 0 ? "+$" : "-$") + Math.abs(totalPnL);
        String bestTradeStr = sellCount > 0 ? "$" + bestTradePnL : "N/A";
        String worstTradeStr = sellCount > 0 ? "$" + worstTradePnL : "N/A";

        String subject = "📊 Your Daily Trading Report";
        String content = "Here is your daily trading report for " + LocalDate.now() + ":\n\n" +
                "• Trades Executed: " + tradesCount + "\n" +
                "• Daily Net PnL: " + formattedPnL + "\n" +
                "• Best Trade: " + bestTradeStr + "\n" +
                "• Worst Trade: " + worstTradeStr + "\n" +
                "• Win Rate: " + String.format("%.2f", winRate) + "%\n\n" +
                "Keep up the great work!";

        // Send email
        centralNotificationService.sendNotification(user, NotificationType.TRADING, subject, content);
    }
}
