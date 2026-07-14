package com.vishal.repository;

import com.vishal.model.ChatBotUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;

@Repository
public interface ChatBotUsageRepository extends JpaRepository<ChatBotUsage, Long> {
    ChatBotUsage findByUserIdAndDate(Long userId, LocalDate date);
}
