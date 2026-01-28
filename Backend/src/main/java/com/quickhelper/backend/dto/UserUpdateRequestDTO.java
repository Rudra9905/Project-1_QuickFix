package com.quickhelper.backend.dto;

import lombok.Data;

@Data
public class UserUpdateRequestDTO {
    private String name;
    private String phone;
    private String city;
}
