package com.digitalcafe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AcademicInfoRequest {

    @NotBlank(message = "Institution name is required")
    private String institutionName;

    @NotBlank(message = "Degree is required")
    private String degree;

    @NotNull(message = "Passing year is required")
    private Integer passingYear;

    @NotBlank(message = "Grade is required")
    private String grade;

    @NotNull(message = "Grade percentage is required")
    private Double gradeInPercentage;
}
