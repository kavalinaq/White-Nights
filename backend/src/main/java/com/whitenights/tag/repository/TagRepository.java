package com.whitenights.tag.repository;

import com.whitenights.tag.domain.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findByNameIgnoreCase(String name);

    @Query("SELECT t FROM Tag t WHERE LOWER(t.name) LIKE LOWER(CONCAT(:prefix, '%')) ORDER BY t.name")
    List<Tag> searchByPrefix(@Param("prefix") String prefix, org.springframework.data.domain.Pageable pageable);

    @Query(value = """
            SELECT t.tag_id, t.name
            FROM tags t
            JOIN post_and_tag pt ON pt.tag_id = t.tag_id
            JOIN posts p ON p.post_id = pt.post_id
            WHERE p.user_id = :userId
            ORDER BY p.created_at DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Tag> findRecentByUser(@Param("userId") Long userId, @Param("limit") int limit);

    @Query(value = """
            SELECT t.tag_id, t.name
            FROM tags t
            JOIN post_and_tag pt ON pt.tag_id = t.tag_id
            GROUP BY t.tag_id, t.name
            ORDER BY COUNT(*) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Tag> findGlobalPopular(@Param("limit") int limit);
}
