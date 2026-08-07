package com.munhub.backend.model;

/**
 * Lifecycle of an amendment. PENDING is the neutral starting state before a
 * chair rules on it; the other four are the outcomes from the spec.
 */
public enum AmendmentStatus {
  PENDING,
  APPROVED,
  ENTERTAINING,
  PASSED,
  FAILED;
}
