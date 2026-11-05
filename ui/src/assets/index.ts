import frogSvg from "./frog.svg?raw";
import logoDataUri from "./logo.svg.webp?inline";

/**
 * The mascot is drawn inline (not as an <img>), so the page's image rules cannot block it. The file ships with
 * width="1000" height="1000"; drop them so CSS decides the size and only the viewBox remains.
 */
export const FROG_SVG: string = frogSvg.replace(/<svg([^>]*)>/, (_match, attrs: string) => {
  const cleaned = attrs.replace(/\s(?:width|height)="[^"]*"/g, "");
  return `<svg${cleaned} aria-hidden="true" focusable="false">`;
});

/** The FPT Education / FPT University logo, bundled as a data URI. */
export const LOGO_SRC: string = logoDataUri;
