package com.vishal.controller;

import com.vishal.response.ApiResponse;
import com.vishal.service.ChatBotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiFeatureController {

    @Autowired
    private ChatBotService chatBotService;

    @PostMapping("/portfolio-review")
    public ResponseEntity<ApiResponse> portfolioReview(@RequestBody String portfolioData) {
        ApiResponse response = chatBotService.portfolioReview(portfolioData);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/strategy-builder")
    public ResponseEntity<ApiResponse> strategyBuilder(
            @RequestParam double budget,
            @RequestParam String risk) {
        ApiResponse response = chatBotService.strategyBuilder(budget, risk);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/news-summary")
    public ResponseEntity<ApiResponse> newsSummary() {
        ApiResponse response = chatBotService.newsSummary();
        return ResponseEntity.ok(response);
    }
}
