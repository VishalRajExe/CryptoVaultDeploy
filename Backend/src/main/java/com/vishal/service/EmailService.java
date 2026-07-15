package com.vishal.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender javaMailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:your_email@gmail.com}")
    private String fromEmail;

    public void sendVerificationOtpEmail(String userEmail, String otp) throws MessagingException, MailSendException {
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
        try {
            helper.setFrom(fromEmail);
            String subject = "Account verification";
            String text = "your account verification code is : " + otp;

            helper.setSubject(subject);
            helper.setText(text, true);
            helper.setTo(userEmail);

            // Send email asynchronously in a separate thread so it does not block the API
            // thread
            javaMailSender.send(mimeMessage);
        } catch (MailSendException | MessagingException e) {
            logger.error("Failed to send email to {}", userEmail, e);
            throw e;
        }
    }
}
