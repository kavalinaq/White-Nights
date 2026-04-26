package com.whitenights.bookshelf.service;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.bookshelf.api.dto.AddBookRequest;
import com.whitenights.bookshelf.api.dto.BookResponse;
import com.whitenights.bookshelf.api.dto.ShelfResponse;
import com.whitenights.bookshelf.domain.Book;
import com.whitenights.bookshelf.domain.BooksOnShelf;
import com.whitenights.bookshelf.domain.Shelf;
import com.whitenights.bookshelf.repository.BookRepository;
import com.whitenights.bookshelf.repository.BooksOnShelfRepository;
import com.whitenights.bookshelf.repository.ShelfRepository;
import com.whitenights.common.exception.types.UnauthorizedException;
import com.whitenights.user.domain.FollowStatus;
import com.whitenights.user.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookshelfService {

    private static final List<String> DEFAULT_SHELF_NAMES = List.of("Want to Read", "Reading", "Read");

    private final ShelfRepository shelfRepository;
    private final BookRepository bookRepository;
    private final BooksOnShelfRepository booksOnShelfRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;

    @Transactional
    public void bootstrapShelves(User user) {
        for (int i = 0; i < DEFAULT_SHELF_NAMES.size(); i++) {
            shelfRepository.save(Shelf.builder()
                    .user(user)
                    .name(DEFAULT_SHELF_NAMES.get(i))
                    .position(i)
                    .build());
        }
    }

    public List<ShelfResponse> getShelves(Long userId, User viewer) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        checkReadAccess(owner, viewer);

        List<Shelf> shelves = shelfRepository.findByUserOrderByPosition(owner);
        return shelves.stream().map(this::toShelfResponse).toList();
    }

    @Transactional
    public BookResponse addBook(Long shelfId, AddBookRequest request, User user) {
        Shelf shelf = shelfRepository.findByShelfIdAndUser(shelfId, user)
                .orElseThrow(() -> new RuntimeException("Shelf not found"));

        Book book = bookRepository.save(Book.builder()
                .user(user)
                .title(request.title())
                .author(request.author())
                .build());

        int nextPosition = booksOnShelfRepository.findMaxPosition(shelfId) + 1;
        booksOnShelfRepository.save(BooksOnShelf.builder()
                .id(new BooksOnShelf.ShelfBookId(shelfId, book.getBookId()))
                .shelf(shelf)
                .book(book)
                .position(nextPosition)
                .build());

        return toBookResponse(book);
    }

    @Transactional
    public void deleteBook(Long bookId, User user) {
        Book book = bookRepository.findByBookIdAndUser(bookId, user)
                .orElseThrow(() -> new RuntimeException("Book not found"));
        bookRepository.delete(book);
    }

    @Transactional
    public void moveBook(Long bookId, Long toShelfId, Integer position, User user) {
        bookRepository.findByBookIdAndUser(bookId, user)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        Shelf targetShelf = shelfRepository.findByShelfIdAndUser(toShelfId, user)
                .orElseThrow(() -> new RuntimeException("Shelf not found"));

        BooksOnShelf existing = booksOnShelfRepository.findByBook_BookId(bookId)
                .orElseThrow(() -> new RuntimeException("Book is not on any shelf"));

        booksOnShelfRepository.delete(existing);
        booksOnShelfRepository.flush();

        int targetPosition = position != null ? position : booksOnShelfRepository.findMaxPosition(toShelfId) + 1;

        Book book = existing.getBook();
        booksOnShelfRepository.save(BooksOnShelf.builder()
                .id(new BooksOnShelf.ShelfBookId(toShelfId, bookId))
                .shelf(targetShelf)
                .book(book)
                .position(targetPosition)
                .build());
    }

    @Transactional
    public void reorderShelf(Long shelfId, List<Long> bookIds, User user) {
        shelfRepository.findByShelfIdAndUser(shelfId, user)
                .orElseThrow(() -> new RuntimeException("Shelf not found"));

        List<BooksOnShelf> entries = booksOnShelfRepository.findByShelf_ShelfIdOrderByPosition(shelfId);

        for (BooksOnShelf entry : entries) {
            int newPosition = bookIds.indexOf(entry.getBook().getBookId());
            if (newPosition >= 0) {
                entry.setPosition(newPosition);
            }
        }
        booksOnShelfRepository.saveAll(entries);
    }

    private ShelfResponse toShelfResponse(Shelf shelf) {
        List<BookResponse> books = booksOnShelfRepository
                .findByShelf_ShelfIdOrderByPosition(shelf.getShelfId())
                .stream()
                .map(b -> toBookResponse(b.getBook()))
                .toList();
        return new ShelfResponse(shelf.getShelfId(), shelf.getName(), shelf.getPosition(), books);
    }

    private BookResponse toBookResponse(Book book) {
        return new BookResponse(book.getBookId(), book.getTitle(), book.getAuthor());
    }

    private void checkReadAccess(User owner, User viewer) {
        if (!owner.isPrivate()) return;
        boolean isSelf = viewer != null && viewer.getUserId().equals(owner.getUserId());
        if (isSelf) return;
        boolean follows = viewer != null && followRepository
                .existsByFollowerAndFolloweeAndStatus(viewer, owner, FollowStatus.accepted);
        if (!follows) {
            throw new UnauthorizedException("Profile is private");
        }
    }
}
