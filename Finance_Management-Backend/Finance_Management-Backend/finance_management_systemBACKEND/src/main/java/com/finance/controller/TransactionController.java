package com.finance.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.finance.dto.TransactionDTO;
import com.finance.entity.Transaction;
import com.finance.service.TransactionService;


@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(
            TransactionService transactionService) {

        this.transactionService = transactionService;
    }

    // CREATE DEPOSIT / WITHDRAWAL
    @PostMapping
    public ResponseEntity<TransactionDTO> createTransaction(
    		 @RequestBody Transaction transaction) {

        return new ResponseEntity<>(
                transactionService.createTransaction(transaction),
                HttpStatus.CREATED
        );
    }

    // GET ALL TRANSACTIONS
    @GetMapping
    public ResponseEntity<List<TransactionDTO>> getAllTransactions() {

        return ResponseEntity.ok(
                transactionService.getAllTransactions()
        );
    }

    // GET TRANSACTION BY ID
    @GetMapping("/{id}")
    public ResponseEntity<TransactionDTO> getTransactionById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                transactionService.getTransactionById(id)
        );
    }

    // GET BY TRANSACTION REFERENCE
    @GetMapping("/reference/{reference}")
    public ResponseEntity<TransactionDTO> getByReference(
            @PathVariable String reference) {

        return ResponseEntity.ok(
                transactionService.getByReference(reference)
        );
    }

    // GET TRANSACTIONS BY SAVING ACCOUNT
    @GetMapping("/account/{savingAccountId}")
    public ResponseEntity<List<TransactionDTO>> getBySavingAccount(
            @PathVariable Long savingAccountId) {

        return ResponseEntity.ok(
                transactionService.getBySavingAccount(
                        savingAccountId)
        );
    }
    // DELETE TRANSACTION
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTransaction(
            @PathVariable Long id) {

        transactionService.deleteTransaction(id);

        return ResponseEntity.ok(
                "Transaction deleted successfully"
        );
    }

}