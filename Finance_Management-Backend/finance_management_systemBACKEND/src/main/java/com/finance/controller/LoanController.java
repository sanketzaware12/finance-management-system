package com.finance.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.finance.dto.LoanDTO;
import com.finance.entity.Loan;
import com.finance.service.LoanService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService loanService) {
        this.loanService = loanService;
    }

    // =========================
    // CREATE LOAN APPLICATION
    // =========================
    @PostMapping
    public ResponseEntity<LoanDTO> createLoan(
           @Valid @RequestBody Loan loan) {

        return new ResponseEntity<>(
                loanService.createLoan(loan),
                HttpStatus.CREATED
        );
    }

    // =========================
    // APPROVE LOAN
    // =========================
    @PatchMapping("/{id}/approve")
    public ResponseEntity<LoanDTO> approveLoan(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                loanService.approveLoan(id)
        );
    }

    // =========================
    // REJECT LOAN
    // =========================
    @PatchMapping("/{id}/reject")
    public ResponseEntity<LoanDTO> rejectLoan(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                loanService.rejectLoan(id)
        );
    }

    // =========================
    // DISBURSE LOAN
    // =========================
    @PatchMapping("/{id}/disburse")
    public ResponseEntity<LoanDTO> disburseLoan(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                loanService.disburseLoan(id)
        );
    }

    // =========================
    // PAY EMI
    // =========================
    @PostMapping("/{id}/payment")
    public ResponseEntity<LoanDTO> payEMI(
            @PathVariable Long id,
            @RequestParam BigDecimal amount) {

        return ResponseEntity.ok(
                loanService.payEMI(id, amount)
        );
    }

    // =========================
    // GET ALL LOANS
    // =========================
    @GetMapping
    public ResponseEntity<List<LoanDTO>> getAllLoans() {

        return ResponseEntity.ok(
                loanService.getAllLoans()
        );
    }

    // =========================
    // GET LOAN BY ID
    // =========================
    @GetMapping("/{id}")
    public ResponseEntity<LoanDTO> getLoanById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                loanService.getLoanById(id)
        );
    }

    // =========================
    // GET LOAN BY NUMBER
    // =========================
    @GetMapping("/number/{loanNumber}")
    public ResponseEntity<LoanDTO> getLoanByNumber(
            @PathVariable String loanNumber) {

        return ResponseEntity.ok(
                loanService.getLoanByNumber(loanNumber)
        );
    }

    // =========================
    // GET LOANS BY USER
    // =========================
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<LoanDTO>> getLoansByUserId(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                loanService.getLoansByUserId(userId)
        );
    }

    // =========================
    // GET LOANS BY STATUS
    // =========================
    @GetMapping("/status/{status}")
    public ResponseEntity<List<LoanDTO>> getLoansByStatus(
            @PathVariable String status) {

        return ResponseEntity.ok(
                loanService.getLoansByStatus(status)
        );
    }

    // =========================
    // FULL UPDATE
    // =========================
    @PutMapping("/{id}")
    public ResponseEntity<LoanDTO> updateLoan(
            @PathVariable Long id,
            @RequestBody Loan loan) {

        return ResponseEntity.ok(
                loanService.updateLoan(id, loan)
        );
    }

    // =========================
    // PARTIAL UPDATE
    // =========================
    @PatchMapping("/{id}")
    public ResponseEntity<LoanDTO> patchLoan(
            @PathVariable Long id,
            @RequestBody Loan loan) {

        return ResponseEntity.ok(
                loanService.patchLoan(id, loan)
        );
    }

    // =========================
    // DELETE
    // =========================
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteLoan(
            @PathVariable Long id) {

        loanService.deleteLoan(id);

        return ResponseEntity.ok(
                "Loan deleted successfully"
        );
    }
}