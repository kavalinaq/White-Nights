# 01. Auth

**Priority:** P0
**Complexity:** M (3–5d)
**Depends on:** —
**Related tables:** `users`
**Related screens:** docx §3.2.1 (login + register)

## Goal

Allow a new visitor to create an account with email + nickname, verify their email, log in, and obtain an access token for all subsequent API calls. Auth is the foundation every other feature depends on.

## User stories

- As a visitor, I can register with a unique nickname and email and receive a verification email.
- As a visitor, I can confirm my email by clicking the link, which activates the account.
- As a registered user, I can log in with email + password and receive a JWT.
- As a registered user, I can log out (token invalidated client-side; refresh token revoked server-side).
- As a registered user, I can request a password reset by email.

## Functional requirements

- Nickname: unique, 3–50 chars.
- Email: unique, valid format; verification required before first login.
- Password: ≥ 8 chars; stored as bcrypt/argon2 hash in `users.password_hash`.
- Token: short-lived JWT access (15 min) + refresh token in httpOnly cookie (14 days).
- Verification email and reset email contain single-use, time-bound tokens (24 h).
- Rate-limit login and password-reset requests per IP + per account.

## API surface (sketch)

- `POST /api/auth/register` — body: `{ nickname, email, password }`; sends verification email.
- `POST /api/auth/verify` — body: `{ token }`; activates account.
- `POST /api/auth/login` — body: `{ email, password }`; returns access token, sets refresh cookie.
- `POST /api/auth/refresh` — reads refresh cookie, returns new access token.
- `POST /api/auth/logout` — revokes refresh token.
- `POST /api/auth/password/reset-request` — body: `{ email }`.
- `POST /api/auth/password/reset` — body: `{ token, newPassword }`.

## Out of scope (v1)

- OAuth / social login.
- 2FA.
- Device/session listing.

## Acceptance criteria

- [ ] Register + verify + login flow works end-to-end in a browser.
- [ ] Duplicate email or nickname returns 409.
- [ ] Unverified account cannot log in.
- [ ] JWT is validated by a backend filter; expired/invalid tokens return 401.
- [ ] Password reset loop works end-to-end.
- [ ] Passwords are never logged and never returned in any response.
