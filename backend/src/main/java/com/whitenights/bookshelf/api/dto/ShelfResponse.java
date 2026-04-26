package com.whitenights.bookshelf.api.dto;

import java.util.List;

public record ShelfResponse(Long shelfId, String name, int position, List<BookResponse> books) {}
