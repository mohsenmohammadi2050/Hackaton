(function initializeAiLiveProvider(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else if (root) root.FORKED_FATES_AI_LIVE_PROVIDER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createAiLiveProviderApi() {
  "use strict";

  const PROVIDER_PROTOCOL = "forked-fates-decision-provider-v1";

  class AiProviderError extends Error {
    constructor(code, message, details) {
      super(message);
      this.name = "AiProviderError";
      this.code = code;
      this.details = details || null;
    }
  }

  function assertRequest(request) {
    if (!request || request.protocol !== PROVIDER_PROTOCOL || typeof request.actorId !== "string" || !request.projection || !Number.isInteger(request.attempt)) {
      throw new TypeError("AI provider requests require the provider protocol, actor, owned projection, and attempt.");
    }
  }

  function createProvider(options = {}) {
    const fetchImpl = options.fetch || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
    const endpoint = options.endpoint || "/api/ai/decision";
    if (typeof fetchImpl !== "function") throw new AiProviderError("AI_TRANSPORT_UNAVAILABLE", "Browser fetch is unavailable.");
    return Object.freeze({
      protocol: PROVIDER_PROTOCOL,
      id: options.id || "ai-live",
      kind: "llm",
      async decide(request) {
        assertRequest(request);
        let response;
        try {
          response = await fetchImpl(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json", accept: "application/json" },
            body: JSON.stringify(request)
          });
        } catch (error) {
          throw new AiProviderError("AI_PROVIDER_ERROR", `AI provider connection failed: ${error.message}`);
        }
        let payload;
        try { payload = await response.json(); }
        catch { throw new AiProviderError("AI_PROVIDER_RESPONSE", "AI provider returned a non-JSON response."); }
        if (!response.ok) throw new AiProviderError(payload?.error?.code || "AI_PROVIDER_ERROR", payload?.error?.message || `AI provider returned HTTP ${response.status}.`, payload?.error || null);
        if (payload.protocol !== PROVIDER_PROTOCOL || payload.actorId !== request.actorId || typeof payload.output !== "string") {
          throw new AiProviderError("AI_PROVIDER_RESPONSE", "AI provider response did not match the decision contract.");
        }
        return payload.output;
      }
    });
  }

  async function getConfiguration(options = {}) {
    const fetchImpl = options.fetch || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
    if (typeof fetchImpl !== "function") throw new AiProviderError("AI_TRANSPORT_UNAVAILABLE", "Browser fetch is unavailable.");
    const response = await fetchImpl(options.endpoint || "/api/ai/config", { headers: { accept: "application/json" } });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) throw new AiProviderError(payload?.error?.code || "AI_PROVIDER_ERROR", payload?.error?.message || "AI provider status is unavailable.");
    return Object.freeze({ configured: Boolean(payload.configured), model: payload.model || null, diagnosticLogging: Boolean(payload.diagnosticLogging), missing: Object.freeze((payload.missing || []).slice()) });
  }

  return Object.freeze({ PROVIDER_PROTOCOL, AiProviderError, createProvider, getConfiguration });
});
