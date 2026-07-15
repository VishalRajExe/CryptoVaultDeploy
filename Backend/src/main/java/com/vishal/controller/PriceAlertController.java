package com.vishal.controller;

import com.vishal.exception.UserException;
import com.vishal.model.PriceAlert;
import com.vishal.model.User;
import com.vishal.service.PriceAlertService;
import com.vishal.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/price-alerts")
public class PriceAlertController {

    @Autowired
    private PriceAlertService priceAlertService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<PriceAlert> createAlert(
            @RequestHeader("Authorization") String jwt,
            @RequestParam String symbol,
            @RequestParam BigDecimal targetPrice,
            @RequestParam String condition) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        PriceAlert alert = priceAlertService.createAlert(user, symbol, targetPrice, condition);
        return new ResponseEntity<>(alert, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<PriceAlert>> getAlerts(
            @RequestHeader("Authorization") String jwt) throws UserException {
        User user = userService.findUserProfileByJwt(jwt);
        List<PriceAlert> alerts = priceAlertService.getAlertsByUserId(user.getId());
        return new ResponseEntity<>(alerts, HttpStatus.OK);
    }

    @DeleteMapping("/{alertId}")
    public ResponseEntity<String> deleteAlert(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Long alertId) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        priceAlertService.deleteAlert(alertId, user.getId());
        return new ResponseEntity<>("Price alert deleted successfully", HttpStatus.OK);
    }
}
