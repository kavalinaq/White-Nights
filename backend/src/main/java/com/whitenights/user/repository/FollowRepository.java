package com.whitenights.user.repository;

import com.whitenights.auth.domain.User;
import com.whitenights.user.domain.Follow;
import com.whitenights.user.domain.FollowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Follow.FollowId> {
    long countByFolloweeAndStatus(User followee, FollowStatus status);
    long countByFollowerAndStatus(User follower, FollowStatus status);
    
    Optional<Follow> findByFollowerAndFollowee(User follower, User followee);
    boolean existsByFollowerAndFolloweeAndStatus(User follower, User followee, FollowStatus status);

    List<Follow> findByFolloweeAndStatus(User followee, FollowStatus status, Pageable pageable);
    List<Follow> findByFollowerAndStatus(User follower, FollowStatus status, Pageable pageable);
}
