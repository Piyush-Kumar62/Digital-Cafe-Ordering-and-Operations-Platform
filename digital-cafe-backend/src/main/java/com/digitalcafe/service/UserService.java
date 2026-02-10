package com.digitalcafe.service;

import com.digitalcafe.dto.request.CreateStaffRequest;
import com.digitalcafe.dto.request.CreateUserRequest;
import com.digitalcafe.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {
    UserResponse createCafeOwner(CreateUserRequest request);
    UserResponse createChef(Long cafeId, CreateUserRequest request);
    UserResponse createWaiter(Long cafeId, CreateUserRequest request);
    UserResponse createStaff(CreateStaffRequest request, String roleName);
    UserResponse getUserById(Long id);
    UserResponse updateUser(Long id, CreateUserRequest request);
    void activateUser(Long id);
    void deactivateUser(Long id);
    UserResponse toggleUserStatus(Long id, boolean isActive);
    Page<UserResponse> getAllUsers(Pageable pageable);
    List<UserResponse> getUsersByRole(String roleName);
    Page<UserResponse> getUsersByCafe(Long cafeId, Pageable pageable);
    List<UserResponse> getStaffByCafeId(Long cafeId);
    List<UserResponse> getChefsByCafeId(Long cafeId);
    List<UserResponse> getWaitersByCafeId(Long cafeId);
    void deleteUser(Long id);
    UserResponse getCurrentUser();
}



