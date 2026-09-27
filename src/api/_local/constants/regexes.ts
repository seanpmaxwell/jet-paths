// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

// A static segment: unreserved characters or percent-escapes, but not "." or
// ".." (including percent-encoded dots normalized by URL parsers).
// A param segment: ":" followed by a name.
const SEGMENT = String.raw`(?!(?:\.|%2[eE]){1,2}(?:\/|$))(?:[A-Za-z0-9\-._~]|%[0-9A-Fa-f]{2})+`;
const PARAM = String.raw`:[A-Za-z0-9_]+`;

// Validates route templates (not formatted urls). Allows "" and "/".
export const TEMPLATE_REGEX = new RegExp(
  String.raw`^(?:\/(?:${PARAM}|${SEGMENT}))*\/?$`,
);

// Search keys declared after the "?" in a route (i.e. "<q!><page>"). A key is
// unreserved characters in angle brackets, with a "!" before the ">" to make
// it required.
const SEARCH_KEY = String.raw`<[A-Za-z0-9\-._~]+!?>`;
export const SEARCH_KEYS_REGEX = new RegExp(String.raw`^(?:${SEARCH_KEY})+$`);

// Reads each declared key, even when validation is disabled. Must stay in
// sync with "SplitSearchKeys" in the types.
export const SEARCH_KEY_REGEX = /<([^>]*)>/g;
