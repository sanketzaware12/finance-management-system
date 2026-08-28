package com.finance.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.finance.dto.RecurringDepositDTO;
import com.finance.entity.RecurringDeposit;
import com.finance.service.RecurringDepositService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/rd")
public class RecurringDepositController {

    private final RecurringDepositService rdService;

    public RecurringDepositController(
            RecurringDepositService rdService) {

        this.rdService = rdService;
    }

    // CREATE RD
    @PostMapping
    public ResponseEntity<RecurringDepositDTO> createRD(
           @Valid @RequestBody RecurringDeposit rd) {

        return new ResponseEntity<>(
                rdService.createRD(rd),
                HttpStatus.CREATED
        );
    }

    // PAY INSTALLMENT
    @PostMapping("/{id}/installment")
    public ResponseEntity<RecurringDepositDTO> payInstallment(
            @PathVariable Long id,
            @RequestParam BigDecimal amount) {

        return ResponseEntity.ok(
                rdService.payInstallment(id, amount)
        );
    }

    // GET ALL RD
    @GetMapping
    public ResponseEntity<List<RecurringDepositDTO>> getAllRDs() {

        return ResponseEntity.ok(
                rdService.getAllRDs()
        );
    }

    // GET RD BY ID
    @GetMapping("/{id}")
    public ResponseEntity<RecurringDepositDTO> getRDById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                rdService.getRDById(id)
        );
    }

    // GET RD BY NUMBER
    @GetMapping("/number/{rdNumber}")
    public ResponseEntity<RecurringDepositDTO> getRDByNumber(
            @PathVariable String rdNumber) {

        return ResponseEntity.ok(
                rdService.getRDByNumber(rdNumber)
        );
    }

    // GET RD BY USER
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RecurringDepositDTO>> getRDsByUserId(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                rdService.getRDsByUserId(userId)
        );
    }

    // GET RD BY STATUS
    @GetMapping("/status/{status}")
    public ResponseEntity<List<RecurringDepositDTO>> getRDsByStatus(
            @PathVariable String status) {

        return ResponseEntity.ok(
                rdService.getRDsByStatus(status)
        );
    }

    // FULL UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<RecurringDepositDTO> updateRD(
            @PathVariable Long id,
            @RequestBody RecurringDeposit rd) {

        return ResponseEntity.ok(
                rdService.updateRD(id, rd)
        );
    }

    // PARTIAL UPDATE
    @PatchMapping("/{id}")
    public ResponseEntity<RecurringDepositDTO> patchRD(
            @PathVariable Long id,
            @RequestBody RecurringDeposit rd) {

        return ResponseEntity.ok(
                rdService.patchRD(id, rd)
        );
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRD(
            @PathVariable Long id) {

        rdService.deleteRD(id);

        return ResponseEntity.ok(
                "Recurring Deposit deleted successfully"
        );
    }
}