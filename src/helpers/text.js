import { encode } from "gpt-3-encoder";

function removeRewlines(content) {
  content = content.replace("/\n/g", " ");
  content = content.replace(/\s+/g, " ");
  return content;
}

function numTokens(text) {
  return encode(text).length;
}

export { removeRewlines, numTokens };
