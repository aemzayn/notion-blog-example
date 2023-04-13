import sanitizeHtml from "sanitize-html";

export function sanitizeDOM(dom) {
  return sanitizeHtml(dom);
}
