package com.whitenights.auth.service;

import com.whitenights.auth.api.dto.AuthResponse;
import com.whitenights.auth.api.dto.RegisterRequest;
import com.whitenights.auth.api.dto.ResetPassword;
import com.whitenights.auth.domain.User;
import com.whitenights.auth.domain.VerificationToken;
import com.whitenights.auth.domain.PasswordResetToken;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.auth.repository.VerificationTokenRepository;
import com.whitenights.auth.repository.RefreshTokenRepository;
import com.whitenights.auth.repository.PasswordResetTokenRepository;
import com.whitenights.bookshelf.service.BookshelfService;
import com.whitenights.common.email.EmailService;
import com.whitenights.common.exception.types.ConflictException;
import com.whitenights.common.exception.types.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final BookshelfService bookshelfService;

    @org.springframework.beans.factory.annotation.Value("${auth.jwt.refresh-expiration-ms}")
    private long refreshExpiration;

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already exists");
        }
        if (userRepository.existsByNickname(request.nickname())) {
            throw new ConflictException("Nickname already exists");
        }

        User user = User.builder()
                .nickname(request.nickname())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .isVerified(false)
                .build();

        userRepository.save(user);
        bookshelfService.bootstrapShelves(user);

        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        tokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user.getEmail(), token);
    }

    @Transactional
    public void verify(String token) {
        VerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (verificationToken.isExpired()) {
            throw new RuntimeException("Token expired");
        }

        User user = verificationToken.getUser();
        user.setVerified(true);
        userRepository.save(user);
        tokenRepository.delete(verificationToken);
    }

    @Transactional
    public AuthResponse login(com.whitenights.auth.api.dto.LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.isVerified()) {
            throw new UnauthorizedException("Account not verified");
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = UUID.randomUUID().toString();

        com.whitenights.auth.domain.RefreshToken refreshToken = com.whitenights.auth.domain.RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusNanos(refreshExpiration * 1_000_000))
                .build();
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                refreshTokenValue,
                new AuthResponse.UserDto(
                        user.getUserId(),
                        user.getNickname(),
                        user.getEmail(),
                        user.getRole()
                )
        );
    }

    @Transactional
    public AuthResponse refresh(String token) {
        com.whitenights.auth.domain.RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new UnauthorizedException("Refresh token expired");
        }

        User user = refreshToken.getUser();
        String accessToken = jwtService.generateAccessToken(user);

        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                new AuthResponse.UserDto(
                        user.getUserId(),
                        user.getNickname(),
                        user.getEmail(),
                        user.getRole()
                )
        );
    }

    @Transactional
    public void logout(String token) {
        refreshTokenRepository.deleteByToken(token);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        passwordResetTokenRepository.deleteByUser_UserId(user.getUserId());

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Transactional
    public void resetPassword(ResetPassword request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw new RuntimeException("Token expired");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);
        refreshTokenRepository.deleteByUser(user); // Revoke all sessions on password change
    }
}
