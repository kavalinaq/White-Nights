package com.whitenights.bookshelf.repository;

import com.whitenights.auth.domain.User;
import com.whitenights.bookshelf.domain.Book;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {

    Optional<Book> findByBookIdAndUser(Long bookId, User user);
}
