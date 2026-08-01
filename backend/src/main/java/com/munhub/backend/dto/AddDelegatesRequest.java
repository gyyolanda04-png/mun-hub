package com.munhub.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AddDelegatesRequest(@NotEmpty @Valid List<DelegateInput> delegates) {}
