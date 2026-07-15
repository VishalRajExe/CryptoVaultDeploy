package com.vishal.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ExchangeOrderRequest {

	@NotBlank(message = "Source Coin ID is required")
	private String fromCoinId;

	@NotBlank(message = "Target Coin ID is required")
	private String toCoinId;

	@NotNull(message = "Quantity is required")
	@Positive(message = "Quantity must be positive")
	private double quantity;
}
