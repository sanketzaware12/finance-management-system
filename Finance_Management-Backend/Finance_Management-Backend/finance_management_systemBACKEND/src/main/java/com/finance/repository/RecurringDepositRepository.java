package com.finance.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.finance.entity.RecurringDeposit;

@Repository
public interface RecurringDepositRepository
        extends JpaRepository<RecurringDeposit, Long> {

    Optional<RecurringDeposit> findByRdNumber(String rdNumber);

    List<RecurringDeposit> findByUserId(Long userId);

    List<RecurringDeposit> findByStatus(String status);

    boolean existsByRdNumber(String rdNumber);
}