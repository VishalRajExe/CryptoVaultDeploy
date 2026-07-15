package com.vishal.controller;

import com.vishal.domain.OtpVerificationResult;
import com.vishal.domain.UserStatus;
import com.vishal.domain.VerificationType;
import com.vishal.domain.NotificationType;
import com.vishal.exception.UserException;
import com.vishal.model.ForgotPasswordToken;
import com.vishal.model.User;
import com.vishal.model.VerificationCode;
import com.vishal.request.ResetPasswordRequest;
import com.vishal.request.UpdatePasswordRequest;
import com.vishal.response.ApiResponse;
import com.vishal.response.AuthResponse;
import com.vishal.service.EmailService;
import com.vishal.service.ForgotPasswordService;
import com.vishal.service.UserService;
import com.vishal.service.VerificationService;
import com.vishal.service.CentralNotificationService;
import com.vishal.utils.OtpUtils;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.vishal.repository.UserRepository;

import java.util.UUID;


@RestController
public class UserController {
	
	@Autowired
	private UserService userService;

	@Autowired
	private VerificationService verificationService;

	@Autowired
	private ForgotPasswordService forgotPasswordService;

	@Autowired
	private EmailService emailService;

	@Autowired
	private com.vishal.repository.UserRepository userRepository;

	@Autowired
	private CentralNotificationService centralNotificationService;

	@Autowired
	private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

	@Autowired
	private com.vishal.repository.VerificationRepository verificationRepository;


	@GetMapping("/api/users/profile")
	public ResponseEntity<User> getUserProfileHandler(
			@RequestHeader("Authorization") String jwt) throws UserException {

		User user = userService.findUserProfileByJwt(jwt);
		user.setPassword(null);

		return new ResponseEntity<>(user, HttpStatus.ACCEPTED);
	}
	
	@GetMapping("/api/users/{userId}")
	public ResponseEntity<User> findUserById(
			@PathVariable Long userId,
			@RequestHeader("Authorization") String jwt) throws UserException {

		User user = userService.findUserById(userId);
		user.setPassword(null);

		return new ResponseEntity<>(user, HttpStatus.ACCEPTED);
	}

	@GetMapping("/api/users/email/{email}")
	public ResponseEntity<User> findUserByEmail(
			@PathVariable String email,
			@RequestHeader("Authorization") String jwt) throws UserException {

		User user = userService.findUserByEmail(email);

		return new ResponseEntity<>(user, HttpStatus.ACCEPTED);
	}

	@PatchMapping("/api/users/enable-two-factor/verify-otp/{otp}")
	public ResponseEntity<User> enabledTwoFactorAuthentication(
			@RequestHeader("Authorization") String jwt,
			@PathVariable String otp
	) throws Exception {


		User user = userService.findUserProfileByJwt(jwt);

		VerificationCode verificationCode = verificationService.findUsersVerification(user);

		if (verificationCode == null) {
			throw new Exception("No verification code found. Please request a new OTP first.");
		}

		String sendTo = verificationCode.getVerificationType().equals(VerificationType.EMAIL)
				? verificationCode.getEmail()
				: verificationCode.getMobile();

		OtpVerificationResult result = verificationService.verifyOtp(otp, verificationCode);

		if (result == OtpVerificationResult.EXPIRED) {
			throw new Exception("OTP has expired. Please request a new one.");
		}
		if (result == OtpVerificationResult.INVALID) {
			throw new Exception("Invalid OTP. Please check your code and try again.");
		}

		// SUCCESS
		User updatedUser = userService.enabledTwoFactorAuthentication(
				verificationCode.getVerificationType(), sendTo, user);
		verificationService.deleteVerification(verificationCode);

		// Send 2FA update alert
		centralNotificationService.sendNotification(
				user,
				NotificationType.SECURITY,
				"Two-Factor Authentication Updated",
				"Two-Factor Authentication status has been successfully updated on your CryptoVault account."
		);

		return ResponseEntity.ok(updatedUser);

	}



	@PatchMapping("/auth/users/reset-password/verify-otp")
	public ResponseEntity<ApiResponse> resetPassword(
			@RequestParam String id,
			@RequestBody ResetPasswordRequest req
			) throws Exception {
		ForgotPasswordToken forgotPasswordToken=forgotPasswordService.findById(id);
		if (forgotPasswordToken == null) {
			throw new Exception("Password reset session not found or expired.");
		}

			boolean isVerified = forgotPasswordService.verifyToken(forgotPasswordToken,req.getOtp());

			if (isVerified) {

				userService.updatePassword(forgotPasswordToken.getUser(),req.getPassword());
				
				// Send password updated alert
				centralNotificationService.sendNotification(
						forgotPasswordToken.getUser(),
						NotificationType.SECURITY,
						"Password Reset Complete",
						"The password for your CryptoVault account has been successfully reset. If you did not make this change, please contact support immediately."
				);

				ApiResponse apiResponse=new ApiResponse();
				apiResponse.setMessage("password updated successfully");
				return ResponseEntity.ok(apiResponse);
			}
			throw new Exception("wrong otp");

	}

	@PostMapping("/auth/users/reset-password/send-otp")
	public ResponseEntity<AuthResponse> sendUpdatePasswordOTP(
			@RequestBody UpdatePasswordRequest req)
			throws Exception {

		User user = userService.findUserByEmail(req.getSendTo());
		String otp= OtpUtils.generateOTP();
		UUID uuid = UUID.randomUUID();
		String id = uuid.toString();

		ForgotPasswordToken token = forgotPasswordService.findByUser(user.getId());

		if(token==null){
			token=forgotPasswordService.createToken(
					user,id,otp,req.getVerificationType(), req.getSendTo()
			);
		}

		if(req.getVerificationType().equals(VerificationType.EMAIL)){
			centralNotificationService.sendNotification(
					user,
					NotificationType.SECURITY,
					"Password Reset Verification Code",
					"Your password reset verification code is: <strong>" + token.getOtp() + "</strong>. This code will expire in 10 minutes."
			);
		}

		AuthResponse res=new AuthResponse();
		res.setSession(token.getId());
		res.setMessage("Password Reset OTP sent successfully.");

		return ResponseEntity.ok(res);

	}


	/** New endpoint backing the Security page's "Mobile number" card, which
	 *  previously had no way to actually save a number at all. */
	@PatchMapping("/api/users/mobile")
	public ResponseEntity<User> updateMobile(
			@RequestHeader("Authorization") String jwt,
			@RequestBody java.util.Map<String, String> body) throws Exception {
		User user = userService.findUserProfileByJwt(jwt);
		User updated = userService.updateMobile(user, body.get("mobile"));
		return ResponseEntity.ok(updated);
	}

	@PostMapping("/api/users/withdrawal-pin")
	public ResponseEntity<ApiResponse> setWithdrawalPin(
			@RequestHeader("Authorization") String jwt,
			@RequestParam String pin) throws Exception {
		User user = userService.findUserProfileByJwt(jwt);
		
		if (pin == null || pin.length() != 4 || !pin.matches("\\d{4}")) {
			throw new IllegalArgumentException("PIN must be exactly 4 digits.");
		}
		
		user.setWithdrawalPin(passwordEncoder.encode(pin));
		userRepository.save(user);

		centralNotificationService.sendNotification(
				user,
				NotificationType.SECURITY,
				"Withdrawal PIN Set Successfully",
				"You have successfully set/updated your CryptoVault withdrawal PIN. This PIN will be required for all future withdrawals."
		);

		ApiResponse res = new ApiResponse();
		res.setMessage("Withdrawal PIN set successfully.");
		return ResponseEntity.ok(res);
	}

	@PostMapping("/api/users/withdrawal-pin/forgot")
	public ResponseEntity<ApiResponse> forgotWithdrawalPin(
			@RequestHeader("Authorization") String jwt) throws Exception {
		User user = userService.findUserProfileByJwt(jwt);
		
		VerificationCode existingCode = verificationService.findUsersVerification(user);
		if (existingCode != null) {
			verificationService.deleteVerification(existingCode);
		}
		
		VerificationCode verificationCode = verificationService.sendVerificationOTP(user, VerificationType.EMAIL);
		
		centralNotificationService.sendNotification(
				user,
				NotificationType.SECURITY,
				"Withdrawal PIN Reset OTP",
				"Your OTP for resetting your withdrawal PIN is: <strong>" + verificationCode.getOtp() + "</strong>. This code will expire in 10 minutes."
		);
		
		ApiResponse res = new ApiResponse();
		res.setMessage("OTP sent to registered email.");
		return ResponseEntity.ok(res);
	}

	@PostMapping("/api/users/withdrawal-pin/reset")
	public ResponseEntity<ApiResponse> resetWithdrawalPin(
			@RequestHeader("Authorization") String jwt,
			@RequestParam String otp,
			@RequestParam String newPin) throws Exception {
		User user = userService.findUserProfileByJwt(jwt);
		
		if (newPin == null || newPin.length() != 4 || !newPin.matches("\\d{4}")) {
			throw new IllegalArgumentException("PIN must be exactly 4 digits.");
		}
		
		VerificationCode verificationCode = verificationService.findUsersVerification(user);
		if (verificationCode == null) {
			throw new Exception("No verification code found. Please request a new OTP first.");
		}
		
		if (verificationCode.getAttempts() >= 3) {
			verificationService.deleteVerification(verificationCode);
			throw new Exception("Too many failed attempts. OTP has been invalidated.");
		}
		
		OtpVerificationResult result = verificationService.verifyOtp(otp, verificationCode);
		if (result == OtpVerificationResult.SUCCESS) {
			verificationService.deleteVerification(verificationCode);
			
			user.setWithdrawalPin(passwordEncoder.encode(newPin));
			userRepository.save(user);
			
			centralNotificationService.sendNotification(
					user,
					NotificationType.SECURITY,
					"Withdrawal PIN Reset Successfully",
					"Your withdrawal PIN has been reset successfully. Please use your new PIN for future transactions."
			);
			
			ApiResponse res = new ApiResponse();
			res.setMessage("Withdrawal PIN reset successfully.");
			return ResponseEntity.ok(res);
		} else {
			verificationCode.setAttempts(verificationCode.getAttempts() + 1);
			verificationRepository.save(verificationCode);
			if (result == OtpVerificationResult.EXPIRED) {
				verificationService.deleteVerification(verificationCode);
				throw new Exception("OTP has expired. Please request a new one.");
			}
			throw new Exception("Invalid OTP. Remaining attempts: " + (3 - verificationCode.getAttempts()));
		}
	}
}
