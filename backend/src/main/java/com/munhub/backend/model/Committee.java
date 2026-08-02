package com.munhub.backend.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

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

  /** Ordered attendance columns, e.g. ["Day 1", "Day 2- Morning", "Day 2- Lunch"]. */
  @ElementCollection
  @CollectionTable(name = "committee_attendance_sessions", joinColumns = @JoinColumn(name = "committee_id"))
  @OrderColumn(name = "session_position")
  @Column(name = "session")
  private List<String> attendanceSessions = new ArrayList<>();

  /** Chairs who can see and edit this committee. Insertion order = creator first. */
  @ManyToMany
  @JoinTable(
      name = "committee_members",
      joinColumns = @JoinColumn(name = "committee_id"),
      inverseJoinColumns = @JoinColumn(name = "user_id"))
  private Set<User> members = new LinkedHashSet<>();

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

  public List<String> getAttendanceSessions() {
    return attendanceSessions;
  }

  public void setAttendanceSessions(List<String> attendanceSessions) {
    this.attendanceSessions = attendanceSessions != null ? attendanceSessions : new ArrayList<>();
  }

  public Set<User> getMembers() {
    return members;
  }

  public void setMembers(Set<User> members) {
    this.members = members != null ? members : new LinkedHashSet<>();
  }
}
