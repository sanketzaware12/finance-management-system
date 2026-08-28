package com.finance.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.finance.dto.EmiScheduleDTO;
import com.finance.service.EmiScheduleService;
import jakarta.validation.constraints.Positive;

@RestController
@RequestMapping("/api/emi-schedules")
public class EmiScheduleController {

    private final EmiScheduleService emiScheduleService;

    public EmiScheduleController(
            EmiScheduleService emiScheduleService) {

        this.emiScheduleService = emiScheduleService;
    }

    // =========================
    // GENERATE EMI SCHEDULE
    // =========================
    @PostMapping("/generate/{loanId}")
    public ResponseEntity<List<EmiScheduleDTO>> generateSchedule(
            @PathVariable Long loanId) {

        return new ResponseEntity<>(
                emiScheduleService.generateSchedule(loanId),
                HttpStatus.CREATED
        );
    }

 // =========================
 // PAY EMI
 // =========================
    @PostMapping("/{emiId}/pay")
    public ResponseEntity<EmiScheduleDTO> payEMI(
            @PathVariable Long emiId,
            @RequestParam @Positive(message = "Payment amount must be greater than zero") BigDecimal amount) {

        return ResponseEntity.ok(
                emiScheduleService.payEMI(emiId, amount)
        );
    }
 
    // =========================
    // GET ALL EMI OF LOAN
    // =========================
    @GetMapping("/loan/{loanId}")
    public ResponseEntity<List<EmiScheduleDTO>> getScheduleByLoan(
            @PathVariable Long loanId) {

        return ResponseEntity.ok(
                emiScheduleService.getScheduleByLoanId(loanId)
        );
    }

    // =========================
    // GET SPECIFIC EMI
    // =========================
    @GetMapping("/loan/{loanId}/emi/{emiNumber}")
    public ResponseEntity<EmiScheduleDTO> getSpecificEMI(
            @PathVariable Long loanId,
            @PathVariable Integer emiNumber) {

        return ResponseEntity.ok(
                emiScheduleService.getEmi(
                        loanId,
                        emiNumber
                )
        );
    }

    // =========================
    // GET EMI BY ID
    // =========================
    @GetMapping("/{id}")
    public ResponseEntity<EmiScheduleDTO> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                emiScheduleService.getById(id)
        );
    }

    // =========================
    // GET EMI BY STATUS
    // =========================
    @GetMapping("/status/{status}")
    public ResponseEntity<List<EmiScheduleDTO>> getByStatus(
            @PathVariable String status) {

        return ResponseEntity.ok(
                emiScheduleService.getByStatus(status)
        );
    }
    
    
}