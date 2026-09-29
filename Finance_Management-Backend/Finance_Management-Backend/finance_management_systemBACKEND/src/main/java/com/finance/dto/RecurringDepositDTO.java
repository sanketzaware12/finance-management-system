package com.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class RecurringDepositDTO {

    private Long id;
    private String rdNumber;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Monthly installment is required")
    @Positive(message = "Monthly installment must be greater than zero")
    private BigDecimal monthlyInstallment;

    @NotNull(message = "Tenure months is required")
    @Positive(message = "Tenure months must be greater than zero")
    private Integer tenureMonths;

    @NotNull(message = "Interest rate is required")
    @Positive(message = "Interest rate must be greater than zero")
    private BigDecimal interestRate;

    private BigDecimal totalDeposited;
    private BigDecimal maturityAmount;
    private LocalDate startDate;
    private LocalDate maturityDate;
    private Integer installmentsPaid;
    private String status;

    public RecurringDepositDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRdNumber() {
        return rdNumber;
    }

    public void setRdNumber(String rdNumber) {
        this.rdNumber = rdNumber;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public BigDecimal getMonthlyInstallment() {
        return monthlyInstallment;
    }

    public void setMonthlyInstallment(BigDecimal monthlyInstallment) {
        this.monthlyInstallment = monthlyInstallment;
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

    public BigDecimal getTotalDeposited() {
        return totalDeposited;
    }

    public void setTotalDeposited(BigDecimal totalDeposited) {
        this.totalDeposited = totalDeposited;
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

    public Integer getInstallmentsPaid() {
        return installmentsPaid;
    }

    public void setInstallmentsPaid(Integer installmentsPaid) {
        this.installmentsPaid = installmentsPaid;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}