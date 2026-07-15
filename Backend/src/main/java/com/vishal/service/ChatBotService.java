package com.vishal.service;

import com.vishal.model.CoinDTO;
import com.vishal.response.ApiResponse;

public interface ChatBotService {

    ApiResponse getCoinDetails(String coinName);

    CoinDTO getCoinByName(String coinName);

    ApiResponse simpleChat(String prompt);

    ApiResponse portfolioReview(String portfolioData);

    ApiResponse strategyBuilder(double budget, String risk);

    ApiResponse newsSummary();
}