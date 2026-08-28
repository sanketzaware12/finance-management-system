package com.finance.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finance.dto.RecurringDepositDTO;
import com.finance.entity.RecurringDeposit;
import com.finance.exception.ResourceNotFoundException;
import com.finance.repository.RecurringDepositRepository;

@Service
public class RecurringDepositService {

    private static final Logger logger =
            LoggerFactory.getLogger(RecurringDepositService.class);

    private final RecurringDepositRepository rdRepository;

    public RecurringDepositService(
            RecurringDepositRepository rdRepository) {
        this.rdRepository = rdRepository;
    }

    // =========================
    // CREATE RD
    // =========================
    @Transactional
    public RecurringDepositDTO createRD(RecurringDeposit rd) {

        logger.info(
                "Creating new Recurring Deposit for user ID: {}",
                rd.getUserId());

        if (rd.getMonthlyInstallment() == null ||
                rd.getMonthlyInstallment()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Monthly installment must be greater than zero");
        }

        if (rd.getTenureMonths() == null ||
                rd.getTenureMonths() <= 0) {

            throw new IllegalArgumentException(
                    "Tenure must be greater than zero");
        }

        if (rd.getInterestRate() == null ||
                rd.getInterestRate()
                        .compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Interest rate cannot be negative");
        }

        // Generate RD number
        rd.setRdNumber(
                "RD-" + UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase());

        // Start date
        LocalDate startDate = LocalDate.now();
        rd.setStartDate(startDate);

        // Maturity date
        LocalDate maturityDate =
                startDate.plusMonths(rd.getTenureMonths());

        rd.setMaturityDate(maturityDate);

        // Initial values
        rd.setInstallmentsPaid(0);
        rd.setTotalDeposited(BigDecimal.ZERO);

        // Calculate maturity amount
        rd.setMaturityAmount(
                calculateMaturityAmount(
                        rd.getMonthlyInstallment(),
                        rd.getTenureMonths(),
                        rd.getInterestRate()
                )
        );

        if (rd.getStatus() == null) {
            rd.setStatus("ACTIVE");
        }

        RecurringDeposit savedRD =
                rdRepository.save(rd);

        logger.info(
                "Recurring Deposit created successfully. ID: {}, RD Number: {}",
                savedRD.getId(),
                savedRD.getRdNumber());

        return convertToDTO(savedRD);
    }

    // =========================
    // PAY INSTALLMENT
    // =========================
    @Transactional
    public RecurringDepositDTO payInstallment(
            Long id,
            BigDecimal amount) {

        logger.info(
                "Processing RD installment payment. RD ID: {}, Amount: {}",
                id,
                amount);

        RecurringDeposit rd =
                rdRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "RD not found with ID: " + id));

        if (!"ACTIVE".equalsIgnoreCase(rd.getStatus())) {
            throw new IllegalArgumentException(
                    "Installment cannot be paid. RD is not active");
        }

        if (amount == null ||
                amount.compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Installment amount must be greater than zero");
        }

        if (amount.compareTo(
                rd.getMonthlyInstallment()) != 0) {

            throw new IllegalArgumentException(
                    "Installment amount must be exactly "
                    + rd.getMonthlyInstallment());
        }

        if (rd.getInstallmentsPaid()
                >= rd.getTenureMonths()) {

            throw new IllegalArgumentException(
                    "All installments are already paid");
        }

        BigDecimal totalDeposited =
                rd.getTotalDeposited()
                        .add(amount);

        rd.setTotalDeposited(totalDeposited);

        rd.setInstallmentsPaid(
                rd.getInstallmentsPaid() + 1);

        // Mark completed after all installments
        if (rd.getInstallmentsPaid()
                >= rd.getTenureMonths()) {

            rd.setStatus("COMPLETED");
        }

        RecurringDeposit savedRD =
                rdRepository.save(rd);

        logger.info(
                "RD installment payment successful. RD ID: {}, Installments Paid: {}",
                id,
                savedRD.getInstallmentsPaid());

        return convertToDTO(savedRD);
    }

    // =========================
    // GET ALL RD
    // =========================
    public List<RecurringDepositDTO> getAllRDs() {

        logger.info("Fetching all Recurring Deposits");

        return rdRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================
    // GET RD BY ID
    // =========================
    public RecurringDepositDTO getRDById(Long id) {

        logger.info(
                "Fetching Recurring Deposit with ID: {}",
                id);

        RecurringDeposit rd =
                rdRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "RD not found with ID: " + id));

        return convertToDTO(rd);
    }

    // =========================
    // GET RD BY NUMBER
    // =========================
    public RecurringDepositDTO getRDByNumber(
            String rdNumber) {

        logger.info(
                "Fetching Recurring Deposit with number: {}",
                rdNumber);

        RecurringDeposit rd =
                rdRepository.findByRdNumber(rdNumber)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "RD not found with number: "
                                + rdNumber));

        return convertToDTO(rd);
    }

    // =========================
    // GET RD BY USER
    // =========================
    public List<RecurringDepositDTO> getRDsByUserId(
            Long userId) {

        logger.info(
                "Fetching Recurring Deposits for user ID: {}",
                userId);

        return rdRepository.findByUserId(userId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================
    // GET RD BY STATUS
    // =========================
    public List<RecurringDepositDTO> getRDsByStatus(
            String status) {

        logger.info(
                "Fetching Recurring Deposits with status: {}",
                status);

        return rdRepository.findByStatus(status)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================
    // FULL UPDATE
    // =========================
    public RecurringDepositDTO updateRD(
            Long id,
            RecurringDeposit updatedRD) {

        logger.info(
                "Updating Recurring Deposit with ID: {}",
                id);

        RecurringDeposit existingRD =
                rdRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "RD not found with ID: " + id));

        existingRD.setUserId(updatedRD.getUserId());

        existingRD.setMonthlyInstallment(
                updatedRD.getMonthlyInstallment());

        existingRD.setTenureMonths(
                updatedRD.getTenureMonths());

        existingRD.setInterestRate(
                updatedRD.getInterestRate());

        existingRD.setStatus(
                updatedRD.getStatus());

        existingRD.setMaturityAmount(
                calculateMaturityAmount(
                        existingRD.getMonthlyInstallment(),
                        existingRD.getTenureMonths(),
                        existingRD.getInterestRate()
                )
        );

        existingRD.setMaturityDate(
                existingRD.getStartDate()
                        .plusMonths(
                                existingRD.getTenureMonths()));

        RecurringDeposit savedRD =
                rdRepository.save(existingRD);

        logger.info(
                "Recurring Deposit updated successfully with ID: {}",
                id);

        return convertToDTO(savedRD);
    }

    // =========================
    // PATCH
    // =========================
    public RecurringDepositDTO patchRD(
            Long id,
            RecurringDeposit updatedRD) {

        logger.info(
                "Partially updating Recurring Deposit with ID: {}",
                id);

        RecurringDeposit existingRD =
                rdRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "RD not found with ID: " + id));

        if (updatedRD.getUserId() != null) {
            existingRD.setUserId(
                    updatedRD.getUserId());
        }

        if (updatedRD.getMonthlyInstallment() != null) {
            existingRD.setMonthlyInstallment(
                    updatedRD.getMonthlyInstallment());
        }

        if (updatedRD.getTenureMonths() != null) {
            existingRD.setTenureMonths(
                    updatedRD.getTenureMonths());
        }

        if (updatedRD.getInterestRate() != null) {
            existingRD.setInterestRate(
                    updatedRD.getInterestRate());
        }

        if (updatedRD.getStatus() != null) {
            existingRD.setStatus(
                    updatedRD.getStatus());
        }

        existingRD.setMaturityAmount(
                calculateMaturityAmount(
                        existingRD.getMonthlyInstallment(),
                        existingRD.getTenureMonths(),
                        existingRD.getInterestRate()
                )
        );

        existingRD.setMaturityDate(
                existingRD.getStartDate()
                        .plusMonths(
                                existingRD.getTenureMonths()));

        RecurringDeposit savedRD =
                rdRepository.save(existingRD);

        logger.info(
                "Recurring Deposit partially updated successfully with ID: {}",
                id);

        return convertToDTO(savedRD);
    }

    // =========================
    // DELETE RD
    // =========================
    public void deleteRD(Long id) {

        logger.info(
                "Deleting Recurring Deposit with ID: {}",
                id);

        if (!rdRepository.existsById(id)) {

            throw new ResourceNotFoundException(
                    "RD not found with ID: " + id);
        }

        rdRepository.deleteById(id);

        logger.info(
                "Recurring Deposit deleted successfully with ID: {}",
                id);
    }

    // =========================
    // MATURITY CALCULATION
    // =========================
    private BigDecimal calculateMaturityAmount(
            BigDecimal monthlyInstallment,
            Integer tenureMonths,
            BigDecimal interestRate) {

        BigDecimal totalDeposit =
                monthlyInstallment.multiply(
                        BigDecimal.valueOf(tenureMonths));

        /*
         * Approximate simple interest calculation
         * for recurring deposit.
         */
        BigDecimal averagePeriod =
                BigDecimal.valueOf(tenureMonths + 1)
                        .divide(
                                BigDecimal.valueOf(2),
                                4,
                                RoundingMode.HALF_UP);

        BigDecimal interest =
                monthlyInstallment
                .multiply(
                        BigDecimal.valueOf(tenureMonths))
                .multiply(averagePeriod)
                .multiply(interestRate)
                .divide(
                        BigDecimal.valueOf(1200),
                        2,
                        RoundingMode.HALF_UP);

        return totalDeposit
                .add(interest)
                .setScale(
                        2,
                        RoundingMode.HALF_UP);
    }

    // =========================
    // ENTITY -> DTO
    // =========================
    private RecurringDepositDTO convertToDTO(
            RecurringDeposit rd) {

        RecurringDepositDTO dto =
                new RecurringDepositDTO();

        dto.setId(rd.getId());
        dto.setRdNumber(rd.getRdNumber());
        dto.setUserId(rd.getUserId());
        dto.setMonthlyInstallment(
                rd.getMonthlyInstallment());
        dto.setTenureMonths(
                rd.getTenureMonths());
        dto.setInterestRate(
                rd.getInterestRate());
        dto.setTotalDeposited(
                rd.getTotalDeposited());
        dto.setMaturityAmount(
                rd.getMaturityAmount());
        dto.setStartDate(rd.getStartDate());
        dto.setMaturityDate(
                rd.getMaturityDate());
        dto.setInstallmentsPaid(
                rd.getInstallmentsPaid());
        dto.setStatus(rd.getStatus());

        return dto;
    }
}