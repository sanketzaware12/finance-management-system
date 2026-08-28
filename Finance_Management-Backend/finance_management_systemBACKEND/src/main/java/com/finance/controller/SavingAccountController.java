package com.finance.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.finance.dto.SavingAccountDTO;
import com.finance.entity.SavingAccount;
import com.finance.service.SavingAccountService;

@RestController
@RequestMapping("/api/savings")
public class SavingAccountController {

	private final SavingAccountService savingAccountService;

	public SavingAccountController(SavingAccountService savingAccountService) {

		this.savingAccountService = savingAccountService;
	}

	// CREATE
	@PostMapping
	public ResponseEntity<SavingAccountDTO> createAccount(@RequestBody SavingAccount account) {

		return new ResponseEntity<>(savingAccountService.createAccount(account), HttpStatus.CREATED);
	}

	// GET ALL
	@GetMapping
	public ResponseEntity<List<SavingAccountDTO>> getAllAccounts() {

		return ResponseEntity.ok(savingAccountService.getAllAccounts());
	}

	// GET BY ID
	@GetMapping("/{id}")
	public ResponseEntity<SavingAccountDTO> getAccountById(@PathVariable Long id) {

		return ResponseEntity.ok(savingAccountService.getAccountById(id));
	}

	// GET BY ACCOUNT NUMBER
	@GetMapping("/account/{accountNumber}")
	public ResponseEntity<SavingAccountDTO> getByAccountNumber(@PathVariable String accountNumber) {

		return ResponseEntity.ok(savingAccountService.getByAccountNumber(accountNumber));
	}

	// GET BY USER ID
	@GetMapping("/user/{userId}")
	public ResponseEntity<List<SavingAccountDTO>> getByUserId(@PathVariable Long userId) {

		return ResponseEntity.ok(savingAccountService.getByUserId(userId));
	}

	// PUT
	@PutMapping("/{id}")
	public ResponseEntity<SavingAccountDTO> updateAccount(@PathVariable Long id, @RequestBody SavingAccount account) {

		return ResponseEntity.ok(savingAccountService.updateAccount(id, account));
	}

	// PATCH
	@PatchMapping("/{id}")
	public ResponseEntity<SavingAccountDTO> patchAccount(@PathVariable Long id, @RequestBody SavingAccount account) {

		return ResponseEntity.ok(savingAccountService.patchAccount(id, account));
	}

	// DELETE
	@DeleteMapping("/{id}")
	public ResponseEntity<String> deleteAccount(@PathVariable Long id) {

		savingAccountService.deleteAccount(id);

		return ResponseEntity.ok("Saving account deleted successfully");
	}
}