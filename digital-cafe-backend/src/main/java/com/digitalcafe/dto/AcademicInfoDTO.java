package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AcademicInfoDTO {
    private Long id;
    private String degree;
    private String institution;
    private Integer yearOfPassing;
    private Double percentage;
}
