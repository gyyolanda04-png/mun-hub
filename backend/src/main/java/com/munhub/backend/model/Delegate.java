package com.munhub.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Mirrors the Delegate interface in the frontend's lib/types.ts.
 *
 * <p>{@code id} remains the technical primary key (it's referenced bare,
 * without a committee scope, by DebateState.currentSpeakerId/speakerQueue),
 * but {@code delegation} is the natural/business key: CommitteeService
 * enforces it's unique per committee, since a committee can't have two
 * delegates representing the same country.
 */
@Entity
@Table(
    name = "delegates",
    uniqueConstraints = @UniqueConstraint(columnNames = {"committee_id", "delegation"}))
public class Delegate {

  @Id
  private String id;

  private String delegation;
  private String name;
  private String school;
  private String email;

  private int speeches = 0;
  private int amendments = 0;
  private int pois = 0;

  @ManyToOne
  @JoinColumn(name = "committee_id", nullable = false)
  private Committee committee;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getDelegation() {
    return delegation;
  }

  public void setDelegation(String delegation) {
    this.delegation = delegation;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getSchool() {
    return school;
  }

  public void setSchool(String school) {
    this.school = school;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public int getSpeeches() {
    return speeches;
  }

  public void setSpeeches(int speeches) {
    this.speeches = speeches;
  }

  public int getAmendments() {
    return amendments;
  }

  public void setAmendments(int amendments) {
    this.amendments = amendments;
  }

  public int getPois() {
    return pois;
  }

  public void setPois(int pois) {
    this.pois = pois;
  }

  public Committee getCommittee() {
    return committee;
  }

  public void setCommittee(Committee committee) {
    this.committee = committee;
  }
}
