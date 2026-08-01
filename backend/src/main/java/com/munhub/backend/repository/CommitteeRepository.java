package com.munhub.backend.repository;

import com.munhub.backend.model.Committee;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommitteeRepository extends JpaRepository<Committee, String> {}
