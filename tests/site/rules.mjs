/* Copy rules for the site check (Petr, 14 Nov 2026). Edit here; the check reads this file.
   Each rule runs on the visible text of every page (tags and scripts removed, structured data included). */

/* "Meetup", never "conference" (V4AIR Context section 1). The only allowed uses talk about what people expect from
   a conference; add a sentence here only when the team has agreed it. */
export const CONFERENCE_ALLOWED = [
  'build the conference you actually want',          // apply form, "What you are looking for" (Petr, 14 Nov 2026)
  'presented at a conference or workshop before',    // apply form, about past events
  'At a typical conference'                          // home and /programme/: "At a typical conference, you sit through talks…"
];

/* Prices are written only on /pricing/ (copy rulings): no amounts in euro or crowns anywhere else.
   The application form shows the fee by copying the table from /pricing/ when it loads, so its source has none. */
export const PRICE_PAGES = ['/pricing/'];
export const PRICE_RE = /(\d[\d .,]*\s?(€|(EUR|Kč|CZK)\b)|(€|EUR|CZK)\s?\d)/;   // "€" is not a letter, so no word boundary after it

/* A page that names several partner universities names all six. */
export const PARTNERS = {
  'Charles University': /Charles University|Univerzita Karlova/,
  'Czech Technical University in Prague': /Czech Technical University/,
  'Comenius University Bratislava': /Comenius/,
  'University of Wrocław': /Wroc[łl]aw/,
  'Nicolaus Copernicus University in Toruń': /Toru[ńn]|Copernicus/,
  'Eötvös Loránd University': /E[öo]tv[öo]s|ELTE/
};
export const PARTNERS_MIN = 3;   // naming at least this many means the page lists partners, so all six must be there

/* Phone width: no page or form screen may be wider than the screen (no sideways scrolling). */
export const PHONE_WIDTHS = [360, 390];
