package com.vishal.service;

import com.vishal.model.PriceAlert;
import com.vishal.model.User;
import java.math.BigDecimal;
import java.util.List;

public interface PriceAlertService {
    PriceAlert createAlert(User user, String symbol, BigDecimal targetPrice, String condition) throws Exception;
    
    List<PriceAlert> getAlertsByUserId(Long userId);
    
    void deleteAlert(Long alertId, Long userId) throws Exception;
    
    void checkAlerts();
}
