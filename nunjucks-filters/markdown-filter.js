import bash from '@shikijs/langs/bash';
import css from '@shikijs/langs/css';
import html from '@shikijs/langs/html';

// Shiki language grammars loaded as plain objects for synchronous highlighting.
// The jinja bundle is an array of grammars (js/css/html/jinja-html/jinja) and is
// spread in below; it provides the `jinja-html` grammar used for Nunjucks.
import javascript from '@shikijs/langs/javascript';
import jinja from '@shikijs/langs/jinja';
import json from '@shikijs/langs/json';
import markdown from '@shikijs/langs/markdown';
import typescript from '@shikijs/langs/typescript';
import yaml from '@shikijs/langs/yaml';
import monokai from '@shikijs/themes/monokai';
import directiveBlock from '@wernerglinka/marked-directive-block';
import imageWithClass from '@wernerglinka/marked-image-with-class';
import linkWithClass from '@wernerglinka/marked-link-with-class';
import paragraphWithClass from '@wernerglinka/marked-paragraph-with-class';
import { Marked } from 'marked';
import { createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

/**
 * Code highlighting theme. Shiki inlines every token color as a style
 * attribute, so no theme stylesheet is needed - changing this constant changes
 * the highlighting everywhere `mdToHTML` is used.
 * @type {string}
 */
const THEME = 'monokai';

/**
 * Tunes the `.code-lang` label text for the surrounding page chrome (the label
 * sits on the page background, not the code background). 'light' or 'dark'.
 * @type {string}
 */
const THEME_COLOR = 'light';

/**
 * Language aliases: lets authors write ```nunjucks / ```njk while highlighting
 * with the `jinja-html` grammar, which tokenizes full template tags. The label
 * shown to readers stays "nunjucks".
 * @type {Object<string, {grammar: string, label: string}>}
 */
const langAliases = {
  nunjucks: { grammar: 'jinja-html', label: 'nunjucks' },
  njk: { grammar: 'jinja-html', label: 'nunjucks' }
};

/**
 * Synchronous Shiki highlighter built once at module load. Uses the JavaScript
 * regex engine so it needs no async WASM init and can run inside a synchronous
 * Nunjucks filter.
 */
const highlighter = createHighlighterCoreSync({
  themes: [monokai],
  langs: [javascript, typescript, css, html, bash, json, yaml, markdown, ...jinja],
  engine: createJavaScriptRegexEngine()
});

/**
 * Configured marked instance.
 *
 * The `code` renderer highlights each fenced block with Shiki and wraps it in a
 * `.code-block` with a `.code-lang` label, so consumers (blog post bodies, the
 * code section) never re-wrap or re-label it. Token colors are inlined by
 * Shiki, so no theme stylesheet is required. The four content extensions add
 * Pandoc-style attribute syntax for paragraphs, images and links plus
 * triple-colon directive blocks.
 */
const markedInstance = new Marked();

const renderer = {
  code({ text, lang }) {
    const alias = langAliases[lang];
    const grammar = alias ? alias.grammar : lang || 'text';
    const label = alias ? alias.label : lang || 'text';

    try {
      const highlighted = highlighter.codeToHtml(text, { lang: grammar, theme: THEME });
      return `<div class="code-block"><span class="code-lang ${THEME_COLOR}">${label}</span>${highlighted}</div>`;
    } catch {
      return `<div class="code-block"><span class="code-lang ${THEME_COLOR}">${label}</span><pre><code>${text}</code></pre></div>`;
    }
  }
};

markedInstance.use({ renderer });

markedInstance.use({
  extensions: [paragraphWithClass(), imageWithClass(), linkWithClass(), directiveBlock()]
});

/**
 * Converts a markdown string to HTML with Shiki syntax highlighting.
 * @param {string} mdString - The markdown string to convert
 * @returns {string} The HTML output
 */
export const mdToHTML = (mdString) => {
  try {
    return markedInstance.parse(mdString, {
      mangle: false,
      headerIds: false
    });
  } catch (e) {
    console.error('Error parsing markdown:', e);
    return mdString;
  }
};

/**
 * Converts inline markdown (emphasis, links, inline code) to HTML without the
 * block-level <p> wrapper that mdToHTML adds. For short one-line strings like
 * the header's top-message banner, where a wrapping <p> would be invalid inside
 * the surrounding <p> and would force a line break.
 * @param {string} mdString - The markdown string to convert
 * @returns {string} The inline HTML output
 */
export const mdInline = (mdString) => {
  try {
    return markedInstance.parseInline(mdString);
  } catch (e) {
    console.error('Error parsing inline markdown:', e);
    return mdString;
  }
};
