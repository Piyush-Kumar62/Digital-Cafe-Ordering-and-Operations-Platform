package com.digitalcafe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkExperienceRequest {

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate; // null if currently working

    @NotNull(message = "Currently working status is required")
    private Boolean currentlyWorking;

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Designation is required")
    private String designation;

    private CtcRequest ctc;

    private String reasonForLeaving; // null if currently working
}
