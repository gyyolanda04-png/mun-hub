package com.munhub.backend.controller;

import com.munhub.backend.dto.AddAttendanceSessionRequest;
import com.munhub.backend.dto.AddDelegatesRequest;
import com.munhub.backend.dto.AddMemberRequest;
import com.munhub.backend.dto.CommitteeResponse;
import com.munhub.backend.dto.CreateAmendmentRequest;
import com.munhub.backend.dto.CreateCommitteeRequest;
import com.munhub.backend.dto.IncrementCounterRequest;
import com.munhub.backend.dto.SetAttendanceRequest;
import com.munhub.backend.model.Committee;
import com.munhub.backend.model.User;
import com.munhub.backend.service.CommitteeService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/committees")
public class CommitteeController {

  private final CommitteeService committeeService;

  public CommitteeController(CommitteeService committeeService) {
    this.committeeService = committeeService;
  }

  @GetMapping
  public List<CommitteeResponse> listCommittees(@AuthenticationPrincipal User currentUser) {
    return committeeService.listCommittees(currentUser).stream().map(CommitteeResponse::from).toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CommitteeResponse createCommittee(
      @AuthenticationPrincipal User currentUser, @Valid @RequestBody CreateCommitteeRequest request) {
    Committee committee = committeeService.createCommittee(request.name(), currentUser);
    return CommitteeResponse.from(committee);
  }

  @GetMapping("/{id}")
  public CommitteeResponse getCommittee(@AuthenticationPrincipal User currentUser, @PathVariable String id) {
    return CommitteeResponse.from(committeeService.getCommittee(id, currentUser));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteCommittee(@AuthenticationPrincipal User currentUser, @PathVariable String id) {
    committeeService.deleteCommittee(id, currentUser);
  }

  @PostMapping("/{id}/members")
  public CommitteeResponse addMember(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @Valid @RequestBody AddMemberRequest request) {
    Committee committee = committeeService.addMember(id, currentUser, request.username());
    return CommitteeResponse.from(committee);
  }

  @DeleteMapping("/{id}/members/{username}")
  public CommitteeResponse removeMember(
      @AuthenticationPrincipal User currentUser, @PathVariable String id, @PathVariable String username) {
    Committee committee = committeeService.removeMember(id, currentUser, username);
    return CommitteeResponse.from(committee);
  }

  @PostMapping("/{id}/delegates")
  public CommitteeResponse addDelegates(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @Valid @RequestBody AddDelegatesRequest request) {
    Committee committee =
        committeeService.addDelegates(id, currentUser, request.delegates(), request.attendanceSessions());
    return CommitteeResponse.from(committee);
  }

  @DeleteMapping("/{id}/delegates/{delegateId}")
  public CommitteeResponse removeDelegate(
      @AuthenticationPrincipal User currentUser, @PathVariable String id, @PathVariable String delegateId) {
    Committee committee = committeeService.removeDelegate(id, currentUser, delegateId);
    return CommitteeResponse.from(committee);
  }

  @PatchMapping("/{id}/delegates/{delegateId}/counter")
  public CommitteeResponse incrementCounter(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @PathVariable String delegateId,
      @Valid @RequestBody IncrementCounterRequest request) {
    Committee committee =
        committeeService.incrementCounter(id, currentUser, delegateId, request.field(), request.delta());
    return CommitteeResponse.from(committee);
  }

  @PatchMapping("/{id}/debate")
  public CommitteeResponse updateDebate(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @RequestBody Map<String, Object> patch) {
    Committee committee = committeeService.updateDebate(id, currentUser, patch);
    return CommitteeResponse.from(committee);
  }

  @PatchMapping("/{id}/delegates/{delegateId}/attendance")
  public CommitteeResponse setAttendance(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @PathVariable String delegateId,
      @Valid @RequestBody SetAttendanceRequest request) {
    Committee committee =
        committeeService.setAttendance(id, currentUser, delegateId, request.session(), request.present());
    return CommitteeResponse.from(committee);
  }

  @PostMapping("/{id}/attendance-sessions")
  public CommitteeResponse addAttendanceSession(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @Valid @RequestBody AddAttendanceSessionRequest request) {
    Committee committee = committeeService.addAttendanceSession(id, currentUser, request.session());
    return CommitteeResponse.from(committee);
  }

  @DeleteMapping("/{id}/attendance-sessions/{session}")
  public CommitteeResponse removeAttendanceSession(
      @AuthenticationPrincipal User currentUser, @PathVariable String id, @PathVariable String session) {
    Committee committee = committeeService.removeAttendanceSession(id, currentUser, session);
    return CommitteeResponse.from(committee);
  }

  // ---- Amendments (F2) ----

  @PostMapping("/{id}/amendments")
  public CommitteeResponse createAmendment(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @RequestBody CreateAmendmentRequest request) {
    Committee committee = committeeService.createAmendment(id, currentUser, request);
    return CommitteeResponse.from(committee);
  }

  @PatchMapping("/{id}/amendments/{amendmentId}")
  public CommitteeResponse updateAmendment(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @PathVariable String amendmentId,
      @RequestBody Map<String, Object> patch) {
    Committee committee = committeeService.updateAmendment(id, currentUser, amendmentId, patch);
    return CommitteeResponse.from(committee);
  }

  @DeleteMapping("/{id}/amendments/{amendmentId}")
  public CommitteeResponse deleteAmendment(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @PathVariable String amendmentId) {
    Committee committee = committeeService.deleteAmendment(id, currentUser, amendmentId);
    return CommitteeResponse.from(committee);
  }

  @PostMapping("/{id}/present-amendment")
  public CommitteeResponse presentAmendment(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @RequestBody Map<String, Object> body) {
    Object v = body.get("amendmentId");
    String amendmentId = v == null ? null : String.valueOf(v);
    Committee committee = committeeService.presentAmendment(id, currentUser, amendmentId);
    return CommitteeResponse.from(committee);
  }

  // ---- Blocs (chair-managed) ----

  @PostMapping("/{id}/blocs")
  public CommitteeResponse addBloc(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @RequestBody Map<String, Object> body) {
    String bloc = body.get("bloc") == null ? "" : String.valueOf(body.get("bloc"));
    Committee committee = committeeService.addBloc(id, currentUser, bloc);
    return CommitteeResponse.from(committee);
  }

  @DeleteMapping("/{id}/blocs/{bloc}")
  public CommitteeResponse removeBloc(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @PathVariable String bloc) {
    Committee committee = committeeService.removeBloc(id, currentUser, bloc);
    return CommitteeResponse.from(committee);
  }

  @PatchMapping("/{id}/delegates/{delegateId}/bloc")
  public CommitteeResponse setDelegateBloc(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @PathVariable String delegateId,
      @RequestBody Map<String, Object> body) {
    String bloc = body.get("bloc") == null ? "" : String.valueOf(body.get("bloc"));
    Committee committee = committeeService.setDelegateBloc(id, currentUser, delegateId, bloc);
    return CommitteeResponse.from(committee);
  }

  // ---- Notes / event log (F5) ----

  @PostMapping("/{id}/notes")
  public CommitteeResponse createNote(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @RequestBody Map<String, Object> body) {
    String text = body.get("text") == null ? "" : String.valueOf(body.get("text"));
    Committee committee = committeeService.createNote(id, currentUser, text);
    return CommitteeResponse.from(committee);
  }

  @PatchMapping("/{id}/notes/{noteId}")
  public CommitteeResponse updateNote(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @PathVariable String noteId,
      @RequestBody Map<String, Object> body) {
    String text = body.get("text") == null ? "" : String.valueOf(body.get("text"));
    Committee committee = committeeService.updateNote(id, currentUser, noteId, text);
    return CommitteeResponse.from(committee);
  }

  @DeleteMapping("/{id}/notes/{noteId}")
  public CommitteeResponse deleteNote(
      @AuthenticationPrincipal User currentUser,
      @PathVariable String id,
      @PathVariable String noteId) {
    Committee committee = committeeService.deleteNote(id, currentUser, noteId);
    return CommitteeResponse.from(committee);
  }
}
