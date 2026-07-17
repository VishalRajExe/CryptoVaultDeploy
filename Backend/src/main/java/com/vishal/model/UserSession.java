package com.vishal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String deviceType; // "Windows", "Android", "Mac", "iOS", etc.

    @Column(length = 1000)
    private String jwtToken;

    private String ipAddress;

    private LocalDateTime lastActive = LocalDateTime.now();

    private boolean active = true;

    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();

    @Transient
    private boolean current;

    public String getDeviceInfo() {
        return deviceType;
    }

    public boolean isCurrent() {
        return current;
    }

    public void setCurrent(boolean current) {
        this.current = current;
    }
}
