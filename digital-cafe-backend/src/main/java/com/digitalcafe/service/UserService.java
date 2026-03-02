package com.digitalcafe.service;

import com.digitalcafe.dto.request.CreateStaffRequest;
import com.digitalcafe.dto.request.CreateUserRequest;
import com.digitalcafe.dto.response.UserResponse;
import com.digitalcafe.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {
    UserResponse createCafeOwner(CreateUserRequest request);
    UserResponse createStaffByOwner(CreateStaffRequest request);
    UserResponse getUserById(Long id);
    UserResponse updateUser(Long id, CreateUserRequest request);
    void activateUser(Long id);
    void deactivateUser(Long id);
    Page<UserResponse> getAllUsers(Pageable pageable);
    List<UserResponse> getUsersByRole(String roleName);
    Page<UserResponse> getUsersByCafe(Long cafeId, Pageable pageable);
    void deleteUser(Long id);
    User createStaffByOwner(Long cafeId, CreateStaffRequest request);
    UserResponse toggleUserStatus(Long id, boolean isActive);
    List<UserResponse> getStaffByCafeId(Long cafeId);
    List<UserResponse> getChefsByCafeId(Long cafeId);
    List<UserResponse> getWaitersByCafeId(Long cafeId);
    List<UserResponse> getPendingApprovalUsers();
    void approveUser(Long userId);
    void rejectUser(Long userId);
    UserResponse getCurrentUser();
    UserResponse updateStaffByOwner(Long staffId, CreateStaffRequest request);
}
