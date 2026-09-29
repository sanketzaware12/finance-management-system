package com.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.finance.entity.TransactionType;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class TransactionDTO {

    private Long id;
    private String transactionReference;

    @NotNull(message = "Saving account ID is required")
    private Long savingAccountId;

    @NotNull(message = "Transaction type is required")
    private TransactionType type;

    @NotNull(message = "Transaction amount is required")
    @Positive(message = "Transaction amount must be greater than zero")
    private BigDecimal amount;

    private BigDecimal balanceAfterTransaction;
    private String description;
    private LocalDateTime transactionDate;

    public TransactionDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSavingAccountId() {
        return savingAccountId;
    }

    public void setSavingAccountId(Long savingAccountId) {
        this.savingAccountId = savingAccountId;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getBalanceAfterTransaction() {
        return balanceAfterTransaction;
    }

    public void setBalanceAfterTransaction(BigDecimal balanceAfterTransaction) {
        this.balanceAfterTransaction = balanceAfterTransaction;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDateTime transactionDate) {
        this.transactionDate = transactionDate;
    }
}