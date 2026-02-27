package com.digitalcafe.dto.response;

import com.digitalcafe.entity.User;
import com.digitalcafe.entity.UserPreference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProfileResponseDTO {
    private String firstName;
    private String lastName;
    private String displayName;
    private String email;
    private String role;
    private String profileImageUrl;
    private User.AccountStatus accountStatus;
    private Boolean emailVerified;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private PreferencesDTO preferences;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PreferencesDTO {
        private UserPreference.Theme theme;
        private Integer autoRefreshSeconds;
        private Boolean adminNotificationsEnabled;
    }
}
