package com.munhub.backend.dto;

import jakarta.validation.constraints.NotNull;

public record IncrementCounterRequest(@NotNull CounterField field, @NotNull Integer delta) {}
