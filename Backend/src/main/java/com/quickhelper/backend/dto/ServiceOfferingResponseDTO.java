package com.quickhelper.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceOfferingResponseDTO {
    private Long id;
    private Long providerId;
    private String name;
    private String description;
    private Integer price;
    private String unit;
    private Boolean active;
}





