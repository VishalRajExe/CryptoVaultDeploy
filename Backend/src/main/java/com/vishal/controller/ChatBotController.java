package com.vishal.controller;

import com.vishal.domain.SubscriptionPlan;
import com.vishal.domain.USER_ROLE;
import com.vishal.exception.UserException;
import com.vishal.model.ChatBotUsage;
import com.vishal.model.CoinDTO;
import com.vishal.model.Subscription;
import com.vishal.model.User;
import com.vishal.repository.ChatBotUsageRepository;
import com.vishal.request.PromptBody;
import com.vishal.response.ApiResponse;
import com.vishal.service.ChatBotService;
import com.vishal.service.SubscriptionService;
import com.vishal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/chat")
public class ChatBotController {

    @Autowired
    private ChatBotService chatBotService;

    @Autowired
    private UserService userService;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private ChatBotUsageRepository chatBotUsageRepository;

    private void enforceChatBotUsageLimit(User user) throws Exception {
        if (user.getRole() == USER_ROLE.ROLE_ADMIN) {
            return; // Admins are exempt
        }
        Subscription subscription = subscriptionService.getSubscriptionByUserId(user.getId());
        if (subscription.getPlan() == SubscriptionPlan.FREE) {
            ChatBotUsage usage = chatBotUsageRepository.findByUserIdAndDate(user.getId(), LocalDate.now());
            if (usage == null) {
                usage = new ChatBotUsage();
                usage.setUser(user);
                usage.setDate(LocalDate.now());
                usage.setMessageCount(0);
            }
            if (usage.getMessageCount() >= 10) {
                throw new UserException("Daily AI message limit reached (10/day). Please upgrade to Pro or Elite for unlimited AI access.");
            }
            usage.setMessageCount(usage.getMessageCount() + 1);
            chatBotUsageRepository.save(usage);
        }
    }

    @GetMapping("/coin/{coinName}")
    public ResponseEntity<CoinDTO> getCoinDetails(
            @PathVariable String coinName) {

        CoinDTO coinDTO =
                chatBotService.getCoinByName(coinName);

        return new ResponseEntity<>(
                coinDTO,
                HttpStatus.OK);
    }

    @PostMapping("/bot")
    public ResponseEntity<ApiResponse> simpleChat(
            @RequestHeader("Authorization") String jwt,
            @RequestBody PromptBody promptBody) throws Exception {

        User user = userService.findUserProfileByJwt(jwt);
        enforceChatBotUsageLimit(user);

        ApiResponse res =
                chatBotService.simpleChat(
                        promptBody.getPrompt());

        return new ResponseEntity<>(
                res,
                HttpStatus.OK);
    }

    @PostMapping("/bot/coin")
    public ResponseEntity<ApiResponse> getCoinRealtimeTime(
            @RequestHeader("Authorization") String jwt,
            @RequestBody PromptBody promptBody) throws Exception {

        User user = userService.findUserProfileByJwt(jwt);
        enforceChatBotUsageLimit(user);

        ApiResponse res =
                chatBotService.getCoinDetails(
                        promptBody.getPrompt());

        return new ResponseEntity<>(
                res,
                HttpStatus.OK);
    }
}