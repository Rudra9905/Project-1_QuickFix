package com.quickhelper.backend.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class StripeService {

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeSecretKey;
    }

    public PaymentIntent createPaymentIntent(long amount, String currency) throws StripeException {
        PaymentIntentCreateParams params =
                PaymentIntentCreateParams.builder()
                        .setAmount(amount)
                        .setCurrency(currency)
                        .build();

        return PaymentIntent.create(params);
    }

    public Refund refundPayment(String paymentIntentId) throws StripeException {
        RefundCreateParams params = RefundCreateParams.builder()
                .setPaymentIntent(paymentIntentId)
                .build();

        return Refund.create(params);
    }
    public com.stripe.model.Account createConnectAccount(String email) throws StripeException {
        com.stripe.param.AccountCreateParams params =
                com.stripe.param.AccountCreateParams.builder()
                        .setType(com.stripe.param.AccountCreateParams.Type.EXPRESS)
                        .setCountry("US") // Adjust as needed or make dynamic
                        .setEmail(email)
                        .setCapabilities(
                                com.stripe.param.AccountCreateParams.Capabilities.builder()
                                        .setTransfers(
                                                com.stripe.param.AccountCreateParams.Capabilities.Transfers.builder()
                                                        .setRequested(true)
                                                        .build()
                                        )
                                        .build()
                        )
                        .build();

        return com.stripe.model.Account.create(params);
    }

    public com.stripe.model.AccountLink createAccountLink(String accountId, String refreshUrl, String returnUrl) throws StripeException {
        com.stripe.param.AccountLinkCreateParams params =
                com.stripe.param.AccountLinkCreateParams.builder()
                        .setAccount(accountId)
                        .setRefreshUrl(refreshUrl)
                        .setReturnUrl(returnUrl)
                        .setType(com.stripe.param.AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
                        .build();

        return com.stripe.model.AccountLink.create(params);
    }

    public com.stripe.model.Transfer transferFunds(String destinationAccountId, long amount, String currency) throws StripeException {
        com.stripe.param.TransferCreateParams params =
                com.stripe.param.TransferCreateParams.builder()
                        .setAmount(amount)
                        .setCurrency(currency)
                        .setDestination(destinationAccountId)
                        .build();

        return com.stripe.model.Transfer.create(params);
    }
}
