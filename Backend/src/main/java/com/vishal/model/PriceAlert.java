package com.vishal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PriceAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String symbol; // e.g. "BTC" or "ETH"

    private BigDecimal targetPrice;

    private String alertCondition; // "ABOVE" or "BELOW"

    private boolean active = true;

    private LocalDateTime createdAt = LocalDateTime.now();
}
