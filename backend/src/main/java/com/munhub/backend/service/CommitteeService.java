package com.munhub.backend.service;

import com.munhub.backend.dto.CounterField;
import com.munhub.backend.dto.CreateAmendmentRequest;
import com.munhub.backend.dto.DelegateInput;
import com.munhub.backend.model.Amendment;
import com.munhub.backend.model.AmendmentStatus;
import com.munhub.backend.model.AmendmentType;
import com.munhub.backend.model.Note;
import com.munhub.backend.exception.NotFoundException;
import com.munhub.backend.model.Committee;
import com.munhub.backend.model.DebateStage;
import com.munhub.backend.model.DebateState;
import com.munhub.backend.model.Delegate;
import com.munhub.backend.model.User;
import com.munhub.backend.repository.CommitteeRepository;
import com.munhub.backend.repository.DelegateRepository;
import com.munhub.backend.repository.UserRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import com.munhub.backend.dto.CommitteeWsEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CommitteeService {

  private final CommitteeRepository committeeRepository;
  private final DelegateRepository delegateRepository;
  private final UserRepository userRepository;
  private final SimpMessagingTemplate messagingTemplate;

  public CommitteeService(
      CommitteeRepository committeeRepository,
      DelegateRepository delegateRepository,
      UserRepository userRepository,
      SimpMessagingTemplate messagingTemplate) {
    this.committeeRepository = committeeRepository;
    this.delegateRepository = delegateRepository;
    this.userRepository = userRepository;
    this.messagingTemplate = messagingTemplate;
  }

  /** Persists the committee and pushes the new state to anyone subscribed to it live. */
  private Committee saveAndBroadcast(Committee committee) {
    Committee saved = committeeRepository.save(committee);
    messagingTemplate.convertAndSend("/topic/committees/" + saved.getId(), CommitteeWsEvent.updated(saved));
    return saved;
  }

  @Transactional(readOnly = true)
  public List<Committee> listCommittees(User currentUser) {
    // Newest first, mirroring the frontend's createCommittee prepend behavior.
    List<Committee> committees = new ArrayList<>(committeeRepository.findAllByMemberId(currentUser.getId()));
    committees.sort((a, b) -> Long.compare(b.getCreatedAt(), a.getCreatedAt()));
    return committees;
  }

  /**
   * Fetches a committee and enforces the caller is a member. Non-members get
   * the same 404 as a nonexistent committee, so this never leaks whether a
   * given id exists to someone who isn't a chair on it.
   */
  @Transactional(readOnly = true)
  public Committee getCommittee(String id, User currentUser) {
    Committee committee = committeeRepository.findById(id).orElseThrow(() -> notFound(id));
    if (!committeeRepository.isMember(id, currentUser.getId())) {
      throw notFound(id);
    }
    return committee;
  }

  public Committee createCommittee(String name, User creator) {
    Committee committee = new Committee();
    committee.setId(UUID.randomUUID().toString());
    committee.setName(name.trim());
    committee.setCreatedAt(System.currentTimeMillis());
    committee.setDebate(new DebateState());
    committee.getMembers().add(creator);
    return saveAndBroadcast(committee);
  }

  public void deleteCommittee(String id, User currentUser) {
    getCommittee(id, currentUser);
    committeeRepository.deleteById(id);
    messagingTemplate.convertAndSend("/topic/committees/" + id, CommitteeWsEvent.deleted(id));
  }

  public Committee addMember(String committeeId, User currentUser, String usernameToAdd) {
    Committee committee = getCommittee(committeeId, currentUser);
    User target =
        userRepository
            .findByUsernameIgnoreCase(usernameToAdd.trim())
            .orElseThrow(() -> new NotFoundException("No user with username: " + usernameToAdd));
    committee.getMembers().add(target);
    return saveAndBroadcast(committee);
  }

  public Committee removeMember(String committeeId, User currentUser, String usernameToRemove) {
    Committee committee = getCommittee(committeeId, currentUser);
    User target =
        userRepository
            .findByUsernameIgnoreCase(usernameToRemove.trim())
            .orElseThrow(() -> new NotFoundException("No user with username: " + usernameToRemove));
    if (committee.getMembers().contains(target) && committee.getMembers().size() <= 1) {
      throw new IllegalArgumentException("Can't remove the last chair from a committee.");
    }
    committee.getMembers().remove(target);
    return saveAndBroadcast(committee);
  }

  public Committee addDelegates(
      String committeeId, User currentUser, List<DelegateInput> inputs, List<String> attendanceSessions) {
    Committee committee = getCommittee(committeeId, currentUser);

    if (attendanceSessions != null) {
      for (String session : attendanceSessions) {
        addSessionIfNew(committee, session);
      }
    }

    // Delegation is the natural key: a committee can't have two delegates
    // representing the same country. Skip anything already present, and
    // skip duplicates within the incoming batch itself.
    Set<String> takenDelegations =
        committee.getDelegates().stream()
            .map(d -> normalizeDelegation(d.getDelegation()))
            .collect(Collectors.toCollection(HashSet::new));

    for (DelegateInput input : inputs) {
      String delegationKey = normalizeDelegation(input.delegation());
      if (!takenDelegations.add(delegationKey)) {
        continue;
      }
      Delegate delegate = new Delegate();
      delegate.setId(UUID.randomUUID().toString());
      delegate.setDelegation(input.delegation().trim());
      delegate.setName(input.name());
      delegate.setSchool(input.school() == null ? "" : input.school());
      delegate.setEmail(input.email() == null ? "" : input.email());
      delegate.setBloc(input.bloc() == null ? "" : input.bloc().trim());
      delegate.setSpeeches(0);
      delegate.setAmendments(0);
      delegate.setPois(0);
      delegate.setAttendance(input.attendance() == null ? new LinkedHashMap<>() : new LinkedHashMap<>(input.attendance()));
      delegate.setCommittee(committee);
      committee.getDelegates().add(delegate);
    }
    return saveAndBroadcast(committee);
  }

  public Committee addAttendanceSession(String committeeId, User currentUser, String session) {
    Committee committee = getCommittee(committeeId, currentUser);
    addSessionIfNew(committee, session);
    return saveAndBroadcast(committee);
  }

  public Committee removeAttendanceSession(String committeeId, User currentUser, String session) {
    Committee committee = getCommittee(committeeId, currentUser);
    String trimmed = session.trim();
    committee.getAttendanceSessions().removeIf(s -> s.equals(trimmed));
    for (Delegate delegate : committee.getDelegates()) {
      delegate.getAttendance().remove(trimmed);
    }
    return saveAndBroadcast(committee);
  }

  public Committee setAttendance(
      String committeeId, User currentUser, String delegateId, String session, boolean present) {
    Committee committee = getCommittee(committeeId, currentUser);
    String trimmed = session.trim();
    if (!committee.getAttendanceSessions().contains(trimmed)) {
      throw new NotFoundException("Unknown attendance session: " + trimmed);
    }
    Delegate delegate =
        committee.getDelegates().stream()
            .filter(d -> d.getId().equals(delegateId))
            .findFirst()
            .orElseThrow(() -> new NotFoundException("Delegate not found: " + delegateId));
    delegate.getAttendance().put(trimmed, present);
    return saveAndBroadcast(committee);
  }

  private void addSessionIfNew(Committee committee, String session) {
    if (session == null) return;
    String trimmed = session.trim();
    if (trimmed.isEmpty() || committee.getAttendanceSessions().contains(trimmed)) {
      return;
    }
    committee.getAttendanceSessions().add(trimmed);
  }

  public Committee removeDelegate(String committeeId, User currentUser, String delegateId) {
    Committee committee = getCommittee(committeeId, currentUser);
    boolean removed = committee.getDelegates().removeIf(d -> d.getId().equals(delegateId));
    if (!removed) {
      throw new NotFoundException("Delegate not found: " + delegateId);
    }
    DebateState debate = committee.getDebate();
    if (delegateId.equals(debate.getCurrentSpeakerId())) {
      debate.setCurrentSpeakerId(null);
    }
    debate.getSpeakerQueue().removeIf(delegateId::equals);
    return saveAndBroadcast(committee);
  }

  public Committee incrementCounter(
      String committeeId, User currentUser, String delegateId, CounterField field, int delta) {
    // Ensures a 404 for a bad/unauthorized committeeId even if delegateId happens to exist elsewhere.
    getCommittee(committeeId, currentUser);

    int updated =
        switch (field) {
          case SPEECHES -> delegateRepository.incrementSpeeches(delegateId, committeeId, delta);
          case AMENDMENTS -> delegateRepository.incrementAmendments(delegateId, committeeId, delta);
          case POIS -> delegateRepository.incrementPois(delegateId, committeeId, delta);
        };
    if (updated == 0) {
      throw new NotFoundException("Delegate not found: " + delegateId);
    }
    Committee updatedCommittee = getCommittee(committeeId, currentUser);
    messagingTemplate.convertAndSend(
        "/topic/committees/" + committeeId, CommitteeWsEvent.updated(updatedCommittee));
    return updatedCommittee;
  }

  @SuppressWarnings("unchecked")
  public Committee updateDebate(String committeeId, User currentUser, Map<String, Object> patch) {
    Committee committee = getCommittee(committeeId, currentUser);
    DebateState debate = committee.getDebate();

    if (patch.containsKey("totalDuration")) {
      debate.setTotalDuration(asInt(patch.get("totalDuration"), "totalDuration"));
    }
    if (patch.containsKey("resolutions")) {
      debate.setResolutions(asInt(patch.get("resolutions"), "resolutions"));
    }
    if (patch.containsKey("openingSpeech")) {
      debate.setOpeningSpeech(asInt(patch.get("openingSpeech"), "openingSpeech"));
    }
    if (patch.containsKey("closingSpeech")) {
      debate.setClosingSpeech(asInt(patch.get("closingSpeech"), "closingSpeech"));
    }
    if (patch.containsKey("amendmentsPerResolution")) {
      debate.setAmendmentsPerResolution(asInt(patch.get("amendmentsPerResolution"), "amendmentsPerResolution"));
    }
    if (patch.containsKey("stage")) {
      Object value = patch.get("stage");
      if (!(value instanceof String s)) {
        throw new IllegalArgumentException("stage must be a string");
      }
      debate.setStage(DebateStage.fromValue(s));
    }
    if (patch.containsKey("currentResolution")) {
      debate.setCurrentResolution(asInt(patch.get("currentResolution"), "currentResolution"));
    }
    if (patch.containsKey("currentAmendment")) {
      debate.setCurrentAmendment(asInt(patch.get("currentAmendment"), "currentAmendment"));
    }
    if (patch.containsKey("currentSpeakerId")) {
      Object value = patch.get("currentSpeakerId");
      if (value != null && !(value instanceof String)) {
        throw new IllegalArgumentException("currentSpeakerId must be a string or null");
      }
      debate.setCurrentSpeakerId((String) value);
    }
    if (patch.containsKey("speakerQueue")) {
      Object value = patch.get("speakerQueue");
      if (!(value instanceof List<?> list)) {
        throw new IllegalArgumentException("speakerQueue must be an array of delegate ids");
      }
      List<String> queue = new ArrayList<>();
      for (Object item : list) {
        if (!(item instanceof String s)) {
          throw new IllegalArgumentException("speakerQueue must contain only strings");
        }
        queue.add(s);
      }
      debate.setSpeakerQueue(queue);
    }

    return saveAndBroadcast(committee);
  }

  // ---- Amendments (F2) ----

  public Committee createAmendment(String committeeId, User currentUser, CreateAmendmentRequest req) {
    Committee committee = getCommittee(committeeId, currentUser);
    Amendment a = new Amendment();
    a.setId(UUID.randomUUID().toString());
    a.setCommittee(committee);
    a.setSubmitterId(req.submitterId());
    a.setSubmitter(resolveSubmitterName(committee, req.submitterId()));
    a.setType(parseType(req.type()));
    a.setClauseRef(req.clauseRef() == null ? "" : req.clauseRef().trim());
    a.setText(req.text() == null ? "" : req.text());
    a.setFriendly(Boolean.TRUE.equals(req.friendly()));
    a.setStatus(AmendmentStatus.PENDING);
    a.setParentId(req.parentId());
    a.setCreatedAt(System.currentTimeMillis());
    committee.getAmendments().add(a);
    return saveAndBroadcast(committee);
  }

  public Committee updateAmendment(
      String committeeId, User currentUser, String amendmentId, Map<String, Object> patch) {
    Committee committee = getCommittee(committeeId, currentUser);
    Amendment a =
        committee.getAmendments().stream()
            .filter(x -> x.getId().equals(amendmentId))
            .findFirst()
            .orElseThrow(() -> new NotFoundException("Amendment not found: " + amendmentId));
    if (patch.containsKey("type")) {
      a.setType(parseType(asString(patch.get("type"), "type")));
    }
    if (patch.containsKey("clauseRef")) {
      a.setClauseRef(asStringOrEmpty(patch.get("clauseRef")));
    }
    if (patch.containsKey("text")) {
      a.setText(asStringOrEmpty(patch.get("text")));
    }
    if (patch.containsKey("friendly")) {
      Object v = patch.get("friendly");
      a.setFriendly(v instanceof Boolean b ? b : Boolean.parseBoolean(String.valueOf(v)));
    }
    if (patch.containsKey("status")) {
      a.setStatus(parseStatus(asString(patch.get("status"), "status")));
    }
    if (patch.containsKey("submitterId")) {
      Object v = patch.get("submitterId");
      String sid = v == null ? null : String.valueOf(v);
      a.setSubmitterId(sid);
      a.setSubmitter(resolveSubmitterName(committee, sid));
    }
    return saveAndBroadcast(committee);
  }

  public Committee deleteAmendment(String committeeId, User currentUser, String amendmentId) {
    Committee committee = getCommittee(committeeId, currentUser);
    // Remove the amendment plus any second-degree amendments targeting it.
    boolean removed =
        committee
            .getAmendments()
            .removeIf(a -> a.getId().equals(amendmentId) || amendmentId.equals(a.getParentId()));
    if (!removed) {
      throw new NotFoundException("Amendment not found: " + amendmentId);
    }
    if (amendmentId.equals(committee.getPresentedAmendmentId())) {
      committee.setPresentedAmendmentId(null);
    }
    return saveAndBroadcast(committee);
  }

  /** Push an amendment to Presentation Mode, or clear it when amendmentId is null. */
  public Committee presentAmendment(String committeeId, User currentUser, String amendmentId) {
    Committee committee = getCommittee(committeeId, currentUser);
    if (amendmentId != null) {
      boolean exists =
          committee.getAmendments().stream().anyMatch(a -> a.getId().equals(amendmentId));
      if (!exists) {
        throw new NotFoundException("Amendment not found: " + amendmentId);
      }
    }
    committee.setPresentedAmendmentId(amendmentId);
    return saveAndBroadcast(committee);
  }

  // ---- Notes / event log (F5) ----

  public Committee createNote(String committeeId, User currentUser, String text) {
    Committee committee = getCommittee(committeeId, currentUser);
    Note note = new Note();
    note.setId(UUID.randomUUID().toString());
    note.setCommittee(committee);
    note.setText(text == null ? "" : text);
    long now = System.currentTimeMillis();
    note.setCreatedAt(now);
    note.setUpdatedAt(now);
    committee.getNotes().add(note);
    return saveAndBroadcast(committee);
  }

  public Committee updateNote(String committeeId, User currentUser, String noteId, String text) {
    Committee committee = getCommittee(committeeId, currentUser);
    Note note =
        committee.getNotes().stream()
            .filter(n -> n.getId().equals(noteId))
            .findFirst()
            .orElseThrow(() -> new NotFoundException("Note not found: " + noteId));
    note.setText(text == null ? "" : text);
    note.setUpdatedAt(System.currentTimeMillis());
    return saveAndBroadcast(committee);
  }

  public Committee deleteNote(String committeeId, User currentUser, String noteId) {
    Committee committee = getCommittee(committeeId, currentUser);
    boolean removed = committee.getNotes().removeIf(n -> n.getId().equals(noteId));
    if (!removed) {
      throw new NotFoundException("Note not found: " + noteId);
    }
    return saveAndBroadcast(committee);
  }

  private String resolveSubmitterName(Committee committee, String submitterId) {
    if (submitterId == null) return "";
    return committee.getDelegates().stream()
        .filter(d -> d.getId().equals(submitterId))
        .findFirst()
        .map(Delegate::getDelegation)
        .orElse("");
  }

  private AmendmentType parseType(String s) {
    if (s == null || s.isBlank()) return AmendmentType.ADD;
    try {
      return AmendmentType.valueOf(s.trim().toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid amendment type: " + s);
    }
  }

  private AmendmentStatus parseStatus(String s) {
    if (s == null || s.isBlank()) return AmendmentStatus.PENDING;
    try {
      return AmendmentStatus.valueOf(s.trim().toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid amendment status: " + s);
    }
  }

  private String asString(Object v, String field) {
    if (v instanceof String s) return s;
    throw new IllegalArgumentException(field + " must be a string");
  }

  private String asStringOrEmpty(Object v) {
    return v == null ? "" : String.valueOf(v);
  }

  private int asInt(Object value, String field) {
    if (value instanceof Number number) {
      return number.intValue();
    }
    throw new IllegalArgumentException(field + " must be a number");
  }

  private NotFoundException notFound(String id) {
    return new NotFoundException("Committee not found: " + id);
  }

  /** Null-safe: delegates persisted before the delegation field existed may have none. */
  private String normalizeDelegation(String delegation) {
    return delegation == null ? "" : delegation.trim().toLowerCase();
  }
}
