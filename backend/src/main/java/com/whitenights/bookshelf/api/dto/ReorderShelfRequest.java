package com.whitenights.bookshelf.api.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ReorderShelfRequest(@NotNull List<Long> bookIds) {}
