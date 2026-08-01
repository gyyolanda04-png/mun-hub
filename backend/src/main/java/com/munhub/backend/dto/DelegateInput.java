package com.munhub.backend.dto;

import jakarta.validation.constraints.NotBlank;

/** A delegate to add, mirroring Omit<Delegate, "id" | "speeches" | "amendments" | "pois">. */
public record DelegateInput(
    @NotBlank String delegation, @NotBlank String name, String school, String email) {}
