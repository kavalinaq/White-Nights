package com.whitenights.support.api;

import com.whitenights.common.security.CurrentUserResolver;
import com.whitenights.support.api.dto.SubmitSupportRequest;
import com.whitenights.support.api.dto.SupportMessageResponse;
import com.whitenights.support.api.dto.SupportReplyRequest;
import com.whitenights.support.service.SupportService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SupportController {

  private final SupportService supportService;
  private final CurrentUserResolver currentUserResolver;

  @PostMapping("/api/support/messages")
  @ResponseStatus(HttpStatus.CREATED)
  public SupportMessageResponse submit(
      @RequestBody @Valid SubmitSupportRequest request,
      @AuthenticationPrincipal String email) {
    return supportService.submit(currentUserResolver.resolve(email), request.subject(), request.message());
  }

  @GetMapping("/api/support/messages/me")
  public List<SupportMessageResponse> myMessages(@AuthenticationPrincipal String email) {
    return supportService.myMessages(currentUserResolver.resolve(email));
  }

  @GetMapping("/api/admin/support/messages")
  public List<SupportMessageResponse> listAll(
      @RequestParam(defaultValue = "50") int limit,
      @AuthenticationPrincipal String email) {
    return supportService.listAll(currentUserResolver.resolve(email), limit);
  }

  @PostMapping("/api/admin/support/messages/{id}/reply")
  public SupportMessageResponse reply(
      @PathVariable Long id,
      @RequestBody @Valid SupportReplyRequest request,
      @AuthenticationPrincipal String email) {
    return supportService.reply(id, request.response(), currentUserResolver.resolve(email));
  }

}
