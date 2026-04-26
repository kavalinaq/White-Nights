package com.whitenights.admin.api.dto;

import com.whitenights.auth.domain.UserRole;
import jakarta.validation.constraints.NotNull;

public record ChangeRoleRequest(@NotNull UserRole role) {}
