package com.munhub.backend.repository;

import com.munhub.backend.model.Committee;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommitteeRepository extends JpaRepository<Committee, String> {

  @Query("select c from Committee c join c.members m where m.id = :userId")
  List<Committee> findAllByMemberId(@Param("userId") String userId);

  @Query(
      "select case when count(c) > 0 then true else false end "
          + "from Committee c join c.members m where c.id = :committeeId and m.id = :userId")
  boolean isMember(@Param("committeeId") String committeeId, @Param("userId") String userId);
}
