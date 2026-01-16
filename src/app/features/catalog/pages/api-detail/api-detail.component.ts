import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../../../core/services/api.service';
import { ApplicationService } from '../../../../core/services/application.service';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MarkdownService } from '../../../../core/services/markdown.service';
import { 
  API, 
  Document, 
  DocumentList,
  ApplicationInfo,
  ApplicationList,
  ThrottlingPolicy
} from '../../../../core/models';

/**
 * Parsed endpoint from OpenAPI spec
 */
interface ParsedEndpoint {
  method: string;
  path: string;
  summary: string;
  description: string;
  operationId?: string;
  tags?: string[];
  parameters?: any[];
  requestBody?: any;
  responses?: any;
}

/**
 * API Detail Component - Connected to WSO2
 */
@Component({
  selector: 'app-api-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './api-detail.component.html',
  styleUrls: ['./api-detail.component.scss']
})
export class ApiDetailComponent implements OnInit {
  @Input() id!: string;
  
  // Navigation
  activeTab: 'overview' | 'documentation' | 'endpoints' | 'tryit' = 'overview';
  
  // API Data
  api: API | null = null;
  documents: Document[] = [];
  endpoints: ParsedEndpoint[] = [];
  swaggerSpec: any = null;
  
  // States
  isLoading = true;
  isLoadingDocs = false;
  isLoadingSwagger = false;
  errorMessage: string | null = null;
  
  // Selected items
  selectedDocument: Document | null = null;
  documentContent: SafeHtml = '';
  isLoadingDocContent = false;
  selectedEndpoint: ParsedEndpoint | null = null;
  activeCodeLang: 'curl' | 'javascript' | 'python' = 'curl';
  codeCopied = false;
  
  // Subscribe modal
  showSubscribeModal = false;
  isSubscribing = false;
  applications: ApplicationInfo[] = [];
  subscriptionPolicies: ThrottlingPolicy[] = [];
  selectedAppId: string = '';
  selectedPolicy: string = '';
  
  // Authentication
  isAuthenticated = false;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private apiService: ApiService,
    private applicationService: ApplicationService,
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private markdownService: MarkdownService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.loadApi();
  }

  // ========================================
  // DATA LOADING
  // ========================================

  loadApi(): void {
    if (!this.id) {
      this.errorMessage = 'ID de l\'API manquant';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    
    this.apiService.getApiById(this.id).subscribe({
      next: (api: API) => {
        this.api = api;
        this.isLoading = false;
        this.cdr.detectChanges();
        
        // Load additional data
        this.loadDocuments();
        this.loadSwaggerDefinition();
      },
      error: (error) => {
        console.error('Failed to load API', error);
        this.errorMessage = 'Impossible de charger les détails de l\'API.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadDocuments(): void {
    if (!this.id) return;
    
    this.isLoadingDocs = true;
    
    this.apiService.getApiDocuments(this.id, 100).subscribe({
      next: (response: DocumentList) => {
        this.documents = response.list || [];
        this.isLoadingDocs = false;
        
        // Select first document if available
        if (this.documents.length > 0) {
          this.selectDocument(this.documents[0]);
        }
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.warn('Could not load documents', error);
        this.isLoadingDocs = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadSwaggerDefinition(): void {
    if (!this.id) return;
    
    this.isLoadingSwagger = true;
    
    this.apiService.getApiDefinition(this.id).subscribe({
      next: (swagger: string) => {
        try {
          this.swaggerSpec = JSON.parse(swagger);
          this.endpoints = this.parseEndpoints(this.swaggerSpec);
          
          // Select first endpoint if available
          if (this.endpoints.length > 0) {
            this.selectedEndpoint = this.endpoints[0];
          }
        } catch (e) {
          console.warn('Could not parse swagger', e);
        }
        
        this.isLoadingSwagger = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.warn('Could not load swagger definition', error);
        this.isLoadingSwagger = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ========================================
  // SWAGGER PARSING
  // ========================================

  parseEndpoints(spec: any): ParsedEndpoint[] {
    const endpoints: ParsedEndpoint[] = [];
    const paths = spec.paths || {};
    
    for (const path of Object.keys(paths)) {
      const pathItem = paths[path];
      
      for (const method of ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']) {
        if (pathItem[method]) {
          const operation = pathItem[method];
          endpoints.push({
            method: method.toUpperCase(),
            path,
            summary: operation.summary || '',
            description: operation.description || '',
            operationId: operation.operationId,
            tags: operation.tags,
            parameters: operation.parameters || [],
            requestBody: operation.requestBody,
            responses: operation.responses || {}
          });
        }
      }
    }
    
    return endpoints;
  }

  // ========================================
  // NAVIGATION
  // ========================================

  setTab(tab: 'overview' | 'documentation' | 'endpoints' | 'tryit'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  selectDocument(doc: Document): void {
    this.selectedDocument = doc;
    
    if (doc.sourceType === 'INLINE' || doc.sourceType === 'MARKDOWN') {
      this.loadDocumentContent(doc);
    } else if (doc.sourceType === 'URL' && doc.sourceUrl) {
      this.documentContent = '';
    }
  }

  loadDocumentContent(doc: Document): void {
    if (!this.id || !doc.documentId) return;
    
    this.isLoadingDocContent = true;
    
    this.apiService.getDocumentContent(this.id, doc.documentId).subscribe({
      next: (content: string) => {
        // Parse Markdown to HTML if document is MARKDOWN type
        if (doc.sourceType === 'MARKDOWN') {
          const htmlContent = this.markdownService.parse(content);
          this.documentContent = this.sanitizer.bypassSecurityTrustHtml(htmlContent);
        } else {
          // For INLINE, treat as plain text or basic HTML
          this.documentContent = this.sanitizer.bypassSecurityTrustHtml(content);
        }
        this.isLoadingDocContent = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.warn('Could not load document content', error);
        this.documentContent = 'Contenu non disponible.';
        this.isLoadingDocContent = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectEndpoint(endpoint: ParsedEndpoint): void {
    this.selectedEndpoint = endpoint;
    this.cdr.detectChanges();
  }

  setCodeLang(lang: 'curl' | 'javascript' | 'python'): void {
    this.activeCodeLang = lang;
    this.cdr.detectChanges();
  }

  // ========================================
  // SUBSCRIPTION
  // ========================================

  openSubscribeModal(): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: `/catalog/${this.id}` } 
      });
      return;
    }
    
    this.showSubscribeModal = true;
    this.loadApplicationsForSubscription();
    this.loadSubscriptionPolicies();
    this.cdr.detectChanges();
  }

  closeSubscribeModal(): void {
    this.showSubscribeModal = false;
    this.selectedAppId = '';
    this.selectedPolicy = '';
    this.cdr.detectChanges();
  }

  loadApplicationsForSubscription(): void {
    this.applicationService.getApplications({ limit: 100 }).subscribe({
      next: (response: ApplicationList) => {
        this.applications = response.list || [];
        
        if (this.applications.length > 0) {
          this.selectedAppId = this.applications[0].applicationId || '';
        }
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Could not load applications', error);
      }
    });
  }

  loadSubscriptionPolicies(): void {
    // Use the API's throttling policies if available
    if (this.api?.tiers && this.api.tiers.length > 0) {
      this.subscriptionPolicies = this.api.tiers.map(t => ({
        name: t.tierName,
        tierPlan: t.tierPlan
      })) as ThrottlingPolicy[];
      
      if (this.subscriptionPolicies.length > 0) {
        this.selectedPolicy = this.subscriptionPolicies[0].name || '';
      }
    } else if (this.api?.throttlingPolicies && this.api.throttlingPolicies.length > 0) {
      this.subscriptionPolicies = this.api.throttlingPolicies.map(p => ({
        name: p
      })) as ThrottlingPolicy[];
      
      if (this.subscriptionPolicies.length > 0) {
        this.selectedPolicy = this.subscriptionPolicies[0].name || '';
      }
    } else {
      // Fallback: load from API
      this.subscriptionService.getSubscriptionPolicies().subscribe({
        next: (response) => {
          this.subscriptionPolicies = response.list || [];
          
          if (this.subscriptionPolicies.length > 0) {
            this.selectedPolicy = this.subscriptionPolicies[0].name || '';
          }
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.warn('Could not load subscription policies', error);
        }
      });
    }
  }

  subscribe(): void {
    if (!this.selectedAppId || !this.selectedPolicy || !this.id) {
      return;
    }
    
    this.isSubscribing = true;
    
    this.subscriptionService.subscribeToApi(this.id, this.selectedAppId, this.selectedPolicy).subscribe({
      next: () => {
        this.isSubscribing = false;
        this.closeSubscribeModal();
        alert('Souscription réussie !');
      },
      error: (error) => {
        console.error('Failed to subscribe', error);
        this.isSubscribing = false;
        alert('Erreur lors de la souscription: ' + (error.error?.description || error.message));
      }
    });
  }

  // ========================================
  // CODE EXAMPLES
  // ========================================

  generateCurlExample(endpoint: ParsedEndpoint): string {
    const baseUrl = this.getBaseUrl();
    const method = endpoint.method;
    const url = `${baseUrl}${endpoint.path}`;
    
    let curl = `curl -X ${method} "${url}"`;
    curl += ` \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`;
    curl += ` \\\n  -H "Content-Type: application/json"`;
    
    if (endpoint.requestBody && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      curl += ` \\\n  -d '{"key": "value"}'`;
    }
    
    return curl;
  }

  generateJsExample(endpoint: ParsedEndpoint): string {
    const baseUrl = this.getBaseUrl();
    const method = endpoint.method;
    const url = `${baseUrl}${endpoint.path}`;
    
    let js = `const response = await fetch("${url}", {\n`;
    js += `  method: "${method}",\n`;
    js += `  headers: {\n`;
    js += `    "Authorization": "Bearer YOUR_ACCESS_TOKEN",\n`;
    js += `    "Content-Type": "application/json"\n`;
    js += `  }`;
    
    if (endpoint.requestBody && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      js += `,\n  body: JSON.stringify({\n    key: "value"\n  })`;
    }
    
    js += `\n});\n\nconst data = await response.json();`;
    
    return js;
  }

  generatePythonExample(endpoint: ParsedEndpoint): string {
    const baseUrl = this.getBaseUrl();
    const method = endpoint.method.toLowerCase();
    const url = `${baseUrl}${endpoint.path}`;
    
    let py = `import requests\n\n`;
    py += `headers = {\n`;
    py += `    "Authorization": "Bearer YOUR_ACCESS_TOKEN",\n`;
    py += `    "Content-Type": "application/json"\n`;
    py += `}\n\n`;
    
    if (endpoint.requestBody && (method === 'post' || method === 'put' || method === 'patch')) {
      py += `data = {\n    "key": "value"\n}\n\n`;
      py += `response = requests.${method}("${url}", headers=headers, json=data)`;
    } else {
      py += `response = requests.${method}("${url}", headers=headers)`;
    }
    
    py += `\nprint(response.json())`;
    
    return py;
  }

  getCodeExample(endpoint: ParsedEndpoint): string {
    switch (this.activeCodeLang) {
      case 'curl':
        return this.generateCurlExample(endpoint);
      case 'javascript':
        return this.generateJsExample(endpoint);
      case 'python':
        return this.generatePythonExample(endpoint);
      default:
        return '';
    }
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.codeCopied = true;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.codeCopied = false;
        this.cdr.detectChanges();
      }, 2000);
    });
  }

  // ========================================
  // HELPERS
  // ========================================

  getBaseUrl(): string {
    if (this.api?.endpointURLs && this.api.endpointURLs.length > 0) {
      const urls = this.api.endpointURLs[0].URLs;
      return urls?.https || urls?.http || '';
    }
    return `https://api.example.com${this.api?.context || ''}/${this.api?.version || ''}`;
  }

  getMethodClass(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET': return 'method-get';
      case 'POST': return 'method-post';
      case 'PUT': return 'method-put';
      case 'DELETE': return 'method-delete';
      case 'PATCH': return 'method-patch';
      default: return 'method-default';
    }
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'PUBLISHED': return 'badge-green';
      case 'PROTOTYPED': return 'badge-blue';
      case 'DEPRECATED': return 'badge-orange';
      case 'BLOCKED': return 'badge-red';
      case 'RETIRED': return 'badge-gray';
      default: return 'badge-gray';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'PUBLISHED': return 'Publié';
      case 'PROTOTYPED': return 'Prototype';
      case 'DEPRECATED': return 'Déprécié';
      case 'BLOCKED': return 'Bloqué';
      case 'RETIRED': return 'Retiré';
      default: return status || 'Inconnu';
    }
  }

  getDocTypeIcon(type?: string): string {
    switch (type) {
      case 'HOWTO': return '📖';
      case 'SAMPLES': return '💻';
      case 'PUBLIC_FORUM': return '💬';
      case 'SUPPORT_FORUM': return '🛟';
      case 'API_MESSAGE_FORMAT': return '📄';
      case 'SWAGGER_DOC': return '📋';
      default: return '📝';
    }
  }

  getDocTypeLabel(type?: string): string {
    switch (type) {
      case 'HOWTO': return 'Guide';
      case 'SAMPLES': return 'Exemples';
      case 'PUBLIC_FORUM': return 'Forum';
      case 'SUPPORT_FORUM': return 'Support';
      case 'API_MESSAGE_FORMAT': return 'Format';
      case 'SWAGGER_DOC': return 'Swagger';
      default: return 'Autre';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  goBack(): void {
    this.router.navigate(['/catalog']);
  }

  getResponseCodes(responses: any): string[] {
    return Object.keys(responses || {}).sort();
  }

  reload(): void {
    this.loadApi();
  }
}