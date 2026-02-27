package com.digitalcafe.dto.request;

import com.digitalcafe.entity.UserPreference;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminProfileUpdateDTO {

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must be at most 100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must be at most 100 characters")
    private String lastName;

    @NotBlank(message = "Display name is required")
    @Size(max = 150, message = "Display name must be at most 150 characters")
    private String displayName;

    @NotNull(message = "Theme is required")
    private UserPreference.Theme theme;

    @NotNull(message = "Auto refresh seconds is required")
    @Min(value = 5, message = "Auto refresh seconds must be at least 5")
    @Max(value = 120, message = "Auto refresh seconds must be at most 120")
    private Integer autoRefreshSeconds;

    @NotNull(message = "Admin notifications preference is required")
    private Boolean adminNotificationsEnabled;
}
