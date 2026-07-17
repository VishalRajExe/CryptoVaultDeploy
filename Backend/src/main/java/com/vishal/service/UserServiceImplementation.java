package com.vishal.service;

import com.vishal.config.JwtProvider;
import com.vishal.domain.VerificationType;
import com.vishal.exception.UserException;
import com.vishal.model.TwoFactorAuth;
import com.vishal.model.User;
import com.vishal.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;


@Service
public class UserServiceImplementation implements UserService {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;
	
	
	@Override
	public User findUserProfileByJwt(String jwt) throws UserException {
		String email= JwtProvider.getEmailFromJwtToken(jwt);
		
		
		User user = userRepository.findByEmail(email);
		
		if(user==null) {
			throw new UserException("user not exist with email "+email);
		}
		return user;
	}
	
	@Override
	public User findUserByEmail(String username) throws UserException {
		
		User user=userRepository.findByEmail(username);
		
		if(user!=null) {
			
			return user;
		}
		
		throw new UserException("user not exist with username "+username);
	}

	@Override
	public User findUserById(Long userId) throws UserException {
		Optional<User> opt = userRepository.findById(userId);
		
		if(opt.isEmpty()) {
			throw new UserException("user not found with id "+userId);
		}
		return opt.get();
	}

	@Override
	public User verifyUser(User user) throws UserException {
		user.setVerified(true);
		return userRepository.save(user);
	}

	@Override
	public User enabledTwoFactorAuthentication(
			VerificationType verificationType, String sendTo, User user) throws UserException {
		TwoFactorAuth twoFactorAuth = new TwoFactorAuth();
		twoFactorAuth.setEnabled(true);
		twoFactorAuth.setSendTo(verificationType);
		twoFactorAuth.setSendToValue(sendTo);
		user.setTwoFactorAuth(twoFactorAuth);
		return userRepository.save(user);
	}

	@Override
	public User updatePassword(User user, String newPassword) {
		user.setPassword(passwordEncoder.encode(newPassword));
		return userRepository.save(user);
	}

	@Override
	public void sendUpdatePasswordOtp(String email, String otp) {

	}

	@jakarta.persistence.PersistenceContext
	private jakarta.persistence.EntityManager entityManager;

	@Override
	public User updateMobile(User user, String mobile) throws UserException {
		if (mobile == null || mobile.trim().isEmpty()) {
			throw new UserException("Mobile number cannot be empty.");
		}
		String cleanMobile = mobile.trim();
		if (!cleanMobile.matches("^\\+?[0-9]{10,15}$")) {
			throw new UserException("Invalid mobile number format. Please enter a valid number (e.g., +917321015054 or 7321015054).");
		}
		user.setMobile(cleanMobile);
		return userRepository.save(user);
	}

	@org.springframework.transaction.annotation.Transactional
	@Override
	public void deleteUser(Long userId) throws UserException {
		// Verify user exists first
		findUserById(userId);

		// JPQL deletes for dependent entities
		entityManager.createQuery("DELETE FROM Asset a WHERE a.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM ChatBotUsage c WHERE c.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM ForgotPasswordToken f WHERE f.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM Notification n WHERE n.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM NotificationHistory nh WHERE nh.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM NotificationPreferences np WHERE np.user.id = :userId").setParameter("userId", userId).executeUpdate();

		// Delete OrderItems associated with the User's Orders
		entityManager.createQuery("DELETE FROM OrderItem oi WHERE oi.order.id IN (SELECT o.id FROM Order o WHERE o.user.id = :userId)").setParameter("userId", userId).executeUpdate();
		// Delete Orders
		entityManager.createQuery("DELETE FROM Order o WHERE o.user.id = :userId").setParameter("userId", userId).executeUpdate();

		entityManager.createQuery("DELETE FROM PaymentDetails pd WHERE pd.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM PaymentOrder po WHERE po.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM PriceAlert pa WHERE pa.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM SubscriptionHistory sh WHERE sh.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM Subscription s WHERE s.user.id = :userId").setParameter("userId", userId).executeUpdate();

		// Delete WalletTransactions associated with the User's Wallet
		entityManager.createQuery("DELETE FROM WalletTransaction wt WHERE wt.wallet.id IN (SELECT w.id FROM Wallet w WHERE w.user.id = :userId)").setParameter("userId", userId).executeUpdate();
		// Delete Wallet
		entityManager.createQuery("DELETE FROM Wallet w WHERE w.user.id = :userId").setParameter("userId", userId).executeUpdate();

		entityManager.createQuery("DELETE FROM TradingHistory th WHERE th.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM TwoFactorOTP t WHERE t.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM UserSession us WHERE us.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM VerificationCode vc WHERE vc.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM Watchlist w WHERE w.user.id = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM Withdrawal w WHERE w.user.id = :userId").setParameter("userId", userId).executeUpdate();

		// Replay Entities (they use Long userId directly)
		entityManager.createQuery("DELETE FROM ReplayTrade rt WHERE rt.replaySession.id IN (SELECT rs.id FROM ReplaySession rs WHERE rs.userId = :userId)").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM ReplayOrder ro WHERE ro.userId = :userId").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM ReplayWallet rw WHERE rw.replaySession.id IN (SELECT rs.id FROM ReplaySession rs WHERE rs.userId = :userId)").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM ReplayPortfolio rp WHERE rp.replaySession.id IN (SELECT rs.id FROM ReplaySession rs WHERE rs.userId = :userId)").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM ReplayPerformance rp WHERE rp.replaySession.id IN (SELECT rs.id FROM ReplaySession rs WHERE rs.userId = :userId)").setParameter("userId", userId).executeUpdate();
		entityManager.createQuery("DELETE FROM ReplaySession rs WHERE rs.userId = :userId").setParameter("userId", userId).executeUpdate();

		// Finally, delete the User
		userRepository.deleteById(userId);
	}
}
