package com.digitalcafe.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CtcRequest {

    private Double amount;
    private String currency; // LPA, CTC, etc.
}
