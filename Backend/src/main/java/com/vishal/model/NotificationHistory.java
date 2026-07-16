package com.vishal.model;

import com.vishal.domain.NotificationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    private User user;

    @Enumerated(EnumType.STRING)
    private NotificationType notificationType;

    private String subject;

    private String recipient;

    private String status; // "SUCCESS" or "FAILED"

    private java.time.Instant timestamp = java.time.Instant.now();

    @Column(length = 2000)
    private String errorMessage;
}
