package com.vishal.controller;

import com.vishal.domain.USER_ROLE;
import com.vishal.domain.WalletTransactionType;
import com.vishal.exception.UserException;
import com.vishal.exception.WalletException;
import com.vishal.model.User;
import com.vishal.model.Wallet;
import com.vishal.model.WalletTransaction;
import com.vishal.model.Withdrawal;
import com.vishal.service.UserService;
import com.vishal.service.WalletService;
import com.vishal.service.WalletTransactionService;
import com.vishal.service.WithdrawalService;
import com.vishal.service.NotificationService;
import com.vishal.model.PaymentDetails;
import com.vishal.service.PaymentDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class WithdrawalController {

    @Autowired
    private WithdrawalService withdrawalService;

    @Autowired
    private WalletService walletService;

    @Autowired
    private UserService userService;

    @Autowired
    private WalletTransactionService walletTransactionService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PaymentDetailsService paymentDetailsService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private com.vishal.service.VerificationService verificationService;

    @Autowired
    private com.vishal.repository.VerificationRepository verificationRepository;

    @Autowired
    private com.vishal.service.CentralNotificationService centralNotificationService;

    @PostMapping("/api/withdrawal/initiate")
    public ResponseEntity<?> initiateWithdrawal(
            @RequestParam java.math.BigDecimal amount,
            @RequestParam(required = false) String pin,
            @RequestHeader("Authorization") String jwt) throws Exception {
        
        if (amount == null || amount.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new WalletException("Withdrawal amount must be greater than zero.");
        }

        User user = userService.findUserProfileByJwt(jwt);

        // Check Withdrawal PIN if set
        if (user.getWithdrawalPin() != null) {
            if (pin == null || !passwordEncoder.matches(pin, user.getWithdrawalPin())) {
                throw new UserException("Incorrect withdrawal PIN. Please try again.");
            }
        }

        Wallet userWallet = walletService.getUserWallet(user);
        if (userWallet.getBalance().compareTo(amount) < 0) {
            throw new WalletException("Insufficient wallet balance for this withdrawal.");
        }

        // Generate OTP and send via CentralNotificationService
        com.vishal.model.VerificationCode existingCode = verificationService.findUsersVerification(user);
        if (existingCode != null) {
            verificationService.deleteVerification(existingCode);
        }

        com.vishal.model.VerificationCode verificationCode = verificationService.sendVerificationOTP(user, com.vishal.domain.VerificationType.EMAIL);

        centralNotificationService.sendNotification(
                user,
                com.vishal.domain.NotificationType.SECURITY,
                "Withdrawal Request Verification",
                "You are requesting a withdrawal of <strong>$" + amount + "</strong>. "
                        + "Your verification code is: <strong>" + verificationCode.getOtp() + "</strong>. This code will expire in 10 minutes."
        );

        com.vishal.response.ApiResponse res = new com.vishal.response.ApiResponse();
        res.setMessage("Verification OTP sent to your registered email.");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/api/withdrawal/{amount}")
    public ResponseEntity<?> withdrawalRequest(
            @PathVariable java.math.BigDecimal amount,
            @RequestParam(required = false) String pin,
            @RequestParam String otp,
            @RequestHeader("Authorization") String jwt) throws Exception {

        if (amount == null || amount.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new WalletException("Withdrawal amount must be greater than zero.");
        }

        User user = userService.findUserProfileByJwt(jwt);

        // Check Withdrawal PIN if set
        if (user.getWithdrawalPin() != null) {
            if (pin == null || !passwordEncoder.matches(pin, user.getWithdrawalPin())) {
                throw new UserException("Incorrect withdrawal PIN. Please try again.");
            }
        }

        // Verify OTP
        com.vishal.model.VerificationCode verificationCode = verificationService.findUsersVerification(user);
        if (verificationCode == null) {
            throw new UserException("No verification code found. Please request an OTP first.");
        }

        if (verificationCode.getAttempts() >= 3) {
            verificationService.deleteVerification(verificationCode);
            throw new UserException("Too many failed verification attempts. OTP has been invalidated.");
        }

        com.vishal.domain.OtpVerificationResult result = verificationService.verifyOtp(otp, verificationCode);
        if (result != com.vishal.domain.OtpVerificationResult.SUCCESS) {
            verificationCode.setAttempts(verificationCode.getAttempts() + 1);
            verificationRepository.save(verificationCode);
            if (result == com.vishal.domain.OtpVerificationResult.EXPIRED) {
                verificationService.deleteVerification(verificationCode);
                throw new UserException("Verification OTP has expired. Please request a new one.");
            }
            throw new UserException("Invalid verification OTP. Remaining attempts: " + (3 - verificationCode.getAttempts()));
        }

        // Successfully verified, delete OTP
        verificationService.deleteVerification(verificationCode);

        // Withdrawals require bank details to be linked. Admin accounts are exempt.
        if (user.getRole() != USER_ROLE.ROLE_ADMIN) {
            PaymentDetails paymentDetails = paymentDetailsService.getUsersPaymentDetails(user);
            if (paymentDetails == null || paymentDetails.getAccountNumber() == null || paymentDetails.getAccountNumber().isBlank()) {
                throw new UserException("Please add your bank account details before requesting a withdrawal.");
            }
        }

        // Withdrawals require email verification. Admin accounts are exempt.
        if (user.getRole() != USER_ROLE.ROLE_ADMIN && !user.isVerified()) {
            throw new UserException("Email verification required before withdrawing. Please verify your account.");
        }

        Wallet userWallet = walletService.getUserWallet(user);

        if (userWallet.getBalance().compareTo(amount) < 0) {
            throw new WalletException("Insufficient wallet balance for this withdrawal.");
        }

        Withdrawal withdrawal = withdrawalService.requestWithdrawal(amount, user);
        walletService.addBalanceToWallet(userWallet, withdrawal.getAmount().negate());

        WalletTransaction walletTransaction = walletTransactionService.createTransaction(
                userWallet,
                WalletTransactionType.WITHDRAWAL, null,
                "bank account withdrawal",
                withdrawal.getAmount()
        );

        notificationService.create(user, "WITHDRAWAL_REQUESTED",
                "Withdrawal request for $" + amount + " submitted.", amount);

        // Security logging
        System.out.println("Security Log: Successful withdrawal of $" + amount + " by user " + user.getEmail());

        return new ResponseEntity<>(withdrawal, HttpStatus.OK);
    }

    @PatchMapping("/api/admin/withdrawal/{id}/proceed/{accept}")
    public ResponseEntity<?> proceedWithdrawal(
            @PathVariable Long id,
            @PathVariable boolean accept,
            @RequestHeader("Authorization")String jwt) throws Exception {

        // The admin making this call - used only to authorize the action, NOT as the
        // wallet to refund (see bugfix below).
        userService.findUserProfileByJwt(jwt);

        Withdrawal withdrawal=withdrawalService.procedWithdrawal(id,accept);

        if(!accept){
            // BUGFIX: this previously credited the refund to the ADMIN'S OWN wallet
            // (fetched from the JWT of whoever called this endpoint) instead of the
            // wallet belonging to the user who actually requested the withdrawal -
            // meaning a rejected withdrawal silently transferred the user's money to
            // whichever admin clicked "reject".
            Wallet requesterWallet = walletService.getUserWallet(withdrawal.getUser());
            walletService.addBalanceToWallet(requesterWallet, withdrawal.getAmount());
            notificationService.create(withdrawal.getUser(), "WITHDRAWAL_DECLINED",
                    "Your withdrawal request for $" + withdrawal.getAmount() + " was declined and refunded.",
                    withdrawal.getAmount());
        } else {
            notificationService.create(withdrawal.getUser(), "WITHDRAWAL_APPROVED",
                    "Your withdrawal request for $" + withdrawal.getAmount() + " was approved.",
                    withdrawal.getAmount());
        }
        
        return new ResponseEntity<>(withdrawal, HttpStatus.OK);
    }

    @GetMapping("/api/withdrawal")
    public ResponseEntity<List<Withdrawal>> getWithdrawalHistory(

            @RequestHeader("Authorization")String jwt) throws Exception {
        User user=userService.findUserProfileByJwt(jwt);

        List<Withdrawal> withdrawal=withdrawalService.getUsersWithdrawalHistory(user);

        return new ResponseEntity<>(withdrawal, HttpStatus.OK);
    }

    @GetMapping("/api/admin/withdrawal")
    public ResponseEntity<List<Withdrawal>> getAllWithdrawalRequest(

            @RequestHeader("Authorization")String jwt) throws Exception {
        User user=userService.findUserProfileByJwt(jwt);

        List<Withdrawal> withdrawal=withdrawalService.getAllWithdrawalRequest();

        return new ResponseEntity<>(withdrawal, HttpStatus.OK);
    }
}
