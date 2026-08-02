package com.munhub.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record AddAttendanceSessionRequest(@NotBlank String session) {}
