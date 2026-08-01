package com.munhub.backend.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

/** Mirrors the Committee interface in the frontend's lib/types.ts. */
@Entity
@Table(name = "committees")
public class Committee {

  @Id
  private String id;

  private String name;
  private String topic;
  private long createdAt;

  @OneToMany(mappedBy = "committee", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderColumn(name = "delegate_position")
  private List<Delegate> delegates = new ArrayList<>();

  @Embedded
  private DebateState debate = new DebateState();

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getTopic() {
    return topic;
  }

  public void setTopic(String topic) {
    this.topic = topic;
  }

  public long getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(long createdAt) {
    this.createdAt = createdAt;
  }

  public List<Delegate> getDelegates() {
    return delegates;
  }

  public void setDelegates(List<Delegate> delegates) {
    this.delegates = delegates != null ? delegates : new ArrayList<>();
  }

  public DebateState getDebate() {
    return debate;
  }

  public void setDebate(DebateState debate) {
    this.debate = debate != null ? debate : new DebateState();
  }
}
