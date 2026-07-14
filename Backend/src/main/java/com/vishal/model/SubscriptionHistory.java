package com.vishal.model;

import com.vishal.domain.SubscriptionPlan;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    private User user;

    @Enumerated(EnumType.STRING)
    private SubscriptionPlan plan;

    private Long amount;

    private String currency;

    private String paymentId;

    private String razorpayOrderId;

    private LocalDateTime paymentDate;

    private String status; // e.g. "SUCCESS", "PENDING", "FAILED"
}
