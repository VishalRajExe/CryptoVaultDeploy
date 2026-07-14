package com.vishal.service;

import com.vishal.domain.WithdrawalStatus;
import com.vishal.domain.NotificationType;
import com.vishal.model.User;
import com.vishal.model.Withdrawal;
import com.vishal.repository.WithdrawalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class WithdrawalServiceImpl implements WithdrawalService{
    @Autowired
    private WithdrawalRepository withdrawalRepository;


    @Autowired
    private CentralNotificationService centralNotificationService;

    @Override
    public Withdrawal requestWithdrawal(java.math.BigDecimal amount,User user) {
        Withdrawal withdrawal=new Withdrawal();
        withdrawal.setAmount(amount);
        withdrawal.setStatus(WithdrawalStatus.PENDING);
        withdrawal.setDate(LocalDateTime.now());
        withdrawal.setUser(user);
        
        Withdrawal saved = withdrawalRepository.save(withdrawal);
        
        // Notify user and admin
        centralNotificationService.sendNotification(user, NotificationType.WALLET, "Withdrawal Requested", "You have requested a withdrawal of $" + amount + " USD.");
        centralNotificationService.sendAdminNotification(NotificationType.ADMIN, "Withdrawal Request", "A new withdrawal request of $" + amount + " USD from user: " + user.getEmail());
        if (amount.compareTo(new java.math.BigDecimal("5000")) >= 0) {
            centralNotificationService.sendAdminNotification(NotificationType.ADMIN, "Large Withdrawal", "Large withdrawal request from " + user.getEmail() + " of amount: $" + amount);
        }

        return saved;
    }

    @Override
    public Withdrawal procedWithdrawal(Long withdrawalId,boolean accept) throws Exception {
        Optional<Withdrawal> withdrawalOptional=withdrawalRepository.findById(withdrawalId);

        if(withdrawalOptional.isEmpty()){
            throw new Exception("withdrawal id is wrong...");
        }

        Withdrawal withdrawal=withdrawalOptional.get();


        withdrawal.setDate(LocalDateTime.now());

        if(accept){
            withdrawal.setStatus(WithdrawalStatus.SUCCESS);
            centralNotificationService.sendNotification(withdrawal.getUser(), NotificationType.WALLET, "Withdrawal Approved", "Your withdrawal request of $" + withdrawal.getAmount() + " USD was approved and completed successfully.");
        }
        else{
            withdrawal.setStatus(WithdrawalStatus.DECLINE);
            centralNotificationService.sendNotification(withdrawal.getUser(), NotificationType.WALLET, "Withdrawal Rejected", "Your withdrawal request of $" + withdrawal.getAmount() + " USD was declined/rejected.");
            centralNotificationService.sendAdminNotification(NotificationType.ADMIN, "Withdrawal Request Rejected", "A withdrawal request for user " + withdrawal.getUser().getEmail() + " of amount $" + withdrawal.getAmount() + " USD was rejected.");
        }

        return withdrawalRepository.save(withdrawal);
    }

    @Override
    public List<Withdrawal> getUsersWithdrawalHistory(User user) {
        return withdrawalRepository.findByUserId(user.getId());
    }

    @Override
    public List<Withdrawal> getAllWithdrawalRequest() {
        return withdrawalRepository.findAll();
    }
}
