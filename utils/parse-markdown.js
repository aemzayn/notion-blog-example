import { marked } from "marked";

export function parseMarkdown(markdown) {
  return marked.parse(markdown);
}
