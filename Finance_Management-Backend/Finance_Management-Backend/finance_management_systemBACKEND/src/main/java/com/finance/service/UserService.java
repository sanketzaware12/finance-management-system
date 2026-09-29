package com.finance.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.finance.dto.UserDTO;
import com.finance.entity.User;
import com.finance.exception.DuplicateResourceException;
import com.finance.exception.ResourceNotFoundException;
import com.finance.repository.UserRepository;

@Service
public class UserService {

    private static final Logger logger =
            LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // CREATE
    public UserDTO createUser(User user) {

        logger.info("Creating new user with email: {}", user.getEmail());

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new DuplicateResourceException(
                    "Email already registered: " + user.getEmail()
            );
        }

        if (userRepository.existsByMobile(user.getMobile())) {
            throw new DuplicateResourceException(
                    "Mobile number already registered: " + user.getMobile()
            );
        }

        User savedUser = userRepository.save(user);

        logger.info("User created successfully with ID: {}",
                savedUser.getId());

        return convertToDTO(savedUser);
    }

    // GET ALL
    public List<UserDTO> getAllUsers() {

        logger.info("Fetching all users");

        return userRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // GET BY ID
    public UserDTO getUserById(Long id) {

        logger.info("Fetching user with ID: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with ID: " + id
                        ));

        return convertToDTO(user);
    }

    // GET BY EMAIL
    public UserDTO getUserByEmail(String email) {

        logger.info("Fetching user with email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with email: " + email
                        ));

        return convertToDTO(user);
    }

    // GET BY MOBILE
    public UserDTO getUserByMobile(String mobile) {

        logger.info("Fetching user with mobile: {}", mobile);

        User user = userRepository.findByMobile(mobile)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with mobile: " + mobile
                        ));

        return convertToDTO(user);
    }

    // UPDATE FULL USER
    public UserDTO updateUser(Long id, User updatedUser) {

        logger.info("Updating user with ID: {}", id);

        User existingUser = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with ID: " + id
                        ));

        existingUser.setName(updatedUser.getName());
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setMobile(updatedUser.getMobile());
        existingUser.setPassword(updatedUser.getPassword());
        existingUser.setAddress(updatedUser.getAddress());
        existingUser.setGender(updatedUser.getGender());

        User savedUser = userRepository.save(existingUser);

        logger.info("User updated successfully with ID: {}", id);

        return convertToDTO(savedUser);
    }

    // PATCH USER
    public UserDTO patchUser(Long id, User updatedUser) {

        logger.info("Partially updating user with ID: {}", id);

        User existingUser = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with ID: " + id
                        ));

        if (updatedUser.getName() != null) {
            existingUser.setName(updatedUser.getName());
        }

        if (updatedUser.getEmail() != null) {
            existingUser.setEmail(updatedUser.getEmail());
        }

        if (updatedUser.getMobile() != null) {
            existingUser.setMobile(updatedUser.getMobile());
        }

        if (updatedUser.getPassword() != null) {
            existingUser.setPassword(updatedUser.getPassword());
        }

        if (updatedUser.getAddress() != null) {
            existingUser.setAddress(updatedUser.getAddress());
        }

        if (updatedUser.getGender() != null) {
            existingUser.setGender(updatedUser.getGender());
        }

        User savedUser = userRepository.save(existingUser);

        logger.info("User partially updated successfully with ID: {}", id);

        return convertToDTO(savedUser);
    }

    // DELETE
    public void deleteUser(Long id) {

        logger.info("Deleting user with ID: {}", id);

        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "User not found with ID: " + id
            );
        }

        userRepository.deleteById(id);

        logger.info("User deleted successfully with ID: {}", id);
    }

    // ENTITY -> DTO
    private UserDTO convertToDTO(User user) {

        UserDTO dto = new UserDTO();

        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setMobile(user.getMobile());
        dto.setAddress(user.getAddress());
        dto.setGender(user.getGender());
        dto.setRole(user.getRole());

        return dto;
    }
}