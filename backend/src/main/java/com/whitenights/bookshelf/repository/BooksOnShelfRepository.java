package com.whitenights.bookshelf.repository;

import com.whitenights.bookshelf.domain.BooksOnShelf;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BooksOnShelfRepository extends JpaRepository<BooksOnShelf, BooksOnShelf.ShelfBookId> {

    List<BooksOnShelf> findByShelf_ShelfIdOrderByPosition(Long shelfId);

    Optional<BooksOnShelf> findByBook_BookId(Long bookId);

    @Query("SELECT COALESCE(MAX(b.position), -1) FROM BooksOnShelf b WHERE b.shelf.shelfId = :shelfId")
    int findMaxPosition(@Param("shelfId") Long shelfId);
}
