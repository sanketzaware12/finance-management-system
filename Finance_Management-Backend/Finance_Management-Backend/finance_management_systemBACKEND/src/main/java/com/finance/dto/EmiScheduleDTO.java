package com.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class EmiScheduleDTO {

    private Long id;

    @NotNull(message = "Loan ID is required")
    private Long loanId;

    @NotNull(message = "EMI number is required")
    @Positive(message = "EMI number must be greater than zero")
    private Integer emiNumber;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    @NotNull(message = "EMI amount is required")
    @Positive(message = "EMI amount must be greater than zero")
    private BigDecimal emiAmount;

    private BigDecimal principalAmount;
    private BigDecimal interestAmount;
    private BigDecimal paidAmount;
    private String status;
    private LocalDate paymentDate;

    public EmiScheduleDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLoanId() {
        return loanId;
    }

    public void setLoanId(Long loanId) {
        this.loanId = loanId;
    }

    public Integer getEmiNumber() {
        return emiNumber;
    }

    public void setEmiNumber(Integer emiNumber) {
        this.emiNumber = emiNumber;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public BigDecimal getEmiAmount() {
        return emiAmount;
    }

    public void setEmiAmount(BigDecimal emiAmount) {
        this.emiAmount = emiAmount;
    }

    public BigDecimal getPrincipalAmount() {
        return principalAmount;
    }

    public void setPrincipalAmount(BigDecimal principalAmount) {
        this.principalAmount = principalAmount;
    }

    public BigDecimal getInterestAmount() {
        return interestAmount;
    }

    public void setInterestAmount(BigDecimal interestAmount) {
        this.interestAmount = interestAmount;
    }

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }
}