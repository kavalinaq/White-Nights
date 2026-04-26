package com.whitenights.bookshelf.domain;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "books_on_shelves")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BooksOnShelf {

    @EmbeddedId
    private ShelfBookId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("shelfId")
    @JoinColumn(name = "shelf_id")
    private Shelf shelf;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("bookId")
    @JoinColumn(name = "book_id")
    private Book book;

    @Column(nullable = false)
    private int position;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class ShelfBookId implements Serializable {
        private Long shelfId;
        private Long bookId;
    }
}
