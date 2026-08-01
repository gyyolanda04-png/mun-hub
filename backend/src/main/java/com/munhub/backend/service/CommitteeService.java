package com.munhub.backend.service;

import com.munhub.backend.dto.CounterField;
import com.munhub.backend.dto.DelegateInput;
import com.munhub.backend.exception.NotFoundException;
import com.munhub.backend.model.Committee;
import com.munhub.backend.model.DebateStage;
import com.munhub.backend.model.DebateState;
import com.munhub.backend.model.Delegate;
import com.munhub.backend.repository.CommitteeRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CommitteeService {

  private final CommitteeRepository committeeRepository;

  public CommitteeService(CommitteeRepository committeeRepository) {
    this.committeeRepository = committeeRepository;
  }

  @Transactional(readOnly = true)
  public List<Committee> listCommittees() {
    // Newest first, mirroring the frontend's createCommittee prepend behavior.
    List<Committee> committees = new ArrayList<>(committeeRepository.findAll());
    committees.sort((a, b) -> Long.compare(b.getCreatedAt(), a.getCreatedAt()));
    return committees;
  }

  @Transactional(readOnly = true)
  public Committee getCommittee(String id) {
    return committeeRepository.findById(id).orElseThrow(() -> notFound(id));
  }

  public Committee createCommittee(String name, String topic) {
    Committee committee = new Committee();
    committee.setId(UUID.randomUUID().toString());
    committee.setName(name.trim());
    committee.setTopic(topic == null ? "" : topic.trim());
    committee.setCreatedAt(System.currentTimeMillis());
    committee.setDebate(new DebateState());
    return committeeRepository.save(committee);
  }

  public void deleteCommittee(String id) {
    if (!committeeRepository.existsById(id)) {
      throw notFound(id);
    }
    committeeRepository.deleteById(id);
  }

  public Committee addDelegates(String committeeId, List<DelegateInput> inputs) {
    Committee committee = getCommittee(committeeId);
    for (DelegateInput input : inputs) {
      Delegate delegate = new Delegate();
      delegate.setId(UUID.randomUUID().toString());
      delegate.setName(input.name());
      delegate.setSchool(input.school() == null ? "" : input.school());
      delegate.setEmail(input.email() == null ? "" : input.email());
      delegate.setSpeeches(0);
      delegate.setAmendments(0);
      delegate.setPois(0);
      delegate.setCommittee(committee);
      committee.getDelegates().add(delegate);
    }
    return committeeRepository.save(committee);
  }

  public Committee removeDelegate(String committeeId, String delegateId) {
    Committee committee = getCommittee(committeeId);
    boolean removed = committee.getDelegates().removeIf(d -> d.getId().equals(delegateId));
    if (!removed) {
      throw new NotFoundException("Delegate not found: " + delegateId);
    }
    DebateState debate = committee.getDebate();
    if (delegateId.equals(debate.getCurrentSpeakerId())) {
      debate.setCurrentSpeakerId(null);
    }
    debate.getSpeakerQueue().removeIf(delegateId::equals);
    return committeeRepository.save(committee);
  }

  public Committee incrementCounter(String committeeId, String delegateId, CounterField field, int delta) {
    Committee committee = getCommittee(committeeId);
    Delegate delegate =
        committee.getDelegates().stream()
            .filter(d -> d.getId().equals(delegateId))
            .findFirst()
            .orElseThrow(() -> new NotFoundException("Delegate not found: " + delegateId));

    switch (field) {
      case SPEECHES -> delegate.setSpeeches(Math.max(0, delegate.getSpeeches() + delta));
      case AMENDMENTS -> delegate.setAmendments(Math.max(0, delegate.getAmendments() + delta));
      case POIS -> delegate.setPois(Math.max(0, delegate.getPois() + delta));
    }
    return committeeRepository.save(committee);
  }

  @SuppressWarnings("unchecked")
  public Committee updateDebate(String committeeId, Map<String, Object> patch) {
    Committee committee = getCommittee(committeeId);
    DebateState debate = committee.getDebate();

    if (patch.containsKey("totalDuration")) {
      debate.setTotalDuration(asInt(patch.get("totalDuration"), "totalDuration"));
    }
    if (patch.containsKey("resolutions")) {
      debate.setResolutions(asInt(patch.get("resolutions"), "resolutions"));
    }
    if (patch.containsKey("openingCeremony")) {
      debate.setOpeningCeremony(asInt(patch.get("openingCeremony"), "openingCeremony"));
    }
    if (patch.containsKey("closingCeremony")) {
      debate.setClosingCeremony(asInt(patch.get("closingCeremony"), "closingCeremony"));
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

    return committeeRepository.save(committee);
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
}
