package com.munhub.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** A timestamped note in a committee's running event log (F5). */
@Entity
@Table(name = "notes")
public class Note {

  @Id
  private String id;

  @ManyToOne
  @JoinColumn(name = "committee_id", nullable = false)
  private Committee committee;

  @Column(length = 8000)
  private String text;

  private long createdAt;
  private long updatedAt;

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

  public String getText() {
    return text;
  }

  public void setText(String text) {
    this.text = text;
  }

  public long getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(long createdAt) {
    this.createdAt = createdAt;
  }

  public long getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(long updatedAt) {
    this.updatedAt = updatedAt;
  }
}
