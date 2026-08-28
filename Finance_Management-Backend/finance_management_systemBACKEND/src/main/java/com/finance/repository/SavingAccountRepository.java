package com.finance.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.finance.entity.SavingAccount;

@Repository
public interface SavingAccountRepository
        extends JpaRepository<SavingAccount, Long> {

    Optional<SavingAccount> findByAccountNumber(String accountNumber);

    List<SavingAccount> findByUserId(Long userId);

    boolean existsByAccountNumber(String accountNumber);
}