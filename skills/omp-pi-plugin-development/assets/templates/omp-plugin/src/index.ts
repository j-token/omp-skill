import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

export default function examplePlugin(pi: ExtensionAPI) {
  const z = pi.zod;

  pi.on("session_start", async (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.setStatus("example-plugin", "ready");
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.setStatus("example-plugin", undefined);
  });

  pi.registerTool({
    name: "word_count",
    label: "Word Count",
    description: "Count the words in a string",
    parameters: z.object({
      text: z.string().describe("Text to count"),
    }),
    approval: "read",
    loadMode: "discoverable",
    async execute(_toolCallId, params, signal) {
      if (signal?.aborted) {
        return {
          content: [{ type: "text", text: "Cancelled" }],
          details: { cancelled: true },
        };
      }

      const count = params.text.split(/\s+/).filter(Boolean).length;
      return {
        content: [{ type: "text", text: String(count) }],
        details: { count },
      };
    },
  });

  pi.registerCommand("greet", {
    description: "Send a greeting into the conversation",
    handler: async (args, ctx) => {
      const name = args.trim() || "world";
      pi.sendMessage(
        {
          customType: "example-greeting",
          content: `Hello, ${name}!`,
          display: true,
          attribution: "user",
        },
        { triggerTurn: false },
      );
      if (ctx.hasUI) ctx.ui.notify(`Greeted ${name}`, "info");
    },
  });
}
