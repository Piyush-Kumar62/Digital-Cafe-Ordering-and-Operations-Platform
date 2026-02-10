package com.digitalcafe.mapper;

import com.digitalcafe.dto.response.UserResponse;
import com.digitalcafe.dto.UserDTO;
import com.digitalcafe.dto.UserRequestDTO;
import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import org.mapstruct.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * MapStruct mapper for User entity and DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    @Mapping(target = "roles", expression = "java(mapRolesToStrings(user.getRoles()))")
    @Mapping(target = "cafeId", source = "cafe.id")
    @Mapping(target = "cafeName", source = "cafe.name")
    UserResponse toResponse(User user);

    List<UserResponse> toResponseList(List<User> users);

    // Legacy methods for backward compatibility
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "cafe", ignore = true)
    @Mapping(target = "password", ignore = true)
    User toEntity(UserRequestDTO dto);

    @Mapping(target = "role", expression = "java(getPrimaryRole(user.getRoles()))")
    @Mapping(target = "active", source = "isActive")
    @Mapping(target = "emailVerified", source = "isEmailVerified")
    @Mapping(target = "profileCompleted", source = "isProfileComplete")
    UserDTO toDTO(User user);

    default List<String> mapRolesToStrings(java.util.Set<Role> roles) {
        if (roles == null) {
            return List.of();
        }
        return roles.stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());
    }

    default String getPrimaryRole(java.util.Set<Role> roles) {
        if (roles == null || roles.isEmpty()) {
            return null;
        }
        return roles.iterator().next().getName().name();
    }

    default String[] mapRolesToStringArray(java.util.Set<Role> roles) {
        if (roles == null) {
            return new String[0];
        }
        return roles.stream()
                .map(role -> role.getName().name())
                .toArray(String[]::new);
    }
}
