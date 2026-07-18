(function initializeInterventionLayer(root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) module.exports = factory(require("./world-engine"));
  else if (root) root.FORKED_FATES_INTERVENTION_LAYER = factory(root.FORKED_FATES_WORLD_ENGINE);
})(typeof globalThis !== "undefined" ? globalThis : this, function createInterventionLayer(engine) {
  "use strict";

  if (!engine) throw new Error("The Intervention Layer requires the authoritative World Engine.");

  const CATEGORIES = Object.freeze(Object.keys(engine.INTERVENTION_EVENT_TYPES));

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function assertPlainObject(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
  }

  function exactKeys(value, allowed, label) {
    const unexpected = Object.keys(value).find((key) => !allowed.includes(key));
    if (unexpected) throw new TypeError(`${label} contains unsupported field ${unexpected}.`);
  }

  function validatePayload(category, payload) {
    const descriptions = typeof payload.description === "string" && payload.description.trim().length > 0 && payload.description.length <= 280;
    if (!descriptions) throw new TypeError("Intervention description must contain 1 to 280 characters.");

    if (category === "Information") {
      exactKeys(payload, ["recipientId", "propositionId", "truthStatus", "beliefStance", "confidence", "description"], "Information intervention");
      if (typeof payload.recipientId !== "string" || typeof payload.propositionId !== "string") throw new TypeError("Information intervention requires recipient and proposition identities.");
      if (!["true-evidence", "true-observation", "false-rumor"].includes(payload.truthStatus)) throw new TypeError("Information truth status is invalid.");
      if (!["believes-true", "believes-false", "uncertain"].includes(payload.beliefStance)) throw new TypeError("Information belief stance is invalid.");
      if (!Number.isInteger(payload.confidence) || payload.confidence < 0 || payload.confidence > 100) throw new TypeError("Information belief confidence must be an integer from 0 to 100.");
    }

    if (category === "ItemTransfer") {
      exactKeys(payload, ["itemId", "fromId", "toId", "description"], "Item-transfer intervention");
      if (![payload.itemId, payload.fromId, payload.toId].every((value) => typeof value === "string" && value.length > 0)) throw new TypeError("Item-transfer intervention requires item, source, and recipient identities.");
    }

    if (category === "EnvironmentalEvent") {
      exactKeys(payload, ["locationId", "conditionId", "conditionState", "description"], "Environmental intervention");
      if (typeof payload.locationId !== "string" || typeof payload.conditionId !== "string") throw new TypeError("Environmental intervention requires location and condition identities.");
      if (!["active", "cleared"].includes(payload.conditionState)) throw new TypeError("Environmental condition state must be active or cleared.");
    }
  }

  function createInterventionEvent(boundary, request) {
    assertPlainObject(boundary, "Completed boundary");
    if (!Object.isFrozen(boundary)) throw new TypeError("Interventions require a frozen completed boundary.");
    assertPlainObject(request, "Intervention request");
    exactKeys(request, ["id", "category", "boundaryTurn", "payload"], "Intervention request");
    if (typeof request.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(request.id)) throw new TypeError("Intervention request requires a stable kebab-case identity.");
    if (!CATEGORIES.includes(request.category)) throw new TypeError(`Unsupported intervention category ${request.category}.`);
    if (!Number.isInteger(request.boundaryTurn) || request.boundaryTurn !== boundary.turn) throw new TypeError(`Intervention request must target completed turn ${boundary.turn}.`);
    assertPlainObject(request.payload, "Intervention payload");
    validatePayload(request.category, request.payload);

    return deepFreeze({
      protocol: engine.INTERVENTION_PROTOCOL,
      id: `evt-world-intervention-${request.id}`,
      eventType: engine.INTERVENTION_EVENT_TYPES[request.category],
      category: request.category,
      boundaryTurn: request.boundaryTurn,
      payload: deepClone(request.payload)
    });
  }

  function applyIntervention(boundary, request) {
    return engine.resolveInterventionEvent(boundary, createInterventionEvent(boundary, request));
  }

  return Object.freeze({
    CATEGORIES,
    createInterventionEvent,
    applyIntervention
  });
});
