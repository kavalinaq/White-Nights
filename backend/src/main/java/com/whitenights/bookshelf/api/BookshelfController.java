package com.whitenights.bookshelf.api;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.bookshelf.api.dto.AddBookRequest;
import com.whitenights.bookshelf.api.dto.BookResponse;
import com.whitenights.bookshelf.api.dto.MoveBookRequest;
import com.whitenights.bookshelf.api.dto.ReorderShelfRequest;
import com.whitenights.bookshelf.api.dto.ShelfResponse;
import com.whitenights.bookshelf.service.BookshelfService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class BookshelfController {

    private final BookshelfService bookshelfService;
    private final UserRepository userRepository;

    @GetMapping("/api/users/{userId}/shelves")
    public List<ShelfResponse> getShelves(
            @PathVariable Long userId,
            @AuthenticationPrincipal String email) {
        User viewer = email != null ? resolveUser(email) : null;
        return bookshelfService.getShelves(userId, viewer);
    }

    @PostMapping("/api/shelves/{shelfId}/books")
    @ResponseStatus(HttpStatus.CREATED)
    public BookResponse addBook(
            @PathVariable Long shelfId,
            @RequestBody @Valid AddBookRequest request,
            @AuthenticationPrincipal String email) {
        return bookshelfService.addBook(shelfId, request, resolveUser(email));
    }

    @DeleteMapping("/api/books/{bookId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBook(
            @PathVariable Long bookId,
            @AuthenticationPrincipal String email) {
        bookshelfService.deleteBook(bookId, resolveUser(email));
    }

    @PostMapping("/api/books/{bookId}/move")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void moveBook(
            @PathVariable Long bookId,
            @RequestBody @Valid MoveBookRequest request,
            @AuthenticationPrincipal String email) {
        bookshelfService.moveBook(bookId, request.toShelfId(), request.position(), resolveUser(email));
    }

    @PostMapping("/api/shelves/{shelfId}/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorderShelf(
            @PathVariable Long shelfId,
            @RequestBody @Valid ReorderShelfRequest request,
            @AuthenticationPrincipal String email) {
        bookshelfService.reorderShelf(shelfId, request.bookIds(), resolveUser(email));
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
