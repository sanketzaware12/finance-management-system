package com.finance.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.finance.entity.EmiSchedule;

@Repository
public interface EmiScheduleRepository extends JpaRepository<EmiSchedule, Long> {

    List<EmiSchedule> findByLoanIdOrderByEmiNumberAsc(Long loanId);

    Optional<EmiSchedule> findByLoanIdAndEmiNumber(
            Long loanId,
            Integer emiNumber
    );

    List<EmiSchedule> findByStatus(String status);

    boolean existsByLoanIdAndEmiNumber(
            Long loanId,
            Integer emiNumber
    );
}