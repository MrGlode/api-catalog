import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Simple Markdown to HTML pipe
 * Supports: headers, code blocks, inline code, lists, tables, bold, italic, links
 */
@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    
    let html = value.trim();
    
    // Extract and preserve code blocks first
    const codeBlocks: string[] = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const index = codeBlocks.length;
      const escapedCode = this.escapeHtml(code.trim());
      const language = lang || 'text';
      codeBlocks.push(`<pre class="code-block" data-lang="${language}"><code>${escapedCode}</code></pre>`);
      return `%%CODEBLOCK_${index}%%`;
    });
    
    // Extract inline code
    const inlineCodes: string[] = [];
    html = html.replace(/`([^`]+)`/g, (_, code) => {
      const index = inlineCodes.length;
      inlineCodes.push(`<code>${this.escapeHtml(code)}</code>`);
      return `%%INLINECODE_${index}%%`;
    });
    
    // Escape remaining HTML
    html = this.escapeHtml(html);
    
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    
    // Tables
    html = this.convertTables(html);
    
    // Unordered lists
    html = this.convertLists(html);
    
    // Paragraphs (double newline)
    const blocks = html.split(/\n\n+/);
    html = blocks.map(block => {
      block = block.trim();
      if (!block) return '';
      // Don't wrap if it's already a block element
      if (block.startsWith('<h') || 
          block.startsWith('<pre') || 
          block.startsWith('<table') || 
          block.startsWith('<ul') || 
          block.startsWith('<ol') ||
          block.startsWith('%%CODEBLOCK')) {
        return block;
      }
      // Convert single line breaks to <br>
      block = block.replace(/\n/g, '<br>');
      return `<p>${block}</p>`;
    }).join('\n');
    
    // Restore code blocks
    codeBlocks.forEach((block, index) => {
      html = html.replace(`%%CODEBLOCK_${index}%%`, block);
      html = html.replace(`<p>%%CODEBLOCK_${index}%%</p>`, block);
    });
    
    // Restore inline code
    inlineCodes.forEach((code, index) => {
      html = html.replace(new RegExp(`%%INLINECODE_${index}%%`, 'g'), code);
    });
    
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private convertTables(html: string): string {
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    let result: string[] = [];
    let headerDone = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line is a table row
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          headerDone = false;
          tableHtml = '<table><thead>';
        }
        
        const cells = line.split('|').filter(c => c !== '').map(c => c.trim());
        
        // Check if this is the separator line
        if (cells.every(c => /^[-:]+$/.test(c))) {
          tableHtml += '</thead><tbody>';
          headerDone = true;
          continue;
        }
        
        const cellTag = !headerDone ? 'th' : 'td';
        
        tableHtml += '<tr>';
        for (const cell of cells) {
          tableHtml += `<${cellTag}>${cell}</${cellTag}>`;
        }
        tableHtml += '</tr>';
      } else {
        if (inTable) {
          tableHtml += '</tbody></table>';
          result.push(tableHtml);
          tableHtml = '';
          inTable = false;
        }
        result.push(line);
      }
    }
    
    if (inTable) {
      tableHtml += '</tbody></table>';
      result.push(tableHtml);
    }
    
    return result.join('\n');
  }

  private convertLists(html: string): string {
    const lines = html.split('\n');
    let inList = false;
    let listType = '';
    let result: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for list items with various markers
      const unorderedMatch = trimmed.match(/^[-*•✅❌] (.+)$/);
      const orderedMatch = trimmed.match(/^\d+\. (.+)$/);
      
      if (unorderedMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) result.push(`</${listType}>`);
          result.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        result.push(`<li>${unorderedMatch[1]}</li>`);
        continue;
      }
      
      if (orderedMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) result.push(`</${listType}>`);
          result.push('<ol>');
          inList = true;
          listType = 'ol';
        }
        result.push(`<li>${orderedMatch[1]}</li>`);
        continue;
      }
      
      // End list if empty line or non-list content
      if (inList && (trimmed === '' || (!unorderedMatch && !orderedMatch))) {
        result.push(`</${listType}>`);
        inList = false;
        listType = '';
      }
      
      result.push(line);
    }
    
    if (inList) {
      result.push(`</${listType}>`);
    }
    
    return result.join('\n');
  }
}