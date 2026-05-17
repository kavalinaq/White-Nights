package com.whitenights.bookshelf.api;

import com.whitenights.auth.domain.User;
import com.whitenights.bookshelf.api.dto.AddBookRequest;
import com.whitenights.bookshelf.api.dto.BookResponse;
import com.whitenights.bookshelf.api.dto.MoveBookRequest;
import com.whitenights.bookshelf.api.dto.ReorderShelfRequest;
import com.whitenights.bookshelf.api.dto.ShelfResponse;
import com.whitenights.bookshelf.service.BookshelfService;
import com.whitenights.common.security.CurrentUserResolver;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class BookshelfController {

    private final BookshelfService bookshelfService;
  private final CurrentUserResolver currentUserResolver;

    @GetMapping("/api/users/{userId}/shelves")
    public List<ShelfResponse> getShelves(
            @PathVariable Long userId,
            @AuthenticationPrincipal String email) {
      User viewer = email != null ? currentUserResolver.resolve(email) : null;
        return bookshelfService.getShelves(userId, viewer);
    }

    @PostMapping("/api/shelves/{shelfId}/books")
    @ResponseStatus(HttpStatus.CREATED)
    public BookResponse addBook(
            @PathVariable Long shelfId,
            @RequestBody @Valid AddBookRequest request,
            @AuthenticationPrincipal String email) {
      return bookshelfService.addBook(shelfId, request, currentUserResolver.resolve(email));
    }

    @DeleteMapping("/api/books/{bookId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBook(
            @PathVariable Long bookId,
            @AuthenticationPrincipal String email) {
      bookshelfService.deleteBook(bookId, currentUserResolver.resolve(email));
    }

    @PostMapping("/api/books/{bookId}/move")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void moveBook(
            @PathVariable Long bookId,
            @RequestBody @Valid MoveBookRequest request,
            @AuthenticationPrincipal String email) {
      bookshelfService.moveBook(bookId, request.toShelfId(), request.position(), currentUserResolver.resolve(email));
    }

    @PostMapping("/api/shelves/{shelfId}/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorderShelf(
            @PathVariable Long shelfId,
            @RequestBody @Valid ReorderShelfRequest request,
            @AuthenticationPrincipal String email) {
      bookshelfService.reorderShelf(shelfId, request.bookIds(), currentUserResolver.resolve(email));
    }

}
