package com.whitenights.post.domain;

import com.whitenights.auth.domain.User;
import com.whitenights.tag.domain.Tag;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String imageUrl;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 120)
    private String author;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private boolean isBlocked = false;

    @ManyToMany
    @JoinTable(
            name = "post_and_tag",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @org.hibernate.annotations.Formula("(SELECT COUNT(*) FROM likes l WHERE l.post_id = post_id)")
    private long likeCount;

    @org.hibernate.annotations.Formula("(SELECT COUNT(*) FROM comments c WHERE c.post_id = post_id)")
    private long commentCount;

    @org.hibernate.annotations.Formula("(SELECT COUNT(*) FROM views v WHERE v.post_id = post_id)")
    private long viewCount;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
