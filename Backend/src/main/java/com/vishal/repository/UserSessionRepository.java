package com.vishal.repository;

import com.vishal.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    List<UserSession> findByUserIdAndActiveTrue(Long userId);
    Optional<UserSession> findByJwtToken(String jwtToken);
}
