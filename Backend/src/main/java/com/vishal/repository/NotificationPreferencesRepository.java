package com.vishal.repository;

import com.vishal.model.NotificationPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationPreferencesRepository extends JpaRepository<NotificationPreferences, Long> {
    NotificationPreferences findByUserId(Long userId);
}
