/**
 * Mermaid Renderer Directive
 * Renders Mermaid diagrams from prepared HTML containers
 * Works with MarkdownService which prepares .mermaid-block elements
 */
import { 
  Directive, 
  ElementRef, 
  AfterViewChecked, 
  OnDestroy,
  Input,
  NgZone
} from '@angular/core';
import mermaid from 'mermaid';

@Directive({
  selector: '[appMermaidRenderer]',
  standalone: true
})
export class MermaidRendererDirective implements AfterViewChecked, OnDestroy {
  
  @Input() appMermaidRenderer: string = ''; // Optional theme override
  
  private initialized = false;
  private renderedBlocks = new Set<string>();
  private observer: MutationObserver | null = null;
  private renderTimeout: any = null;

  constructor(
    private el: ElementRef<HTMLElement>,
    private ngZone: NgZone
  ) {
    this.initMermaid();
    this.setupMutationObserver();
  }

  /**
   * Initialize Mermaid with configuration
   */
  private initMermaid(): void {
    if (this.initialized) return;
    
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        padding: 15
      },
      sequence: {
        useMaxWidth: true,
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35
      },
      er: {
        useMaxWidth: true
      },
      pie: {
        useMaxWidth: true
      },
      gantt: {
        useMaxWidth: true
      }
    });
    
    this.initialized = true;
  }

  /**
   * Setup MutationObserver to detect content changes
   */
  private setupMutationObserver(): void {
    this.ngZone.runOutsideAngular(() => {
      this.observer = new MutationObserver((mutations) => {
        let hasNewContent = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            hasNewContent = true;
            break;
          }
        }
        
        if (hasNewContent) {
          this.scheduleRender();
        }
      });
      
      this.observer.observe(this.el.nativeElement, {
        childList: true,
        subtree: true
      });
    });
  }

  /**
   * Schedule a render with debounce
   */
  private scheduleRender(): void {
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }
    
    this.renderTimeout = setTimeout(() => {
      this.renderMermaidBlocks();
    }, 100);
  }

  ngAfterViewChecked(): void {
    // Also check on view updates
    this.scheduleRender();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
    }
    this.renderedBlocks.clear();
  }

  /**
   * Find and render all Mermaid blocks in the container
   */
  private async renderMermaidBlocks(): Promise<void> {
    const container = this.el.nativeElement;
    const mermaidBlocks = container.querySelectorAll('.mermaid-block[data-mermaid]');
    
    if (mermaidBlocks.length === 0) return;
    
    for (let i = 0; i < mermaidBlocks.length; i++) {
      const block = mermaidBlocks[i] as HTMLElement;
      const blockId = `mermaid-${Date.now()}-${i}`;
      
      // Skip already rendered blocks
      if (block.dataset['rendered'] === 'true') {
        continue;
      }
      
      // Skip if we've already tried to render this specific block
      const encodedCode = block.dataset['mermaid'];
      if (!encodedCode || this.renderedBlocks.has(encodedCode)) {
        continue;
      }
      
      await this.renderBlock(block, blockId, encodedCode);
    }
    
    // Setup copy buttons after rendering
    this.setupCopyButtons();
  }

  /**
   * Render a single Mermaid block
   */
  private async renderBlock(block: HTMLElement, blockId: string, encodedCode: string): Promise<void> {
    const loadingEl = block.querySelector('.mermaid-loading') as HTMLElement;
    const contentEl = block.querySelector('.mermaid-content') as HTMLElement;
    const errorEl = block.querySelector('.mermaid-error') as HTMLElement;
    
    if (!contentEl) return;
    
    try {
      // Decode the mermaid code from base64
      const mermaidCode = decodeURIComponent(escape(atob(encodedCode)));
      
      // Show loading
      if (loadingEl) loadingEl.style.display = 'flex';
      if (errorEl) errorEl.style.display = 'none';
      
      // Validate syntax first
      const isValid = await mermaid.parse(mermaidCode);
      
      if (isValid) {
        // Render the diagram
        const { svg, bindFunctions } = await mermaid.render(blockId, mermaidCode);
        
        // Insert SVG
        contentEl.innerHTML = svg;
        
        // Apply interactive bindings if any
        if (bindFunctions) {
          bindFunctions(contentEl);
        }
        
        // Mark as rendered
        block.dataset['rendered'] = 'true';
        block.classList.add('rendered');
        this.renderedBlocks.add(encodedCode);
        
        // Hide loading
        if (loadingEl) loadingEl.style.display = 'none';
      } else {
        throw new Error('Invalid mermaid syntax');
      }
      
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      
      // Show error state
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) {
        errorEl.style.display = 'flex';
        const errorText = errorEl.querySelector('.error-text');
        if (errorText) {
          errorText.textContent = `Erreur: ${(error as Error).message || 'Impossible de rendre le diagramme'}`;
        }
      }
      
      // Show source code as fallback
      const sourceEl = block.querySelector('.mermaid-source') as HTMLDetailsElement;
      if (sourceEl) {
        sourceEl.open = true;
      }
      
      // Mark as attempted (don't retry)
      block.dataset['rendered'] = 'error';
      this.renderedBlocks.add(encodedCode);
    }
  }

  /**
   * Setup copy button functionality
   */
  private setupCopyButtons(): void {
    const container = this.el.nativeElement;
    const copyButtons = container.querySelectorAll('.mermaid-copy-btn:not([data-listener])');
    
    copyButtons.forEach((btn) => {
      btn.setAttribute('data-listener', 'true');
      
      btn.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        const block = (event.target as HTMLElement).closest('.mermaid-block');
        if (!block) return;
        
        const encodedCode = (block as HTMLElement).dataset['mermaid'];
        if (!encodedCode) return;
        
        try {
          const mermaidCode = decodeURIComponent(escape(atob(encodedCode)));
          await navigator.clipboard.writeText(mermaidCode);
          
          // Visual feedback
          const button = event.currentTarget as HTMLButtonElement;
          const originalHtml = button.innerHTML;
          button.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          `;
          button.classList.add('copied');
          
          setTimeout(() => {
            button.innerHTML = originalHtml;
            button.classList.remove('copied');
          }, 2000);
          
        } catch (err) {
          console.error('Failed to copy mermaid code:', err);
        }
      });
    });
  }
}