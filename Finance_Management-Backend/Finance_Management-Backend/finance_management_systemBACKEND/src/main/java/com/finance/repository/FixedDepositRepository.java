package com.finance.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.finance.entity.FixedDeposit;

@Repository
public interface FixedDepositRepository
        extends JpaRepository<FixedDeposit, Long> {

    Optional<FixedDeposit> findByFdNumber(String fdNumber);

    List<FixedDeposit> findByUserId(Long userId);

    List<FixedDeposit> findByStatus(String status);

    boolean existsByFdNumber(String fdNumber);
}