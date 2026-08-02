package com.munhub.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record AddMemberRequest(@NotBlank String username) {}
