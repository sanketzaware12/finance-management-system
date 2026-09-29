package com.finance.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finance.dto.TransactionDTO;
import com.finance.entity.SavingAccount;
import com.finance.entity.Transaction;
import com.finance.entity.TransactionType;
import com.finance.exception.ResourceNotFoundException;
import com.finance.repository.SavingAccountRepository;
import com.finance.repository.TransactionRepository;

@Service
public class TransactionService {

    private static final Logger logger =
            LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository transactionRepository;
    private final SavingAccountRepository savingAccountRepository;

    public TransactionService(
            TransactionRepository transactionRepository,
            SavingAccountRepository savingAccountRepository) {

        this.transactionRepository = transactionRepository;
        this.savingAccountRepository = savingAccountRepository;
    }

    // =========================
    // CREATE DEPOSIT / WITHDRAWAL
    // =========================
    @Transactional
    public TransactionDTO createTransaction(
            Transaction transaction) {

        logger.info(
                "Creating transaction for saving account ID: {}",
                transaction.getSavingAccountId());

        // Amount validation
        if (transaction.getAmount() == null ||
                transaction.getAmount()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Transaction amount must be greater than zero");
        }

        // Type validation
        if (transaction.getType() == null) {

            throw new IllegalArgumentException(
                    "Transaction type is required");
        }

        // Saving account ID validation
        if (transaction.getSavingAccountId() == null) {

            throw new IllegalArgumentException(
                    "Saving account ID is required");
        }

        // Find saving account
        SavingAccount account =
                savingAccountRepository
                        .findById(
                                transaction.getSavingAccountId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Saving account not found with ID: "
                                                + transaction
                                                        .getSavingAccountId()));

        // Account status validation
        if (!"ACTIVE".equalsIgnoreCase(
                account.getStatus())) {

            throw new IllegalArgumentException(
                    "Transaction not allowed. Saving account is not active");
        }

        // Handle null balance safely
        BigDecimal currentBalance =
                account.getBalance();

        if (currentBalance == null) {
            currentBalance = BigDecimal.ZERO;
        }

        BigDecimal newBalance;

        // =========================
        // DEPOSIT
        // =========================
        if (transaction.getType()
                == TransactionType.DEPOSIT) {

            newBalance =
                    currentBalance.add(
                            transaction.getAmount());

            logger.info(
                    "Deposit of {} to saving account ID: {}",
                    transaction.getAmount(),
                    transaction.getSavingAccountId());
        }

        // =========================
        // WITHDRAWAL
        // =========================
        else if (transaction.getType()
                == TransactionType.WITHDRAWAL) {

            if (currentBalance.compareTo(
                    transaction.getAmount()) < 0) {

                throw new IllegalArgumentException(
                        "Insufficient balance");
            }

            newBalance =
                    currentBalance.subtract(
                            transaction.getAmount());

            logger.info(
                    "Withdrawal of {} from saving account ID: {}",
                    transaction.getAmount(),
                    transaction.getSavingAccountId());
        }

        // =========================
        // INVALID TYPE
        // =========================
        else {

            throw new IllegalArgumentException(
                    "Unsupported transaction type");
        }

        // Round balance
        newBalance =
                newBalance.setScale(
                        2,
                        java.math.RoundingMode.HALF_UP);

        // Generate transaction reference
        transaction.setTransactionReference(
                "TXN-" +
                UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase());

        // Balance after transaction
        transaction.setBalanceAfterTransaction(
                newBalance);


        // Update saving account balance
        account.setBalance(newBalance);

        savingAccountRepository.save(account);

        // Save transaction
        Transaction savedTransaction =
                transactionRepository.save(
                        transaction);

        logger.info(
                "Transaction created successfully. Reference: {}",
                savedTransaction
                        .getTransactionReference());

        return convertToDTO(savedTransaction);
    }

    // =========================
    // DELETE TRANSACTION
    // =========================
    @Transactional
    public void deleteTransaction(Long id) {

        logger.info("Deleting transaction with ID: {}", id);

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Transaction not found with ID: " + id));

        SavingAccount account = savingAccountRepository
                .findById(transaction.getSavingAccountId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Saving account not found with ID: "
                                + transaction.getSavingAccountId()));

        BigDecimal currentBalance = account.getBalance() == null
                ? BigDecimal.ZERO
                : account.getBalance();

        BigDecimal amount = transaction.getAmount() == null
                ? BigDecimal.ZERO
                : transaction.getAmount();

        BigDecimal newBalance;

        if (transaction.getType() == TransactionType.DEPOSIT) {
            newBalance = currentBalance.subtract(amount);
        } else if (transaction.getType() == TransactionType.WITHDRAWAL) {
            newBalance = currentBalance.add(amount);
        } else {
            throw new IllegalArgumentException(
                    "Unsupported transaction type");
        }

        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Transaction cannot be deleted because the account balance would become negative");
        }

        account.setBalance(newBalance.setScale(2, java.math.RoundingMode.HALF_UP));
        savingAccountRepository.save(account);
        transactionRepository.delete(transaction);

        logger.info("Transaction deleted successfully. ID: {}", id);
    }

    // =========================
    // GET ALL TRANSACTIONS
    // =========================
    public List<TransactionDTO> getAllTransactions() {

        logger.info(
                "Fetching all transactions");

        return transactionRepository
                .findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================
    // GET TRANSACTION BY ID
    // =========================
    public TransactionDTO getTransactionById(
            Long id) {

        logger.info(
                "Fetching transaction with ID: {}",
                id);

        Transaction transaction =
                transactionRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Transaction not found with ID: "
                                                + id));

        return convertToDTO(transaction);
    }

    // =========================
    // GET BY TRANSACTION REFERENCE
    // =========================
    public TransactionDTO getByReference(
            String reference) {

        logger.info(
                "Fetching transaction with reference: {}",
                reference);

        Transaction transaction =
                transactionRepository
                        .findByTransactionReference(
                                reference)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Transaction not found with reference: "
                                                + reference));

        return convertToDTO(transaction);
    }

    // =========================
    // GET BY SAVING ACCOUNT
    // =========================
    public List<TransactionDTO> getBySavingAccount(
            Long savingAccountId) {

        logger.info(
                "Fetching transactions for saving account ID: {}",
                savingAccountId);

        if (!savingAccountRepository
                .existsById(savingAccountId)) {

            throw new ResourceNotFoundException(
                    "Saving account not found with ID: "
                            + savingAccountId);
        }

        return transactionRepository
                .findBySavingAccountIdOrderByTransactionDateDesc(
                        savingAccountId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================
    // ENTITY -> DTO
    // =========================
    private TransactionDTO convertToDTO(
            Transaction transaction) {

        TransactionDTO dto =
                new TransactionDTO();

        dto.setId(
                transaction.getId());

        dto.setSavingAccountId(
                transaction.getSavingAccountId());

        dto.setTransactionReference(
                transaction.getTransactionReference());

        dto.setType(
                transaction.getType());

        dto.setAmount(
                transaction.getAmount());

        dto.setBalanceAfterTransaction(
                transaction
                        .getBalanceAfterTransaction());

        dto.setDescription(
                transaction.getDescription());

        dto.setTransactionDate(
                transaction.getTransactionDate());

        return dto;
    }
}