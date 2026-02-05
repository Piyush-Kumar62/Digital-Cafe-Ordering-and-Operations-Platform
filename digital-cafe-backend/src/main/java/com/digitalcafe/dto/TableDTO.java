package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableDTO {
    private Long id;
    private Long cafeId;
    private String cafeName;
    private String tableNumber;
    private Integer capacity;
    private String location;
    private Boolean available;
}
