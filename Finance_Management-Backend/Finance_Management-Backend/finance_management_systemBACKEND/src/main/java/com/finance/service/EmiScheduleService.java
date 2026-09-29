package com.finance.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finance.dto.EmiScheduleDTO;
import com.finance.entity.EmiSchedule;
import com.finance.entity.Loan;
import com.finance.exception.ResourceNotFoundException;
import com.finance.repository.EmiScheduleRepository;
import com.finance.repository.LoanRepository;

@Service
public class EmiScheduleService {

    private static final Logger logger =
            LoggerFactory.getLogger(EmiScheduleService.class);

    private final EmiScheduleRepository emiScheduleRepository;
    private final LoanRepository loanRepository;

    public EmiScheduleService(
            EmiScheduleRepository emiScheduleRepository,
            LoanRepository loanRepository) {

        this.emiScheduleRepository = emiScheduleRepository;
        this.loanRepository = loanRepository;
    }

    // =========================
    // GENERATE EMI SCHEDULE
    // =========================
    @Transactional
    public List<EmiScheduleDTO> generateSchedule(Long loanId) {

        logger.info(
                "Generating EMI schedule for loan ID: {}",
                loanId);

        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Loan not found with ID: "
                                        + loanId));

        if (!"DISBURSED".equalsIgnoreCase(
                loan.getStatus())) {

            throw new IllegalArgumentException(
                    "EMI schedule can be generated only after loan disbursement");
        }

        // Prevent duplicate schedule
        if (!emiScheduleRepository
                .findByLoanIdOrderByEmiNumberAsc(loanId)
                .isEmpty()) {

            throw new IllegalArgumentException(
                    "EMI schedule already exists for this loan");
        }

        if (loan.getTenureMonths() == null ||
                loan.getTenureMonths() <= 0) {

            throw new IllegalArgumentException(
                    "Loan tenure must be greater than zero");
        }

        if (loan.getEmiAmount() == null ||
                loan.getEmiAmount()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Loan EMI amount must be greater than zero");
        }

        if (loan.getLoanAmount() == null ||
                loan.getLoanAmount()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Loan amount must be greater than zero");
        }

        int tenure = loan.getTenureMonths();

        BigDecimal emi =
                loan.getEmiAmount();

        BigDecimal outstandingPrincipal =
                loan.getLoanAmount();

        BigDecimal annualRate =
                loan.getInterestRate();

        BigDecimal monthlyRate =
                annualRate.divide(
                        BigDecimal.valueOf(12 * 100),
                        10,
                        RoundingMode.HALF_UP);

        LocalDate firstDueDate =
                loan.getDisbursementDate()
                        .plusMonths(1);

        for (int i = 1; i <= tenure; i++) {

            BigDecimal interestAmount =
                    outstandingPrincipal
                            .multiply(monthlyRate)
                            .setScale(
                                    2,
                                    RoundingMode.HALF_UP);

            BigDecimal principalAmount =
                    emi.subtract(interestAmount)
                            .setScale(
                                    2,
                                    RoundingMode.HALF_UP);

            // Final EMI adjustment
            if (i == tenure) {

                principalAmount =
                        outstandingPrincipal;

                emi =
                        principalAmount
                                .add(interestAmount)
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP);
            }

            EmiSchedule schedule =
                    new EmiSchedule();

            schedule.setLoanId(loanId);

            schedule.setEmiNumber(i);

            schedule.setDueDate(
                    firstDueDate
                            .plusMonths(i - 1));

            schedule.setEmiAmount(emi);

            schedule.setPrincipalAmount(
                    principalAmount);

            schedule.setInterestAmount(
                    interestAmount);

            schedule.setPaidAmount(
                    BigDecimal.ZERO);

            schedule.setPaymentDate(null);

            schedule.setStatus("PENDING");

            emiScheduleRepository.save(schedule);

            outstandingPrincipal =
                    outstandingPrincipal
                            .subtract(principalAmount)
                            .max(BigDecimal.ZERO)
                            .setScale(
                                    2,
                                    RoundingMode.HALF_UP);
        }

        logger.info(
                "EMI schedule generated successfully. Loan ID: {}, Total EMIs: {}",
                loanId,
                tenure);

        return getScheduleByLoanId(loanId);
    }

    // =========================
    // PAY SPECIFIC EMI
    // =========================
    @Transactional
    public EmiScheduleDTO payEMI(
            Long emiId,
            BigDecimal amount) {

        logger.info(
                "Processing EMI payment. EMI ID: {}, Amount: {}",
                emiId,
                amount);

        EmiSchedule schedule =
                emiScheduleRepository.findById(emiId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "EMI schedule not found with ID: "
                                                + emiId));

        if ("PAID".equalsIgnoreCase(
                schedule.getStatus())) {

            throw new IllegalArgumentException(
                    "This EMI is already paid");
        }

        if (amount == null ||
                amount.compareTo(
                        BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Payment amount must be greater than zero");
        }

        if (amount.compareTo(
                schedule.getEmiAmount()) != 0) {

            throw new IllegalArgumentException(
                    "Payment amount must be exactly EMI amount: "
                            + schedule.getEmiAmount());
        }

        // Find related loan
        Loan loan =
                loanRepository.findById(
                        schedule.getLoanId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Loan not found with ID: "
                                                + schedule.getLoanId()));

        if (!"DISBURSED".equalsIgnoreCase(
                loan.getStatus())) {

            throw new IllegalArgumentException(
                    "EMI payment is allowed only for DISBURSED loan");
        }

        if (loan.getOutstandingAmount() == null ||
                loan.getOutstandingAmount()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Loan has no outstanding amount");
        }

        if (amount.compareTo(
                loan.getOutstandingAmount()) > 0) {

            throw new IllegalArgumentException(
                    "Payment cannot exceed loan outstanding amount");
        }

        // Mark EMI as paid
        schedule.setPaidAmount(amount);

        schedule.setPaymentDate(
                LocalDate.now());

        schedule.setStatus("PAID");

        EmiSchedule savedSchedule =
                emiScheduleRepository.save(schedule);

        // Update loan outstanding
        BigDecimal newOutstanding =
                loan.getOutstandingAmount()
                        .subtract(amount)
                        .max(BigDecimal.ZERO)
                        .setScale(
                                2,
                                RoundingMode.HALF_UP);

        loan.setOutstandingAmount(
                newOutstanding);

        // Complete loan when all outstanding is paid
        if (newOutstanding.compareTo(
                BigDecimal.ZERO) == 0) {

            loan.setStatus("COMPLETED");

            logger.info(
                    "Loan completed successfully. Loan ID: {}",
                    loan.getId());
        }

        loanRepository.save(loan);

        logger.info(
                "EMI payment successful. EMI ID: {}, Loan ID: {}, Remaining Outstanding: {}",
                emiId,
                loan.getId(),
                newOutstanding);

        return convertToDTO(savedSchedule);
    }


    // =========================
    // SYNC EXISTING LOAN PAYMENTS
    // =========================
    @Transactional
    public List<EmiScheduleDTO> syncScheduleWithLoan(Long loanId) {

        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Loan not found with ID: " + loanId));

        List<EmiSchedule> schedules = emiScheduleRepository
                .findByLoanIdOrderByEmiNumberAsc(loanId);

        if (schedules.isEmpty()) {
            return List.of();
        }

        BigDecimal outstanding = loan.getOutstandingAmount() == null
                ? BigDecimal.ZERO
                : loan.getOutstandingAmount();
        BigDecimal totalPayable = loan.getTotalPayable() == null
                ? schedules.stream()
                    .map(EmiSchedule::getEmiAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                : loan.getTotalPayable();
        BigDecimal targetPaid = totalPayable.subtract(outstanding)
                .max(BigDecimal.ZERO);

        BigDecimal paidSoFar = BigDecimal.ZERO;
        boolean changed = false;

        for (EmiSchedule schedule : schedules) {
            if ("PAID".equalsIgnoreCase(schedule.getStatus())) {
                paidSoFar = paidSoFar.add(schedule.getPaidAmount() == null
                        ? schedule.getEmiAmount()
                        : schedule.getPaidAmount());
                continue;
            }

            BigDecimal emiAmount = schedule.getEmiAmount() == null
                    ? BigDecimal.ZERO
                    : schedule.getEmiAmount();
            boolean loanFullyPaid = outstanding.compareTo(BigDecimal.ZERO) == 0;
            boolean enoughRecordedPayment = targetPaid.subtract(paidSoFar)
                    .compareTo(emiAmount) >= 0;
            if (loanFullyPaid || enoughRecordedPayment) {
                schedule.setPaidAmount(emiAmount);
                schedule.setPaymentDate(LocalDate.now());
                schedule.setStatus("PAID");
                emiScheduleRepository.save(schedule);
                paidSoFar = paidSoFar.add(emiAmount);
                changed = true;
            } else {
                break;
            }
        }

        if (changed) {
            logger.info(
                    "Existing loan payments synchronized with EMI schedule. Loan ID: {}",
                    loanId);
        }

        return getScheduleByLoanId(loanId);
    }

    // =========================
    // GET SCHEDULE BY LOAN
    // =========================
    public List<EmiScheduleDTO> getScheduleByLoanId(
            Long loanId) {

        logger.info(
                "Fetching EMI schedule for loan ID: {}",
                loanId);

        if (!loanRepository.existsById(loanId)) {

            throw new ResourceNotFoundException(
                    "Loan not found with ID: "
                            + loanId);
        }

        return emiScheduleRepository
                .findByLoanIdOrderByEmiNumberAsc(loanId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================
    // GET EMI BY NUMBER
    // =========================
    public EmiScheduleDTO getEmi(
            Long loanId,
            Integer emiNumber) {

        logger.info(
                "Fetching EMI number {} for loan ID {}",
                emiNumber,
                loanId);

        EmiSchedule schedule =
                emiScheduleRepository
                        .findByLoanIdAndEmiNumber(
                                loanId,
                                emiNumber)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "EMI not found for loan ID: "
                                                + loanId
                                                + " and EMI number: "
                                                + emiNumber));

        return convertToDTO(schedule);
    }

    // =========================
    // GET EMI BY ID
    // =========================
    public EmiScheduleDTO getById(
            Long id) {

        logger.info(
                "Fetching EMI schedule with ID: {}",
                id);

        EmiSchedule schedule =
                emiScheduleRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "EMI schedule not found with ID: "
                                                + id));

        return convertToDTO(schedule);
    }

    // =========================
    // GET EMI BY STATUS
    // =========================
    public List<EmiScheduleDTO> getByStatus(
            String status) {

        logger.info(
                "Fetching EMI schedules with status: {}",
                status);

        return emiScheduleRepository
                .findByStatus(status)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================
    // ENTITY TO DTO
    // =========================
    private EmiScheduleDTO convertToDTO(
            EmiSchedule schedule) {

        EmiScheduleDTO dto =
                new EmiScheduleDTO();

        dto.setId(schedule.getId());

        dto.setLoanId(
                schedule.getLoanId());

        dto.setEmiNumber(
                schedule.getEmiNumber());

        dto.setDueDate(
                schedule.getDueDate());

        dto.setEmiAmount(
                schedule.getEmiAmount());

        dto.setPrincipalAmount(
                schedule.getPrincipalAmount());

        dto.setInterestAmount(
                schedule.getInterestAmount());

        dto.setPaidAmount(
                schedule.getPaidAmount());

        dto.setStatus(
                schedule.getStatus());

        dto.setPaymentDate(
                schedule.getPaymentDate());

        return dto;
    }
}