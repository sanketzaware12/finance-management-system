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

import com.finance.dto.FixedDepositDTO;
import com.finance.entity.FixedDeposit;
import com.finance.exception.ResourceNotFoundException;
import com.finance.repository.FixedDepositRepository;

@Service
public class FixedDepositService {

    private static final Logger logger =
            LoggerFactory.getLogger(FixedDepositService.class);

    private final FixedDepositRepository fixedDepositRepository;

    public FixedDepositService(
            FixedDepositRepository fixedDepositRepository) {

        this.fixedDepositRepository = fixedDepositRepository;
    }

    // =========================
    // CREATE FD
    // =========================
    @Transactional
    public FixedDepositDTO createFD(FixedDeposit fd) {

        logger.info("Creating new Fixed Deposit for user ID: {}",
                fd.getUserId());

        if (fd.getDepositAmount() == null ||
                fd.getDepositAmount().compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Deposit amount must be greater than zero");
        }

        if (fd.getTenureMonths() == null ||
                fd.getTenureMonths() <= 0) {

            throw new IllegalArgumentException(
                    "Tenure must be greater than zero");
        }

        if (fd.getInterestRate() == null ||
                fd.getInterestRate().compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Interest rate cannot be negative");
        }

        // Generate FD number automatically
        fd.setFdNumber(
                "FD-" + UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase());

        // Start date
        LocalDate startDate = LocalDate.now();
        fd.setStartDate(startDate);

        // Maturity date
        LocalDate maturityDate =
                startDate.plusMonths(fd.getTenureMonths());

        fd.setMaturityDate(maturityDate);

        // Simple interest calculation
        BigDecimal interest =
                fd.getDepositAmount()
                .multiply(fd.getInterestRate())
                .multiply(
                        BigDecimal.valueOf(
                                fd.getTenureMonths()))
                .divide(
                        BigDecimal.valueOf(1200),
                        2,
                        RoundingMode.HALF_UP
                );

        // Maturity amount
        BigDecimal maturityAmount =
                fd.getDepositAmount()
                .add(interest)
                .setScale(2, RoundingMode.HALF_UP);

        fd.setMaturityAmount(maturityAmount);

        if (fd.getStatus() == null) {
            fd.setStatus("ACTIVE");
        }

        FixedDeposit savedFD =
                fixedDepositRepository.save(fd);

        logger.info(
                "Fixed Deposit created successfully. ID: {}, FD Number: {}",
                savedFD.getId(),
                savedFD.getFdNumber());

        return convertToDTO(savedFD);
    }

    // =========================
    // GET ALL FDs
    // =========================
    public List<FixedDepositDTO> getAllFDs() {

        logger.info("Fetching all Fixed Deposits");

        return fixedDepositRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================
    // GET FD BY ID
    // =========================
    public FixedDepositDTO getFDById(Long id) {

        logger.info("Fetching Fixed Deposit with ID: {}", id);

        FixedDeposit fd =
                fixedDepositRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "FD not found with ID: " + id));

        return convertToDTO(fd);
    }

    // =========================
    // GET FD BY FD NUMBER
    // =========================
    public FixedDepositDTO getFDByNumber(
            String fdNumber) {

        logger.info(
                "Fetching Fixed Deposit with number: {}",
                fdNumber);

        FixedDeposit fd =
                fixedDepositRepository
                .findByFdNumber(fdNumber)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "FD not found with number: "
                                + fdNumber));

        return convertToDTO(fd);
    }

    // =========================
    // GET FDs BY USER ID
    // =========================
    public List<FixedDepositDTO> getFDsByUserId(
            Long userId) {

        logger.info(
                "Fetching Fixed Deposits for user ID: {}",
                userId);

        return fixedDepositRepository
                .findByUserId(userId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================
    // GET FDs BY STATUS
    // =========================
    public List<FixedDepositDTO> getFDsByStatus(
            String status) {

        logger.info(
                "Fetching Fixed Deposits with status: {}",
                status);

        return fixedDepositRepository
                .findByStatus(status)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // =========================
    // FULL UPDATE
    // =========================
    public FixedDepositDTO updateFD(
            Long id,
            FixedDeposit updatedFD) {

        logger.info(
                "Updating Fixed Deposit with ID: {}",
                id);

        FixedDeposit existingFD =
                fixedDepositRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "FD not found with ID: " + id));

        existingFD.setUserId(updatedFD.getUserId());

        existingFD.setDepositAmount(
                updatedFD.getDepositAmount());

        existingFD.setTenureMonths(
                updatedFD.getTenureMonths());

        existingFD.setInterestRate(
                updatedFD.getInterestRate());

        existingFD.setStatus(
                updatedFD.getStatus());

        // Recalculate maturity details
        LocalDate startDate =
                existingFD.getStartDate();

        if (startDate == null) {
            startDate = LocalDate.now();
            existingFD.setStartDate(startDate);
        }

        LocalDate maturityDate =
                startDate.plusMonths(
                        existingFD.getTenureMonths());

        existingFD.setMaturityDate(maturityDate);

        BigDecimal interest =
                existingFD.getDepositAmount()
                .multiply(existingFD.getInterestRate())
                .multiply(
                        BigDecimal.valueOf(
                                existingFD.getTenureMonths()))
                .divide(
                        BigDecimal.valueOf(1200),
                        2,
                        RoundingMode.HALF_UP
                );

        existingFD.setMaturityAmount(
                existingFD.getDepositAmount()
                .add(interest)
                .setScale(2, RoundingMode.HALF_UP));

        FixedDeposit savedFD =
                fixedDepositRepository.save(existingFD);

        logger.info(
                "Fixed Deposit updated successfully with ID: {}",
                id);

        return convertToDTO(savedFD);
    }

    // =========================
    // PATCH
    // =========================
    public FixedDepositDTO patchFD(
            Long id,
            FixedDeposit updatedFD) {

        logger.info(
                "Partially updating Fixed Deposit with ID: {}",
                id);

        FixedDeposit existingFD =
                fixedDepositRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "FD not found with ID: " + id));

        if (updatedFD.getUserId() != null) {
            existingFD.setUserId(
                    updatedFD.getUserId());
        }

        if (updatedFD.getDepositAmount() != null) {
            existingFD.setDepositAmount(
                    updatedFD.getDepositAmount());
        }

        if (updatedFD.getTenureMonths() != null) {
            existingFD.setTenureMonths(
                    updatedFD.getTenureMonths());
        }

        if (updatedFD.getInterestRate() != null) {
            existingFD.setInterestRate(
                    updatedFD.getInterestRate());
        }

        if (updatedFD.getStatus() != null) {
            existingFD.setStatus(
                    updatedFD.getStatus());
        }

        // Recalculate maturity details
        LocalDate startDate =
                existingFD.getStartDate();

        if (startDate == null) {
            startDate = LocalDate.now();
            existingFD.setStartDate(startDate);
        }

        LocalDate maturityDate =
                startDate.plusMonths(
                        existingFD.getTenureMonths());

        existingFD.setMaturityDate(maturityDate);

        BigDecimal interest =
                existingFD.getDepositAmount()
                .multiply(existingFD.getInterestRate())
                .multiply(
                        BigDecimal.valueOf(
                                existingFD.getTenureMonths()))
                .divide(
                        BigDecimal.valueOf(1200),
                        2,
                        RoundingMode.HALF_UP
                );

        existingFD.setMaturityAmount(
                existingFD.getDepositAmount()
                .add(interest)
                .setScale(2, RoundingMode.HALF_UP));

        FixedDeposit savedFD =
                fixedDepositRepository.save(existingFD);

        logger.info(
                "Fixed Deposit partially updated successfully with ID: {}",
                id);

        return convertToDTO(savedFD);
    }

    // =========================
    // DELETE FD
    // =========================
    public void deleteFD(Long id) {

        logger.info(
                "Deleting Fixed Deposit with ID: {}",
                id);

        if (!fixedDepositRepository.existsById(id)) {

            throw new ResourceNotFoundException(
                    "FD not found with ID: " + id);
        }

        fixedDepositRepository.deleteById(id);

        logger.info(
                "Fixed Deposit deleted successfully with ID: {}",
                id);
    }

    // =========================
    // ENTITY -> DTO
    // =========================
    private FixedDepositDTO convertToDTO(
            FixedDeposit fd) {

        FixedDepositDTO dto = new FixedDepositDTO();

        dto.setId(fd.getId());
        dto.setFdNumber(fd.getFdNumber());
        dto.setUserId(fd.getUserId());
        dto.setDepositAmount(fd.getDepositAmount());
        dto.setTenureMonths(fd.getTenureMonths());
        dto.setInterestRate(fd.getInterestRate());
        dto.setMaturityAmount(fd.getMaturityAmount());
        dto.setStartDate(fd.getStartDate());
        dto.setMaturityDate(fd.getMaturityDate());
        dto.setStatus(fd.getStatus());

        return dto;
    }
}