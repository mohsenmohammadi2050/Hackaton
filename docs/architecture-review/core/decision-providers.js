(function initializeDecisionProviders(root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) module.exports = factory(require("./npc-agents"));
  else if (root) root.FORKED_FATES_DECISION_PROVIDERS = factory(root.FORKED_FATES_NPC_AGENTS);
})(typeof globalThis !== "undefined" ? globalThis : this, function createDecisionProviders(npcAgents) {
  "use strict";

  const PROVIDER_PROTOCOL = "forked-fates-decision-provider-v1";

  class DecisionProvider {
    constructor(options = {}) {
      if (new.target === DecisionProvider) throw new TypeError("DecisionProvider is an interface and cannot be instantiated directly.");
      this.protocol = PROVIDER_PROTOCOL;
      this.id = options.id;
      this.kind = options.kind;
    }

    decide() {
      throw new Error("Decision providers must implement decide(request).");
    }
  }

  function assertRequest(request) {
    if (!request || typeof request !== "object") throw new TypeError("A provider request is required.");
    if (request.protocol !== PROVIDER_PROTOCOL) throw new TypeError(`Unsupported provider protocol ${request.protocol}.`);
    if (typeof request.actorId !== "string" || !request.projection || !Number.isInteger(request.attempt)) {
      throw new TypeError("Provider requests require an actor, owned projection, and attempt number.");
    }
  }

  class DeterministicProvider extends DecisionProvider {
    constructor(options = {}) {
      super({ id: options.id || "deterministic", kind: "deterministic" });
      if (!npcAgents && !options.agents) throw new Error("The Deterministic Provider requires the existing NPC policies.");
      this.agents = options.agents || npcAgents.createAutonomousAgents();
      Object.freeze(this);
    }

    decide(request) {
      assertRequest(request);
      const agent = this.agents[request.actorId];
      if (!agent || typeof agent.decide !== "function") throw new Error(`No deterministic policy is available for ${request.actorId}.`);
      return agent.decide(request.projection, { attempt: request.attempt });
    }
  }

  class LLMProvider extends DecisionProvider {
    constructor(options = {}) {
      super({ id: options.id || "llm", kind: "llm" });
      this.vendor = options.vendor || "provider-agnostic";
      this.model = options.model || null;
      this.invoke = options.invoke || null;
      Object.freeze(this);
    }

    decide(request) {
      assertRequest(request);
      if (typeof this.invoke !== "function") {
        throw new Error("No LLM invocation adapter is configured; this interface performs no external API calls.");
      }
      return this.invoke(Object.freeze({
        protocol: PROVIDER_PROTOCOL,
        providerId: this.id,
        vendor: this.vendor,
        model: this.model,
        actorId: request.actorId,
        projection: request.projection,
        attempt: request.attempt,
        outputContract: request.outputContract
      }));
    }
  }

  function isDecisionProvider(provider) {
    return Boolean(provider && provider.protocol === PROVIDER_PROTOCOL && typeof provider.decide === "function");
  }

  function createProvider(configuration = {}) {
    const type = configuration.type || "deterministic";
    if (type === "deterministic") return new DeterministicProvider(configuration);
    if (type === "llm") return new LLMProvider(configuration);
    throw new Error(`Unknown decision provider type ${type}.`);
  }

  return Object.freeze({
    PROVIDER_PROTOCOL,
    DecisionProvider,
    DeterministicProvider,
    LLMProvider,
    isDecisionProvider,
    createProvider
  });
});
