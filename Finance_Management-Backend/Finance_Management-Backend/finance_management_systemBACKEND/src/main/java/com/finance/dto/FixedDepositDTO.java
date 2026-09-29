package com.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class FixedDepositDTO {

    private Long id;
    private String fdNumber;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Deposit amount is required")
    @Positive(message = "Deposit amount must be greater than zero")
    private BigDecimal depositAmount;

    @NotNull(message = "Tenure months is required")
    @Positive(message = "Tenure months must be greater than zero")
    private Integer tenureMonths;

    @NotNull(message = "Interest rate is required")
    @Positive(message = "Interest rate must be greater than zero")
    private BigDecimal interestRate;

    private BigDecimal maturityAmount;
    private LocalDate startDate;
    private LocalDate maturityDate;
    private String status;

    public FixedDepositDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFdNumber() {
        return fdNumber;
    }

    public void setFdNumber(String fdNumber) {
        this.fdNumber = fdNumber;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public BigDecimal getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(BigDecimal depositAmount) {
        this.depositAmount = depositAmount;
    }

    public Integer getTenureMonths() {
        return tenureMonths;
    }

    public void setTenureMonths(Integer tenureMonths) {
        this.tenureMonths = tenureMonths;
    }

    public BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(BigDecimal interestRate) {
        this.interestRate = interestRate;
    }

    public BigDecimal getMaturityAmount() {
        return maturityAmount;
    }

    public void setMaturityAmount(BigDecimal maturityAmount) {
        this.maturityAmount = maturityAmount;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getMaturityDate() {
        return maturityDate;
    }

    public void setMaturityDate(LocalDate maturityDate) {
        this.maturityDate = maturityDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}