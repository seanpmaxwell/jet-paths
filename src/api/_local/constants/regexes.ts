// ========================================================================= //
//                                 CONSTANTS                                 //
// ========================================================================= //

// A static segment: unreserved characters or percent-escapes, but not "." or
// "..". A param segment: ":" followed by a name.
const SEGMENT = String.raw`(?!\.{1,2}(?:\/|$))(?:[A-Za-z0-9\-._~]|%[0-9A-Fa-f]{2})+`;
const PARAM = String.raw`:[A-Za-z0-9_]+`;

// Validates route templates (not formatted urls). Allows "" and "/".
export const TEMPLATE_REGEX = new RegExp(
  String.raw`^(?:\/(?:${PARAM}|${SEGMENT}))*\/?$`,
);
