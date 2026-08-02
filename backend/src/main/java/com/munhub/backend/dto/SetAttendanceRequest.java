package com.munhub.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SetAttendanceRequest(@NotBlank String session, @NotNull Boolean present) {}
