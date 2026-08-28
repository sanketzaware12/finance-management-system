package com.finance.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.finance.entity.Transaction;

@Repository
public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionReference(
            String transactionReference);

    List<Transaction> findBySavingAccountId(
            Long savingAccountId);

    List<Transaction> findBySavingAccountIdOrderByTransactionDateDesc(
            Long savingAccountId);

    boolean existsByTransactionReference(
            String transactionReference);
}