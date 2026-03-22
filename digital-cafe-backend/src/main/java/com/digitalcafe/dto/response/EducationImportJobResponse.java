package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationImportJobResponse {
    private Long id;
    private String importType;
    private String status;
    private String fileName;
    private Integer totalRows;
    private Integer insertedRows;
    private Integer skippedRows;
    private String errorMessage;
    private List<String> errors;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
}
