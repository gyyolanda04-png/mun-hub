package com.munhub.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** An amendment submitted during debate. Mirrors the frontend Amendment type. */
@Entity
@Table(name = "amendments")
public class Amendment {

  @Id
  private String id;

  @ManyToOne
  @JoinColumn(name = "committee_id", nullable = false)
  private Committee committee;

  /** The delegate (by id) who submitted it, plus their delegation name denormalized for display. */
  private String submitterId;
  private String submitter;

  @Enumerated(EnumType.STRING)
  private AmendmentType type = AmendmentType.ADD;

  /** Clause being amended, e.g. "1. e." or "clause 6". */
  private String clauseRef;

  @Column(length = 8000)
  private String text;

  private boolean friendly = false;

  @Enumerated(EnumType.STRING)
  private AmendmentStatus status = AmendmentStatus.PENDING;

  /** Non-null when this is a second-degree amendment (an amendment to another amendment). */
  private String parentId;

  private long createdAt;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public Committee getCommittee() {
    return committee;
  }

  public void setCommittee(Committee committee) {
    this.committee = committee;
  }

  public String getSubmitterId() {
    return submitterId;
  }

  public void setSubmitterId(String submitterId) {
    this.submitterId = submitterId;
  }

  public String getSubmitter() {
    return submitter;
  }

  public void setSubmitter(String submitter) {
    this.submitter = submitter;
  }

  public AmendmentType getType() {
    return type;
  }

  public void setType(AmendmentType type) {
    this.type = type;
  }

  public String getClauseRef() {
    return clauseRef;
  }

  public void setClauseRef(String clauseRef) {
    this.clauseRef = clauseRef;
  }

  public String getText() {
    return text;
  }

  public void setText(String text) {
    this.text = text;
  }

  public boolean isFriendly() {
    return friendly;
  }

  public void setFriendly(boolean friendly) {
    this.friendly = friendly;
  }

  public AmendmentStatus getStatus() {
    return status;
  }

  public void setStatus(AmendmentStatus status) {
    this.status = status;
  }

  public String getParentId() {
    return parentId;
  }

  public void setParentId(String parentId) {
    this.parentId = parentId;
  }

  public long getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(long createdAt) {
    this.createdAt = createdAt;
  }
}
