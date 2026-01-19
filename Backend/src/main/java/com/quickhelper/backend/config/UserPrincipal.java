package com.quickhelper.backend.config;

import java.security.Principal;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class UserPrincipal implements Principal {
    private String name;
}
