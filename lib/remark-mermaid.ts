import { visit } from "unist-util-visit";
import type { Node, Parent } from "unist";

// Define strict types for MDX nodes since we don't have full @types/mdast
interface MdxJsxFlowElement extends Node {
  type: "mdxJsxFlowElement";
  name: string;
  attributes: Array<{ type: "mdxJsxAttribute"; name: string; value: string }>;
  children: Node[];
}

interface CodeNode extends Node {
  type: "code";
  lang?: string;
  value: string;
}

export function remarkMermaid() {
  return (tree: Node) => {
    visit(tree, "code", (node: CodeNode, index: number | undefined, parent: Parent | undefined) => {
      if (node.lang === "mermaid" && parent && index !== undefined && Array.isArray(parent.children)) {
        // Create a new MDX JSX node to replace the code block
        const newNode: MdxJsxFlowElement = {
          type: "mdxJsxFlowElement",
          name: "Mermaid",
          attributes: [
            { type: "mdxJsxAttribute", name: "chart", value: node.value },
          ],
          children: [],
        };
        
        // Replace the node in the parent's children array
        parent.children[index] = newNode;
      }
    });
  };
}
