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

import com.finance.dto.LoanDTO;
import com.finance.entity.Loan;
import com.finance.exception.ResourceNotFoundException;
import com.finance.repository.LoanRepository;

@Service
public class LoanService {

    private static final Logger logger =
            LoggerFactory.getLogger(LoanService.class);

    private final LoanRepository loanRepository;

    public LoanService(LoanRepository loanRepository) {
        this.loanRepository = loanRepository;
    }

    // =========================
    // CREATE LOAN APPLICATION
    // =========================
    @Transactional
    public LoanDTO createLoan(Loan loan) {

        logger.info(
                "Creating new loan application for user ID: {}",
                loan.getUserId());

        if (loan.getUserId() == null) {
            throw new IllegalArgumentException(
                    "User ID is required");
        }

        if (loan.getLoanAmount() == null ||
                loan.getLoanAmount()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Loan amount must be greater than zero");
        }

        if (loan.getInterestRate() == null ||
                loan.getInterestRate()
                        .compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Interest rate cannot be negative");
        }

        if (loan.getTenureMonths() == null ||
                loan.getTenureMonths() <= 0) {

            throw new IllegalArgumentException(
                    "Tenure must be greater than zero");
        }

        // Generate loan number automatically
        loan.setLoanNumber(
                "LN-" + UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase());

        // Application date
        loan.setApplicationDate(LocalDate.now());

        // New loan starts as PENDING
        loan.setStatus("PENDING");

        // Calculate EMI
        BigDecimal emi = calculateEMI(
                loan.getLoanAmount(),
                loan.getInterestRate(),
                loan.getTenureMonths());

        loan.setEmiAmount(emi);

        // Total payable amount
        BigDecimal totalPayable =
                emi.multiply(
                        BigDecimal.valueOf(
                                loan.getTenureMonths()));

        loan.setTotalPayable(
                totalPayable.setScale(
                        2,
                        RoundingMode.HALF_UP));

        // Outstanding amount starts from zero
        // It will be set when loan is disbursed
        loan.setOutstandingAmount(
                BigDecimal.ZERO);

        Loan savedLoan =
                loanRepository.save(loan);

        logger.info(
                "Loan created successfully. ID: {}, Loan Number: {}",
                savedLoan.getId(),
                savedLoan.getLoanNumber());

        return convertToDTO(savedLoan);
    }

    // =========================
    // APPROVE LOAN
    // =========================
    @Transactional
    public LoanDTO approveLoan(Long id) {

        logger.info(
                "Approving loan with ID: {}",
                id);

        Loan loan = getLoanEntity(id);

        if (!"PENDING".equalsIgnoreCase(
                loan.getStatus())) {

            throw new IllegalArgumentException(
                    "Only PENDING loans can be approved");
        }

        loan.setStatus("APPROVED");
        loan.setApprovalDate(LocalDate.now());

        Loan savedLoan =
                loanRepository.save(loan);

        logger.info(
                "Loan approved successfully. ID: {}",
                id);

        return convertToDTO(savedLoan);
    }

    // =========================
    // REJECT LOAN
    // =========================
    @Transactional
    public LoanDTO rejectLoan(Long id) {

        logger.info(
                "Rejecting loan with ID: {}",
                id);

        Loan loan = getLoanEntity(id);

        if (!"PENDING".equalsIgnoreCase(
                loan.getStatus())) {

            throw new IllegalArgumentException(
                    "Only PENDING loans can be rejected");
        }

        loan.setStatus("REJECTED");

        Loan savedLoan =
                loanRepository.save(loan);

        logger.info(
                "Loan rejected successfully. ID: {}",
                id);

        return convertToDTO(savedLoan);
    }

    // =========================
    // DISBURSE LOAN
    // =========================
    @Transactional
    public LoanDTO disburseLoan(Long id) {

        logger.info(
                "Disbursing loan with ID: {}",
                id);

        Loan loan = getLoanEntity(id);

        if (!"APPROVED".equalsIgnoreCase(
                loan.getStatus())) {

            throw new IllegalArgumentException(
                    "Only APPROVED loans can be disbursed");
        }

        loan.setStatus("DISBURSED");

        loan.setDisbursementDate(
                LocalDate.now());

        // Outstanding starts with total payable
        loan.setOutstandingAmount(
                loan.getTotalPayable());

        Loan savedLoan =
                loanRepository.save(loan);

        logger.info(
                "Loan disbursed successfully. ID: {}, Outstanding Amount: {}",
                id,
                savedLoan.getOutstandingAmount());

        return convertToDTO(savedLoan);
    }

    // =========================
    // PAY EMI
    // =========================
    @Transactional
    public LoanDTO payEMI(
            Long id,
            BigDecimal amount) {

        logger.info(
                "Processing loan payment. Loan ID: {}, Amount: {}",
                id,
                amount);

        Loan loan = getLoanEntity(id);

        if (!"DISBURSED".equalsIgnoreCase(
                loan.getStatus())) {

            throw new IllegalArgumentException(
                    "EMI can be paid only for DISBURSED loan");
        }

        if (amount == null ||
                amount.compareTo(
                        BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Payment amount must be greater than zero");
        }

        if (loan.getOutstandingAmount() == null ||
                loan.getOutstandingAmount()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "No outstanding amount remaining");
        }

        if (amount.compareTo(
                loan.getOutstandingAmount()) > 0) {

            throw new IllegalArgumentException(
                    "Payment cannot exceed outstanding amount");
        }

        BigDecimal newOutstanding =
                loan.getOutstandingAmount()
                        .subtract(amount)
                        .setScale(
                                2,
                                RoundingMode.HALF_UP);

        loan.setOutstandingAmount(
                newOutstanding);

        // Loan completed when outstanding becomes zero
        if (newOutstanding.compareTo(
                BigDecimal.ZERO) == 0) {

            loan.setStatus("COMPLETED");

            logger.info(
                    "Loan completed successfully. Loan ID: {}",
                    id);
        }

        Loan savedLoan =
                loanRepository.save(loan);

        logger.info(
                "Loan payment successful. Loan ID: {}, Remaining Outstanding: {}",
                id,
                savedLoan.getOutstandingAmount());

        return convertToDTO(savedLoan);
    }

    // =========================
    // GET ALL LOANS
    // =========================
    public List<LoanDTO> getAllLoans() {

        logger.info("Fetching all loans");

        return loanRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================
    // GET LOAN BY ID
    // =========================
    public LoanDTO getLoanById(Long id) {

        logger.info(
                "Fetching loan with ID: {}",
                id);

        return convertToDTO(
                getLoanEntity(id));
    }

    // =========================
    // GET LOAN BY NUMBER
    // =========================
    public LoanDTO getLoanByNumber(
            String loanNumber) {

        logger.info(
                "Fetching loan with number: {}",
                loanNumber);

        Loan loan =
                loanRepository
                .findByLoanNumber(loanNumber)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Loan not found with number: "
                                + loanNumber));

        return convertToDTO(loan);
    }

    // =========================
    // GET LOANS BY USER
    // =========================
    public List<LoanDTO> getLoansByUserId(
            Long userId) {

        logger.info(
                "Fetching loans for user ID: {}",
                userId);

        return loanRepository
                .findByUserId(userId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================
    // GET LOANS BY STATUS
    // =========================
    public List<LoanDTO> getLoansByStatus(
            String status) {

        logger.info(
                "Fetching loans with status: {}",
                status);

        return loanRepository
                .findByStatus(status)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================
    // FULL UPDATE
    // =========================
    @Transactional
    public LoanDTO updateLoan(
            Long id,
            Loan updatedLoan) {

        logger.info(
                "Updating loan with ID: {}",
                id);

        Loan existingLoan =
                getLoanEntity(id);

        if (updatedLoan.getUserId() == null) {
            throw new IllegalArgumentException(
                    "User ID is required");
        }

        if (updatedLoan.getLoanAmount() == null ||
                updatedLoan.getLoanAmount()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Loan amount must be greater than zero");
        }

        if (updatedLoan.getInterestRate() == null ||
                updatedLoan.getInterestRate()
                        .compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Interest rate cannot be negative");
        }

        if (updatedLoan.getTenureMonths() == null ||
                updatedLoan.getTenureMonths() <= 0) {

            throw new IllegalArgumentException(
                    "Tenure must be greater than zero");
        }

        existingLoan.setUserId(
                updatedLoan.getUserId());

        existingLoan.setLoanAmount(
                updatedLoan.getLoanAmount());

        existingLoan.setInterestRate(
                updatedLoan.getInterestRate());

        existingLoan.setTenureMonths(
                updatedLoan.getTenureMonths());

        existingLoan.setPurpose(
                updatedLoan.getPurpose());

        // Recalculate EMI
        BigDecimal emi =
                calculateEMI(
                        existingLoan.getLoanAmount(),
                        existingLoan.getInterestRate(),
                        existingLoan.getTenureMonths());

        existingLoan.setEmiAmount(emi);

        // Recalculate total payable
        existingLoan.setTotalPayable(
                emi.multiply(
                        BigDecimal.valueOf(
                                existingLoan
                                        .getTenureMonths()))
                        .setScale(
                                2,
                                RoundingMode.HALF_UP));

        Loan savedLoan =
                loanRepository.save(existingLoan);

        logger.info(
                "Loan updated successfully. ID: {}",
                id);

        return convertToDTO(savedLoan);
    }

    // =========================
    // PATCH
    // =========================
    @Transactional
    public LoanDTO patchLoan(
            Long id,
            Loan updatedLoan) {

        logger.info(
                "Partially updating loan with ID: {}",
                id);

        Loan existingLoan =
                getLoanEntity(id);

        if (updatedLoan.getLoanAmount() != null) {

            if (updatedLoan.getLoanAmount()
                    .compareTo(BigDecimal.ZERO) <= 0) {

                throw new IllegalArgumentException(
                        "Loan amount must be greater than zero");
            }

            existingLoan.setLoanAmount(
                    updatedLoan.getLoanAmount());
        }

        if (updatedLoan.getInterestRate() != null) {

            if (updatedLoan.getInterestRate()
                    .compareTo(BigDecimal.ZERO) < 0) {

                throw new IllegalArgumentException(
                        "Interest rate cannot be negative");
            }

            existingLoan.setInterestRate(
                    updatedLoan.getInterestRate());
        }

        if (updatedLoan.getTenureMonths() != null) {

            if (updatedLoan.getTenureMonths() <= 0) {

                throw new IllegalArgumentException(
                        "Tenure must be greater than zero");
            }

            existingLoan.setTenureMonths(
                    updatedLoan.getTenureMonths());
        }

        if (updatedLoan.getPurpose() != null) {
            existingLoan.setPurpose(
                    updatedLoan.getPurpose());
        }

        if (updatedLoan.getUserId() != null) {
            existingLoan.setUserId(
                    updatedLoan.getUserId());
        }

        // Recalculate EMI
        BigDecimal emi =
                calculateEMI(
                        existingLoan.getLoanAmount(),
                        existingLoan.getInterestRate(),
                        existingLoan.getTenureMonths());

        existingLoan.setEmiAmount(emi);

        existingLoan.setTotalPayable(
                emi.multiply(
                        BigDecimal.valueOf(
                                existingLoan
                                        .getTenureMonths()))
                        .setScale(
                                2,
                                RoundingMode.HALF_UP));

        Loan savedLoan =
                loanRepository.save(existingLoan);

        logger.info(
                "Loan partially updated successfully. ID: {}",
                id);

        return convertToDTO(savedLoan);
    }

    // =========================
    // DELETE
    // =========================
    @Transactional
    public void deleteLoan(Long id) {

        logger.info(
                "Deleting loan with ID: {}",
                id);

        if (!loanRepository.existsById(id)) {

            throw new ResourceNotFoundException(
                    "Loan not found with ID: " + id);
        }

        loanRepository.deleteById(id);

        logger.info(
                "Loan deleted successfully. ID: {}",
                id);
    }

    // =========================
    // EMI CALCULATION
    // =========================
    private BigDecimal calculateEMI(
            BigDecimal principal,
            BigDecimal annualRate,
            Integer tenureMonths) {

        if (annualRate.compareTo(
                BigDecimal.ZERO) == 0) {

            return principal.divide(
                    BigDecimal.valueOf(
                            tenureMonths),
                    2,
                    RoundingMode.HALF_UP);
        }

        double p =
                principal.doubleValue();

        double monthlyRate =
                annualRate.doubleValue()
                / 12
                / 100;

        int n = tenureMonths;

        double emi =
                p * monthlyRate
                * Math.pow(
                        1 + monthlyRate,
                        n)
                /
                (Math.pow(
                        1 + monthlyRate,
                        n) - 1);

        return BigDecimal.valueOf(emi)
                .setScale(
                        2,
                        RoundingMode.HALF_UP);
    }

    // =========================
    // GET ENTITY
    // =========================
    private Loan getLoanEntity(Long id) {

        return loanRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Loan not found with ID: "
                                + id));
    }

    // =========================
    // ENTITY -> DTO
    // =========================
    private LoanDTO convertToDTO(
            Loan loan) {

        LoanDTO dto = new LoanDTO();

        dto.setId(loan.getId());

        dto.setLoanNumber(
                loan.getLoanNumber());

        dto.setUserId(
                loan.getUserId());

        dto.setLoanAmount(
                loan.getLoanAmount());

        dto.setInterestRate(
                loan.getInterestRate());

        dto.setTenureMonths(
                loan.getTenureMonths());

        dto.setEmiAmount(
                loan.getEmiAmount());

        dto.setTotalPayable(
                loan.getTotalPayable());

        dto.setOutstandingAmount(
                loan.getOutstandingAmount());

        dto.setApplicationDate(
                loan.getApplicationDate());

        dto.setApprovalDate(
                loan.getApprovalDate());

        dto.setDisbursementDate(
                loan.getDisbursementDate());

        dto.setStatus(
                loan.getStatus());

        dto.setPurpose(
                loan.getPurpose());

        return dto;
    }
}