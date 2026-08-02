package com.munhub.backend.repository;

import com.munhub.backend.model.Delegate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DelegateRepository extends JpaRepository<Delegate, String> {

  /**
   * Atomic read-modify-write at the database level, so concurrent clicks
   * (e.g. two officers, or one person double-clicking) never lose an
   * increment the way a Java-side load-then-save would.
   */
  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      value =
          "UPDATE delegates SET speeches = GREATEST(0, speeches + :delta) "
              + "WHERE id = :id AND committee_id = :committeeId",
      nativeQuery = true)
  int incrementSpeeches(
      @Param("id") String id, @Param("committeeId") String committeeId, @Param("delta") int delta);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      value =
          "UPDATE delegates SET amendments = GREATEST(0, amendments + :delta) "
              + "WHERE id = :id AND committee_id = :committeeId",
      nativeQuery = true)
  int incrementAmendments(
      @Param("id") String id, @Param("committeeId") String committeeId, @Param("delta") int delta);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      value =
          "UPDATE delegates SET pois = GREATEST(0, pois + :delta) "
              + "WHERE id = :id AND committee_id = :committeeId",
      nativeQuery = true)
  int incrementPois(
      @Param("id") String id, @Param("committeeId") String committeeId, @Param("delta") int delta);
}
