import { buildFontFaceCss } from "./css";

export interface MountOptions {
  css: string;
  documentCss: string;
  fontBaseUrl?: string;
}

export interface MountResult {
  host: HTMLElement;
  root: ShadowRoot;
  unmount: () => void;
}

export function mountShadow(opts: MountOptions): MountResult {
  const HOST_ID = "fptu-ui-host";
  const DOC_STYLE_ID = "fptu-ui-document-styles";

  // Document-level styles (@property, @font-face)
  let fullDocCss = opts.documentCss || "";
  if (opts.fontBaseUrl) {
    const fontCss = buildFontFaceCss(opts.fontBaseUrl);
    fullDocCss = fullDocCss ? `${fontCss}\n\n${fullDocCss}` : fontCss;
  }

  if (fullDocCss) {
    let docStyleEl = document.getElementById(DOC_STYLE_ID) as HTMLStyleElement | null;
    if (!docStyleEl) {
      docStyleEl = document.createElement("style");
      docStyleEl.id = DOC_STYLE_ID;
      document.head.appendChild(docStyleEl);
    }
    docStyleEl.textContent = fullDocCss;
  }

  // Host element
  let host = document.getElementById(HOST_ID);
  let root: ShadowRoot;

  if (host) {
    root = host.shadowRoot || host.attachShadow({ mode: "open" });
  } else {
    host = document.createElement("div");
    host.id = HOST_ID;
    document.body.appendChild(host);
    root = host.attachShadow({ mode: "open" });
  }

  // Shadow styles
  if (opts.css) {
    let applied = false;
    if (typeof CSSStyleSheet !== "undefined" && "replaceSync" in CSSStyleSheet.prototype && root.adoptedStyleSheets) {
      try {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(opts.css);
        root.adoptedStyleSheets = [sheet];
        applied = true;
      } catch {
        applied = false;
      }
    }

    if (!applied) {
      let shadowStyleEl = root.querySelector("style");
      if (!shadowStyleEl) {
        shadowStyleEl = document.createElement("style");
        root.appendChild(shadowStyleEl);
      }
      shadowStyleEl.textContent = opts.css;
    }
  }

  const unmount = () => {
    if (host && host.parentNode) {
      host.parentNode.removeChild(host);
    }
    const docStyle = document.getElementById(DOC_STYLE_ID);
    if (docStyle && docStyle.parentNode) {
      docStyle.parentNode.removeChild(docStyle);
    }
  };

  return {
    host,
    root,
    unmount,
  };
}
