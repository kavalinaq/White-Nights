package com.whitenights.user.service;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.user.domain.Follow;
import com.whitenights.user.domain.FollowStatus;
import com.whitenights.user.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    @Transactional
    public void follow(Long targetUserId, User currentUser) {
        if (currentUser.getUserId().equals(targetUserId)) {
            throw new RuntimeException("You cannot follow yourself");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (followRepository.existsById(new Follow.FollowId(currentUser.getUserId(), targetUserId))) {
            return; // Already following or pending
        }

        FollowStatus status = targetUser.isPrivate() ? FollowStatus.pending : FollowStatus.accepted;

        Follow follow = Follow.builder()
                .id(new Follow.FollowId(currentUser.getUserId(), targetUserId))
                .follower(currentUser)
                .followee(targetUser)
                .status(status)
                .build();

        followRepository.save(follow);
    }

    @Transactional
    public void unfollow(Long targetUserId, User currentUser) {
        followRepository.deleteById(new Follow.FollowId(currentUser.getUserId(), targetUserId));
    }

    @Transactional
    public void acceptRequest(Long followerId, User currentUser) {
        Follow follow = followRepository.findById(new Follow.FollowId(followerId, currentUser.getUserId()))
                .orElseThrow(() -> new RuntimeException("Follow request not found"));

        if (follow.getStatus() != FollowStatus.pending) {
            return;
        }

        follow.setStatus(FollowStatus.accepted);
        followRepository.save(follow);
    }

    @Transactional
    public void rejectRequest(Long followerId, User currentUser) {
        followRepository.deleteById(new Follow.FollowId(followerId, currentUser.getUserId()));
    }
}
