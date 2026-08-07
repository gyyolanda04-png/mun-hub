package com.munhub.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCommitteeRequest(@NotBlank String name) {}
