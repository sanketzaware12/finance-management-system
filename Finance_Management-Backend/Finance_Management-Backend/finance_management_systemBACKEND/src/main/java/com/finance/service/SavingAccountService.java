package com.finance.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;

import com.finance.dto.SavingAccountDTO;
import com.finance.entity.SavingAccount;
import com.finance.exception.DuplicateResourceException;
import com.finance.exception.ResourceNotFoundException;
import com.finance.repository.SavingAccountRepository;

@Service
public class SavingAccountService {

    private final SavingAccountRepository savingAccountRepository;

    public SavingAccountService(
            SavingAccountRepository savingAccountRepository) {

        this.savingAccountRepository = savingAccountRepository;
    }

    // CREATE ACCOUNT
    public SavingAccountDTO createAccount(
            SavingAccount account) {

        if (savingAccountRepository
                .existsByAccountNumber(account.getAccountNumber())) {

            throw new DuplicateResourceException(
                    "Account number already exists: "
                    + account.getAccountNumber());
        }

        if (account.getBalance() == null) {
            account.setBalance(BigDecimal.ZERO);
        }

        if (account.getAccountType() == null) {
            account.setAccountType("SAVINGS");
        }

        if (account.getStatus() == null) {
            account.setStatus("ACTIVE");
        }

        SavingAccount savedAccount =
                savingAccountRepository.save(account);

        return convertToDTO(savedAccount);
    }

    // GET ALL
    public List<SavingAccountDTO> getAllAccounts() {

        return savingAccountRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // GET BY ID
    public SavingAccountDTO getAccountById(Long id) {

        SavingAccount account =
                savingAccountRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Saving account not found with ID: "
                                + id));

        return convertToDTO(account);
    }

    // GET BY ACCOUNT NUMBER
    public SavingAccountDTO getByAccountNumber(
            String accountNumber) {

        SavingAccount account =
                savingAccountRepository
                .findByAccountNumber(accountNumber)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Account not found with number: "
                                + accountNumber));

        return convertToDTO(account);
    }

    // GET BY USER ID
    public List<SavingAccountDTO> getByUserId(Long userId) {

        return savingAccountRepository
                .findByUserId(userId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // FULL UPDATE
    public SavingAccountDTO updateAccount(
            Long id,
            SavingAccount updatedAccount) {

        SavingAccount existingAccount =
                savingAccountRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Saving account not found with ID: "
                                + id));

        existingAccount.setAccountNumber(
                updatedAccount.getAccountNumber());

        existingAccount.setUserId(
                updatedAccount.getUserId());

        existingAccount.setAccountType(
                updatedAccount.getAccountType());

        existingAccount.setBalance(
                updatedAccount.getBalance());

        existingAccount.setStatus(
                updatedAccount.getStatus());

        return convertToDTO(
                savingAccountRepository.save(existingAccount));
    }

    // PATCH
    public SavingAccountDTO patchAccount(
            Long id,
            SavingAccount updatedAccount) {

        SavingAccount existingAccount =
                savingAccountRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Saving account not found with ID: "
                                + id));

        if (updatedAccount.getAccountNumber() != null) {
            existingAccount.setAccountNumber(
                    updatedAccount.getAccountNumber());
        }

        if (updatedAccount.getUserId() != null) {
            existingAccount.setUserId(
                    updatedAccount.getUserId());
        }

        if (updatedAccount.getAccountType() != null) {
            existingAccount.setAccountType(
                    updatedAccount.getAccountType());
        }

        if (updatedAccount.getBalance() != null) {
            existingAccount.setBalance(
                    updatedAccount.getBalance());
        }

        if (updatedAccount.getStatus() != null) {
            existingAccount.setStatus(
                    updatedAccount.getStatus());
        }

        return convertToDTO(
                savingAccountRepository.save(existingAccount));
    }

    // DELETE
    public void deleteAccount(Long id) {

        if (!savingAccountRepository.existsById(id)) {

            throw new ResourceNotFoundException(
                    "Saving account not found with ID: "
                    + id);
        }

        savingAccountRepository.deleteById(id);
    }

    // ENTITY -> DTO
    private SavingAccountDTO convertToDTO(
            SavingAccount account) {

        SavingAccountDTO dto = new SavingAccountDTO();

        dto.setId(account.getId());
        dto.setAccountNumber(
                account.getAccountNumber());
        dto.setUserId(account.getUserId());
        dto.setAccountType(
                account.getAccountType());
        dto.setBalance(
                account.getBalance());
        dto.setStatus(
                account.getStatus());

        return dto;
    }
}