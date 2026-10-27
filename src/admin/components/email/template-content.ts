import { EMAIL_TEMPLATE_MARKERS } from '@shared/types';

// Helper to check if HTML is a full email template
export function isFullHtmlTemplate(html: string): boolean {
  return html.includes('<!DOCTYPE') || html.includes('<html') || html.includes('<head');
}

// Extract the editable content from a full HTML email template
export function extractEditableContent(html: string): { content: string; wrapper: string } {
  if (!isFullHtmlTemplate(html)) {
    // Convert text variables to nodes for WYSIWYG display
    return { content: convertTextVariablesToNodes(html), wrapper: '' };
  }

  // Current default templates mark the editable part with content markers
  const { contentStart, contentEnd } = EMAIL_TEMPLATE_MARKERS;
  const start = html.indexOf(contentStart);
  const end = start === -1 ? -1 : html.indexOf(contentEnd, start + contentStart.length);
  if (start !== -1 && end !== -1) {
    const innerStart = start + contentStart.length;
    const inner = html.slice(innerStart, end);
    const content = convertTextVariablesToNodes(inner.replace(/^\n/, '').replace(/\n$/, ''));
    const wrapper = `${html.slice(0, innerStart)}\n{{__EDITOR_CONTENT__}}\n${html.slice(end)}`;
    return { content, wrapper };
  }

  // Legacy templates: try to extract content from the .content div, excluding the button
  const contentMatch = html.match(
    /<div class="content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/body>/i
  );
  if (contentMatch) {
    let innerContent = contentMatch[1].trim();

    // Extract the button (and any content after it) to keep in wrapper
    // The button is typically: <a href="..." class="button">...</a>
    const buttonMatch = innerContent.match(/(\s*<a[^>]*class="button"[^>]*>[\s\S]*?<\/a>\s*)$/i);
    let buttonHtml = '';
    if (buttonMatch) {
      buttonHtml = buttonMatch[1];
      innerContent = innerContent.replace(buttonMatch[1], '').trim();
    }

    // Convert text variables to nodes for WYSIWYG display
    const content = convertTextVariablesToNodes(innerContent);

    // Store wrapper with placeholder, keeping button after placeholder
    const wrapper = html.replace(contentMatch[1], `{{__EDITOR_CONTENT__}}${buttonHtml}`);
    return { content, wrapper };
  }

  // Fallback: try to extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    // Convert text variables to nodes for WYSIWYG display
    const content = convertTextVariablesToNodes(bodyMatch[1].trim());
    const wrapper = html.replace(bodyMatch[1], '{{__EDITOR_CONTENT__}}');
    return { content, wrapper };
  }

  return { content: convertTextVariablesToNodes(html), wrapper: '' };
}

// Re-wrap edited content back into the template structure
export function wrapContentInTemplate(content: string, wrapper: string): string {
  // Convert variable nodes back to plain text for storage
  const cleanContent = convertNodeVariablesToText(content);
  if (!wrapper) {
    return cleanContent;
  }
  return wrapper.replace('{{__EDITOR_CONTENT__}}', () => cleanContent);
}

// Convert plain text {{variable}} to span elements that Tiptap can parse as VariableNodes
export function convertTextVariablesToNodes(html: string): string {
  // Match {{variable.name}} patterns that are in text content, NOT inside HTML attributes
  // We need to avoid converting variables inside href="{{...}}", style="...", etc.

  // Strategy: Only convert variables that are NOT inside an HTML tag's attributes
  // A variable is in an attribute if it's between < and > with an = before it

  return html.replace(
    /(\{\{([a-zA-Z][a-zA-Z0-9_.]*)\}\})/g,
    (match, fullMatch, varName, offset, string) => {
      // Check if this match is inside an HTML attribute
      // Look backwards for the nearest < or > to determine context
      const beforeMatch = string.substring(0, offset);
      const lastOpenTag = beforeMatch.lastIndexOf('<');
      const lastCloseTag = beforeMatch.lastIndexOf('>');

      // If we're inside a tag (last < is after last >), don't convert
      if (lastOpenTag > lastCloseTag) {
        // We're inside a tag - check if we're in an attribute value
        const tagContent = beforeMatch.substring(lastOpenTag);
        // If there's an = followed by a quote before our position, we're in an attribute
        if (/=\s*["'][^"']*$/.test(tagContent)) {
          return match; // Don't convert - it's inside an attribute value
        }
      }

      // Check if already wrapped in a span with data-variable
      const before20Chars = string.substring(Math.max(0, offset - 30), offset);
      if (before20Chars.includes('data-variable="')) {
        return match; // Already converted
      }

      return `<span data-variable="${varName}" class="variable-node">${fullMatch}</span>`;
    }
  );
}

// Convert VariableNode spans back to plain text for storage
export function convertNodeVariablesToText(html: string): string {
  // Convert <span data-variable="var" class="variable-node">{{var}}</span> back to {{var}}
  return html.replace(/<span[^>]*data-variable="([^"]*)"[^>]*>\{\{[^}]*\}\}<\/span>/g, '{{$1}}');
}
