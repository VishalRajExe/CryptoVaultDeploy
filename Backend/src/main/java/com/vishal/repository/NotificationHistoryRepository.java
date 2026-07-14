package com.vishal.repository;

import com.vishal.model.NotificationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationHistoryRepository extends JpaRepository<NotificationHistory, Long> {
    List<NotificationHistory> findByUserIdOrderByTimestampDesc(Long userId);
    List<NotificationHistory> findAllByOrderByTimestampDesc();
}
