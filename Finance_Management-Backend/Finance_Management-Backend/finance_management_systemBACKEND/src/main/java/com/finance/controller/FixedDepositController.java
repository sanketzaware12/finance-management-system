package com.finance.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.finance.dto.FixedDepositDTO;
import com.finance.entity.FixedDeposit;
import com.finance.service.FixedDepositService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/fd")
public class FixedDepositController {

    private final FixedDepositService fixedDepositService;

    public FixedDepositController(
            FixedDepositService fixedDepositService) {

        this.fixedDepositService = fixedDepositService;
    }

    // CREATE FD
    @PostMapping
    public ResponseEntity<FixedDepositDTO> createFD(
            @Valid @RequestBody FixedDeposit fd) {

        return new ResponseEntity<>(
                fixedDepositService.createFD(fd),
                HttpStatus.CREATED
        );
    }

    // GET ALL FDs
    @GetMapping
    public ResponseEntity<List<FixedDepositDTO>> getAllFDs() {

        return ResponseEntity.ok(
                fixedDepositService.getAllFDs()
        );
    }

    // GET FD BY ID
    @GetMapping("/{id}")
    public ResponseEntity<FixedDepositDTO> getFDById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                fixedDepositService.getFDById(id)
        );
    }

    // GET FD BY FD NUMBER
    @GetMapping("/number/{fdNumber}")
    public ResponseEntity<FixedDepositDTO> getFDByNumber(
            @PathVariable String fdNumber) {

        return ResponseEntity.ok(
                fixedDepositService.getFDByNumber(fdNumber)
        );
    }

    // GET FDs BY USER ID
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<FixedDepositDTO>> getFDsByUserId(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                fixedDepositService.getFDsByUserId(userId)
        );
    }

    // GET FDs BY STATUS
    @GetMapping("/status/{status}")
    public ResponseEntity<List<FixedDepositDTO>> getFDsByStatus(
            @PathVariable String status) {

        return ResponseEntity.ok(
                fixedDepositService.getFDsByStatus(status)
        );
    }

    // FULL UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<FixedDepositDTO> updateFD(
            @PathVariable Long id,
            @RequestBody FixedDeposit fd) {

        return ResponseEntity.ok(
                fixedDepositService.updateFD(id, fd)
        );
    }

    // PARTIAL UPDATE
    @PatchMapping("/{id}")
    public ResponseEntity<FixedDepositDTO> patchFD(
            @PathVariable Long id,
            @RequestBody FixedDeposit fd) {

        return ResponseEntity.ok(
                fixedDepositService.patchFD(id, fd)
        );
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteFD(
            @PathVariable Long id) {

        fixedDepositService.deleteFD(id);

        return ResponseEntity.ok(
                "Fixed Deposit deleted successfully"
        );
    }
}