import { Directive, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import mermaid from 'mermaid';

@Directive({
  selector: '[appMermaidRenderer]',
  standalone: true
})
export class MermaidRendererDirective implements AfterViewChecked, OnDestroy {
  private rendered = new Set<Element>();
  private timeout: any;

  constructor(private el: ElementRef<HTMLElement>) {
    mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
  }

  ngAfterViewChecked(): void {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.render(), 50);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeout);
  }

  private async render(): Promise<void> {
    const elements = this.el.nativeElement.querySelectorAll('.mermaid[data-mermaid]');
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i] as HTMLElement;
      if (this.rendered.has(el)) continue;
      const encoded = el.dataset['mermaid'];
      if (!encoded) continue;
      try {
        const code = decodeURIComponent(escape(atob(encoded)));
        const { svg } = await mermaid.render(`mermaid-${Date.now()}-${i}`, code);
        el.innerHTML = svg;
        this.rendered.add(el);
      } catch (e) {
        el.textContent = 'Erreur Mermaid';
        this.rendered.add(el);
      }
    }
  }
}
