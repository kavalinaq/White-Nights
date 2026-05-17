package com.whitenights.common.security;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.common.exception.types.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUserResolver {

  private final UserRepository userRepository;

  public User resolve(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new NotFoundException("User not found"));
  }
}
