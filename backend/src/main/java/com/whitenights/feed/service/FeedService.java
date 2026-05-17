package com.whitenights.feed.service;

import com.whitenights.auth.domain.User;
import com.whitenights.post.domain.Post;
import com.whitenights.post.repository.PostRepository;
import com.whitenights.user.domain.FollowStatus;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final PostRepository postRepository;

  @Transactional(readOnly = true)
    public List<Post> getFeed(User viewer, Long cursor, int limit) {
        return postRepository.findFeedPosts(
                viewer,
                FollowStatus.accepted,
                cursor,
                PageRequest.of(0, Math.min(limit, 50))
        );
    }
}
