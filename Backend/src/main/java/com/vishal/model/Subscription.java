package com.vishal.model;

import com.vishal.domain.SubscriptionPlan;
import com.vishal.domain.SubscriptionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @OneToOne
    private User user;

    @Enumerated(EnumType.STRING)
    private SubscriptionPlan plan = SubscriptionPlan.FREE;

    private Long amount;

    private String currency = "INR";

    private String paymentId;

    private String razorpayOrderId;

    private LocalDateTime startDate;

    private LocalDateTime expiryDate;

    private boolean active = true;

    @Enumerated(EnumType.STRING)
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;
}
