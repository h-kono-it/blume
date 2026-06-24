import { jsxAttribute, jsxFlowElement, jsxTextElement } from "./mdast.ts";
import type { MdastNode, MdastVisitorContext } from "./mdast.ts";

interface MathNode extends MdastNode {
  value: string;
}

/**
 * Satteri MDAST plugin that turns math nodes into Blume's `<Math>` component,
 * which renders them with KaTeX at build time. Block math (`$$…$$`) becomes a
 * block element; inline math (`$…$`) stays inline. Only active when math is
 * enabled in config, so `$` is otherwise left as literal text.
 */
export const mathPlugin = () => ({
  inlineMath(node: MathNode, ctx: MdastVisitorContext) {
    ctx.replaceNode(
      node,
      jsxTextElement("Math", [jsxAttribute("code", node.value)])
    );
  },
  math(node: MathNode, ctx: MdastVisitorContext) {
    ctx.replaceNode(
      node,
      jsxFlowElement(
        "Math",
        [jsxAttribute("code", node.value), jsxAttribute("display")],
        []
      )
    );
  },
  name: "blume-math",
});
