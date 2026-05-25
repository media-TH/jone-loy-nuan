# Migration Plan Checklist

## Agreed Migration Order

1. **Auth / Session**
2. **Core Read Pages**
3. **User Actions**
4. **Admin / Reporting**
5. **Background Jobs**

---

## Feature Slice Breakdown

### 1) Auth / Session

- **Old component(s)**
  - Existing auth guard and session bootstrap logic in current route/layout wrappers.
  - Legacy login/logout/session refresh handlers.
- **New component(s)**
  - New auth provider/session boundary with unified token lifecycle handling.
  - New login/logout/session refresh adapters wired to the target architecture.
- **Data API parity checklist**
  - [ ] Login endpoint request/response shape matches legacy behavior.
  - [ ] Logout invalidates session and clears local state exactly as before.
  - [ ] Session refresh timing and retry behavior match legacy semantics.
  - [ ] Auth error codes/messages map to existing UI expectations.
  - [ ] Anonymous vs authenticated state transitions are preserved.

### 2) Core Read Pages

- **Old component(s)**
  - Existing read-only pages and server/client data loaders.
  - Legacy list/detail presentation components for core content.
- **New component(s)**
  - New page containers and shared read-model adapters.
  - New list/detail components using the new data access layer.
- **Data API parity checklist**
  - [ ] Query params and route params produce equivalent payloads.
  - [ ] Sorting/filtering defaults are unchanged.
  - [ ] Pagination cursors/offset handling is equivalent.
  - [ ] Empty/loading/error states receive identical contract fields.
  - [ ] Caching/revalidation behavior remains functionally equivalent.

### 3) User Actions

- **Old component(s)**
  - Legacy forms, mutation handlers, and optimistic update logic.
  - Existing action toasts/alerts and rollback flows.
- **New component(s)**
  - New action components and mutation service wrappers.
  - New optimistic state/update orchestration aligned with target architecture.
- **Data API parity checklist**
  - [ ] Create/update/delete endpoints accept legacy payload shapes.
  - [ ] Validation errors map to same field-level UI behavior.
  - [ ] Optimistic UI behavior and rollback triggers are preserved.
  - [ ] Idempotency/retry semantics match current production behavior.
  - [ ] Success/failure telemetry events remain compatible.

### 4) Admin / Reporting

- **Old component(s)**
  - Existing admin dashboards, report tables, and export handlers.
  - Legacy role-gated admin route wrappers.
- **New component(s)**
  - New admin/reporting modules and shared analytics adapters.
  - New role/permission gate implementation in target stack.
- **Data API parity checklist**
  - [ ] Role checks and permission boundaries are unchanged.
  - [ ] Report filters/groupings produce equivalent aggregates.
  - [ ] Export formats/columns are backward-compatible.
  - [ ] Timezone/date-range behavior matches legacy output.
  - [ ] Audit/event logging remains complete and queryable.

### 5) Background Jobs

- **Old component(s)**
  - Legacy scheduled/async workers and job dispatch hooks.
  - Existing retry/dead-letter/error notification paths.
- **New component(s)**
  - New job orchestrators/workers on the target execution path.
  - New queue adapters and failure handling pipeline.
- **Data API parity checklist**
  - [ ] Trigger conditions and schedules match legacy cadence.
  - [ ] Job payload schema compatibility is maintained.
  - [ ] Retry/backoff/dead-letter behavior is equivalent.
  - [ ] Side effects (writes, notifications, webhooks) match old system.
  - [ ] Operational metrics and alerting dimensions are preserved.

---

## Feature Flag Policy (Old + New Side-by-Side)

For **every** slice above:

- [ ] Keep old and new implementations behind feature flags until QA sign-off.
- [ ] Default flag state remains on old path in production until approval.
- [ ] Enable progressive rollout by cohort/environment.
- [ ] Add explicit rollback switch with no deploy requirement.
- [ ] Record flag name, owner, and rollout timeline in release notes.

---

## Decommission Policy (Dead Path Removal Gate)

Only remove old paths after all conditions pass:

- [ ] Smoke tests succeed on staged rollout.
- [ ] Key product metrics are stable or improved.
- [ ] Error rate/regression checks are within acceptable thresholds.
- [ ] QA pass is documented for the migrated slice.
- [ ] Rollback readiness confirmed before code removal PR.

---

## Regression Tracking Checklist

Use this section during rollout to track regressions:

- [ ] Regression logged with slice, environment, and timestamp.
- [ ] Repro steps documented.
- [ ] Severity and blast radius assessed.
- [ ] Owner assigned and ETA recorded.
- [ ] Fix verified in QA and marked complete.
- [ ] Post-fix metric validation attached.
