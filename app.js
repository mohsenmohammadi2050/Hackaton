(function initializeForkedFates() {
  "use strict";

  const data = window.FORKED_FATES_PHASE1;
  const app = document.getElementById("app");
  const announcer = document.getElementById("announcer");

  if (!data || !app) {
    throw new Error("Forked Fates Recorded data failed to load.");
  }

  const state = {
    screen: "start",
    mode: "recorded",
    currentTurn: 0,
    selectedTurn: 0,
    isRunning: false,
    recordedStatus: "Ready",
    followRecorded: true,
    selection: { type: "event", id: "evt-shared-t00-start" }
  };

  let runTimer = null;
  let livePresentation = null;

  const characterEntries = Object.entries(data.characters);
  const locationEntries = Object.entries(data.locations);

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function characterName(id) {
    return data.characters[id]?.name || id;
  }

  function announce(message) {
    announcer.textContent = "";
    window.setTimeout(() => {
      announcer.textContent = message;
    }, 20);
  }

  function capturePresentationScroll() {
    const timeline = document.querySelector?.(".timeline");
    const inspector = document.querySelector?.(".inspector-scroll");
    return {
      pageX: window.scrollX || window.pageXOffset || 0,
      pageY: window.scrollY || window.pageYOffset || 0,
      timelineTop: timeline?.scrollTop || 0,
      inspectorTop: inspector?.scrollTop || 0
    };
  }

  function restorePresentationScroll(snapshot, options = {}) {
    if (!snapshot) return;
    const restore = () => {
      const timeline = document.querySelector?.(".timeline");
      const inspector = document.querySelector?.(".inspector-scroll");
      if (timeline) timeline.scrollTop = options.timelineToEnd ? timeline.scrollHeight : snapshot.timelineTop;
      if (inspector) inspector.scrollTop = options.inspectorToTop ? 0 : snapshot.inspectorTop;
      if (typeof window.scrollTo === "function") window.scrollTo(snapshot.pageX, snapshot.pageY);
    };
    restore();
    window.requestAnimationFrame?.(restore);
  }

  function focusMainWithoutScroll() {
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }

  function renderStart() {
    app.innerHTML = `
      <section class="screen start-screen" aria-labelledby="product-title">
        <div class="start-orbit orbit-one" aria-hidden="true"></div>
        <div class="start-orbit orbit-two" aria-hidden="true"></div>
        <div class="start-copy">
          <p class="eyebrow"><span class="eyebrow-mark"></span>${escapeHtml(data.product.type)}</p>
          <h1 id="product-title">${escapeHtml(data.product.name)}</h1>
          <p class="promise">${escapeHtml(data.product.promise)}</p>
          <div class="scenario-intro">
            <span class="scenario-number">Scenario 01</span>
            <h2>${escapeHtml(data.product.scenario)}</h2>
            <p>${escapeHtml(data.product.premise)}</p>
            <div class="stakes-line" aria-label="Scenario stakes">
              <span><strong>4</strong> characters</span>
              <span><strong>1</strong> missing vial</span>
              <span><strong>12</strong> turns</span>
            </div>
          </div>
          <div class="start-actions start-primary-choices">
            <button class="button button-primary mode-choice" type="button" data-action="open-briefing" data-mode="ai-live" aria-label="Start AI Live Simulation">
              <strong>Start AI Live</strong><span>Real model-backed character decisions</span>
            </button>
            <button class="button button-secondary mode-choice" type="button" data-action="watch-recorded" aria-label="Explore Recorded Demo">
              <strong>Explore Demo</strong><span>Reliable prebuilt experience</span>
            </button>
          </div>
          <div class="mode-explanations" aria-label="Experience descriptions">
            <p><strong>AI Live:</strong> Characters controlled by real language-model decisions.</p>
            <p><strong>Explore Demo:</strong> A reliable prebuilt run in the complete product workspace.</p>
          </div>
          <details class="advanced-modes">
            <summary>Advanced / Testing Modes</summary>
            <p>Deterministic Simulation is designed for testing and reproducibility.</p>
            <button class="button button-tertiary" type="button" data-action="open-briefing" data-mode="deterministic">Start Deterministic Simulation</button>
          </details>
        </div>
        <aside class="start-art" aria-label="The Last Antidote scenario motif">
          <div class="vial-glow" aria-hidden="true">
            <span class="vial-cap"></span>
            <span class="vial-body"><span class="vial-liquid"></span></span>
          </div>
          <p>One belief can redirect every choice that follows.</p>
        </aside>
      </section>
    `;
  }

  function renderBriefing() {
    const isLive = state.mode === "ai-live";
    const isDeterministic = state.mode === "deterministic";
    const modeLabel = isLive ? "AI Live" : isDeterministic ? "Deterministic" : "Recorded";
    const cast = characterEntries.map(([id, npc]) => `
      <article class="brief-card">
        <img class="portrait portrait-image" src="assets/${escapeHtml(id)}.svg" alt="">
        <div>
          <p class="role-label">${escapeHtml(npc.role)}</p>
          <h3>${escapeHtml(npc.name)}</h3>
          <p>${escapeHtml(npc.publicDescription)}</p>
        </div>
      </article>
    `).join("");

    app.innerHTML = `
      <section class="screen briefing-screen" aria-labelledby="briefing-title">
        <header class="briefing-header">
          <button class="text-button" type="button" data-action="back-start"><span aria-hidden="true">←</span> Back to Start</button>
          <div class="mode-pill ${isLive ? "mode-live" : ""}"><span class="record-dot" aria-hidden="true"></span> ${modeLabel}</div>
        </header>
        <div class="briefing-hero">
          <div>
            <p class="eyebrow"><span class="eyebrow-mark"></span>Scenario briefing</p>
            <h1 id="briefing-title">The Last Antidote</h1>
            <p class="briefing-lede">Niko has been poisoned. The village's only antidote is missing from the Clinic, and nightfall is twelve turns away.</p>
          </div>
          <div class="deadline-card">
            <span class="deadline-number">12</span>
            <span>turns until<br>nightfall</span>
          </div>
        </div>
        <section aria-labelledby="cast-title">
          <div class="section-heading">
            <div>
              <p class="section-kicker">The cast</p>
              <h2 id="cast-title">Four people. Partial truths.</h2>
            </div>
            <p>Each character acts from their own goals, trust, and memories. Nobody begins with the whole story.</p>
          </div>
          <div class="brief-grid">${cast}</div>
        </section>
        <div class="briefing-footer">
          <div class="briefing-note">
            <span class="note-icon" aria-hidden="true">i</span>
            <p><strong>Perspective view</strong> lets you inspect each character's owned memories, beliefs, trust, and declared decisions without revealing hidden world truth.</p>
          </div>
          <button class="button button-primary" type="button" data-action="enter-world">${isLive ? "Connect and start AI Live" : isDeterministic ? "Start deterministic simulation" : "Explore precomputed story"} <span aria-hidden="true">→</span></button>
        </div>
      </section>
    `;
  }

  function renderWorkspace(options = {}) {
    if (state.mode !== "recorded") {
      renderLiveWorkspace();
      return;
    }
    const scroll = capturePresentationScroll();
    const snapshot = data.snapshots[state.selectedTurn];
    const currentSnapshot = data.snapshots[state.currentTurn];
    const isHistorical = state.selectedTurn !== state.currentTurn;
    const branchComplete = state.currentTurn === data.originalOutcome.turn;
    const patientLost = currentSnapshot.patient.startsWith("Lost");

    app.innerHTML = `
      <section class="workspace" aria-labelledby="workspace-title">
        <header class="workspace-topbar">
          <div class="brand-lockup">
            <span class="brand-sigil" aria-hidden="true">FF</span>
            <div>
              <p>Forked Fates</p>
              <h1 id="workspace-title">The Last Antidote</h1>
            </div>
          </div>
          <div class="status-strip" aria-label="Current branch status">
            <div class="status-cell"><span>Branch</span><strong>Original</strong></div>
            <div class="status-cell"><span>Current turn</span><strong>${state.currentTurn} <small>/ 12 · ${currentSnapshot.turnsRemaining} remain</small></strong></div>
            <div class="status-cell status-patient ${patientLost ? "status-lost" : ""}"><span>Patient</span><strong><i aria-hidden="true"></i> ${patientLost ? "Lost" : "Untreated"}</strong></div>
            <div class="mode-pill mode-pill-strong"><span class="record-dot" aria-hidden="true"></span> Recorded</div>
          </div>
          <div class="workspace-nav-actions"><button class="text-button" type="button" data-action="back-start">Back to Start</button><button class="icon-button" type="button" data-action="restart" title="Restart recorded session" aria-label="Restart recorded session">↻</button></div>
        </header>

        <div class="workspace-body">
          <section class="world-column" aria-labelledby="world-title">
            <div class="panel-heading">
              <div>
                <p class="section-kicker">World view</p>
                <h2 id="world-title">Turn ${state.selectedTurn} boundary</h2>
              </div>
              <div class="activity-state ${state.isRunning ? "is-running" : ""}"><span aria-hidden="true"></span>${state.isRunning ? "Recorded playback running" : escapeHtml(snapshot.activity)}</div>
            </div>
            ${isHistorical ? `<div class="historical-banner"><strong>Reviewing turn ${state.selectedTurn}</strong><span>Current branch remains at turn ${state.currentTurn}.</span></div>` : ""}
            ${renderRecordedStoryBeat(snapshot)}
            <div class="world-map">${renderLocations(snapshot)}</div>
            <div class="world-legend" aria-label="Information legend">
              <span class="legend-chip fact">World fact</span>
              <span class="legend-chip claim">Claim</span>
              <span class="legend-chip belief">Belief</span>
              <span class="legend-chip memory">Memory</span>
            </div>
            ${branchComplete ? renderCompletedOutcome() : renderOutcomePreview()}
          </section>

          <section class="timeline-column" aria-labelledby="timeline-title">
            <div class="panel-heading timeline-heading">
              <div>
                <p class="section-kicker">Recorded history</p>
                <h2 id="timeline-title">Timeline</h2>
              </div>
              <span class="turn-count">${state.currentTurn + 1} boundaries</span>
            </div>
            <div class="timeline" aria-label="Recorded timeline">${renderTimeline()}</div>
            ${renderPlaybackControls(branchComplete)}
          </section>

          <aside class="inspector-column" aria-labelledby="inspector-title">
            ${renderInspector()}
          </aside>
        </div>
      </section>
    `;
    restorePresentationScroll(scroll, options);
  }

  function renderLiveWorkspace() {
    if (livePresentation) livePresentation.render();
    else startLiveSession();
  }

  function renderRecordedStoryBeat(snapshot) {
    const turnEvents = data.events.filter((event) => event.turn === state.selectedTurn && event.actor);
    const actions = turnEvents.slice(0, 4).map((event) => {
      const actor = data.characters[event.actor];
      return `<button type="button" data-action="select-event" data-event="${escapeHtml(event.id)}"><img src="assets/${escapeHtml(event.actor)}.svg" alt=""><span><strong>${escapeHtml(actor.name)}</strong><small>${escapeHtml(event.category)} · ${escapeHtml(event.summary)}</small></span></button>`;
    }).join("");
    return `<section class="story-beat recorded-story-beat" aria-label="Selected recorded story summary"><div class="story-beat-copy"><p class="section-kicker">Recorded story beat</p><h3>${escapeHtml(snapshot.activity)}</h3><div class="story-actions">${actions || `<p class="empty-copy">The immutable starting boundary is ready.</p>`}</div></div><div class="story-vitals"><div><span>Patient</span><strong>${escapeHtml(snapshot.patient)}</strong></div><div><span>Branch</span><strong>Original</strong></div><div><span>Turns left</span><strong>${snapshot.turnsRemaining}</strong></div></div></section>`;
  }

  function renderLocations(snapshot) {
    return locationEntries.map(([locationId, location]) => {
      const occupants = snapshot.locations[locationId] || [];
      const occupantMarkup = occupants.length
        ? occupants.map((npcId) => renderNpcToken(npcId, locationId)).join("")
        : `<p class="empty-location">No character present</p>`;

      return `
        <article class="location-card location-${locationId}">
          <img class="location-illustration" src="assets/${escapeHtml(locationId)}.svg" alt="">
          <header>
            <span class="location-marker" aria-hidden="true">${escapeHtml(location.marker)}</span>
            <div>
              <h3>${escapeHtml(location.name)}</h3>
              <p>${escapeHtml(location.description)}</p>
            </div>
          </header>
          <div class="occupant-list">${occupantMarkup}</div>
          <footer>${escapeHtml(location.contents)}</footer>
        </article>
      `;
    }).join("");
  }

  function renderNpcToken(id, locationId) {
    const npc = data.characters[id];
    const npcState = npcStateAt(id, state.selectedTurn);
    const selected = state.selection.type === "npc" && state.selection.id === id;
    return `
      <button class="npc-token ${selected ? "is-selected" : ""}" type="button" data-action="select-npc" data-npc="${escapeHtml(id)}" aria-label="Inspect ${escapeHtml(npc.name)}, ${escapeHtml(npc.role)}, at ${escapeHtml(data.locations[locationId].name)}">
        <img class="portrait portrait-small portrait-image" src="assets/${escapeHtml(id)}.svg" alt="">
        <span><strong>${escapeHtml(npc.shortName)}</strong><small>${escapeHtml(npc.role)}</small></span>
        <span class="posture-dot" title="${escapeHtml(npcState.posture)} posture" aria-label="${escapeHtml(npcState.posture)} posture"></span>
      </button>
    `;
  }

  function renderTimeline() {
    const turns = [];
    for (let turn = 0; turn <= state.currentTurn; turn += 1) {
      const events = data.events.filter((event) => event.turn === turn).sort((a, b) => a.order - b.order);
      turns.push(`
        <section class="turn-group ${state.selectedTurn === turn ? "is-selected-turn" : ""}">
          <button class="turn-header" type="button" data-action="select-turn" data-turn="${turn}" aria-label="Review completed turn ${turn}">
            <span class="turn-node" aria-hidden="true"></span>
            <span><strong>Turn ${turn}</strong><small>${turn === 0 ? "Starting boundary" : `Complete · ${data.snapshots[turn].turnsRemaining} turn${data.snapshots[turn].turnsRemaining === 1 ? "" : "s"} remain`}</small></span>
            <span class="turn-status">${state.selectedTurn === turn ? "Viewing" : "View"}</span>
          </button>
          <div class="event-list">
            ${events.map(renderTimelineEvent).join("")}
          </div>
        </section>
      `);
    }
    return turns.join("");
  }

  function renderTimelineEvent(event) {
    const actor = event.actor ? data.characters[event.actor] : null;
    const selected = state.selection.type === "event" && state.selection.id === event.id;
    const showPivotal = state.currentTurn === data.originalOutcome.turn && event.pivotal;
    return `
      <button class="event-card event-${escapeHtml(event.tone)} ${selected ? "is-selected" : ""} ${showPivotal ? "is-pivotal" : ""}" type="button" data-action="select-event" data-event="${escapeHtml(event.id)}">
        <span class="event-icon" aria-hidden="true">${event.tone === "fact" ? "◇" : event.tone === "claim" ? "“" : "⌁"}</span>
        <span class="event-copy">
          <span class="event-meta">${escapeHtml(event.category)} · ${escapeHtml(event.visibility)}${showPivotal ? " · Pivotal" : ""}</span>
          <strong>${escapeHtml(event.summary)}</strong>
          <small>${actor ? `${escapeHtml(actor.name)} · ` : ""}${escapeHtml(event.location)}</small>
        </span>
        <span class="event-arrow" aria-hidden="true">›</span>
      </button>
    `;
  }

  function renderInspector() {
    if (state.selection.type === "npc") {
      return renderNpcInspector(state.selection.id);
    }
    const event = data.events.find((item) => item.id === state.selection.id) || data.events[0];
    return renderEventInspector(event);
  }

  function renderNpcInspector(id) {
    const npc = data.characters[id];
    const npcState = npcStateAt(id, state.selectedTurn);
    const locationId = Object.entries(data.snapshots[state.selectedTurn].locations).find(([, ids]) => ids.includes(id))?.[0];
    const beliefs = npc.beliefs.filter((belief) => belief.turn <= state.selectedTurn);
    const memories = npc.memories.filter((memory) => memory.turn <= state.selectedTurn);
    const relevantMemories = memories.slice(-6).reverse();
    const trustRows = Object.entries(npcState.trust).map(([targetId, value]) => {
      const tone = value >= 25 ? "trusted" : value <= -25 ? "distrusted" : "neutral";
      return `<li><span>${escapeHtml(characterName(targetId))}</span><span class="trust-value trust-${tone}">${value > 0 ? "+" : ""}${value} · ${tone}</span></li>`;
    }).join("");

    return `
      <div class="inspector-header">
        <div>
          <p class="section-kicker">NPC inspector</p>
          <h2 id="inspector-title">${escapeHtml(npc.name)}</h2>
        </div>
        <img class="portrait portrait-image" src="assets/${escapeHtml(id)}.svg" alt="">
      </div>
      <div class="identity-line">
        <span>${escapeHtml(npc.role)}</span><span>${escapeHtml(data.locations[locationId].name)}</span><span>${escapeHtml(npcState.posture)}</span>
      </div>
      <div class="inspector-scroll">
        <section class="inspector-section">
          <h3>Starting character definition</h3>
          <div class="trait-list">${npc.traits.map((trait) => `<span>${escapeHtml(trait)}</span>`).join("")}</div>
          <p class="item-line"><span>Possessed item</span><strong>${escapeHtml(npcState.item)}</strong></p>
        </section>
        <section class="inspector-section">
          <h3>Goals</h3>
          ${npc.goals.map((goal) => `<div class="goal-row"><span>${escapeHtml(goal.priority)}</span><p>${escapeHtml(goal.text)}</p><small>${escapeHtml(goal.status)}</small></div>`).join("")}
        </section>
        <section class="inspector-section">
          <h3>Directed trust</h3>
          <ul class="trust-list">${trustRows}</ul>
        </section>
        <section class="inspector-section">
          <div class="section-label-row"><h3><span class="type-dot belief"></span>Beliefs</h3><small>Not world truth</small></div>
          ${beliefs.map((belief) => `
            <article class="belief-card">
              <div><strong>${escapeHtml(belief.stance)}</strong><span>${belief.confidence}%</span></div>
              <p>${escapeHtml(belief.proposition)}</p>
              <small>Provenance · ${escapeHtml(belief.provenance)}</small>
            </article>
          `).join("")}
        </section>
        <section class="inspector-section">
          <div class="section-label-row"><h3><span class="type-dot memory"></span>Relevant memories</h3><small>${relevantMemories.length} of ${memories.length}</small></div>
          <div class="memory-list">
            ${relevantMemories.map((memory) => `
              <article class="memory-card">
                <span>Turn ${memory.turn} · ${escapeHtml(memory.salience)}</span>
                <p>${escapeHtml(memory.text)}</p>
                <small>${escapeHtml(memory.source)} · ${escapeHtml(memory.visibility)}</small>
              </article>
            `).join("")}
          </div>
          <details class="full-memory-list">
            <summary>Full chronological memory list (${memories.length})</summary>
            <ol>${memories.map((memory) => `<li><span>Turn ${memory.turn}</span>${escapeHtml(memory.text)}</li>`).join("")}</ol>
          </details>
        </section>
      </div>
    `;
  }

  function renderEventInspector(event) {
    const actor = event.actor ? data.characters[event.actor] : null;
    const cited = event.citedMemories.map(findMemory).filter(Boolean);
    return `
      <div class="inspector-header event-inspector-header">
        <div>
          <p class="section-kicker">Event inspector</p>
          <h2 id="inspector-title">Turn ${event.turn} · ${escapeHtml(event.phase)}</h2>
        </div>
        <span class="event-type-badge event-${escapeHtml(event.tone)}">${escapeHtml(event.category)}</span>
      </div>
      <div class="identity-line">
        <span>${actor ? escapeHtml(actor.name) : "World"}</span><span>${escapeHtml(event.location)}</span><span>${escapeHtml(event.visibility)}</span>
      </div>
      <div class="inspector-scroll">
        <section class="inspector-section event-lede">
          <h3>What happened</h3>
          <p>${escapeHtml(event.happened)}</p>
        </section>
        <section class="inspector-section rationale-box">
          <p class="detail-label">Declared rationale</p>
          <blockquote>${escapeHtml(event.rationale)}</blockquote>
          <p class="goal-served"><span>Goal served</span>${escapeHtml(event.goal)}</p>
        </section>
        <section class="inspector-section">
          <h3>Witnesses & memories</h3>
          <dl class="event-details">
            <div><dt>Witnesses</dt><dd>${event.witnesses.map(escapeHtml).join(", ") || "None"}</dd></div>
            <div><dt>Memories created</dt><dd>${event.createdMemories.length ? event.createdMemories.map((id) => `<code>${escapeHtml(id)}</code>`).join(" ") : "None"}</dd></div>
          </dl>
        </section>
        <section class="inspector-section">
          <div class="section-label-row"><h3><span class="type-dot memory"></span>Cited memories</h3><small>${cited.length}</small></div>
          ${cited.length ? cited.map((memory) => `
            <article class="memory-card compact">
              <span>${escapeHtml(memory.id)}</span>
              <p>${escapeHtml(memory.text)}</p>
            </article>
          `).join("") : `<p class="empty-copy">This boundary event cites no NPC memory.</p>`}
        </section>
        <section class="inspector-section">
          <h3>Immediate consequences</h3>
          <ul class="change-list">${event.changes.map((change) => `<li>${escapeHtml(change)}</li>`).join("")}</ul>
        </section>
        <section class="inspector-section">
          <h3>Causal predecessors</h3>
          ${event.causes.length ? event.causes.map((cause) => `<button class="cause-link" type="button" data-action="select-event" data-event="${escapeHtml(cause)}">${escapeHtml(cause)} <span aria-hidden="true">↗</span></button>`).join("") : `<p class="empty-copy">This is the start of the recorded causal chain.</p>`}
        </section>
      </div>
    `;
  }

  function renderOutcomePreview() {
    const outcome = data.outcomePreview;
    return `
      <section class="outcome-preview" aria-labelledby="outcome-preview-title">
        <div>
          <p class="section-kicker">Outcome preview</p>
          <h2 id="outcome-preview-title">The story is still in motion</h2>
          <p>${escapeHtml(outcome.explanation)}</p>
        </div>
        <dl>
          <div><dt>Medical</dt><dd>${escapeHtml(outcome.medical)}</dd></div>
          <div><dt>Truth</dt><dd>${escapeHtml(outcome.truth)}</dd></div>
          <div><dt>Social</dt><dd>${escapeHtml(outcome.social)}</dd></div>
        </dl>
      </section>
    `;
  }

  function renderCompletedOutcome() {
    const outcome = data.originalOutcome;
    const labels = Object.entries(outcome.labels).map(([dimension, result]) => `
      <div class="outcome-result outcome-${escapeHtml(result.label.toLowerCase())}">
        <dt>${escapeHtml(dimension)}</dt>
        <dd>${escapeHtml(result.label)}</dd>
        <p>${escapeHtml(result.explanation)}</p>
      </div>
    `).join("");
    const pivotal = outcome.pivotalEvents.map((eventId) => {
      const event = data.events.find((item) => item.id === eventId);
      return `
        <button class="pivotal-link" type="button" data-action="select-event" data-event="${escapeHtml(eventId)}">
          <span>Turn ${event.turn}</span><strong>${escapeHtml(event.summary)}</strong><i aria-hidden="true">↗</i>
        </button>
      `;
    }).join("");

    return `
      <section class="completed-outcome terminal-completion recorded-terminal-completion" aria-labelledby="completed-outcome-title">
        <header>
          <div>
            <p class="section-kicker">Original outcome</p>
            <h2 id="completed-outcome-title">Night falls before the antidote arrives</h2>
          </div>
          <span class="outcome-complete-mark">Branch complete</span>
        </header>
        <dl class="outcome-results">${labels}</dl>
        <p class="outcome-recap">${escapeHtml(outcome.recap)}</p>
        <div class="outcome-evidence">
          <section>
            <h3>Antidote path</h3>
            <ol>${outcome.antidotePath.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
          </section>
          <section>
            <h3>Pivotal events</h3>
            <div class="pivotal-list">${pivotal}</div>
          </section>
        </div>
        <div class="terminal-actions"><button class="button button-primary button-compact" type="button" data-action="restart">Start New Simulation</button><button class="button button-tertiary button-compact" type="button" data-action="back-start">Back to Start</button></div>
      </section>
    `;
  }

  function renderPlaybackControls(branchComplete) {
    const status = branchComplete
      ? "Complete"
      : state.isRunning
        ? "Auto-running"
        : state.recordedStatus;

    return `
      <div class="playback-control">
        <div class="playback-status">
          <span>Recorded Original</span>
          <strong>${escapeHtml(status)}</strong>
          <button class="follow-toggle" type="button" data-action="toggle-recorded-follow" aria-pressed="${state.followRecorded}">Follow live events: ${state.followRecorded ? "On" : "Off"}</button>
          ${state.followRecorded ? "" : `<button class="jump-latest" type="button" data-action="jump-recorded-latest">Jump to latest</button>`}
        </div>
        <div class="playback-buttons" role="group" aria-label="Recorded playback controls">
          <button class="button button-compact" title="Resolve one decision round and stop." type="button" data-action="step" ${state.isRunning || branchComplete ? "disabled" : ""}>Next Turn <span aria-hidden="true">→</span></button>
          <button class="button button-compact button-run" title="Continue automatically until paused or completed." type="button" data-action="run" ${state.isRunning || branchComplete ? "disabled" : ""}>Run to End <span aria-hidden="true">▶</span></button>
          <button class="button button-compact button-pause" title="Stop after the current turn finishes." type="button" data-action="pause" ${state.isRunning ? "" : "disabled"}>Pause <span aria-hidden="true">Ⅱ</span></button>
        </div>
      </div>
    `;
  }

  function npcStateAt(id, turn) {
    const npc = data.characters[id];
    const result = { item: npc.item, posture: npc.posture, trust: Object.assign({}, npc.trust) };
    for (const entry of npc.history || []) {
      if (entry.turn > turn) break;
      if (entry.item !== undefined) result.item = entry.item;
      if (entry.posture !== undefined) result.posture = entry.posture;
      if (entry.trust !== undefined) result.trust = Object.assign({}, entry.trust);
    }
    return result;
  }

  function findMemory(memoryId) {
    for (const [, npc] of characterEntries) {
      const memory = npc.memories.find((item) => item.id === memoryId);
      if (memory) return memory;
    }
    return null;
  }

  function restartSession() {
    stopRunTimer();
    state.currentTurn = 0;
    state.selectedTurn = 0;
    state.isRunning = false;
    state.recordedStatus = "Ready";
    state.followRecorded = true;
    state.selection = { type: "event", id: "evt-shared-t00-start" };
    renderWorkspace({ timelineToEnd: true, inspectorToTop: true });
    announce("Recorded session restarted at turn zero.");
  }

  function returnToStart() {
    stopRunTimer();
    livePresentation?.dispose?.();
    livePresentation = null;
    state.screen = "start";
    state.mode = "recorded";
    state.currentTurn = 0;
    state.selectedTurn = 0;
    state.isRunning = false;
    state.recordedStatus = "Ready";
    state.followRecorded = true;
    state.selection = { type: "event", id: "evt-shared-t00-start" };
    renderStart();
    focusMainWithoutScroll();
  }

  function stepTurn() {
    if (state.isRunning || state.currentTurn >= data.originalOutcome.turn) return;
    advanceRecordedTurn(true);
  }

  function advanceRecordedTurn(shouldAnnounce) {
    if (state.currentTurn >= data.originalOutcome.turn) {
      state.isRunning = false;
      stopRunTimer();
      renderWorkspace();
      return;
    }

    state.currentTurn += 1;
    state.recordedStatus = "Ready";
    if (state.followRecorded) {
      state.selectedTurn = state.currentTurn;
      const firstEvent = data.events.find((item) => item.turn === state.currentTurn);
      state.selection = { type: "event", id: firstEvent.id };
    }

    if (state.currentTurn === data.originalOutcome.turn) {
      state.isRunning = false;
      stopRunTimer();
    }

    renderWorkspace({ timelineToEnd: state.followRecorded });
    if (shouldAnnounce) {
      const snapshot = data.snapshots[state.currentTurn];
      announce(state.currentTurn === data.originalOutcome.turn
        ? "Original branch complete. Niko is lost. The truth is exposed and the group is fractured."
        : `Turn ${state.currentTurn} complete. ${snapshot.turnsRemaining} turns remain.`);
    }
  }

  function startRun() {
    if (state.isRunning || state.currentTurn >= data.originalOutcome.turn) return;
    state.isRunning = true;
    state.recordedStatus = "Auto-running";
    renderWorkspace();
    announce(`Recorded playback running from completed turn ${state.currentTurn}.`);
    scheduleNextRecordedTurn();
  }

  function scheduleNextRecordedTurn() {
    stopRunTimer();
    if (!state.isRunning || state.currentTurn >= data.originalOutcome.turn) return;
    runTimer = window.setTimeout(() => {
      runTimer = null;
      if (!state.isRunning) return;
      advanceRecordedTurn(false);
      if (state.isRunning) {
        scheduleNextRecordedTurn();
      } else if (state.currentTurn === data.originalOutcome.turn) {
        announce("Recorded Original complete. Lost, Exposed, Fractured.");
      }
    }, 520);
  }

  function pauseRun() {
    if (!state.isRunning) return;
    state.isRunning = false;
    state.recordedStatus = "Paused";
    stopRunTimer();
    renderWorkspace();
    announce(`Recorded playback paused at completed turn ${state.currentTurn}.`);
  }

  function stopRunTimer() {
    if (runTimer !== null) {
      window.clearTimeout(runTimer);
      runTimer = null;
    }
  }

  function startLiveSession() {
    stopRunTimer();
    state.screen = "workspace";
    const presentationApi = window.FORKED_FATES_LIVE_PRESENTATION;
    if (!presentationApi || typeof presentationApi.create !== "function") {
      app.innerHTML = `
        <section class="live-state-screen error-state" aria-labelledby="live-unavailable-title">
          <button class="text-button live-state-back" type="button" data-action="back-start">← Back to Start</button>
          <span class="error-glyph" aria-hidden="true">!</span>
          <p class="eyebrow">Recorded fallback available</p>
          <h1 id="live-unavailable-title">Live mode did not load</h1>
          <p>The immutable Recorded Original is still independently executable.</p>
          <button class="button button-primary" type="button" data-action="use-recorded">Explore Demo</button>
        </section>`;
      return;
    }
    livePresentation = presentationApi.create({
      window,
      document,
      app,
      announcer,
      escapeHtml,
      mode: state.mode,
      onUseRecorded() {
        state.mode = "recorded";
        livePresentation = null;
        restartSession();
      },
      onBackStart() {
        livePresentation = null;
        returnToStart();
      }
    });
    livePresentation.start();
  }

  app.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action]");
    if (!control) return;
    const action = control.dataset.action;

    if (state.mode !== "recorded" && state.screen === "workspace" && livePresentation?.handleAction(control)) {
      return;
    }
    if (action === "open-briefing" || action === "watch-recorded") {
      state.mode = action === "watch-recorded" ? "recorded" : (control.dataset.mode || "recorded");
      state.screen = "briefing";
      renderBriefing();
      focusMainWithoutScroll();
      return;
    }
    if (action === "back-start") {
      returnToStart();
      return;
    }
    if (action === "enter-world") {
      state.screen = "workspace";
      if (state.mode !== "recorded") startLiveSession();
      else restartSession();
      focusMainWithoutScroll();
      return;
    }
    if (action === "use-recorded") {
      state.mode = "recorded";
      livePresentation = null;
      restartSession();
      return;
    }
    if (action === "restart") {
      restartSession();
      return;
    }
    if (action === "step") {
      stepTurn();
      return;
    }
    if (action === "run") {
      startRun();
      return;
    }
    if (action === "pause") {
      pauseRun();
      return;
    }
    if (action === "toggle-recorded-follow") {
      state.followRecorded = !state.followRecorded;
      if (state.followRecorded) {
        state.selectedTurn = state.currentTurn;
        const event = data.events.filter((item) => item.turn === state.currentTurn).at(-1);
        state.selection = { type: "event", id: event.id };
      }
      renderWorkspace({ timelineToEnd: state.followRecorded, inspectorToTop: state.followRecorded });
      announce(`Follow live events ${state.followRecorded ? "on" : "off"}.`);
      return;
    }
    if (action === "jump-recorded-latest") {
      state.followRecorded = true;
      state.selectedTurn = state.currentTurn;
      const event = data.events.filter((item) => item.turn === state.currentTurn).at(-1);
      state.selection = { type: "event", id: event.id };
      renderWorkspace({ timelineToEnd: true, inspectorToTop: true });
      announce(`Jumped to latest completed turn ${state.currentTurn}.`);
      return;
    }
    if (action === "select-npc") {
      state.selection = { type: "npc", id: control.dataset.npc };
      renderWorkspace({ inspectorToTop: true });
      announce(`${characterName(control.dataset.npc)} inspector opened.`);
      return;
    }
    if (action === "select-event") {
      const selectedEvent = data.events.find((item) => item.id === control.dataset.event);
      if (!selectedEvent || selectedEvent.turn > state.currentTurn) return;
      state.selectedTurn = selectedEvent.turn;
      if (state.selectedTurn < state.currentTurn) state.followRecorded = false;
      state.selection = { type: "event", id: selectedEvent.id };
      renderWorkspace({ inspectorToTop: true });
      announce(`Event inspector opened for ${selectedEvent.summary}.`);
      return;
    }
    if (action === "select-turn") {
      const turn = Number(control.dataset.turn);
      if (!Number.isInteger(turn) || turn < 0 || turn > state.currentTurn) return;
      state.selectedTurn = turn;
      if (turn < state.currentTurn) state.followRecorded = false;
      const firstEvent = data.events.find((item) => item.turn === turn);
      state.selection = { type: "event", id: firstEvent.id };
      renderWorkspace({ inspectorToTop: true });
      announce(`Reviewing completed turn ${turn}. Current branch remains at turn ${state.currentTurn}.`);
    }
  });

  renderStart();
})();
