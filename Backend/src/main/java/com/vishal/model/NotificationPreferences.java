package com.vishal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private boolean trading = true;

    private boolean wallet = true;

    // Security notification preferences must always remain enabled (read-only true)
    private final boolean security = true;

    private boolean replay = true;

    private boolean subscription = true;

    private boolean marketing = false;
}
