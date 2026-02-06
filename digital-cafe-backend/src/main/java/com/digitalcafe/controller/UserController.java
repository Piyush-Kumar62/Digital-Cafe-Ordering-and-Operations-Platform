package com.digitalcafe.controller;

import com.digitalcafe.dto.UserDTO;
import com.digitalcafe.dto.UserRequestDTO;
import com.digitalcafe.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserDTO> getUserByEmail(@PathVariable String email) {
        UserDTO user = userService.getUserByEmail(email);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable String role) {
        List<UserDTO> users = userService.getUsersByRole(role);
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserRequestDTO userRequestDTO) {
        UserDTO createdUser = userService.createUser(userRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserRequestDTO userRequestDTO) {
        UserDTO updatedUser = userService.updateUser(id, userRequestDTO);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<UserDTO> deactivateUser(@PathVariable Long id) {
        UserDTO deactivatedUser = userService.deactivateUser(id);
        return ResponseEntity.ok(deactivatedUser);
    }

    /**
     * Admin creates Café Owner account
     * POST /api/users/create-cafe-owner
     */
    @PostMapping("/create-cafe-owner")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.digitalcafe.dto.StaffCreationResponse> createCafeOwner(
            @Valid @RequestBody com.digitalcafe.dto.CreateStaffRequest request,
            @RequestHeader("Authorization") String authHeader) {
        com.digitalcafe.dto.StaffCreationResponse createdOwner = userService.createCafeOwner(request, authHeader);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOwner);
    }

    /**
     * Café Owner creates Chef account
     * POST /api/users/create-chef
     */
    @PostMapping("/create-chef")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<com.digitalcafe.dto.StaffCreationResponse> createChef(
            @Valid @RequestBody com.digitalcafe.dto.CreateStaffRequest request,
            @RequestHeader("Authorization") String authHeader) {
        com.digitalcafe.dto.StaffCreationResponse createdChef = userService.createChef(request, authHeader);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdChef);
    }

    /**
     * Café Owner creates Waiter account
     * POST /api/users/create-waiter
     */
    @PostMapping("/create-waiter")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<com.digitalcafe.dto.StaffCreationResponse> createWaiter(
            @Valid @RequestBody com.digitalcafe.dto.CreateStaffRequest request,
            @RequestHeader("Authorization") String authHeader) {
        com.digitalcafe.dto.StaffCreationResponse createdWaiter = userService.createWaiter(request, authHeader);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdWaiter);
    }
}
