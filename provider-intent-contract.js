(function initializeProviderIntentContract(root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else if (root) root.FORKED_FATES_PROVIDER_INTENT_CONTRACT = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function createProviderIntentContractApi() {
  "use strict";

  const MAX_RELEVANT_MEMORIES = 6;
  const BASE_INTENT_FIELDS = Object.freeze(["id", "actorId", "action", "chosenAtTurn", "servedGoalId", "rationale", "citedMemoryIds"]);
  const INTENT_ACTION_FIELDS = Object.freeze({
    Move: Object.freeze(["targetLocationId"]), Investigate: Object.freeze(["subject"]),
    Communicate: Object.freeze(["audience", "targetId", "claimIds", "factIds", "confessionFactIds"]),
    Transfer: Object.freeze(["targetId", "itemId"]), Administer: Object.freeze([]),
    Accuse: Object.freeze(["targetId", "responsibilityTargetId", "claimIds"]), Wait: Object.freeze([])
  });

  function deepFreeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); Object.values(value).forEach(deepFreeze); return value; }
  function allowedIntentFields(action) { return Object.freeze(BASE_INTENT_FIELDS.concat(INTENT_ACTION_FIELDS[action] || [])); }
  function availablePropositionIds(projection) {
    const claimIds = projection.relevantMemories.flatMap((memory) => memory.claimIds || []);
    const factIds = projection.relevantMemories.flatMap((memory) => memory.factIds || []).filter((factId) => projection.self.beliefs[factId]?.stance === "believes-true");
    return { claimIds: Array.from(new Set(claimIds)), factIds: Array.from(new Set(factIds)) };
  }
  function enumString(values) {
    const unique = Array.from(new Set((values || []).filter((value) => typeof value === "string" && value.length > 0)));
    return unique.length ? { type: "string", enum: unique } : { type: "string", minLength: 1 };
  }
  function identityArray(values, options = {}) {
    return Object.assign({ type: "array", items: enumString(values), uniqueItems: true, maxItems: options.maxItems ?? MAX_RELEVANT_MEMORIES }, options.minItems ? { minItems: options.minItems } : {});
  }

  function createIntentJsonSchema(projection) {
    const options = projection.legalOptions;
    const propositions = availablePropositionIds(projection);
    const baseProperties = {
      id: { type: "string", minLength: 1, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }, actorId: { type: "string", const: projection.self.id },
      chosenAtTurn: { type: "integer", const: projection.turn }, servedGoalId: enumString(projection.self.goals.map((goal) => goal.id)),
      rationale: { type: "string", minLength: 1, maxLength: 280 }, citedMemoryIds: identityArray(projection.relevantMemories.map((memory) => memory.id))
    };
    const schemaFor = (action, extraProperties, requiredExtras) => ({
      type: "object", additionalProperties: false,
      properties: Object.assign({}, baseProperties, { action: { type: "string", const: action } }, extraProperties),
      required: BASE_INTENT_FIELDS.concat(requiredExtras)
    });
    const communicationArrays = {
      claimIds: identityArray(propositions.claimIds, { maxItems: 3 }), factIds: identityArray(propositions.factIds, { maxItems: 3 }),
      confessionFactIds: identityArray(propositions.factIds, { maxItems: 3 })
    };
    return deepFreeze({ title: "ForkedFatesIntent", oneOf: [
      schemaFor("Move", { targetLocationId: enumString(options.Move.targetLocationIds) }, ["targetLocationId"]),
      schemaFor("Investigate", { subject: enumString(options.Investigate.subjects) }, ["subject"]),
      schemaFor("Communicate", Object.assign({ audience: { type: "string", const: "public" } }, communicationArrays), ["audience", "claimIds", "factIds", "confessionFactIds"]),
      schemaFor("Communicate", Object.assign({ audience: { type: "string", const: "private" }, targetId: enumString(options.Communicate.knownTargetIds) }, communicationArrays), ["audience", "targetId", "claimIds", "factIds", "confessionFactIds"]),
      schemaFor("Transfer", { targetId: enumString(options.Transfer.knownTargetIds), itemId: enumString(options.Transfer.itemIds) }, ["targetId", "itemId"]),
      schemaFor("Administer", {}, []),
      schemaFor("Accuse", { targetId: enumString(options.Accuse.knownTargetIds), responsibilityTargetId: enumString(options.Accuse.knownTargetIds), claimIds: identityArray(propositions.claimIds, { minItems: 1, maxItems: 3 }) }, ["targetId", "responsibilityTargetId", "claimIds"]),
      schemaFor("Wait", {}, [])
    ] });
  }

  function minimalIntentExample(action, projection, candidate = {}) {
    const propositions = availablePropositionIds(projection);
    const knownMemoryIds = new Set(projection.relevantMemories.map((memory) => memory.id));
    const example = {
      id: `intent-${projection.self.id}-corrected-t${String(projection.turn + 1).padStart(2, "0")}`, actorId: projection.self.id, action,
      chosenAtTurn: projection.turn, servedGoalId: projection.self.goals[0].id, rationale: "Choose this legal action using only owned information.",
      citedMemoryIds: (candidate.citedMemoryIds || []).filter((id) => knownMemoryIds.has(id)).slice(0, MAX_RELEVANT_MEMORIES)
    };
    if (action === "Move") example.targetLocationId = projection.legalOptions.Move.targetLocationIds[0];
    if (action === "Investigate") example.subject = projection.legalOptions.Investigate.subjects[0];
    if (action === "Communicate") {
      const factId = (candidate.factIds || []).find((id) => propositions.factIds.includes(id)) || propositions.factIds[0];
      const claimId = (candidate.claimIds || []).find((id) => propositions.claimIds.includes(id)) || propositions.claimIds[0];
      example.audience = candidate.audience === "private" ? "private" : "public";
      if (example.audience === "private") example.targetId = projection.legalOptions.Communicate.knownTargetIds.includes(candidate.targetId) ? candidate.targetId : projection.legalOptions.Communicate.knownTargetIds[0];
      example.claimIds = claimId ? [claimId] : []; example.factIds = factId ? [factId] : []; example.confessionFactIds = [];
      const supportId = projection.relevantMemories.find((memory) => (memory.factIds || []).includes(factId) || (memory.claimIds || []).includes(claimId))?.id;
      if (supportId) example.citedMemoryIds = [supportId];
    }
    if (action === "Transfer") { example.targetId = projection.legalOptions.Transfer.knownTargetIds[0]; example.itemId = projection.legalOptions.Transfer.itemIds[0]; }
    if (action === "Accuse") { example.targetId = projection.legalOptions.Accuse.knownTargetIds[0]; example.responsibilityTargetId = example.targetId; example.claimIds = propositions.claimIds.slice(0, 1); }
    return deepFreeze(example);
  }

  return Object.freeze({ BASE_INTENT_FIELDS, INTENT_ACTION_FIELDS, allowedIntentFields, createIntentJsonSchema, minimalIntentExample });
});
