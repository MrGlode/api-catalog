/**
 * Markdown Service - Enhanced with Syntax Highlighting
 * Uses 'marked' library for Markdown parsing + custom syntax highlighting
 */
import { Injectable } from '@angular/core';
import { marked } from 'marked';

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {

  constructor() {
    // Configure marked options
    marked.setOptions({
      gfm: true,        // GitHub Flavored Markdown
      breaks: true,     // Convert \n to <br>
    });
  }

  /**
   * Convert Markdown to HTML with syntax highlighting
   */
  parse(markdown: string): string {
    if (!markdown) return '';

    try {
      // Extract mermaid blocks before parsing
      const { text, blocks } = this.extractMermaidBlocks(markdown);

      // Use marked to parse markdown
      const result = marked.parse(text);

      // marked.parse can return string or Promise<string>
      if (typeof result === 'string') {
        // Post-process to add syntax highlighting to code blocks
        let html = this.addSyntaxHighlighting(result);
        // Restore mermaid blocks
        html = this.restoreMermaidBlocks(html, blocks);
        return html;
      }

      // Fallback for async result (shouldn't happen with sync options)
      return markdown;
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return this.escapeHtml(markdown);
    }
  }

  /**
   * Extract mermaid code blocks and replace with placeholders
   */
  private extractMermaidBlocks(markdown: string): { text: string; blocks: Map<string, string> } {
    const blocks = new Map<string, string>();
    let i = 0;
    const text = markdown.replace(/```mermaid\s*\n([\s\S]*?)```/gi, (_, code) => {
      const key = `MERMAIDPLACEHOLDER${i++}END`;
      blocks.set(key, code.trim());
      return key;
    });
    return { text, blocks };
  }

  /**
   * Restore mermaid blocks as div elements
   */
  private restoreMermaidBlocks(html: string, blocks: Map<string, string>): string {
    blocks.forEach((code, key) => {
      const encoded = btoa(unescape(encodeURIComponent(code)));
      const div = `<div class="mermaid" data-mermaid="${encoded}"></div>`;
      html = html.replace(`<p>${key}</p>`, div).replace(key, div);
    });
    return html;
  }

  /**
   * Add syntax highlighting to code blocks
   */
  private addSyntaxHighlighting(html: string): string {
    // Find all <pre><code> blocks and add highlighting
    return html.replace(
      /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g,
      (match, language, code) => {
        const lang = language || this.detectLanguage(code);
        const highlightedCode = this.highlightCode(code, lang);
        return `<pre class="code-block" data-lang="${lang}"><code class="language-${lang}">${highlightedCode}</code></pre>`;
      }
    );
  }

  /**
   * Detect language from code content
   */
  private detectLanguage(code: string): string {
    const trimmed = code.trim();

    // JSON detection
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      return 'json';
    }

    // Bash/Shell detection
    if (trimmed.startsWith('$') ||
        trimmed.startsWith('curl') ||
        trimmed.startsWith('#!')) {
      return 'bash';
    }

    // JavaScript detection
    if (trimmed.includes('const ') ||
        trimmed.includes('let ') ||
        trimmed.includes('function ') ||
        trimmed.includes('=>')) {
      return 'javascript';
    }

    return 'text';
  }

  /**
   * Highlight code based on language
   */
  private highlightCode(code: string, language: string): string {
    switch (language) {
      case 'json':
        return this.highlightJson(code);
      case 'bash':
      case 'shell':
      case 'sh':
        return this.highlightBash(code);
      case 'javascript':
      case 'js':
        return this.highlightJavaScript(code);
      default:
        return code;
    }
  }

  /**
   * JSON syntax highlighting
   */
  private highlightJson(code: string): string {
    // Don't double-escape - code is already escaped by marked
    return code
      // Keys (before colon)
      .replace(/&quot;([^&]+)&quot;(\s*:)/g, '<span class="json-key">&quot;$1&quot;</span>$2')
      // String values (after colon or in arrays)
      .replace(/(:\s*)&quot;([^&]*)&quot;/g, '$1<span class="json-string">&quot;$2&quot;</span>')
      .replace(/(\[|,\s*)&quot;([^&]*)&quot;/g, '$1<span class="json-string">&quot;$2&quot;</span>')
      // Numbers
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
      .replace(/(\[|,\s*)(-?\d+\.?\d*)(\s*[,\]])/g, '$1<span class="json-number">$2</span>$3')
      // Booleans
      .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
      // Null
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
  }

  /**
   * Bash/Shell syntax highlighting
   */
  private highlightBash(code: string): string {
    return code
      // Comments
      .replace(/(#[^\n]*)/g, '<span class="bash-comment">$1</span>')
      // Commands at start
      .replace(/^(curl|wget|npm|yarn|docker|git|cd|ls|mkdir|rm|cp|mv|echo|cat|grep|sed|awk)/gm,
        '<span class="bash-command">$1</span>')
      // Flags
      .replace(/(\s)(-{1,2}[\w-]+)/g, '$1<span class="bash-flag">$2</span>')
      // Variables
      .replace(/(\$\w+)/g, '<span class="bash-variable">$1</span>');
  }

  /**
   * JavaScript syntax highlighting
   */
  private highlightJavaScript(code: string): string {
    return code
      // Comments
      .replace(/(\/\/[^\n]*)/g, '<span class="js-comment">$1</span>')
      // Keywords
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new)\b/g,
        '<span class="js-keyword">$1</span>')
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="js-number">$1</span>')
      // Booleans
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="js-boolean">$1</span>');
  }

  /**
   * Escape HTML entities (fallback)
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
