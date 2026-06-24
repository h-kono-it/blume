import { PACKAGE_MANAGERS, toPackageCommands } from "./package-commands.ts";

/**
 * Minimal structural types for the Satteri MDAST nodes and visitor context we
 * touch. The full types live in `satteri` (a transitive dependency reached only
 * through `@astrojs/markdown-satteri`); we model just what this plugin reads and
 * builds so the package needs no direct dependency on the alpha core.
 */
interface CodeNode {
  lang?: string | null;
  type: "code";
  value: string;
}

interface MdastVisitorContext {
  replaceNode: (node: CodeNode, replacement: unknown) => void;
}

/** Build an `<Tab title="...">` node wrapping a single highlighted command. */
const tabNode = (manager: string, command: string) => ({
  attributes: [{ name: "title", type: "mdxJsxAttribute", value: manager }],
  children: [{ lang: "bash", meta: null, type: "code", value: command }],
  name: "Tab",
  type: "mdxJsxFlowElement",
});

/**
 * Satteri MDAST plugin that turns a ` ```package-install ` code block into a
 * `<Tabs>` group with one `<Tab>` per package manager, each holding the
 * converted install command as a normal (highlighted) code block. Runs at the
 * MDAST stage so the generated code blocks are highlighted like any other.
 */
export const packageInstallPlugin = () => ({
  code(node: CodeNode, ctx: MdastVisitorContext) {
    if (node.lang !== "package-install") {
      return;
    }
    const commands = toPackageCommands(node.value);
    ctx.replaceNode(node, {
      attributes: [],
      children: PACKAGE_MANAGERS.map((manager) =>
        tabNode(manager, commands[manager])
      ),
      name: "Tabs",
      type: "mdxJsxFlowElement",
    });
  },
  name: "blume-package-install",
});
