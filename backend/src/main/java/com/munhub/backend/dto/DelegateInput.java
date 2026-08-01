package com.munhub.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

/** A delegate to add, mirroring Omit<Delegate, "id" | "speeches" | "amendments" | "pois">. */
public record DelegateInput(
    @NotBlank String delegation,
    @NotBlank String name,
    String school,
    String email,
    Map<String, Boolean> attendance) {}
