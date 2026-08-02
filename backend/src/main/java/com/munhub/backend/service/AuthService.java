package com.munhub.backend.service;

import com.munhub.backend.dto.AuthResponse;
import com.munhub.backend.exception.ConflictException;
import com.munhub.backend.exception.UnauthorizedException;
import com.munhub.backend.model.AuthToken;
import com.munhub.backend.model.User;
import com.munhub.backend.repository.AuthTokenRepository;
import com.munhub.backend.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

  private final UserRepository userRepository;
  private final AuthTokenRepository authTokenRepository;
  private final PasswordEncoder passwordEncoder;

  public AuthService(
      UserRepository userRepository,
      AuthTokenRepository authTokenRepository,
      PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.authTokenRepository = authTokenRepository;
    this.passwordEncoder = passwordEncoder;
  }

  public AuthResponse register(String username, String password) {
    String normalized = username.trim();
    if (userRepository.existsByUsernameIgnoreCase(normalized)) {
      throw new ConflictException("That username is already taken.");
    }
    User user = new User();
    user.setId(UUID.randomUUID().toString());
    user.setUsername(normalized);
    user.setPasswordHash(passwordEncoder.encode(password));
    user.setCreatedAt(System.currentTimeMillis());
    userRepository.save(user);
    return issueToken(user);
  }

  public AuthResponse login(String username, String password) {
    User user =
        userRepository
            .findByUsernameIgnoreCase(username.trim())
            .orElseThrow(() -> new UnauthorizedException("Invalid username or password."));
    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
      throw new UnauthorizedException("Invalid username or password.");
    }
    return issueToken(user);
  }

  public void logout(String token) {
    authTokenRepository.deleteById(token);
  }

  @Transactional(readOnly = true)
  public Optional<User> resolveToken(String token) {
    if (token == null || token.isBlank()) {
      return Optional.empty();
    }
    return authTokenRepository.findById(token).map(AuthToken::getUser);
  }

  private AuthResponse issueToken(User user) {
    AuthToken authToken = new AuthToken();
    authToken.setToken(UUID.randomUUID().toString());
    authToken.setUser(user);
    authToken.setCreatedAt(System.currentTimeMillis());
    authTokenRepository.save(authToken);
    return new AuthResponse(authToken.getToken(), user.getUsername());
  }
}
