package com.vishal.service;

import com.vishal.domain.USER_ROLE;


import com.vishal.model.User;
import com.vishal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializationComponent implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WatchlistService watchlistService;


    private PasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializationComponent(UserRepository userRepository,
                                       PasswordEncoder passwordEncoder,
                                       WatchlistService watchlistService
                                       ) {
        this.userRepository = userRepository;
        this.passwordEncoder=passwordEncoder;
        this.watchlistService = watchlistService;

    }

    @Override
    public void run(String... args) {
        initializeAdminUser();
        syncVerifiedUserStatus();
    }

    private void initializeAdminUser() {
        String adminUsername = "admin@vishal.com";

        if (userRepository.findByEmail(adminUsername)==null) {
            User adminUser = new User();

            adminUser.setPassword(passwordEncoder.encode("Admin@123"));
            adminUser.setFullName("Vishal Admin");
            adminUser.setEmail(adminUsername);
            adminUser.setRole(USER_ROLE.ROLE_ADMIN);
            adminUser.setVerified(true);
            adminUser.setStatus(com.vishal.domain.UserStatus.VERIFIED);
            User admin=userRepository.save(adminUser);

            // BUGFIX: the seeded admin account never had a watchlist created for it
            // (unlike users created through normal signup), so the very first call to
            // GET /api/watchlist as the admin would fail with a "not found" error.
            watchlistService.createWatchList(admin);
        }

        // Initialize requested admin user
        String requestedAdminEmail = "tradingapp.vishal@gmail.com";
        User reqAdmin = userRepository.findByEmail(requestedAdminEmail);
        if (reqAdmin == null) {
            reqAdmin = new User();
            reqAdmin.setEmail(requestedAdminEmail);
            reqAdmin.setFullName("TradingApp Admin");
            reqAdmin.setPassword(passwordEncoder.encode("admin123vr"));
            reqAdmin.setRole(USER_ROLE.ROLE_ADMIN);
            reqAdmin.setVerified(true);
            reqAdmin.setStatus(com.vishal.domain.UserStatus.VERIFIED);
            reqAdmin = userRepository.save(reqAdmin);
            watchlistService.createWatchList(reqAdmin);
        } else {
            reqAdmin.setRole(USER_ROLE.ROLE_ADMIN);
            reqAdmin.setPassword(passwordEncoder.encode("admin123vr"));
            reqAdmin.setVerified(true);
            reqAdmin.setStatus(com.vishal.domain.UserStatus.VERIFIED);
            userRepository.save(reqAdmin);
        }
    }

    private void syncVerifiedUserStatus() {
        try {
            java.util.List<User> users = userRepository.findAll();
            for (User u : users) {
                if (u.isVerified() && u.getStatus() == com.vishal.domain.UserStatus.PENDING) {
                    u.setStatus(com.vishal.domain.UserStatus.VERIFIED);
                    userRepository.save(u);
                }
            }
        } catch (Exception e) {
            System.err.println("Could not synchronize verified users status: " + e.getMessage());
        }
    }
}
