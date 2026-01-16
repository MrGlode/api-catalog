/**
 * Markdown Service
 * Uses 'marked' library for robust Markdown parsing
 * Install: npm install marked
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
   * Convert Markdown to HTML
   */
  parse(markdown: string): string {
    if (!markdown) return '';
    
    try {
      // Use marked to parse markdown
      const result = marked.parse(markdown);
      
      // marked.parse can return string or Promise<string>
      if (typeof result === 'string') {
        return result;
      }
      
      // Fallback for async result (shouldn't happen with sync options)
      return markdown;
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return this.escapeHtml(markdown);
    }
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