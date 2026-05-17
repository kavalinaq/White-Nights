package com.whitenights.moderation;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.whitenights.AbstractIT;
import com.whitenights.auth.domain.User;
import com.whitenights.auth.domain.UserRole;
import com.whitenights.moderation.api.dto.CreateReportRequest;
import com.whitenights.moderation.domain.ReportTargetType;
import com.whitenights.post.domain.Comment;
import com.whitenights.post.domain.Post;
import com.whitenights.post.repository.CommentRepository;
import com.whitenights.post.repository.PostRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class ModerationEnrichmentIT extends AbstractIT {

  @Autowired
  private PostRepository postRepository;
  @Autowired
  private CommentRepository commentRepository;

  @Test
  void queueEntriesIncludeReporterAndTargetDetailsByType() throws Exception {
    String reporterToken = registerAndLogin("reporter@example.com", "password123", "reporter");
    String modToken = registerAndLogin("mod@example.com", "password123", "mod", UserRole.moderator);
    registerAndLogin("offender@example.com", "password123", "offender");

    User offender = userRepository.findByNickname("offender").orElseThrow();
    Post post = postRepository.save(Post.builder()
        .user(offender)
        .title("War and Peace")
        .author("Tolstoy")
        .description("Long.")
        .build());
    Comment comment = commentRepository.save(Comment.builder()
        .post(post)
        .user(offender)
        .text("Inflammatory text")
        .build());

    report(reporterToken, ReportTargetType.user, offender.getUserId(), "Harassing other users.");
    report(reporterToken, ReportTargetType.post, post.getPostId(), "Spam and irrelevant.");
    report(reporterToken, ReportTargetType.comment, comment.getCommentId(), "Hate speech in comment.");

    mockMvc.perform(get("/api/moderation/reports")
            .header("Authorization", "Bearer " + modToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(3))
        .andExpect(jsonPath("$[?(@.targetType=='user')].reporterNickname").value("reporter"))
        .andExpect(jsonPath("$[?(@.targetType=='user')].targetUserNickname").value("offender"))
        .andExpect(jsonPath("$[?(@.targetType=='post')].targetPostTitle").value("War and Peace"))
        .andExpect(jsonPath("$[?(@.targetType=='comment')].targetCommentText").value("Inflammatory text"))
        .andExpect(jsonPath("$[?(@.targetType=='comment')].targetCommentPostId").value(post.getPostId().intValue()));
  }

  private void report(String token, ReportTargetType type, Long targetId, String reason) throws Exception {
    mockMvc.perform(post("/api/reports")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                new CreateReportRequest(type, targetId, reason))))
        .andExpect(status().isCreated());
  }
}
