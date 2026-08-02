package com.munhub.backend.repository;

import com.munhub.backend.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {
  Optional<User> findByUsernameIgnoreCase(String username);

  boolean existsByUsernameIgnoreCase(String username);
}
