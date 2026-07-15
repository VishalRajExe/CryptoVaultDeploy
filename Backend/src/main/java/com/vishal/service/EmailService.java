package com.vishal.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:your_email@gmail.com}")
    private String fromEmail;

    @org.springframework.beans.factory.annotation.Value("${BREVO_API_KEY:}")
    private String brevoApiKey;

    @org.springframework.beans.factory.annotation.Value("${BREVO_SENDER_EMAIL:}")
    private String brevoSenderEmail;

    public void sendVerificationOtpEmail(String userEmail, String otp) throws Exception {
        String htmlBody = "<h3>Account Verification</h3><p>Your account verification code is: <strong>" + otp + "</strong></p>";
        sendHtmlEmail(userEmail, "Account verification", htmlBody);
    }

    public void sendHtmlEmail(String recipientEmail, String subject, String htmlBody) throws Exception {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            throw new Exception("Brevo API key is not configured. Please set the BREVO_API_KEY environment variable in Railway.");
        }
        
        String senderEmail = (brevoSenderEmail != null && !brevoSenderEmail.isBlank()) ? brevoSenderEmail : fromEmail;

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);
        headers.set("accept", "application/json");

        Map<String, Object> body = new HashMap<>();
        
        Map<String, String> sender = new HashMap<>();
        sender.put("name", "CryptoVault");
        sender.put("email", senderEmail);
        body.put("sender", sender);

        List<Map<String, String>> toList = new ArrayList<>();
        Map<String, String> toRecipient = new HashMap<>();
        toRecipient.put("email", recipientEmail);
        toList.add(toRecipient);
        body.put("to", toList);

        body.put("subject", subject);
        body.put("htmlContent", htmlBody);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        
        try {
            ResponseEntity<String> response = restTemplate.postForEntity("https://api.brevo.com/v3/smtp/email", request, String.class);
            logger.info("Email sent successfully via Brevo to {}. Status: {}", recipientEmail, response.getStatusCode());
        } catch (Exception e) {
            logger.error("Failed to send email to {} via Brevo API", recipientEmail, e);
            throw e;
        }
    }
}
