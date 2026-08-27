import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function examplePackage(pi: ExtensionAPI) {
  pi.registerTool({
    name: "text_case",
    label: "Text Case",
    description: "Convert text to upper or lower case",
    promptSnippet: "Convert text to upper or lower case deterministically",
    promptGuidelines: [
      "Use text_case when the user asks for deterministic upper/lower case conversion.",
    ],
    parameters: Type.Object({
      action: StringEnum(["upper", "lower"] as const),
      text: Type.String({ description: "Text to convert" }),
    }),
    async execute(_toolCallId, params, signal) {
      signal?.throwIfAborted();
      const text = params.action === "upper"
        ? params.text.toUpperCase()
        : params.text.toLowerCase();
      return {
        content: [{ type: "text", text }],
        details: { action: params.action },
      };
    },
  });

  pi.registerCommand("text-case", {
    description: "Show how to invoke the text_case tool",
    handler: async (_args, ctx) => {
      if (ctx.hasUI) {
        ctx.ui.notify("Ask Pi to use text_case with upper or lower", "info");
      }
    },
  });
}
