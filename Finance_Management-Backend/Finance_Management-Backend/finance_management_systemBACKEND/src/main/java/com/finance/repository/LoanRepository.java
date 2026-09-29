package com.finance.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.finance.entity.Loan;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    Optional<Loan> findByLoanNumber(String loanNumber);

    List<Loan> findByUserId(Long userId);

    List<Loan> findByStatus(String status);

    boolean existsByLoanNumber(String loanNumber);
}