package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class EducationResponse {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstitutionResponse {
        private Long id;
        private String name;
        private String city;
        private String state;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DegreeResponse {
        private Long id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BranchResponse {
        private Long id;
        private String name;
        private Long degreeId;
        private String degreeName;
    }
}
