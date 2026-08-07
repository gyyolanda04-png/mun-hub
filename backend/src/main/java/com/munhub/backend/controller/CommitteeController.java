package com.munhub.backend.controller;

import com.munhub.backend.dto.AddAttendanceSessionRequest;
import com.munhub.backend.dto.AddDelegatesRequest;
import com.munhub.backend.dto.AddMemberRequest;
import com.munhub.backend.dto.CommitteeResponse;
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
}
