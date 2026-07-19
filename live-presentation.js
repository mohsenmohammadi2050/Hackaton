(function initializeLivePresentation(root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) module.exports = factory(require("./live-session-adapter"), require("./demo-path-config"));
  else if (root) root.FORKED_FATES_LIVE_PRESENTATION = factory(root.FORKED_FATES_LIVE_SESSION_ADAPTER, root.FORKED_FATES_DEMO_PATH);
})(typeof globalThis !== "undefined" ? globalThis : this, function createLivePresentationApi(adapterApi, demoConfig) {
  "use strict";

  const COLOR = Object.freeze({ mara: "blue", dain: "amber", sera: "rose", orin: "purple" });
  const INITIALS = Object.freeze({ mara: "MV", dain: "DH", sera: "SQ", orin: "OV" });
  const PROPOSITIONS = Object.freeze([
    ["fact-case-spare-key", "The empty case was opened with the spare Clinic key"],
    ["fact-orin-holds-spare-key", "Orin holds the spare Clinic key"],
    ["obs-dain-sera-sighting", "Dain saw Sera leave the Clinic"]
  ]);

  function create(options) {
    const win = options.window;
    const doc = options.document;
    const app = options.app;
    const announcer = options.announcer;
    const escape = options.escapeHtml;
    const useRecorded = options.onUseRecorded;
    let adapter = null;
    let runTimer = null;
    const ui = {
      branch: "original",
      frontiers: { original: 0, alternate: 0 },
      selections: { original: null, alternate: null },
      selection: { type: "event", id: null },
      running: false,
      loading: false,
      error: null,
      composer: false,
      interventionCategory: "Information",
      compare: false,
      movedNpcIds: []
    };

    function announce(message) {
      announcer.textContent = "";
      win.setTimeout(() => { announcer.textContent = message; }, 20);
    }
    function stopTimer() {
      if (runTimer !== null) win.clearTimeout(runTimer);
      runTimer = null;
      ui.running = false;
    }
    function fail(error) {
      stopTimer();
      ui.loading = false;
      ui.error = error?.message || "Live simulation could not continue.";
      render();
      announce(`Live simulation error. ${ui.error}`);
    }
    function start() {
      ui.loading = true;
      render();
      win.setTimeout(() => {
        try {
          if (!adapterApi || typeof adapterApi.createLiveSession !== "function") throw new Error("Live modules are unavailable in this build.");
          adapter = adapterApi.createLiveSession();
          const initial = adapter.currentView("original");
          ui.selections.original = initial.boundary.id;
          ui.selection = { type: "event", id: initial.events[0]?.id || null };
          ui.loading = false;
          render();
          announce("Live authoritative Original ready at turn zero.");
        } catch (error) { fail(error); }
      }, 30);
    }
    function list(branch = ui.branch) { return adapter.boundaryList(branch); }
    function selectedView(branch = ui.branch) {
      const boundaries = list(branch);
      const id = ui.selections[branch] || boundaries[0].id;
      return adapter.viewAt(branch, id);
    }
    function frontierView(branch = ui.branch) {
      const boundaries = list(branch);
      return adapter.viewAt(branch, boundaries[ui.frontiers[branch]].id);
    }
    function branchComplete(branch) {
      return ui.frontiers[branch] >= list(branch).length - 1;
    }
    function canCompare() {
      return adapter.capabilities().canCompare && branchComplete("original") && branchComplete("alternate");
    }

    function render() {
      if (ui.loading) {
        app.innerHTML = `<section class="live-state-screen" aria-labelledby="live-loading-title"><div class="loading-orbit" aria-hidden="true"></div><p class="eyebrow"><span class="eyebrow-mark"></span>Authoritative simulation</p><h1 id="live-loading-title">Freezing the first boundary…</h1><p>Four autonomous decisions will resolve through deterministic World rules.</p></section>`;
        return;
      }
      if (ui.error) {
        app.innerHTML = `<section class="live-state-screen error-state" aria-labelledby="live-error-title"><span class="error-glyph" aria-hidden="true">!</span><p class="eyebrow">Frozen-boundary recovery</p><h1 id="live-error-title">Live simulation paused safely</h1><p>${escape(ui.error)}</p><div class="start-actions"><button class="button button-primary" data-action="retry-live" type="button">Retry Live</button><button class="button button-secondary" data-action="use-recorded" type="button">Use Recorded Original</button></div></section>`;
        return;
      }
      if (!adapter) return;
      if (ui.compare) renderComparison();
      else renderWorkspace();
    }

    function renderWorkspace() {
      const view = selectedView();
      const frontier = frontierView();
      const historical = view.boundary.id !== frontier.boundary.id;
      const capabilities = adapter.capabilities();
      const hasAlternate = capabilities.hasAlternate;
      const patientLost = frontier.patient.status === "Lost";
      app.innerHTML = `
        <section class="workspace live-workspace" aria-labelledby="workspace-title">
          <header class="workspace-topbar">
            <div class="brand-lockup"><span class="brand-sigil" aria-hidden="true">FF</span><div><p>Forked Fates</p><h1 id="workspace-title">The Last Antidote</h1></div></div>
            <div class="status-strip" aria-label="Live branch status">
              <div class="status-cell"><span>Branch</span><strong>${view.branch.kind}</strong></div>
              <div class="status-cell"><span>Completed turn</span><strong>${frontier.clock.turn} <small>/ 12 · ${frontier.clock.turnsRemaining} remain</small></strong></div>
              <div class="status-cell status-patient ${patientLost ? "status-lost" : ""}"><span>Patient</span><strong><i aria-hidden="true"></i> ${escape(frontier.patient.status)}</strong></div>
              <div class="mode-pill mode-pill-strong mode-live"><span class="live-pulse" aria-hidden="true"></span> Live · deterministic</div>
            </div>
            <button class="icon-button" type="button" data-action="restart-live" title="Restart Live session" aria-label="Restart Live session">↻</button>
          </header>
          ${hasAlternate ? renderBranchBar(view) : ""}
          <div class="workspace-body">
            <section class="world-column" aria-labelledby="world-title">
              <div class="panel-heading"><div><p class="section-kicker">World view</p><h2 id="world-title">Turn ${view.boundary.turn} boundary</h2></div><div class="activity-state ${ui.running ? "is-running" : ""}"><span aria-hidden="true"></span>${ui.running ? "Resolving completed boundaries" : `${escape(view.boundary.classification)} · frozen`}</div></div>
              ${historical ? `<div class="historical-banner"><strong>Reviewing turn ${view.boundary.turn}</strong><span>${view.branch.kind} remains at turn ${frontier.boundary.turn}.</span></div>` : ""}
              ${renderLocations(view)}
              <div class="world-legend" aria-label="Information legend"><span class="legend-chip fact">World fact</span><span class="legend-chip claim">Claim</span><span class="legend-chip belief">Belief</span><span class="legend-chip memory">Memory</span></div>
              ${view.outcome ? renderOutcome(view.outcome, view.branch.kind) : renderOutcomePreview(view)}
            </section>
            <section class="timeline-column" aria-labelledby="timeline-title">
              <div class="panel-heading timeline-heading"><div><p class="section-kicker">Authoritative history</p><h2 id="timeline-title">Timeline</h2></div><span class="turn-count">${ui.frontiers[ui.branch] + 1} boundaries</span></div>
              <div class="timeline" aria-label="${view.branch.kind} completed timeline">${renderTimeline(view, frontier)}</div>
              ${renderControls(view, frontier, capabilities)}
            </section>
            <aside class="inspector-column" aria-labelledby="inspector-title">${renderInspector(view)}</aside>
          </div>
          ${ui.composer ? renderComposer(view) : ""}
        </section>`;
    }

    function renderBranchBar(view) {
      return `<nav class="branch-bar" aria-label="Timeline branches"><div><span class="fork-mark" aria-hidden="true">⑂</span><strong>Forked at turn ${adapter.getSession().alternate.forkTurn}</strong><small>Original is immutable · Alternate owns all post-fork state</small></div><div class="branch-tabs" role="tablist"><button role="tab" aria-selected="${ui.branch === "original"}" data-action="switch-branch" data-branch="original">Original</button><button role="tab" aria-selected="${ui.branch === "alternate"}" data-action="switch-branch" data-branch="alternate">Alternate</button>${canCompare() ? `<button class="compare-tab" data-action="open-comparison">Compare branches</button>` : ""}</div></nav>`;
    }

    function renderLocations(view) {
      return `<div class="world-map live-map">${Object.values(view.locations).map((location) => `
        <article class="location-card location-${escape(location.id)}">
          <header><span class="location-marker" aria-hidden="true">${location.id === "clinic" ? "+" : location.id === "square" ? "◇" : "▣"}</span><div><h3>${escape(location.name)}</h3><p>${escape(location.description)}</p></div></header>
          <div class="occupant-list">${location.occupantIds.length ? location.occupantIds.map((id) => renderNpc(view.npcs[id], location.name)).join("") : `<p class="empty-location">No character present</p>`}</div>
          <footer>${location.patientPresent ? `Niko · ${escape(view.patient.status)}` : "Observed location"}</footer>
        </article>`).join("")}</div>`;
    }
    function renderNpc(npc, locationName) {
      const selected = ui.selection.type === "npc" && ui.selection.id === npc.id;
      const moved = ui.movedNpcIds.includes(npc.id);
      return `<button class="npc-token ${selected ? "is-selected" : ""} ${moved ? "is-moving" : ""}" type="button" data-action="select-live-npc" data-npc="${escape(npc.id)}" aria-label="Inspect ${escape(npc.name)}, ${escape(npc.role)}, at ${escape(locationName)}"><span class="portrait portrait-small portrait-${COLOR[npc.id]}" aria-hidden="true">${INITIALS[npc.id]}</span><span><strong>${escape(npc.name.split(" ")[0])}</strong><small>${escape(npc.role)}</small></span><span class="posture-dot" title="${escape(npc.posture)} posture"></span></button>`;
    }
    function renderTimeline(view, frontier) {
      const boundaries = list().slice(0, ui.frontiers[ui.branch] + 1);
      const events = frontier.events;
      return boundaries.map((boundary, index) => {
        const previousEventCount = index === 0 ? 0 : boundaries[index - 1].eventCount;
        const turnEvents = events.slice(previousEventCount, boundary.eventCount);
        const selected = view.boundary.id === boundary.id;
        return `<section class="turn-group ${selected ? "is-selected-turn" : ""}"><button class="turn-header" type="button" data-action="select-live-boundary" data-boundary="${escape(boundary.id)}"><span class="turn-node" aria-hidden="true"></span><span><strong>Turn ${boundary.turn}</strong><small>${escape(boundary.classification)} · ${boundary.eventCount} events</small></span><span class="turn-status">${selected ? "Viewing" : "View"}</span></button><div class="event-list">${turnEvents.map(renderEventCard).join("")}</div></section>`;
      }).join("");
    }
    function renderEventCard(event) {
      const selected = ui.selection.type === "event" && ui.selection.id === event.id;
      const tone = /belief|memory/i.test(event.category) ? "belief" : /claim|communication|accus/i.test(event.category) ? "claim" : "fact";
      return `<button class="event-card event-${tone} ${selected ? "is-selected" : ""} ${event.isIntervention ? "is-intervention" : ""}" type="button" data-action="select-live-event" data-event="${escape(event.id)}" data-turn="${event.turn}"><span class="event-icon" aria-hidden="true">${event.isIntervention ? "✦" : tone === "fact" ? "◇" : tone === "claim" ? "“" : "⌁"}</span><span class="event-copy"><span class="event-meta">${escape(event.category)} · ${escape(event.visibility)}</span><strong>${escape(event.description)}</strong><small>${escape(event.actorName)} · ${escape(event.locationName)}</small></span><span class="event-arrow" aria-hidden="true">›</span></button>`;
    }

    function renderControls(view, frontier, capabilities) {
      const awaitingIntervention = ui.branch === "alternate" && capabilities.alternateNeedsIntervention;
      const complete = branchComplete(ui.branch) && !awaitingIntervention && !capabilities.alternateCanRun;
      const forkable = ui.branch === "original" && !capabilities.hasAlternate && view.boundary.turn <= 10 && view.boundary.classification !== "post-intervention";
      const status = awaitingIntervention ? "Awaiting exactly one typed intervention" : capabilities.alternateCanRun && ui.branch === "alternate" ? "Intervention frozen · future ready to resolve" : complete ? "Branch outcome complete" : ui.running ? "Resolving next completed boundary" : `Turn ${frontier.boundary.turn} complete · next boundary ready`;
      return `<div class="playback-control"><div class="playback-status"><span>${view.branch.kind} · frozen boundaries</span><strong>${status}</strong></div><div class="playback-buttons" role="group" aria-label="Live playback controls"><button class="button button-compact" data-action="live-step" ${ui.running || complete || awaitingIntervention || capabilities.alternateCanRun ? "disabled" : ""}>Step →</button><button class="button button-compact button-run" data-action="live-run" ${ui.running || complete || awaitingIntervention || capabilities.alternateCanRun ? "disabled" : ""}>Run ▶</button><button class="button button-compact button-pause" data-action="live-pause" ${ui.running ? "" : "disabled"}>Pause Ⅱ</button></div>${forkable ? `<button class="button button-fork" data-action="open-fork">Fork from turn ${view.boundary.turn} <span aria-hidden="true">⑂</span></button>` : ""}${capabilities.alternateCanRun && ui.branch === "alternate" ? `<button class="button button-primary button-resolve" data-action="resolve-alternate">Resolve Alternate future</button>` : ""}${canCompare() ? `<button class="button button-primary button-resolve" data-action="open-comparison">Compare outcomes</button>` : ""}</div>`;
    }

    function renderInspector(view) {
      if (ui.selection.type === "npc" && view.npcs[ui.selection.id]) return renderNpcInspector(view.npcs[ui.selection.id], view);
      const event = view.events.find((item) => item.id === ui.selection.id) || view.events.at(-1) || null;
      if (!event) return `<div class="inspector-header"><div><p class="section-kicker">Inspector</p><h2 id="inspector-title">Starting boundary</h2></div></div><p class="empty-copy">Select a character or completed event.</p>`;
      return renderEventInspector(event, view);
    }
    function renderNpcInspector(npc, view) {
      const memories = npc.memories.slice(-6).reverse();
      const trust = Object.entries(npc.trust).map(([id, value]) => `<li><span>${escape(view.npcs[id]?.name || id)}</span><span class="trust-value ${value < -24 ? "trust-distrusted" : value > 24 ? "trust-trusted" : "trust-neutral"}">${value > 0 ? "+" : ""}${value}</span></li>`).join("");
      return `<div class="inspector-header"><div><p class="section-kicker">NPC inspector · owned perspective</p><h2 id="inspector-title">${escape(npc.name)}</h2></div><span class="portrait portrait-${COLOR[npc.id]}" aria-hidden="true">${INITIALS[npc.id]}</span></div><div class="identity-line"><span>${escape(npc.role)}</span><span>${escape(view.locations[npc.locationId].name)}</span><span>${escape(npc.posture)}</span></div><div class="inspector-scroll"><section class="inspector-section"><h3>Character definition</h3><div class="trait-list">${npc.traits.map((trait) => `<span>${escape(trait)}</span>`).join("")}</div><p class="item-line"><span>Owned inventory</span><strong>${npc.inventory.length ? npc.inventory.map(escape).join(", ") : "None"}</strong></p></section><section class="inspector-section"><h3>Goals</h3>${npc.goals.map((goal) => `<div class="goal-row"><span>${escape(goal.priority)}</span><p>${escape(goal.description)}</p><small>${escape(goal.status)}</small></div>`).join("")}</section><section class="inspector-section"><h3>Directed trust</h3><ul class="trust-list">${trust}</ul></section><section class="inspector-section"><div class="section-label-row"><h3><span class="type-dot belief"></span>Beliefs</h3><small>Not world truth</small></div>${npc.beliefs.map((belief) => `<article class="belief-card"><div><strong>${escape(belief.stance)}</strong><span>${belief.confidence}%</span></div><p>${escape(belief.propositionId)}</p><small>Updated turn ${belief.updatedTurn}</small></article>`).join("") || `<p class="empty-copy">No beliefs recorded yet.</p>`}</section><section class="inspector-section"><div class="section-label-row"><h3><span class="type-dot memory"></span>Relevant memories</h3><small>${memories.length} of ${npc.memories.length}</small></div><div class="memory-list">${memories.map((memory) => `<article class="memory-card"><span>Turn ${memory.turn} · ${escape(memory.salience)}</span><p>${escape(memory.description)}</p><small>${escape(memory.source)} · ${escape(memory.visibility)}</small></article>`).join("")}</div></section></div>`;
    }
    function renderEventInspector(event, view) {
      const cited = event.citedMemoryIds.map((id) => Object.values(view.npcs).flatMap((npc) => npc.memories).find((memory) => memory.id === id)).filter(Boolean);
      return `<div class="inspector-header event-inspector-header"><div><p class="section-kicker">Event inspector</p><h2 id="inspector-title">Turn ${event.turn} · ${escape(event.phaseLabel)}</h2></div><span class="event-type-badge event-fact">${escape(event.category)}</span></div><div class="identity-line"><span>${escape(event.actorName)}</span><span>${escape(event.locationName)}</span><span>${escape(event.visibility)}</span></div><div class="inspector-scroll"><section class="inspector-section event-lede"><h3>What happened</h3><p>${escape(event.description)}</p></section><section class="inspector-section rationale-box"><p class="detail-label">Declared rationale</p><blockquote>${escape(event.rationale || "World resolution event")}</blockquote><p class="goal-served"><span>Goal served</span>${escape(event.goalId || "Authoritative consequence")}</p></section><section class="inspector-section"><h3>Witnesses & memories</h3><dl class="event-details"><div><dt>Witnesses</dt><dd>${event.witnessIds.map((id) => escape(view.npcs[id]?.name || id)).join(", ") || "None"}</dd></div><div><dt>Memories created</dt><dd>${event.createdMemoryIds.length ? event.createdMemoryIds.map((id) => `<code>${escape(id)}</code>`).join(" ") : "None"}</dd></div></dl></section><section class="inspector-section"><div class="section-label-row"><h3><span class="type-dot memory"></span>Cited memories</h3><small>${cited.length}</small></div>${cited.map((memory) => `<article class="memory-card compact"><span>${escape(memory.id)}</span><p>${escape(memory.description)}</p></article>`).join("") || `<p class="empty-copy">No owned memory cited.</p>`}</section><section class="inspector-section"><h3>Immediate consequences</h3><ul class="change-list">${event.changeLines.map((line) => `<li>${escape(line)}</li>`).join("") || `<li>No authoritative state change.</li>`}</ul></section><section class="inspector-section"><h3>Authoritative causal predecessors</h3>${event.causes.map((id) => `<button class="cause-link" data-action="select-live-event" data-event="${escape(id)}" data-turn="${event.turn}">${escape(id)} <span aria-hidden="true">↗</span></button>`).join("") || `<p class="empty-copy">This event is a causal root.</p>`}</section></div>`;
    }
    function renderOutcomePreview(view) {
      return `<section class="outcome-preview"><div><p class="section-kicker">Outcome preview</p><h2>The branch is still in motion</h2><p>Only frozen completed boundaries are visible. The authoritative outcome resolves by turn twelve.</p></div><dl><div><dt>Medical</dt><dd>Pending</dd></div><div><dt>Truth</dt><dd>Pending</dd></div><div><dt>Social</dt><dd>Pending</dd></div></dl></section>`;
    }
    function renderOutcome(outcome, kind) {
      return `<section class="completed-outcome"><header><div><p class="section-kicker">${escape(kind)} outcome</p><h2>${escape(outcome.medical)} · ${escape(outcome.truth)} · ${escape(outcome.social)}</h2></div><span class="outcome-complete-mark">Branch complete</span></header><dl class="outcome-results"><div class="outcome-result"><dt>Medical</dt><dd>${escape(outcome.medical)}</dd><p>${outcome.treatmentTurn ? `Treatment completed at turn ${outcome.treatmentTurn}.` : "No treatment before the deadline."}</p></div><div class="outcome-result"><dt>Truth</dt><dd>${escape(outcome.truth)}</dd><p>${outcome.attribution.truthEventIds.length} authoritative supporting event(s).</p></div><div class="outcome-result"><dt>Social</dt><dd>${escape(outcome.social)}</dd><p>${outcome.attribution.socialEventIds.length} trust or consensus contributor(s).</p></div></dl></section>`;
    }

    function renderComposer(view) {
      const category = ui.interventionCategory;
      const ownerRows = Object.values(view.npcs).filter((npc) => npc.inventory.length).flatMap((npc) => npc.inventory.map((item) => ({ item, owner: npc.id, location: npc.locationId })));
      const transfer = ownerRows[0];
      const recipients = transfer ? Object.values(view.npcs).filter((npc) => npc.id !== transfer.owner && npc.locationId === transfer.location) : [];
      return `<div class="modal-backdrop"><section class="intervention-modal" role="dialog" aria-modal="true" aria-labelledby="fork-title"><header><div><p class="section-kicker">Counterfactual intervention</p><h2 id="fork-title">Fork turn ${view.boundary.turn}</h2></div><button class="icon-button" data-action="close-fork" aria-label="Close intervention composer">×</button></header><p class="modal-lede">The Original stays immutable. The Alternate receives exactly one typed World event at this frozen boundary.</p><div class="intervention-tabs" role="tablist">${["Information", "ItemTransfer", "EnvironmentalEvent"].map((name) => `<button role="tab" aria-selected="${category === name}" data-action="set-intervention-category" data-category="${name}">${name === "ItemTransfer" ? "Item transfer" : name === "EnvironmentalEvent" ? "Environmental" : name}</button>`).join("")}</div><form id="intervention-form" class="intervention-form">${category === "Information" ? `<label>Recipient<select id="intervention-recipient">${Object.values(view.npcs).map((npc) => `<option value="${npc.id}">${escape(npc.name)}</option>`).join("")}</select></label><label>Information<select id="intervention-proposition">${PROPOSITIONS.map(([id, label]) => `<option value="${id}">${escape(label)}</option>`).join("")}</select></label><label>Confidence<input id="intervention-confidence" type="number" min="0" max="100" value="90"></label><label class="form-wide">Event description<input id="intervention-description" maxlength="280" value="A sealed record supplies new evidence at the completed boundary."></label>` : category === "ItemTransfer" ? (transfer && recipients.length ? `<label>Item<input id="intervention-item" value="${escape(transfer.item)}" readonly></label><label>From<input id="intervention-from" value="${escape(transfer.owner)}" readonly></label><label>To<select id="intervention-to">${recipients.map((npc) => `<option value="${npc.id}">${escape(npc.name)}</option>`).join("")}</select></label><label class="form-wide">Event description<input id="intervention-description" maxlength="280" value="An external handoff transfers the item between co-located characters."></label>` : `<div class="form-empty">No legal co-located item transfer exists at this boundary. Choose another turn or intervention type.</div>`) : `<label>Location<select id="intervention-location">${Object.values(view.locations).map((location) => `<option value="${location.id}">${escape(location.name)}</option>`).join("")}</select></label><label>Condition ID<input id="intervention-condition" value="condition-smoke"></label><label>State<select id="intervention-condition-state"><option value="active">Active</option><option value="cleared">Cleared</option></select></label><label class="form-wide">Event description<input id="intervention-description" maxlength="280" value="Smoke becomes directly observable at this location."></label>`}</form><div class="intervention-preview"><span>Typed event</span><strong>${escape(category)}</strong><small>Validated by the Intervention Layer, then resolved only by World rules.</small></div><footer><button class="button button-secondary" data-action="apply-demo-intervention" ${view.boundary.turn === demoConfig?.forkTurn ? "" : "disabled"}>Use approved demo intervention</button><button class="button button-primary" data-action="apply-intervention" ${category === "ItemTransfer" && (!transfer || !recipients.length) ? "disabled" : ""}>Create Alternate event →</button></footer></section></div>`;
    }

    function renderComparison() {
      const result = adapter.compare();
      const changed = result.changedIntents.slice(0, 8);
      app.innerHTML = `<section class="comparison-screen" aria-labelledby="comparison-title"><header class="comparison-header"><div><button class="text-button" data-action="close-comparison">← Back to timelines</button><p class="eyebrow"><span class="eyebrow-mark"></span>Validated branch comparison</p><h1 id="comparison-title">One event. Two causal futures.</h1><p>Shared through turn ${result.sharedPrefix.throughTurn}; the first changed autonomous decision appears at turn ${changed[0]?.turn ?? "—"}.</p></div><div class="comparison-seal"><span>Integrity ${escape(result.integritySchemaVersion)}</span><strong>Original remained immutable</strong></div></header><section class="fork-summary"><div><span>Shared prefix</span><strong>Turns 0–${result.sharedPrefix.throughTurn}</strong></div><div class="fork-arrow" aria-hidden="true">⑂</div><div><span>Intervention</span><strong>${escape(result.fork.interventionEventId)}</strong></div></section><div class="comparison-grid">${renderOutcomeColumn("Original", result.outcomes.original, result.deltas.antidote.original, "original")}${renderOutcomeColumn("Alternate", result.outcomes.alternate, result.deltas.antidote.alternate, "alternate")}</div><section class="divergence-panel"><div class="section-heading"><div><p class="section-kicker">First divergence and changed decisions</p><h2>Autonomous intent deltas</h2></div><p>These are deterministic comparisons. They are not invented causal edges.</p></div><div class="decision-deltas">${changed.map((change) => `<article><span>Turn ${change.turn} · ${escape(change.actorId)}</span><div><p><small>Original</small>${escape(change.original?.action || "No intent")} — ${escape(change.original?.rationale || "")}</p><i aria-hidden="true">→</i><p><small>Alternate</small>${escape(change.alternate?.action || "No intent")} — ${escape(change.alternate?.rationale || "")}</p></div></article>`).join("")}</div></section><section class="comparison-details"><article><p class="section-kicker">Trust changes</p><h2>${result.deltas.trust.length} directed relationships changed</h2>${result.deltas.trust.map((row) => `<p class="delta-row"><span>${escape(row.actorId)} → ${escape(row.targetId)}</span><strong>${row.original} → ${row.alternate} (${row.delta > 0 ? "+" : ""}${row.delta})</strong></p>`).join("") || `<p>No trust deltas.</p>`}</article><article><p class="section-kicker">Antidote path</p><h2>Physical state at conclusion</h2><p class="delta-row"><span>Original holder</span><strong>${escape(result.deltas.antidote.original.possessorId || result.deltas.antidote.original.locationId || "used")}</strong></p><p class="delta-row"><span>Alternate holder</span><strong>${escape(result.deltas.antidote.alternate.possessorId || result.deltas.antidote.alternate.locationId || "used")}</strong></p></article><article><p class="section-kicker">Causal support</p><h2>Authoritative vs comparison-only</h2><p>${result.causalSupport.alternate.edges.length} authoritative event-cause edges support the Alternate outcome.</p><p>${result.causalSupport.comparisonLinks.length} decision-change link is explicitly labeled comparison-only.</p></article></section><section class="causal-path-panel"><p class="section-kicker">Alternate outcome support</p><h2>Validated authoritative event path</h2><div class="causal-path">${result.causalSupport.alternate.events.slice().sort((a, b) => a.turn - b.turn).slice(-12).map((event) => `<button data-action="jump-comparison-event" data-event="${escape(event.id)}" data-turn="${event.turn}"><span>Turn ${event.turn}</span><strong>${escape(event.category)}</strong><small>${escape(event.description)}</small></button>`).join("<i aria-hidden=\"true\">→</i>")}</div>${result.causalSupport.comparisonLinks.map((link) => `<p class="comparison-only-note"><strong>Comparison-only link:</strong> ${escape(link.label)}</p>`).join("")}</section></section>`;
    }
    function renderOutcomeColumn(label, outcome, antidote, branch) {
      return `<article class="branch-outcome branch-${branch}"><header><span>${label}</span><strong>${branch === "original" ? "Immutable reference" : "Counterfactual"}</strong></header><div class="outcome-triplet"><div><small>Medical</small><strong>${escape(outcome.medical)}</strong></div><div><small>Truth</small><strong>${escape(outcome.truth)}</strong></div><div><small>Social</small><strong>${escape(outcome.social)}</strong></div></div><p>Antidote: ${escape(antidote.used ? "used" : antidote.possessorId ? `held by ${antidote.possessorId}` : `at ${antidote.locationId}`)}</p></article>`;
    }

    function step() {
      if (branchComplete(ui.branch)) return;
      const before = frontierView();
      const boundaries = list();
      ui.frontiers[ui.branch] += 1;
      const nextId = boundaries[ui.frontiers[ui.branch]].id;
      ui.selections[ui.branch] = nextId;
      const after = adapter.viewAt(ui.branch, nextId);
      ui.movedNpcIds = Object.keys(after.npcs).filter((id) => before.npcs[id].locationId !== after.npcs[id].locationId);
      ui.selection = { type: "event", id: after.currentTurnEvents[0]?.id || after.events.at(-1)?.id || null };
      render();
      announce(`${after.branch.kind} turn ${after.boundary.turn} ${after.boundary.classification} complete. ${after.clock.turnsRemaining} turns remain.`);
    }
    function run() {
      if (ui.running || branchComplete(ui.branch)) return;
      ui.running = true;
      render();
      function tick() {
        runTimer = null;
        if (!ui.running) return;
        step();
        if (!branchComplete(ui.branch)) {
          ui.running = true;
          runTimer = win.setTimeout(tick, 360);
        } else {
          ui.running = false;
          render();
          announce(`${selectedView().branch.kind} outcome complete.`);
        }
      }
      runTimer = win.setTimeout(tick, 360);
    }
    function value(id, fallback = "") { return doc.getElementById(id)?.value ?? fallback; }
    function interventionRequest(view) {
      const suffix = `${ui.interventionCategory.toLowerCase()}-t${String(view.boundary.turn).padStart(2, "0")}`;
      if (ui.interventionCategory === "Information") return { id: `ui-${suffix}`, category: "Information", boundaryTurn: view.boundary.turn, payload: { recipientId: value("intervention-recipient", "mara"), propositionId: value("intervention-proposition", "fact-case-spare-key"), truthStatus: "true-evidence", beliefStance: "believes-true", confidence: Number(value("intervention-confidence", 90)), description: value("intervention-description", "A new piece of evidence arrives.") } };
      if (ui.interventionCategory === "ItemTransfer") return { id: `ui-${suffix}`, category: "ItemTransfer", boundaryTurn: view.boundary.turn, payload: { itemId: value("intervention-item"), fromId: value("intervention-from"), toId: value("intervention-to"), description: value("intervention-description") } };
      return { id: `ui-${suffix}`, category: "EnvironmentalEvent", boundaryTurn: view.boundary.turn, payload: { locationId: value("intervention-location", "clinic"), conditionId: value("intervention-condition", "condition-smoke"), conditionState: value("intervention-condition-state", "active"), description: value("intervention-description") } };
    }
    function applyIntervention(request) {
      try {
        const post = adapter.applyIntervention(request);
        ui.composer = false;
        ui.selections.alternate = post.boundary.id;
        ui.frontiers.alternate = list("alternate").findIndex((boundary) => boundary.id === post.boundary.id);
        ui.selection = { type: "event", id: post.currentTurnEvents.at(-1)?.id || post.events.at(-1)?.id };
        render();
        announce("Intervention validated and resolved as an authoritative World event. Alternate is ready to continue.");
      } catch (error) { fail(error); }
    }

    function handleAction(control) {
      const action = control.dataset.action;
      if (action === "retry-live") { ui.error = null; adapter = null; start(); return true; }
      if (action === "use-recorded") { stopTimer(); useRecorded(); return true; }
      if (!adapter) return false;
      if (action === "restart-live") { stopTimer(); adapter = null; Object.assign(ui, { branch: "original", frontiers: { original: 0, alternate: 0 }, selections: { original: null, alternate: null }, selection: { type: "event", id: null }, error: null, composer: false, compare: false }); start(); return true; }
      if (action === "live-step") { step(); return true; }
      if (action === "live-run") { run(); return true; }
      if (action === "live-pause") { stopTimer(); render(); announce(`Playback paused at completed turn ${frontierView().boundary.turn}.`); return true; }
      if (action === "select-live-npc") { ui.selection = { type: "npc", id: control.dataset.npc }; render(); announce(`${selectedView().npcs[control.dataset.npc].name} owned perspective opened.`); return true; }
      if (action === "select-live-boundary") { ui.selections[ui.branch] = control.dataset.boundary; const view = selectedView(); ui.selection = { type: "event", id: view.currentTurnEvents[0]?.id || view.events.at(-1)?.id }; render(); return true; }
      if (action === "select-live-event") { const event = frontierView().events.find((item) => item.id === control.dataset.event); if (event) { const boundary = list().filter((item) => item.turn === event.turn).at(-1); ui.selections[ui.branch] = boundary.id; ui.selection = { type: "event", id: event.id }; render(); } return true; }
      if (action === "open-fork") { stopTimer(); try { const view = selectedView("original"); adapter.forkAt(view.boundary.turn); ui.branch = "alternate"; ui.frontiers.alternate = list("alternate").length - 1; ui.selections.alternate = list("alternate").at(-1).id; ui.composer = true; ui.selection = { type: "event", id: selectedView("alternate").events.at(-1)?.id }; render(); announce(`Alternate forked from completed turn ${view.boundary.turn}. Choose exactly one intervention.`); } catch (error) { fail(error); } return true; }
      if (action === "close-fork") { ui.composer = false; render(); return true; }
      if (action === "set-intervention-category") { ui.interventionCategory = control.dataset.category; render(); return true; }
      if (action === "apply-demo-intervention") { applyIntervention(demoConfig.intervention); return true; }
      if (action === "apply-intervention") { applyIntervention(interventionRequest(selectedView())); return true; }
      if (action === "resolve-alternate") { try { adapter.completeAlternate(); render(); announce("Alternate future resolved deterministically. Use Step or Run to reveal its frozen boundaries."); } catch (error) { fail(error); } return true; }
      if (action === "switch-branch") { stopTimer(); ui.branch = control.dataset.branch; ui.composer = false; ui.compare = false; const view = selectedView(); ui.selection = { type: "event", id: view.events.at(-1)?.id || null }; render(); announce(`${view.branch.kind} timeline selected.`); return true; }
      if (action === "open-comparison") { ui.compare = true; render(); announce("Validated side-by-side branch comparison opened."); return true; }
      if (action === "close-comparison") { ui.compare = false; render(); return true; }
      if (action === "jump-comparison-event") { ui.compare = false; ui.branch = "alternate"; const boundary = list("alternate").filter((item) => item.turn === Number(control.dataset.turn)).at(-1); ui.selections.alternate = boundary.id; ui.selection = { type: "event", id: control.dataset.event }; render(); return true; }
      return false;
    }

    return Object.freeze({ start, render, handleAction });
  }

  return Object.freeze({ create });
});
