package com.quickhelper.backend.dto;

import lombok.Data;

@Data
public class PaymentRequestDTO {
    private String token;
    private Long amount; // Amount in smallest currency unit (e.g., paise)
    private String currency = "inr";
    private String description;
}
