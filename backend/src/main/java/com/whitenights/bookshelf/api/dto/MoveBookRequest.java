package com.whitenights.bookshelf.api.dto;

import jakarta.validation.constraints.NotNull;

public record MoveBookRequest(@NotNull Long toShelfId, Integer position) {}
