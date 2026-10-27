import { compile } from 'html-to-text';

const toText = compile({
  wordwrap: 100,
  selectors: [
    { selector: 'img', format: 'skip' },
    { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
    { selector: 'h1', options: { uppercase: false } },
    { selector: 'tr', format: 'block', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    // The value cell follows on a new line in the layout, which renders as the separating space.
    { selector: 'td.bp-label', format: 'inlineSurround', options: { suffix: ':' } },
  ],
});

/** Plain-text alternative for an HTML email body. */
export function htmlToPlainText(html: string): string {
  return toText(html).trim();
}
