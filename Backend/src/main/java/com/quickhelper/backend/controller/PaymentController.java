package com.quickhelper.backend.controller;

import com.quickhelper.backend.dto.PaymentRequestDTO;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final com.quickhelper.backend.service.StripeService stripeService;
    private final com.quickhelper.backend.repository.ProviderProfileRepository providerProfileRepository;
    private final com.quickhelper.backend.repository.UserRepository userRepository;

    public PaymentController(
            com.quickhelper.backend.service.StripeService stripeService,
            com.quickhelper.backend.repository.ProviderProfileRepository providerProfileRepository,
            com.quickhelper.backend.repository.UserRepository userRepository
    ) {
        this.stripeService = stripeService;
        this.providerProfileRepository = providerProfileRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/create-payment-intent")
    public ResponseEntity<?> createPaymentIntent(@RequestBody PaymentRequestDTO paymentRequest) {
        try {
            PaymentIntent paymentIntent = stripeService.createPaymentIntent(
                    paymentRequest.getAmount(),
                    paymentRequest.getCurrency()
            );

            Map<String, String> response = new HashMap<>();
            response.put("clientSecret", paymentIntent.getClientSecret());
            response.put("id", paymentIntent.getId());

            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Payment error: " + e.getMessage()));
        }
    }

    @PostMapping("/onboard-provider")
    public ResponseEntity<?> onboardProvider(@RequestBody Map<String, Object> request) {
        try {
            Long providerId = Long.valueOf(request.get("providerId").toString());
            String refreshUrl = request.get("refreshUrl").toString(); // e.g., http://localhost:5173/provider/profile
            String returnUrl = request.get("returnUrl").toString();   // e.g., http://localhost:5173/provider/dashboard

            com.quickhelper.backend.model.User provider = userRepository.findById(providerId)
                    .orElseThrow(() -> new RuntimeException("Provider not found"));
            
            com.quickhelper.backend.model.ProviderProfile profile = providerProfileRepository.findByUser(provider)
                    .orElseThrow(() -> new RuntimeException("Profile not found"));

            String accountId = profile.getStripeAccountId();
            if (accountId == null || accountId.isEmpty()) {
                com.stripe.model.Account account = stripeService.createConnectAccount(provider.getEmail());
                accountId = account.getId();
                profile.setStripeAccountId(accountId);
                providerProfileRepository.save(profile);
            }

            com.stripe.model.AccountLink accountLink = stripeService.createAccountLink(accountId, refreshUrl, returnUrl);
            
            return ResponseEntity.ok(Map.of("url", accountLink.getUrl()));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Onboarding error: " + e.getMessage()));
        }
    }

    @PostMapping("/payout")
    public ResponseEntity<?> payoutToProvider(@RequestBody Map<String, Object> request) {
        try {
            Long providerId = Long.valueOf(request.get("providerId").toString());
            long amount = Long.parseLong(request.get("amount").toString());
            
            com.quickhelper.backend.model.User provider = userRepository.findById(providerId)
                    .orElseThrow(() -> new RuntimeException("Provider not found"));
            
            com.quickhelper.backend.model.ProviderProfile profile = providerProfileRepository.findByUser(provider)
                    .orElseThrow(() -> new RuntimeException("Profile not found"));
            
            if (profile.getStripeAccountId() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Provider has not set up payouts"));
            }

            com.stripe.model.Transfer transfer = stripeService.transferFunds(
                    profile.getStripeAccountId(),
                    amount,
                    "inr" // Assuming INR for now, can be dynamic
            );

            return ResponseEntity.ok(Map.of("transferId", transfer.getId(), "status", "success"));

        } catch (Exception e) {
             e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Payout error: " + e.getMessage()));
        }
    }
}
