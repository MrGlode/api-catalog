import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Enhanced Markdown to HTML pipe
 * Supports: headers, code blocks with syntax highlighting, inline code, 
 * lists, tables, bold, italic, links, blockquotes, horizontal rules
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
    
    // Extract and preserve code blocks first (with syntax highlighting)
    const codeBlocks: string[] = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const index = codeBlocks.length;
      const language = lang || 'text';
      const highlightedCode = this.highlightCode(code.trim(), language);
      codeBlocks.push(`<pre class="code-block" data-lang="${language}"><code class="language-${language}">${highlightedCode}</code></pre>`);
      return `%%CODEBLOCK_${index}%%`;
    });
    
    // Extract inline code
    const inlineCodes: string[] = [];
    html = html.replace(/`([^`]+)`/g, (_, code) => {
      const index = inlineCodes.length;
      inlineCodes.push(`<code class="inline-code">${this.escapeHtml(code)}</code>`);
      return `%%INLINECODE_${index}%%`;
    });
    
    // Escape remaining HTML
    html = this.escapeHtml(html);
    
    // Horizontal rules (before headers to avoid conflicts)
    html = html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr class="md-hr">');
    
    // Headers
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Blockquotes (must be before paragraphs)
    html = this.convertBlockquotes(html);
    
    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    
    // Tables
    html = this.convertTables(html);
    
    // Lists
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
          block.startsWith('<blockquote') ||
          block.startsWith('<hr') ||
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
    
    // Wrap in markdown-body container
    html = `<div class="markdown-body">${html}</div>`;
    
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Highlight code based on language
   */
  private highlightCode(code: string, language: string): string {
    const escaped = this.escapeHtml(code);
    
    // JSON syntax highlighting
    if (language === 'json') {
      return this.highlightJson(escaped);
    }
    
    // Bash/Shell syntax highlighting
    if (language === 'bash' || language === 'shell' || language === 'sh') {
      return this.highlightBash(escaped);
    }
    
    // JavaScript syntax highlighting
    if (language === 'javascript' || language === 'js') {
      return this.highlightJavaScript(escaped);
    }
    
    // Default: no highlighting
    return escaped;
  }

  /**
   * JSON syntax highlighting
   */
  private highlightJson(code: string): string {
    return code
      // Strings (keys and values)
      .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match, content) => {
        return `<span class="json-string">"${content}"</span>`;
      })
      // Numbers
      .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="json-number">$1</span>')
      // Booleans
      .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
      // Null
      .replace(/\bnull\b/g, '<span class="json-null">null</span>');
  }

  /**
   * Bash/Shell syntax highlighting
   */
  private highlightBash(code: string): string {
    return code
      // Comments
      .replace(/(#.*)$/gm, '<span class="bash-comment">$1</span>')
      // Strings
      .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="bash-string">"$1"</span>')
      .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '<span class="bash-string">\'$1\'</span>')
      // Commands at start of line
      .replace(/^(\s*)(curl|wget|npm|yarn|docker|git|cd|ls|mkdir|rm|cp|mv|echo|cat|grep|sed|awk)/gm, 
        '$1<span class="bash-command">$2</span>')
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
      .replace(/(\/\/.*$)/gm, '<span class="js-comment">$1</span>')
      // Strings
      .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="js-string">"$1"</span>')
      .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '<span class="js-string">\'$1\'</span>')
      .replace(/`([^`]*)`/g, '<span class="js-string">`$1`</span>')
      // Keywords
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new)\b/g, 
        '<span class="js-keyword">$1</span>')
      // Numbers
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="js-number">$1</span>')
      // Booleans
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="js-boolean">$1</span>');
  }

  /**
   * Convert blockquotes (> syntax)
   */
  private convertBlockquotes(html: string): string {
    const lines = html.split('\n');
    let inBlockquote = false;
    let blockquoteContent = '';
    let blockquoteType = 'info'; // default
    let result: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for blockquote line
      if (trimmed.startsWith('&gt;')) {
        if (!inBlockquote) {
          inBlockquote = true;
          blockquoteContent = '';
        }
        
        // Remove the > and get content
        let content = trimmed.replace(/^&gt;\s*/, '');
        
        // Detect blockquote type from emoji or keywords
        if (content.includes('💡') || content.toLowerCase().includes('tip') || content.toLowerCase().includes('astuce')) {
          blockquoteType = 'tip';
        } else if (content.includes('⚠️') || content.includes('⚠') || content.toLowerCase().includes('attention') || content.toLowerCase().includes('warning')) {
          blockquoteType = 'warning';
        } else if (content.includes('❌') || content.toLowerCase().includes('danger') || content.toLowerCase().includes('erreur')) {
          blockquoteType = 'danger';
        } else if (content.includes('📍') || content.includes('ℹ️') || content.toLowerCase().includes('note')) {
          blockquoteType = 'info';
        }
        
        blockquoteContent += content + '\n';
      } else {
        if (inBlockquote) {
          // End blockquote
          result.push(`<blockquote class="md-blockquote blockquote-${blockquoteType}">${blockquoteContent.trim()}</blockquote>`);
          blockquoteContent = '';
          blockquoteType = 'info';
          inBlockquote = false;
        }
        result.push(line);
      }
    }
    
    // Handle blockquote at end of content
    if (inBlockquote) {
      result.push(`<blockquote class="md-blockquote blockquote-${blockquoteType}">${blockquoteContent.trim()}</blockquote>`);
    }
    
    return result.join('\n');
  }

  /**
   * Convert markdown tables to HTML tables
   */
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
          tableHtml = '<table class="md-table"><thead>';
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

  /**
   * Convert markdown lists to HTML lists
   */
  private convertLists(html: string): string {
    const lines = html.split('\n');
    let inList = false;
    let listType = '';
    let result: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for list items with various markers (including emojis)
      const unorderedMatch = trimmed.match(/^[-*•✅❌📖🔧🧪📋📌] (.+)$/);
      const orderedMatch = trimmed.match(/^\d+\. (.+)$/);
      
      if (unorderedMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) result.push(`</${listType}>`);
          result.push('<ul class="md-list">');
          inList = true;
          listType = 'ul';
        }
        result.push(`<li>${unorderedMatch[1]}</li>`);
        continue;
      }
      
      if (orderedMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) result.push(`</${listType}>`);
          result.push('<ol class="md-list">');
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