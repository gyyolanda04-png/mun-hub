package com.munhub.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Size(min = 2, max = 32) String username,
    @NotBlank @Size(min = 4, max = 100) String password) {}
