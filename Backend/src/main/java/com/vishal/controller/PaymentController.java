package com.vishal.controller;

import com.razorpay.RazorpayException;
import com.stripe.exception.StripeException;
import com.vishal.domain.PaymentMethod;
import com.vishal.domain.PaymentOrderStatus;
import com.vishal.domain.NotificationType;
import com.vishal.exception.UserException;
import com.vishal.model.PaymentOrder;
import com.vishal.model.User;
import com.vishal.repository.PaymentOrderRepository;
import com.vishal.response.PaymentResponse;
import com.vishal.service.PaymentService;
import com.vishal.service.UserService;
import com.vishal.service.CentralNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PaymentController {

    @Autowired
    private UserService userService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CentralNotificationService centralNotificationService;



    @PostMapping("/api/payment/{paymentMethod}/amount/{amount}")
    public ResponseEntity<PaymentResponse> paymentHandler(
            @PathVariable PaymentMethod paymentMethod,
            @PathVariable Long amount,
            @RequestHeader("Authorization") String jwt) throws UserException, RazorpayException, StripeException {

        User user = userService.findUserProfileByJwt(jwt);

        if (amount == null || amount <= 0) {
            throw new UserException("Deposit amount must be greater than zero.");
        }
        if (paymentMethod.equals(PaymentMethod.RAZORPAY) && amount > 200000) {
            throw new UserException("Deposit amount cannot exceed ₹2,00,000 (200,000 INR) per transaction.");
        }
        if (paymentMethod.equals(PaymentMethod.STRIPE) && amount > 10000) {
            throw new UserException("Deposit amount cannot exceed $10,000 USD per transaction.");
        }

        PaymentResponse paymentResponse;

        PaymentOrder order= paymentService.createOrder(user, amount,paymentMethod);

        if(paymentMethod.equals(PaymentMethod.RAZORPAY)){
            paymentResponse=paymentService.createRazorpayPaymentLink(user,amount,
                    order.getId());
            centralNotificationService.sendNotification(user, NotificationType.WALLET, "Deposit Initiated", "You have initiated a deposit of ₹" + amount + " INR via RAZORPAY.");
        }
        else{
            paymentResponse=paymentService.createStripePaymentLink(user,amount, order.getId());
            centralNotificationService.sendNotification(user, NotificationType.WALLET, "Deposit Initiated", "You have initiated a deposit of $" + amount + " USD via STRIPE.");
        }

        return new ResponseEntity<>(paymentResponse, HttpStatus.CREATED);
    }


}
