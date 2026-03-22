package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationImportResponse {
    private Integer totalRows;
    private Integer inserted;
    private Integer skipped;
    private List<String> errors;
}
