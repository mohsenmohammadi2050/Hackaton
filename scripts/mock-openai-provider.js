"use strict";

const http = require("node:http");

const port = Number(process.env.MOCK_AI_PORT || 9090);
const mode = process.env.MOCK_AI_MODE || "valid";

function send(response, status, body) {
  const value = JSON.stringify(body);
  response.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(value) });
  response.end(value);
}

const server = http.createServer((request, response) => {
  if (request.method !== "POST" || request.url !== "/v1/chat/completions") {
    send(response, 404, { error: { message: "Mock endpoint not found." } });
    return;
  }
  const chunks = [];
  request.on("data", (chunk) => chunks.push(chunk));
  request.on("end", () => {
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      const message = body.messages.find((item) => item.role === "user");
      const prompt = JSON.parse(message.content);
      const actor = prompt.ownedState.self;
      const turn = prompt.ownedState.turn;
      console.log(`decision actor=${actor.id} turn=${turn} mode=${mode}`);
      if (mode === "invalid") {
        send(response, 200, { choices: [{ message: { content: "not a JSON object" } }] });
        return;
      }
      if (mode === "timeout") {
        setTimeout(() => send(response, 200, { choices: [{ message: { content: "{}" } }] }), 2000);
        return;
      }
      const output = {
        id: `mock-${actor.id}-wait-t${String(turn + 1).padStart(2, "0")}`,
        actorId: actor.id,
        action: "Wait",
        chosenAtTurn: turn,
        servedGoalId: actor.goals[0].id,
        rationale: `${actor.name} waits while observing the current situation.`,
        citedMemoryIds: []
      };
      send(response, 200, { choices: [{ message: { content: JSON.stringify(output) } }] });
    } catch (error) {
      send(response, 400, { error: { message: error.message } });
    }
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock OpenAI-compatible provider listening on http://127.0.0.1:${port}/v1 mode=${mode}`);
});
