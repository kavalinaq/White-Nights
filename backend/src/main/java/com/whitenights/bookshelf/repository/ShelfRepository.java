package com.whitenights.bookshelf.repository;

import com.whitenights.auth.domain.User;
import com.whitenights.bookshelf.domain.Shelf;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShelfRepository extends JpaRepository<Shelf, Long> {

    List<Shelf> findByUserOrderByPosition(User user);

    Optional<Shelf> findByShelfIdAndUser(Long shelfId, User user);
}
