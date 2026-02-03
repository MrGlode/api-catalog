import { Component, OnInit, Input, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
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
import { MermaidRendererDirective } from '../../../../shared/directives/mermaid-renderer.directive';

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
  parameters?: ParameterDef[];
  requestBody?: RequestBodyDef;
  responses?: Record<string, ResponseDef>;
  security?: any[];
  expanded?: boolean;
}

/**
 * Parameter definition
 */
interface ParameterDef {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: SchemaRef;
  type?: string;
  example?: any;
  // For sandbox
  value?: string;
}

/**
 * Request body definition
 */
interface RequestBodyDef {
  description?: string;
  required?: boolean;
  content?: Record<string, { schema?: SchemaRef; example?: any }>;
}

/**
 * Response definition
 */
interface ResponseDef {
  description?: string;
  content?: Record<string, { schema?: SchemaRef; example?: any }>;
}

/**
 * Schema reference
 */
interface SchemaRef {
  type?: string;
  format?: string;
  items?: SchemaRef;
  $ref?: string;
  properties?: Record<string, SchemaRef>;
  example?: any;
  examples?: any[];
  required?: string[];
  default?: any;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  oneOf?: SchemaRef[];
  anyOf?: SchemaRef[];
  allOf?: SchemaRef[];
  title?: string;
  description?: string;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
}

/**
 * Tag group for endpoints
 */
interface TagGroup {
  name: string;
  description?: string;
  endpoints: ParsedEndpoint[];
  expanded: boolean;
}

/**
 * Sandbox request/response
 */
interface SandboxRequest {
  endpoint: ParsedEndpoint | null;
  parameters: Record<string, string>;
  headers: Record<string, string>;
  body: string;
}

interface SandboxResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  error?: string;
}

/**
 * Environment for Sandbox
 */
interface SandboxEnvironment {
  name: string;
  displayName: string;
  httpUrl?: string;
  httpsUrl?: string;
  type: 'production' | 'sandbox' | 'hybrid';
}

/**
 * JSON Validation state
 */
interface JsonValidation {
  isValid: boolean;
  error: string | null;
}

/**
 * Application key for token
 */
interface AppKeyInfo {
  applicationId: string;
  applicationName: string;
  keyType: 'PRODUCTION' | 'SANDBOX';
  consumerKey?: string;
  consumerSecret?: string;
  token?: string;
}

/**
 * Environment Variable for Sandbox
 */
interface EnvironmentVariable {
  key: string;
  value: string;
  description?: string;
}

/**
 * Saved Request Collection Item
 */
interface SavedRequest {
  id: string;
  name: string;
  description?: string;
  endpoint: {
    method: string;
    path: string;
  };
  parameters: Record<string, string>;
  headers: Record<string, string>;
  body: string;
  createdAt: Date;
}

/**
 * History item for diff
 */
interface HistoryItem {
  id: string;
  request: SandboxRequest;
  response: SandboxResponse;
  timestamp: Date;
}

/**
 * API Detail Component - Connected to WSO2
 */
@Component({
  selector: 'app-api-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MermaidRendererDirective],
  templateUrl: './api-detail.component.html',
  styleUrls: ['./api-detail.component.scss']
})
export class ApiDetailComponent implements OnInit, OnDestroy {
  @Input() id!: string;
  
  // Navigation - 4 tabs now
  activeTab: 'overview' | 'documentation' | 'reference' | 'sandbox' = 'overview';
  
  // API Data
  api: API | null = null;
  documents: Document[] = [];
  endpoints: ParsedEndpoint[] = [];
  tagGroups: TagGroup[] = [];
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
  
  // Sandbox
  sandboxRequest: SandboxRequest = {
    endpoint: null,
    parameters: {},
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{token}}'
    },
    body: ''
  };
  sandboxResponse: SandboxResponse | null = null;
  isSandboxLoading = false;
  sandboxHistory: HistoryItem[] = [];
  
  // Sandbox Level 1 - Environments
  sandboxEnvironments: SandboxEnvironment[] = [];
  selectedEnvironment: SandboxEnvironment | null = null;
  
  // Sandbox Level 1 - Token Auto-fill
  userSubscriptions: any[] = [];
  availableAppKeys: AppKeyInfo[] = [];
  selectedAppKey: AppKeyInfo | null = null;
  isLoadingKeys = false;
  
  // Sandbox Level 1 - JSON Validation
  jsonValidation: JsonValidation = { isValid: true, error: null };
  
  // Sandbox Level 3 - Environment Variables
  envVariables: EnvironmentVariable[] = [
    { key: 'baseUrl', value: '', description: 'URL de base de l\'API' },
    { key: 'token', value: '', description: 'Token d\'authentification' }
  ];
  showEnvPanel = false;
  
  // Sandbox Level 3 - Saved Collections
  savedRequests: SavedRequest[] = [];
  showCollectionsPanel = false;
  
  // Sandbox Level 3 - Code Generation Modal
  showCodeGenModal = false;
  codeGenLang: 'curl' | 'javascript' | 'python' = 'curl';
  
  // Sandbox Level 3 - Diff Mode
  diffMode = false;
  diffSelection: { first: HistoryItem | null; second: HistoryItem | null } = { first: null, second: null };

  // API Thumbnail URL (object URL from Blob)
  apiThumbnailUrl: string | null = null;

  // Response accordion state
  expandedResponses: Record<string, boolean> = {};
  
  // Parameter schema accordion state
  expandedParams: Record<string, boolean> = {};
  
  // Nested property expansion state
  expandedNestedProps: Record<string, boolean> = {};

  // OneOf/AnyOf option selection
  expandedOneOfOptions: Record<string, number> = {};

  // Global Search Navigation - highlight endpoint from search results
  highlightedEndpointKey: string | null = null;
  private pendingEndpointNavigation: string | null = null;

  constructor(
    private route: ActivatedRoute,
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
    
    // Listen to route params changes (API ID) - handles navigation between different APIs
    this.route.params.subscribe(params => {
      const newId = params['id'];
      if (newId && newId !== this.id) {
        this.id = newId;
        this.resetComponentState();
        this.loadApi();
      } else if (newId && !this.api) {
        // Initial load
        this.id = newId;
        this.loadApi();
      }
    });
    
    // Listen to query params for navigation from global search
    this.route.queryParams.subscribe(params => {
      if (params['tab'] || params['endpoint']) {
        this.handleSearchNavigation(params['tab'], params['endpoint']);
      }
    });
    
    // Fallback: if id is already set via @Input but params subscription hasn't fired
    if (this.id && !this.api) {
      this.loadApi();
    }
  }

  /**
   * Reset component state when navigating to a different API
   */
  private resetComponentState(): void {
    // Reset navigation tab to default
    this.activeTab = 'overview';
    
    // Reset data
    this.api = null;
    this.documents = [];
    this.endpoints = [];
    this.tagGroups = [];
    this.swaggerSpec = null;
    
    // Reset states
    this.isLoading = true;
    this.isLoadingDocs = false;
    this.isLoadingSwagger = false;
    this.errorMessage = null;
    
    // Reset selected items
    this.selectedDocument = null;
    this.documentContent = '';
    this.selectedEndpoint = null;
    
    // Reset sandbox
    this.sandboxResponse = null;
    this.sandboxHistory = [];
    
    // Reset navigation state
    this.highlightedEndpointKey = null;
    this.pendingEndpointNavigation = null;
    
    // Reset accordion states
    this.expandedResponses = {};
    this.expandedParams = {};
    this.expandedNestedProps = {};
    this.expandedOneOfOptions = {};
    
    // Clean up previous thumbnail
    if (this.apiThumbnailUrl) {
      URL.revokeObjectURL(this.apiThumbnailUrl);
      this.apiThumbnailUrl = null;
    }
    
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    // Clean up thumbnail object URL to prevent memory leak
    if (this.apiThumbnailUrl) {
      URL.revokeObjectURL(this.apiThumbnailUrl);
    }
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
        this.loadThumbnail();
        
        // Initialize sandbox environments from API
        this.initSandboxEnvironments();
        
        // Load user subscriptions if authenticated
        if (this.isAuthenticated) {
          this.loadUserSubscriptions();
        }
      },
      error: (error) => {
        console.error('Failed to load API', error);
        this.errorMessage = 'Impossible de charger les dÃ©tails de l\'API.';
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
          this.tagGroups = this.groupEndpointsByTag(this.swaggerSpec, this.endpoints);
          
          // Select first endpoint if available
          if (this.endpoints.length > 0) {
            this.selectedEndpoint = this.endpoints[0];
          }
          
          // Handle pending navigation from global search (query params arrived before data loaded)
          if (this.pendingEndpointNavigation) {
            setTimeout(() => {
              this.navigateToEndpoint(this.pendingEndpointNavigation!);
              this.pendingEndpointNavigation = null;
            }, 100);
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
          
          // Merge path-level parameters with operation parameters
          const pathParams = pathItem.parameters || [];
          const operationParams = operation.parameters || [];
          const allParamsRaw = [...pathParams, ...operationParams];
          
          // Resolve $ref parameters
          const allParams = allParamsRaw.map(param => this.resolveParameter(param, spec));
          
          // Resolve $ref in responses
          const resolvedResponses = this.resolveResponses(operation.responses || {}, spec);
          
          // Resolve $ref in requestBody
          const resolvedRequestBody = this.resolveRequestBody(operation.requestBody, spec);
          
          endpoints.push({
            method: method.toUpperCase(),
            path,
            summary: operation.summary || '',
            description: operation.description || '',
            operationId: operation.operationId,
            tags: operation.tags || ['default'],
            parameters: allParams,
            requestBody: resolvedRequestBody,
            responses: resolvedResponses,
            security: operation.security,
            expanded: false
          });
        }
      }
    }
    
    return endpoints;
  }

  /**
   * Resolve a parameter that might be a $ref
   */
  resolveParameter(param: any, spec: any): ParameterDef {
    if (param.$ref) {
      const resolved = this.resolveRefFromSpec(param.$ref, spec);
      if (resolved) {
        return resolved as ParameterDef;
      }
      const paramName = param.$ref.split('/').pop() || 'unknown';
      return {
        name: paramName,
        in: 'header',
        description: `Reference: ${param.$ref}`,
        required: false
      };
    }
    return param as ParameterDef;
  }

  /**
   * Resolve $ref in responses object
   */
  resolveResponses(responses: Record<string, any>, spec: any): Record<string, any> {
    const resolved: Record<string, any> = {};
    for (const [code, response] of Object.entries(responses)) {
      if (response.$ref) {
        const resolvedResponse = this.resolveRefFromSpec(response.$ref, spec);
        resolved[code] = resolvedResponse || response;
      } else {
        resolved[code] = response;
      }
    }
    return resolved;
  }

  /**
   * Resolve $ref in requestBody
   */
  resolveRequestBody(requestBody: any, spec: any): any {
    if (!requestBody) return null;
    if (requestBody.$ref) {
      return this.resolveRefFromSpec(requestBody.$ref, spec) || requestBody;
    }
    return requestBody;
  }

  /**
   * Resolve a $ref path from the OpenAPI spec
   */
  resolveRefFromSpec(refPath: string, spec: any): any {
    if (!refPath.startsWith('#/')) return null;
    const pathParts = refPath.substring(2).split('/');
    let current = spec;
    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    return current;
  }

  groupEndpointsByTag(spec: any, endpoints: ParsedEndpoint[]): TagGroup[] {
    const tagMap = new Map<string, TagGroup>();
    
    // Get tag definitions from spec
    const tagDefs = spec.tags || [];
    const tagDescriptions: Record<string, string> = {};
    for (const tag of tagDefs) {
      tagDescriptions[tag.name] = tag.description || '';
    }
    
    // Group endpoints by first tag
    for (const endpoint of endpoints) {
      const tagName = endpoint.tags?.[0] || 'default';
      
      if (!tagMap.has(tagName)) {
        tagMap.set(tagName, {
          name: tagName,
          description: tagDescriptions[tagName] || '',
          endpoints: [],
          expanded: true // First load: all expanded
        });
      }
      
      tagMap.get(tagName)!.endpoints.push(endpoint);
    }
    
    // Convert to array and sort alphabetically
    return Array.from(tagMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  // ========================================
  // NAVIGATION
  // ========================================

  setTab(tab: 'overview' | 'documentation' | 'reference' | 'sandbox'): void {
    this.activeTab = tab;
    
    // If switching to sandbox, prepare the first endpoint
    if (tab === 'sandbox' && this.endpoints.length > 0 && !this.sandboxRequest.endpoint) {
      this.selectEndpointForSandbox(this.endpoints[0]);
    }
    
    this.cdr.detectChanges();
  }

  toggleTagGroup(group: TagGroup): void {
    group.expanded = !group.expanded;
    this.cdr.detectChanges();
  }

  toggleEndpoint(endpoint: ParsedEndpoint): void {
    endpoint.expanded = !endpoint.expanded;
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
  // SANDBOX
  // ========================================

  // --- Level 1: Environment Management ---
  
  initSandboxEnvironments(): void {
    if (!this.api?.endpointURLs || this.api.endpointURLs.length === 0) {
      // Default environment
      this.sandboxEnvironments = [{
        name: 'default',
        displayName: 'Production',
        httpsUrl: this.getBaseUrl(),
        type: 'production'
      }];
    } else {
      this.sandboxEnvironments = this.api.endpointURLs.map(env => ({
        name: env.environmentName || 'default',
        displayName: env.environmentDisplayName || env.environmentName || 'Default',
        httpUrl: env.URLs?.http,
        httpsUrl: env.URLs?.https,
        type: this.detectEnvironmentType(env.environmentName || '')
      }));
    }
    
    // Select first environment by default
    if (this.sandboxEnvironments.length > 0) {
      this.selectedEnvironment = this.sandboxEnvironments[0];
      
      // Initialize {{baseUrl}} variable with selected environment
      const baseUrlVar = this.envVariables.find(v => v.key === 'baseUrl');
      if (baseUrlVar) {
        baseUrlVar.value = this.selectedEnvironment.httpsUrl || 
                           this.selectedEnvironment.httpUrl || 
                           this.getBaseUrl();
      }
    }
    
    this.cdr.detectChanges();
  }
  
  detectEnvironmentType(name: string): 'production' | 'sandbox' | 'hybrid' {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('sandbox') || lowerName.includes('test') || lowerName.includes('dev')) {
      return 'sandbox';
    }
    if (lowerName.includes('prod')) {
      return 'production';
    }
    return 'hybrid';
  }
  
  selectEnvironment(env: SandboxEnvironment): void {
    this.selectedEnvironment = env;
    
    // Sync {{baseUrl}} variable with selected environment
    const baseUrlVar = this.envVariables.find(v => v.key === 'baseUrl');
    if (baseUrlVar) {
      baseUrlVar.value = env.httpsUrl || env.httpUrl || '';
    }
    
    // Auto-select matching app key (production env -> PRODUCTION key)
    this.autoSelectAppKey();
    
    this.cdr.detectChanges();
  }
  
  getEnvironmentIcon(type: 'production' | 'sandbox' | 'hybrid'): string {
    switch (type) {
      case 'production': return 'ðŸ”´';
      case 'sandbox': return 'ðŸŸ¢';
      case 'hybrid': return 'ðŸŸ¡';
    }
  }
  
  // --- Level 1: Token Auto-fill ---
  
  loadUserSubscriptions(): void {
    if (!this.id) return;
    
    this.subscriptionService.getSubscriptions({ apiId: this.id, limit: 100 }).subscribe({
      next: (response) => {
        this.userSubscriptions = response.list || [];
        
        // Load keys for all subscribed applications
        if (this.userSubscriptions.length > 0) {
          this.loadApplicationKeys();
        }
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.warn('Could not load user subscriptions', error);
      }
    });
  }
  
  loadApplicationKeys(): void {
    this.isLoadingKeys = true;
    this.availableAppKeys = [];
    
    // Get unique application IDs
    const appIds = [...new Set(this.userSubscriptions.map(s => s.applicationId))];
    
    let loadedCount = 0;
    
    for (const appId of appIds) {
      const sub = this.userSubscriptions.find(s => s.applicationId === appId);
      const appName = sub?.applicationInfo?.name || 'Application';
      
      this.applicationService.getApplicationKeys(appId).subscribe({
        next: (keys: any[]) => {
          // Process each key returned by the API
          for (const key of keys) {
            if (key.consumerKey) {
              this.availableAppKeys.push({
                applicationId: appId,
                applicationName: appName,
                keyType: key.keyType || 'PRODUCTION',
                consumerKey: key.consumerKey,
                consumerSecret: key.consumerSecret,
                token: key.token?.accessToken
              });
            }
          }
          
          loadedCount++;
          if (loadedCount === appIds.length) {
            this.isLoadingKeys = false;
            
            // Auto-select first key matching environment type
            this.autoSelectAppKey();
            
            this.cdr.detectChanges();
          }
        },
        error: () => {
          loadedCount++;
          if (loadedCount === appIds.length) {
            this.isLoadingKeys = false;
            this.cdr.detectChanges();
          }
        }
      });
    }
    
    // If no apps to load
    if (appIds.length === 0) {
      this.isLoadingKeys = false;
      this.cdr.detectChanges();
    }
  }
  
  autoSelectAppKey(): void {
    if (this.availableAppKeys.length === 0) return;
    
    // Try to match environment type
    const envType = this.selectedEnvironment?.type;
    let key: AppKeyInfo | undefined;
    
    if (envType === 'production') {
      key = this.availableAppKeys.find(k => k.keyType === 'PRODUCTION');
    } else if (envType === 'sandbox') {
      key = this.availableAppKeys.find(k => k.keyType === 'SANDBOX');
    }
    
    // Fallback to first available
    this.selectedAppKey = key || this.availableAppKeys[0];
    
    // Apply token
    if (this.selectedAppKey) {
      this.applyTokenToHeaders();
    }
  }
  
  selectAppKey(key: AppKeyInfo): void {
    this.selectedAppKey = key;
    this.applyTokenToHeaders();
    
    // Sync {{token}} variable
    const tokenVar = this.envVariables.find(v => v.key === 'token');
    if (tokenVar) {
      tokenVar.value = key.token || '';
    }
    
    this.cdr.detectChanges();
  }
  
  applyTokenToHeaders(): void {
    if (this.selectedAppKey?.token) {
      // Use {{token}} variable syntax so user can customize
      this.sandboxRequest.headers['Authorization'] = `Bearer {{token}}`;
      
      // Also update the token variable value
      const tokenVar = this.envVariables.find(v => v.key === 'token');
      if (tokenVar) {
        tokenVar.value = this.selectedAppKey.token;
      }
    } else if (this.selectedAppKey?.consumerKey && this.selectedAppKey?.consumerSecret) {
      // If no token, show the consumer key/secret (user will need to generate token)
      this.sandboxRequest.headers['Authorization'] = `Bearer <generate_token_first>`;
    }
    this.cdr.detectChanges();
  }
  
  // --- Level 1: JSON Validation ---
  
  validateJsonBody(): void {
    if (!this.sandboxRequest.body || this.sandboxRequest.body.trim() === '') {
      this.jsonValidation = { isValid: true, error: null };
      return;
    }
    
    try {
      JSON.parse(this.sandboxRequest.body);
      this.jsonValidation = { isValid: true, error: null };
    } catch (e: any) {
      this.jsonValidation = { 
        isValid: false, 
        error: e.message || 'JSON invalide' 
      };
    }
    
    this.cdr.detectChanges();
  }
  
  formatJsonBody(): void {
    if (!this.sandboxRequest.body || this.sandboxRequest.body.trim() === '') {
      return;
    }
    
    try {
      const parsed = JSON.parse(this.sandboxRequest.body);
      this.sandboxRequest.body = JSON.stringify(parsed, null, 2);
      this.jsonValidation = { isValid: true, error: null };
    } catch (e: any) {
      this.jsonValidation = { 
        isValid: false, 
        error: e.message || 'Impossible de formater: JSON invalide' 
      };
    }
    
    this.cdr.detectChanges();
  }
  
  minifyJsonBody(): void {
    if (!this.sandboxRequest.body || this.sandboxRequest.body.trim() === '') {
      return;
    }
    
    try {
      const parsed = JSON.parse(this.sandboxRequest.body);
      this.sandboxRequest.body = JSON.stringify(parsed);
      this.jsonValidation = { isValid: true, error: null };
    } catch (e: any) {
      this.jsonValidation = { 
        isValid: false, 
        error: e.message || 'Impossible de minifier: JSON invalide' 
      };
    }
    
    this.cdr.detectChanges();
  }

  // --- Existing Sandbox Methods ---

  // --- Level 2: Load Examples from OpenAPI ---
  
  loadExampleValues(): void {
    if (!this.sandboxRequest.endpoint) return;
    
    const endpoint = this.sandboxRequest.endpoint;
    
    // Load parameter examples
    if (endpoint.parameters) {
      for (const param of endpoint.parameters) {
        if (param.example !== undefined) {
          this.sandboxRequest.parameters[param.name] = String(param.example);
        } else if (param.schema?.example !== undefined) {
          this.sandboxRequest.parameters[param.name] = String(param.schema.example);
        }
      }
    }
    
    // Load request body example
    if (endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      const content = endpoint.requestBody.content?.['application/json'];
      if (content?.example) {
        this.sandboxRequest.body = JSON.stringify(content.example, null, 2);
        this.jsonValidation = { isValid: true, error: null };
      } else if (content?.schema) {
        // Try to get example from schema
        const example = this.extractExampleFromSchema(content.schema);
        if (example) {
          this.sandboxRequest.body = JSON.stringify(example, null, 2);
          this.jsonValidation = { isValid: true, error: null };
        }
      }
    }
    
    this.cdr.detectChanges();
  }
  
  extractExampleFromSchema(schema: SchemaRef, depth = 0): any {
    // Prevent infinite recursion
    if (depth > 5) return null;
    
    // If schema has direct example
    if (schema.example !== undefined) {
      return schema.example;
    }
    
    // Handle $ref (simplified - just return placeholder)
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop();
      // Try to resolve from swagger spec
      const resolved = this.resolveSchemaRef(schema.$ref);
      if (resolved) {
        return this.extractExampleFromSchema(resolved, depth + 1);
      }
      return { _ref: refName };
    }
    
    // Build example based on type
    switch (schema.type) {
      case 'object':
        if (schema.properties) {
          const obj: Record<string, any> = {};
          for (const [key, prop] of Object.entries(schema.properties)) {
            obj[key] = this.extractExampleFromSchema(prop, depth + 1);
          }
          return obj;
        }
        return {};
        
      case 'array':
        if (schema.items) {
          return [this.extractExampleFromSchema(schema.items, depth + 1)];
        }
        return [];
        
      case 'string':
        if (schema.format === 'date') return '2024-01-15';
        if (schema.format === 'date-time') return '2024-01-15T10:30:00Z';
        if (schema.format === 'email') return 'user@example.com';
        if (schema.format === 'uri') return 'https://example.com';
        if (schema.format === 'uuid') return '550e8400-e29b-41d4-a716-446655440000';
        return 'string';
        
      case 'number':
      case 'integer':
        return 0;
        
      case 'boolean':
        return true;
        
      default:
        return null;
    }
  }
  
  resolveSchemaRef(ref: string): SchemaRef | null {
    if (!this.swaggerSpec || !ref.startsWith('#/')) return null;
    
    const parts = ref.replace('#/', '').split('/');
    let current: any = this.swaggerSpec;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    
    return current as SchemaRef;
  }
  
  hasExamples(): boolean {
    if (!this.sandboxRequest.endpoint) return false;
    
    const endpoint = this.sandboxRequest.endpoint;
    
    // Check parameters
    const hasParamExamples = endpoint.parameters?.some(p => 
      p.example !== undefined || p.schema?.example !== undefined
    );
    
    // Check request body
    const hasBodyExample = endpoint.requestBody?.content?.['application/json']?.example !== undefined ||
                          endpoint.requestBody?.content?.['application/json']?.schema !== undefined;
    
    return hasParamExamples || hasBodyExample;
  }
  
  // --- Level 2: Syntax Highlighting ---
  
  highlightJson(json: string): string {
    if (!json) return '';
    
    try {
      // Try to parse and re-stringify for consistent formatting
      const parsed = JSON.parse(json);
      json = JSON.stringify(parsed, null, 2);
    } catch {
      // If not valid JSON, just return escaped
      return this.escapeHtml(json);
    }
    
    // Simple regex-based highlighting
    return json
      // Strings (must be first to avoid conflicts)
      .replace(/"([^"\\]|\\.)*"/g, (match) => {
        // Check if it's a key (followed by :) or value
        return `<span class="json-string">${this.escapeHtml(match)}</span>`;
      })
      // Numbers
      .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="json-number">$1</span>')
      // Booleans
      .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
      // Null
      .replace(/\bnull\b/g, '<span class="json-null">null</span>');
  }
  
  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // --- Level 2: Export Response ---
  
  downloadResponse(): void {
    if (!this.sandboxResponse?.body) return;
    
    const blob = new Blob([this.sandboxResponse.body], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Generate filename from endpoint
    const endpoint = this.sandboxRequest.endpoint;
    const filename = endpoint 
      ? `response_${endpoint.method}_${endpoint.path.replace(/\//g, '_').replace(/[{}]/g, '')}.json`
      : 'response.json';
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  copyResponseFormatted(): void {
    if (!this.sandboxResponse?.body) return;
    
    try {
      // Try to format JSON
      const parsed = JSON.parse(this.sandboxResponse.body);
      const formatted = JSON.stringify(parsed, null, 2);
      navigator.clipboard.writeText(formatted).then(() => {
        this.showCopyFeedback('formatted');
      });
    } catch {
      // If not valid JSON, copy as-is
      navigator.clipboard.writeText(this.sandboxResponse.body).then(() => {
        this.showCopyFeedback('raw');
      });
    }
  }
  
  copyResponseRaw(): void {
    if (!this.sandboxResponse?.body) return;
    
    try {
      // Minify if JSON
      const parsed = JSON.parse(this.sandboxResponse.body);
      const minified = JSON.stringify(parsed);
      navigator.clipboard.writeText(minified).then(() => {
        this.showCopyFeedback('minified');
      });
    } catch {
      navigator.clipboard.writeText(this.sandboxResponse.body).then(() => {
        this.showCopyFeedback('raw');
      });
    }
  }
  
  copyFeedbackType: 'formatted' | 'minified' | 'raw' | null = null;
  
  showCopyFeedback(type: 'formatted' | 'minified' | 'raw'): void {
    this.copyFeedbackType = type;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.copyFeedbackType = null;
      this.cdr.detectChanges();
    }, 2000);
  }
  
  getResponseSize(): string {
    if (!this.sandboxResponse?.body) return '0 B';
    
    const bytes = new Blob([this.sandboxResponse.body]).size;
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  
  // ========================================
  // LEVEL 3: ENVIRONMENT VARIABLES
  // ========================================
  
  toggleEnvPanel(): void {
    this.showEnvPanel = !this.showEnvPanel;
    if (this.showEnvPanel) {
      this.initEnvVariablesFromContext();
    }
    this.cdr.detectChanges();
  }
  
  addEnvVariable(): void {
    const key = prompt('Nom de la variable (ex: apiKey):');
    if (key && key.trim()) {
      // Check if already exists
      if (this.envVariables.some(v => v.key === key.trim())) {
        alert('Cette variable existe dÃ©jÃ .');
        return;
      }
      this.envVariables.push({
        key: key.trim(),
        value: '',
        description: ''
      });
      this.cdr.detectChanges();
    }
  }
  
  removeEnvVariable(index: number): void {
    // Don't allow removing default variables
    if (index < 2) return;
    this.envVariables.splice(index, 1);
    this.cdr.detectChanges();
  }
  
  applyEnvVariables(text: string): string {
    let result = text;
    for (const variable of this.envVariables) {
      if (variable.value) {
        const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
        result = result.replace(regex, variable.value);
      }
    }
    return result;
  }
  
  initEnvVariablesFromContext(): void {
    // Set baseUrl from selected environment
    const baseUrl = this.selectedEnvironment?.httpsUrl || 
                    this.selectedEnvironment?.httpUrl || 
                    this.getBaseUrl();
    this.envVariables[0].value = baseUrl;
    
    // Set token if available
    if (this.selectedAppKey?.token) {
      this.envVariables[1].value = this.selectedAppKey.token;
    }
    
    this.cdr.detectChanges();
  }
  
  // ========================================
  // LEVEL 3: SAVED COLLECTIONS
  // ========================================
  
  toggleCollectionsPanel(): void {
    this.showCollectionsPanel = !this.showCollectionsPanel;
    this.loadSavedRequests();
    this.cdr.detectChanges();
  }
  
  saveCurrentRequest(): void {
    if (!this.sandboxRequest.endpoint) {
      alert('SÃ©lectionnez un endpoint d\'abord.');
      return;
    }
    
    const name = prompt('Nom de la requÃªte sauvegardÃ©e:', 
      `${this.sandboxRequest.endpoint.method} ${this.sandboxRequest.endpoint.path}`);
    
    if (name && name.trim()) {
      const saved: SavedRequest = {
        id: this.generateId(),
        name: name.trim(),
        endpoint: { 
          method: this.sandboxRequest.endpoint.method,
          path: this.sandboxRequest.endpoint.path 
        },
        parameters: { ...this.sandboxRequest.parameters },
        headers: { ...this.sandboxRequest.headers },
        body: this.sandboxRequest.body,
        createdAt: new Date()
      };
      
      this.savedRequests.unshift(saved);
      this.persistSavedRequests();
      this.cdr.detectChanges();
    }
  }
  
  loadSavedRequest(saved: SavedRequest): void {
    // Find the endpoint in current endpoints list
    const endpoint = this.endpoints.find(e => 
      e.method === saved.endpoint.method && e.path === saved.endpoint.path
    );
    
    if (!endpoint) {
      alert('Cet endpoint n\'existe plus dans l\'API.');
      return;
    }
    
    this.sandboxRequest.endpoint = endpoint;
    this.sandboxRequest.parameters = { ...saved.parameters };
    this.sandboxRequest.headers = { ...saved.headers };
    this.sandboxRequest.body = saved.body;
    this.sandboxResponse = null;
    
    this.validateJsonBody();
    this.showCollectionsPanel = false;
    this.cdr.detectChanges();
  }
  
  deleteSavedRequest(id: string): void {
    if (confirm('Supprimer cette requÃªte sauvegardÃ©e ?')) {
      this.savedRequests = this.savedRequests.filter(r => r.id !== id);
      this.persistSavedRequests();
      this.cdr.detectChanges();
    }
  }
  
  persistSavedRequests(): void {
    // Store in localStorage with API-specific key
    if (this.api?.id) {
      const key = `sandbox_collections_${this.api.id}`;
      try {
        localStorage.setItem(key, JSON.stringify(this.savedRequests));
      } catch (e) {
        console.warn('Could not save to localStorage', e);
      }
    }
  }
  
  loadSavedRequests(): void {
    if (this.api?.id) {
      const key = `sandbox_collections_${this.api.id}`;
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          this.savedRequests = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Could not load from localStorage', e);
      }
    }
  }
  
  // ========================================
  // LEVEL 3: CODE GENERATION WITH REAL VALUES
  // ========================================
  
  openCodeGenModal(): void {
    this.showCodeGenModal = true;
    this.cdr.detectChanges();
  }
  
  closeCodeGenModal(): void {
    this.showCodeGenModal = false;
    this.cdr.detectChanges();
  }
  
  generateRealCurlExample(): string {
    if (!this.sandboxRequest.endpoint) return '';
    
    const url = this.buildSandboxUrl();
    const method = this.sandboxRequest.endpoint.method;
    
    let curl = `curl -X ${method} "${url}"`;
    
    // Add real headers (with env variables applied)
    for (const [key, value] of Object.entries(this.sandboxRequest.headers)) {
      if (value && this.hasValidHeaderValue(value)) {
        const resolvedValue = this.applyEnvVariables(value);
        curl += ` \\\n  -H "${key}: ${resolvedValue}"`;
      }
    }
    
    // Add body if present (with env variables applied)
    if (this.sandboxRequest.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      const resolvedBody = this.applyEnvVariables(this.sandboxRequest.body);
      // Escape single quotes in JSON
      const escapedBody = resolvedBody.replace(/'/g, "'\\''");
      curl += ` \\\n  -d '${escapedBody}'`;
    }
    
    return curl;
  }
  
  // Check if a header value is valid (not a placeholder without value)
  hasValidHeaderValue(value: string): boolean {
    // Check for YOUR_ACCESS_TOKEN placeholder
    if (value.includes('YOUR_ACCESS_TOKEN')) return false;
    
    // Check for {{token}} without a value
    if (value.includes('{{token}}')) {
      const tokenValue = this.getEnvVariableValue('token');
      return !!tokenValue;
    }
    
    // Check for any unresolved variable
    const unresolvedVars = value.match(/\{\{(\w+)\}\}/g);
    if (unresolvedVars) {
      for (const match of unresolvedVars) {
        const key = match.replace(/\{\{|\}\}/g, '');
        if (!this.getEnvVariableValue(key)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  generateRealJsExample(): string {
    if (!this.sandboxRequest.endpoint) return '';
    
    const url = this.buildSandboxUrl();
    const method = this.sandboxRequest.endpoint.method;
    
    let js = `const response = await fetch("${url}", {\n`;
    js += `  method: "${method}",\n`;
    js += `  headers: {\n`;
    
    const headerEntries = Object.entries(this.sandboxRequest.headers)
      .filter(([_, v]) => v && this.hasValidHeaderValue(v));
    
    headerEntries.forEach(([key, value], index) => {
      const resolvedValue = this.applyEnvVariables(value);
      js += `    "${key}": "${resolvedValue}"`;
      js += index < headerEntries.length - 1 ? ',\n' : '\n';
    });
    
    js += `  }`;
    
    if (this.sandboxRequest.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const resolvedBody = this.applyEnvVariables(this.sandboxRequest.body);
        const parsed = JSON.parse(resolvedBody);
        js += `,\n  body: JSON.stringify(${JSON.stringify(parsed, null, 4).split('\n').join('\n  ')})`;
      } catch {
        js += `,\n  body: ${JSON.stringify(this.applyEnvVariables(this.sandboxRequest.body))}`;
      }
    }
    
    js += `\n});\n\nconst data = await response.json();\nconsole.log(data);`;
    
    return js;
  }
  
  generateRealPythonExample(): string {
    if (!this.sandboxRequest.endpoint) return '';
    
    const url = this.buildSandboxUrl();
    const method = this.sandboxRequest.endpoint.method.toLowerCase();
    
    let py = `import requests\n\n`;
    py += `url = "${url}"\n\n`;
    py += `headers = {\n`;
    
    const headerEntries = Object.entries(this.sandboxRequest.headers)
      .filter(([_, v]) => v && this.hasValidHeaderValue(v));
    
    headerEntries.forEach(([key, value], index) => {
      const resolvedValue = this.applyEnvVariables(value);
      py += `    "${key}": "${resolvedValue}"`;
      py += index < headerEntries.length - 1 ? ',\n' : '\n';
    });
    
    py += `}\n\n`;
    
    if (this.sandboxRequest.body && ['post', 'put', 'patch'].includes(method)) {
      try {
        const resolvedBody = this.applyEnvVariables(this.sandboxRequest.body);
        const parsed = JSON.parse(resolvedBody);
        py += `data = ${JSON.stringify(parsed, null, 4)}\n\n`;
        py += `response = requests.${method}(url, headers=headers, json=data)`;
      } catch {
        py += `data = ${JSON.stringify(this.applyEnvVariables(this.sandboxRequest.body))}\n\n`;
        py += `response = requests.${method}(url, headers=headers, data=data)`;
      }
    } else {
      py += `response = requests.${method}(url, headers=headers)`;
    }
    
    py += `\n\nprint(response.status_code)\nprint(response.json())`;
    
    return py;
  }
  
  getRealCodeExample(): string {
    switch (this.codeGenLang) {
      case 'curl': return this.generateRealCurlExample();
      case 'javascript': return this.generateRealJsExample();
      case 'python': return this.generateRealPythonExample();
      default: return '';
    }
  }
  
  // ========================================
  // LEVEL 3: DIFF MODE
  // ========================================
  
  toggleDiffMode(): void {
    this.diffMode = !this.diffMode;
    if (!this.diffMode) {
      this.diffSelection = { first: null, second: null };
    }
    this.cdr.detectChanges();
  }
  
  selectForDiff(item: HistoryItem): void {
    if (!this.diffMode) return;
    
    if (!this.diffSelection.first) {
      this.diffSelection.first = item;
    } else if (!this.diffSelection.second && this.diffSelection.first.id !== item.id) {
      this.diffSelection.second = item;
    } else {
      // Reset and start over
      this.diffSelection = { first: item, second: null };
    }
    
    this.cdr.detectChanges();
  }
  
  isSelectedForDiff(item: HistoryItem): 'first' | 'second' | null {
    if (this.diffSelection.first?.id === item.id) return 'first';
    if (this.diffSelection.second?.id === item.id) return 'second';
    return null;
  }
  
  clearDiffSelection(): void {
    this.diffSelection = { first: null, second: null };
    this.cdr.detectChanges();
  }
  
  getDiffResult(): { added: string[]; removed: string[]; unchanged: string[] } | null {
    if (!this.diffSelection.first || !this.diffSelection.second) return null;
    
    const body1 = this.diffSelection.first.response.body;
    const body2 = this.diffSelection.second.response.body;
    
    // Simple line-by-line diff
    const lines1 = body1.split('\n');
    const lines2 = body2.split('\n');
    
    const added: string[] = [];
    const removed: string[] = [];
    const unchanged: string[] = [];
    
    // Find lines unique to each
    const set1 = new Set(lines1);
    const set2 = new Set(lines2);
    
    for (const line of lines1) {
      if (!set2.has(line)) {
        removed.push(line);
      } else {
        unchanged.push(line);
      }
    }
    
    for (const line of lines2) {
      if (!set1.has(line)) {
        added.push(line);
      }
    }
    
    return { added, removed, unchanged };
  }
  
  // ========================================
  // HELPERS
  // ========================================
  
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // Helpers for template (avoid arrow functions)
  hasEnvVariablesWithValue(): boolean {
    return this.envVariables.some(v => !!v.value);
  }
  
  countEnvVariablesWithValue(): number {
    return this.envVariables.filter(v => !!v.value).length;
  }

  selectEndpointForSandbox(endpoint: ParsedEndpoint): void {
    this.sandboxRequest.endpoint = endpoint;
    this.sandboxRequest.parameters = {};
    this.sandboxRequest.body = '';
    this.sandboxResponse = null;
    
    // Initialize parameters with default values
    if (endpoint.parameters) {
      for (const param of endpoint.parameters) {
        this.sandboxRequest.parameters[param.name] = param.example?.toString() || '';
      }
    }
    
    // Initialize body with example if POST/PUT/PATCH
    if (endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      const content = endpoint.requestBody.content?.['application/json'];
      if (content?.example) {
        this.sandboxRequest.body = JSON.stringify(content.example, null, 2);
      } else if (content?.schema) {
        this.sandboxRequest.body = this.generateExampleFromSchema(content.schema);
      }
    }
    
    this.cdr.detectChanges();
  }

  generateExampleFromSchema(schema: SchemaRef): string {
    // Simple example generation from schema
    const example: Record<string, any> = {};
    
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        if (prop.example !== undefined) {
          example[key] = prop.example;
        } else {
          switch (prop.type) {
            case 'string':
              example[key] = 'string';
              break;
            case 'number':
            case 'integer':
              example[key] = 0;
              break;
            case 'boolean':
              example[key] = true;
              break;
            case 'array':
              example[key] = [];
              break;
            case 'object':
              example[key] = {};
              break;
            default:
              example[key] = null;
          }
        }
      }
    }
    
    return JSON.stringify(example, null, 2);
  }

  buildSandboxUrl(): string {
    if (!this.sandboxRequest.endpoint) return '';
    
    // Priority: 1. Custom {{baseUrl}} variable, 2. Selected environment, 3. getBaseUrl()
    let baseUrl = this.getEnvVariableValue('baseUrl');
    
    if (!baseUrl) {
      baseUrl = this.selectedEnvironment?.httpsUrl || 
                this.selectedEnvironment?.httpUrl || 
                this.getBaseUrl();
    }
    
    let url = baseUrl + this.sandboxRequest.endpoint.path;
    
    // Replace path parameters
    for (const param of this.sandboxRequest.endpoint.parameters || []) {
      if (param.in === 'path') {
        const value = this.sandboxRequest.parameters[param.name] || '';
        url = url.replace(`{${param.name}}`, encodeURIComponent(value));
      }
    }
    
    // Add query parameters
    const queryParams: string[] = [];
    for (const param of this.sandboxRequest.endpoint.parameters || []) {
      if (param.in === 'query' && this.sandboxRequest.parameters[param.name]) {
        queryParams.push(`${param.name}=${encodeURIComponent(this.sandboxRequest.parameters[param.name])}`);
      }
    }
    
    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }
    
    return url;
  }
  
  // Get a specific environment variable value
  getEnvVariableValue(key: string): string {
    const variable = this.envVariables.find(v => v.key === key);
    return variable?.value || '';
  }

  async executeSandboxRequest(): Promise<void> {
    if (!this.sandboxRequest.endpoint) return;
    
    this.isSandboxLoading = true;
    this.sandboxResponse = null;
    this.cdr.detectChanges();
    
    const startTime = performance.now();
    const url = this.buildSandboxUrl();
    
    try {
      // Apply environment variables to headers
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(this.sandboxRequest.headers)) {
        headers[key] = this.applyEnvVariables(value);
      }
      
      // Add header parameters
      for (const param of this.sandboxRequest.endpoint.parameters || []) {
        if (param.in === 'header' && this.sandboxRequest.parameters[param.name]) {
          headers[param.name] = this.applyEnvVariables(this.sandboxRequest.parameters[param.name]);
        }
      }
      
      const options: RequestInit = {
        method: this.sandboxRequest.endpoint.method,
        headers,
        mode: 'cors'
      };
      
      // Add body for POST/PUT/PATCH (with env variables applied)
      if (['POST', 'PUT', 'PATCH'].includes(this.sandboxRequest.endpoint.method) && this.sandboxRequest.body) {
        options.body = this.applyEnvVariables(this.sandboxRequest.body);
      }
      
      const response = await fetch(url, options);
      const endTime = performance.now();
      
      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      // Parse response body
      let responseBody = '';
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await response.json();
          responseBody = JSON.stringify(json, null, 2);
        } else {
          responseBody = await response.text();
        }
      } catch {
        responseBody = 'Unable to parse response body';
      }
      
      this.sandboxResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: Math.round(endTime - startTime)
      };
      
      // Add to history with unique id
      this.sandboxHistory.unshift({
        id: this.generateId(),
        request: { ...this.sandboxRequest },
        response: { ...this.sandboxResponse },
        timestamp: new Date()
      });
      
      // Keep only last 20 requests (increased for diff feature)
      if (this.sandboxHistory.length > 20) {
        this.sandboxHistory = this.sandboxHistory.slice(0, 20);
      }
      
    } catch (error: any) {
      const endTime = performance.now();
      
      this.sandboxResponse = {
        status: 0,
        statusText: 'Error',
        headers: {},
        body: '',
        time: Math.round(endTime - startTime),
        error: error.message || 'Network error or CORS issue'
      };
    }
    
    this.isSandboxLoading = false;
    this.cdr.detectChanges();
  }

  addSandboxHeader(): void {
    const key = prompt('Header name:');
    if (key) {
      this.sandboxRequest.headers[key] = '';
      this.cdr.detectChanges();
    }
  }

  removeSandboxHeader(key: string): void {
    delete this.sandboxRequest.headers[key];
    this.cdr.detectChanges();
  }

  clearSandboxHistory(): void {
    this.sandboxHistory = [];
    this.cdr.detectChanges();
  }

  loadFromHistory(index: number): void {
    const item = this.sandboxHistory[index];
    if (item) {
      this.sandboxRequest = { ...item.request };
      this.sandboxResponse = { ...item.response };
      this.cdr.detectChanges();
    }
  }

  getHttpStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-redirect';
    if (status >= 400 && status < 500) return 'status-client-error';
    if (status >= 500) return 'status-server-error';
    return 'status-unknown';
  }

  // ========================================
  // SUBSCRIBE MODAL
  // ========================================

  openSubscribeModal(): void {
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
        alert('Souscription rÃ©ussie !');
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
    let url = `${baseUrl}${endpoint.path}`;
    
    // Replace path params with placeholders
    for (const param of endpoint.parameters || []) {
      if (param.in === 'path') {
        url = url.replace(`{${param.name}}`, `<${param.name}>`);
      }
    }
    
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
    let url = `${baseUrl}${endpoint.path}`;
    
    // Replace path params with template literals
    for (const param of endpoint.parameters || []) {
      if (param.in === 'path') {
        url = url.replace(`{${param.name}}`, `\${${param.name}}`);
      }
    }
    
    let js = `const response = await fetch(\`${url}\`, {\n`;
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
    let url = `${baseUrl}${endpoint.path}`;
    
    // Replace path params with f-string syntax
    let hasPathParams = false;
    for (const param of endpoint.parameters || []) {
      if (param.in === 'path') {
        url = url.replace(`{${param.name}}`, `{${param.name}}`);
        hasPathParams = true;
      }
    }
    
    let py = `import requests\n\n`;
    py += `headers = {\n`;
    py += `    "Authorization": "Bearer YOUR_ACCESS_TOKEN",\n`;
    py += `    "Content-Type": "application/json"\n`;
    py += `}\n\n`;
    
    const urlStr = hasPathParams ? `f"${url}"` : `"${url}"`;
    
    if (endpoint.requestBody && (method === 'post' || method === 'put' || method === 'patch')) {
      py += `data = {\n    "key": "value"\n}\n\n`;
      py += `response = requests.${method}(${urlStr}, headers=headers, json=data)`;
    } else {
      py += `response = requests.${method}(${urlStr}, headers=headers)`;
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

  loadThumbnail(): void {
    if (!this.id) return;
    
    this.apiService.getApiThumbnail(this.id).subscribe({
      next: (blob) => {
        if (blob && blob.size > 0) {
          // Revoke previous URL if exists
          if (this.apiThumbnailUrl) {
            URL.revokeObjectURL(this.apiThumbnailUrl);
          }
          this.apiThumbnailUrl = URL.createObjectURL(blob);
          this.cdr.detectChanges();
        }
      },
      error: () => {
        // No thumbnail available, keep null for fallback
      }
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
    return method.toLowerCase();
  }

  getApiStatusClass(status?: string): string {
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
      case 'PUBLISHED': return 'PubliÃ©';
      case 'PROTOTYPED': return 'Prototype';
      case 'DEPRECATED': return 'DÃ©prÃ©ciÃ©';
      case 'BLOCKED': return 'BloquÃ©';
      case 'RETIRED': return 'RetirÃ©';
      default: return status || 'Inconnu';
    }
  }

  getDocTypeIcon(type?: string): string {
    switch (type) {
      case 'HOWTO': return 'ðŸ“–';
      case 'SAMPLES': return 'ðŸ’»';
      case 'PUBLIC_FORUM': return 'ðŸ’¬';
      case 'SUPPORT_FORUM': return 'ðŸ›Ÿ';
      case 'API_MESSAGE_FORMAT': return 'ðŸ“„';
      case 'SWAGGER_DOC': return 'ðŸ“‹';
      default: return 'ðŸ“';
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

  getParamTypeLabel(param: ParameterDef): string {
    if (!param.schema) {
      return param.type || 'string';
    }
    return this.getSchemaDisplayType(param.schema);
  }
  
  getParamsByType(type: 'path' | 'query' | 'header' | 'cookie'): ParameterDef[] {
    if (!this.sandboxRequest.endpoint?.parameters) return [];
    return this.sandboxRequest.endpoint.parameters.filter(p => p.in === type);
  }

  hasRequiredParams(endpoint: ParsedEndpoint): boolean {
    return endpoint.parameters?.some(p => p.required) || false;
  }

  getSecurityInfo(endpoint: ParsedEndpoint): string {
    if (endpoint.security && endpoint.security.length > 0) {
      return 'Authentification requise';
    }
    return '';
  }

  trackByPath(index: number, endpoint: ParsedEndpoint): string {
    return endpoint.path + endpoint.method;
  }

  trackByName(index: number, group: TagGroup): string {
    return group.name;
  }

  // ========================================
  // SCHEMA RESOLUTION METHODS
  // ========================================

  resolveRef(ref: string): any {
    if (!ref || !this.swaggerSpec) return null;
    const parts = ref.replace('#/', '').split('/');
    let result = this.swaggerSpec;
    for (const part of parts) {
      if (result && result[part]) {
        result = result[part];
      } else {
        return null;
      }
    }
    return result;
  }

  getSchemaNameFromRef(ref: string): string {
    if (!ref) return '';
    const parts = ref.split('/');
    return parts[parts.length - 1];
  }

  resolveSchema(schema: any): any {
    if (!schema) return null;
    if (schema.$ref) {
      return this.resolveRef(schema.$ref);
    }
    return schema;
  }

  getSchemaDisplayType(schema: any): string {
    if (!schema) return 'any';
    if (schema.$ref) {
      return this.getSchemaNameFromRef(schema.$ref);
    }
    const resolved = this.resolveSchema(schema);
    if (!resolved) return 'any';
    if (resolved.type === 'array' && resolved.items) {
      const itemType = this.getSchemaDisplayType(resolved.items);
      return `${itemType}[]`;
    }
    if (resolved.oneOf) {
      return resolved.oneOf.map((s: any) => this.getSchemaDisplayType(s)).join(' | ');
    }
    if (resolved.anyOf) {
      return resolved.anyOf.map((s: any) => this.getSchemaDisplayType(s)).join(' | ');
    }
    if (resolved.allOf) {
      return 'object';
    }
    return resolved.type || 'object';
  }

  getSchemaProperties(schema: any): { name: string; type: string; required: boolean; description: string; schema?: any }[] {
    const resolved = this.resolveSchema(schema);
    if (!resolved) return [];
    
    if (resolved.oneOf && Array.isArray(resolved.oneOf)) {
      for (const option of resolved.oneOf) {
        const optionResolved = this.resolveSchema(option);
        if (optionResolved?.properties) {
          const required = optionResolved.required || [];
          return Object.entries(optionResolved.properties).map(([name, prop]: [string, any]) => ({
            name,
            type: this.getSchemaDisplayType(prop),
            required: required.includes(name),
            description: prop.description || '',
            schema: prop
          }));
        }
      }
      return [];
    }
    
    if (resolved.anyOf && Array.isArray(resolved.anyOf)) {
      for (const option of resolved.anyOf) {
        const optionResolved = this.resolveSchema(option);
        if (optionResolved?.properties) {
          const required = optionResolved.required || [];
          return Object.entries(optionResolved.properties).map(([name, prop]: [string, any]) => ({
            name,
            type: this.getSchemaDisplayType(prop),
            required: required.includes(name),
            description: prop.description || '',
            schema: prop
          }));
        }
      }
      return [];
    }
    
    if (resolved.allOf && Array.isArray(resolved.allOf)) {
      const mergedProperties: Record<string, any> = {};
      const mergedRequired: string[] = [];
      for (const subSchema of resolved.allOf) {
        const subResolved = this.resolveSchema(subSchema);
        if (subResolved?.properties) {
          Object.assign(mergedProperties, subResolved.properties);
        }
        if (subResolved?.required) {
          mergedRequired.push(...subResolved.required);
        }
      }
      if (Object.keys(mergedProperties).length > 0) {
        return Object.entries(mergedProperties).map(([name, prop]: [string, any]) => ({
          name,
          type: this.getSchemaDisplayType(prop),
          required: mergedRequired.includes(name),
          description: prop.description || '',
          schema: prop
        }));
      }
      return [];
    }
    
    if (!resolved.properties) return [];
    const required = resolved.required || [];
    return Object.entries(resolved.properties).map(([name, prop]: [string, any]) => ({
      name,
      type: this.getSchemaDisplayType(prop),
      required: required.includes(name),
      description: prop.description || '',
      schema: prop
    }));
  }

  // ========================================
  // REQUEST BODY METHODS
  // ========================================

  getRequestBodySchema(requestBody: RequestBodyDef | undefined): any {
    if (!requestBody?.content) return null;
    const jsonContent = requestBody.content['application/json'];
    if (jsonContent?.schema) return jsonContent.schema;
    const firstContent = Object.values(requestBody.content)[0];
    return firstContent?.schema || null;
  }

  getRequestBodyExample(requestBody: RequestBodyDef | undefined): string {
    if (!requestBody?.content) return '';
    const jsonContent = requestBody.content['application/json'];
    if (jsonContent?.example) {
      return JSON.stringify(jsonContent.example, null, 2);
    }
    const schema = this.getRequestBodySchema(requestBody);
    if (schema) {
      return this.generateExampleFromSchemaResolved(schema);
    }
    return '{\n  // Request body\n}';
  }

  // ========================================
  // RESPONSE SCHEMA METHODS
  // ========================================

  getResponseSchema(response: ResponseDef | undefined): any {
    if (!response?.content) return null;
    const jsonContent = response.content['application/json'];
    if (jsonContent?.schema) return jsonContent.schema;
    const firstContent = Object.values(response.content)[0];
    return firstContent?.schema || null;
  }

  getResponseExample(response: ResponseDef | undefined): string {
    if (!response?.content) return '';
    const jsonContent = response.content['application/json'];
    if (jsonContent?.example) {
      return JSON.stringify(jsonContent.example, null, 2);
    }
    const schema = this.getResponseSchema(response);
    if (schema) {
      return this.generateExampleFromSchemaResolved(schema);
    }
    return '';
  }

  hasResponseSchema(response: ResponseDef | undefined): boolean {
    return !!this.getResponseSchema(response);
  }

  isResponseExpanded(endpoint: ParsedEndpoint, code: string): boolean {
    const key = endpoint.path + endpoint.method + code;
    return this.expandedResponses[key] || false;
  }

  getResponseSchemaType(response: ResponseDef | undefined): string {
    const schema = this.getResponseSchema(response);
    if (!schema) return '';
    return this.getSchemaDisplayType(schema);
  }

  isResponseSchemaRef(response: ResponseDef | undefined): boolean {
    const schema = this.getResponseSchema(response);
    return schema && !!schema.$ref;
  }

  getResponseSchemaName(response: ResponseDef | undefined): string {
    const schema = this.getResponseSchema(response);
    if (schema?.$ref) {
      return this.getSchemaNameFromRef(schema.$ref);
    }
    return '';
  }

  getResponseSchemaProperties(response: ResponseDef | undefined): { name: string; type: string; required: boolean; description: string; schema?: any }[] {
    const schema = this.getResponseSchema(response);
    if (!schema) return [];
    return this.getSchemaProperties(schema);
  }

  toggleResponse(endpoint: ParsedEndpoint, code: string): void {
    const key = endpoint.path + endpoint.method + code;
    this.expandedResponses[key] = !this.expandedResponses[key];
    this.cdr.detectChanges();
  }

  scrollToSchema(schemaName: string): void {
    console.log('Navigate to schema:', schemaName);
  }

  // ========================================
  // ONEOF / ANYOF OPTIONS
  // ========================================

  /**
   * Check if response schema has oneOf/anyOf options
   */
  hasSchemaOptions(response: ResponseDef | undefined): boolean {
    const schema = this.getResponseSchema(response);
    if (!schema) return false;
    const resolved = this.resolveSchema(schema);
    return !!(resolved?.oneOf || resolved?.anyOf);
  }

  /**
   * Get oneOf/anyOf options for a response schema
   */
  getSchemaOptions(response: ResponseDef | undefined): { index: number; name: string; schema: any }[] {
    const schema = this.getResponseSchema(response);
    if (!schema) return [];
    const resolved = this.resolveSchema(schema);
    
    const options = resolved?.oneOf || resolved?.anyOf || [];
    return options.map((opt: any, index: number) => {
      let name = '';
      if (opt.$ref) {
        name = this.getSchemaNameFromRef(opt.$ref);
      } else if (opt.title) {
        name = opt.title;
      } else {
        const resolvedOpt = this.resolveSchema(opt);
        name = resolvedOpt?.title || `Option ${index + 1}`;
      }
      return { index, name, schema: opt };
    });
  }

  /**
   * Get the type label (oneOf or anyOf)
   */
  getSchemaOptionsType(response: ResponseDef | undefined): string {
    const schema = this.getResponseSchema(response);
    if (!schema) return '';
    const resolved = this.resolveSchema(schema);
    if (resolved?.oneOf) return 'oneOf';
    if (resolved?.anyOf) return 'anyOf';
    return '';
  }

  /**
   * Get selected option index for a response
   */
  getSelectedOptionIndex(endpoint: ParsedEndpoint, code: string): number {
    const key = `${endpoint.method}-${endpoint.path}-${code}`;
    return this.expandedOneOfOptions[key] ?? 0;
  }

  /**
   * Select a oneOf/anyOf option
   */
  selectSchemaOption(endpoint: ParsedEndpoint, code: string, index: number): void {
    const key = `${endpoint.method}-${endpoint.path}-${code}`;
    this.expandedOneOfOptions[key] = index;
    this.cdr.detectChanges();
  }

  /**
   * Get properties for a specific option
   */
  getOptionProperties(optionSchema: any): { name: string; type: string; required: boolean; description: string; schema?: any }[] {
    return this.getSchemaProperties(optionSchema);
  }

  /**
   * Generate example for a specific option
   */
  getOptionExample(optionSchema: any): string {
    return this.generateExampleFromSchemaResolved(optionSchema);
  }

  // ========================================
  // PROPERTY CONSTRAINTS
  // ========================================

  /**
   * Check if a property has constraints
   */
  hasConstraints(propSchema: any): boolean {
    if (!propSchema) return false;
    const resolved = this.resolveSchema(propSchema);
    if (!resolved) return false;
    
    return !!(
      resolved.minimum !== undefined ||
      resolved.maximum !== undefined ||
      resolved.exclusiveMinimum !== undefined ||
      resolved.exclusiveMaximum !== undefined ||
      resolved.minLength !== undefined ||
      resolved.maxLength !== undefined ||
      resolved.minItems !== undefined ||
      resolved.maxItems !== undefined ||
      resolved.pattern ||
      resolved.format ||
      resolved.enum ||
      resolved.nullable ||
      resolved.readOnly ||
      resolved.writeOnly ||
      resolved.default !== undefined
    );
  }

  /**
   * Get formatted constraints for a property
   */
  getConstraints(propSchema: any): { label: string; value: string; type: 'range' | 'format' | 'pattern' | 'enum' | 'flag' | 'default' }[] {
    if (!propSchema) return [];
    const resolved = this.resolveSchema(propSchema);
    if (!resolved) return [];
    
    const constraints: { label: string; value: string; type: 'range' | 'format' | 'pattern' | 'enum' | 'flag' | 'default' }[] = [];
    
    // Number constraints
    if (resolved.minimum !== undefined || resolved.maximum !== undefined) {
      const min = resolved.minimum !== undefined ? resolved.minimum : '-âˆž';
      const max = resolved.maximum !== undefined ? resolved.maximum : '+âˆž';
      constraints.push({ label: 'Intervalle', value: `[${min}, ${max}]`, type: 'range' });
    }
    
    if (resolved.exclusiveMinimum !== undefined || resolved.exclusiveMaximum !== undefined) {
      const min = resolved.exclusiveMinimum !== undefined ? resolved.exclusiveMinimum : '-âˆž';
      const max = resolved.exclusiveMaximum !== undefined ? resolved.exclusiveMaximum : '+âˆž';
      constraints.push({ label: 'Intervalle', value: `]${min}, ${max}[`, type: 'range' });
    }
    
    // String length constraints
    if (resolved.minLength !== undefined || resolved.maxLength !== undefined) {
      const min = resolved.minLength ?? 0;
      const max = resolved.maxLength ?? 'âˆž';
      constraints.push({ label: 'Longueur', value: `${min} - ${max}`, type: 'range' });
    }
    
    // Array constraints
    if (resolved.minItems !== undefined || resolved.maxItems !== undefined) {
      const min = resolved.minItems ?? 0;
      const max = resolved.maxItems ?? 'âˆž';
      constraints.push({ label: 'Nb Ã©lÃ©ments', value: `${min} - ${max}`, type: 'range' });
    }
    
    // Format
    if (resolved.format) {
      constraints.push({ label: 'Format', value: resolved.format, type: 'format' });
    }
    
    // Pattern
    if (resolved.pattern) {
      constraints.push({ label: 'Pattern', value: resolved.pattern, type: 'pattern' });
    }
    
    // Enum
    if (resolved.enum && resolved.enum.length > 0) {
      constraints.push({ label: 'Valeurs', value: resolved.enum.join(', '), type: 'enum' });
    }
    
    // Flags
    if (resolved.nullable) {
      constraints.push({ label: 'Nullable', value: 'oui', type: 'flag' });
    }
    if (resolved.readOnly) {
      constraints.push({ label: 'Lecture seule', value: 'oui', type: 'flag' });
    }
    if (resolved.writeOnly) {
      constraints.push({ label: 'Ã‰criture seule', value: 'oui', type: 'flag' });
    }
    
    // Default value
    if (resolved.default !== undefined) {
      const defaultVal = typeof resolved.default === 'object' 
        ? JSON.stringify(resolved.default) 
        : String(resolved.default);
      constraints.push({ label: 'DÃ©faut', value: defaultVal, type: 'default' });
    }
    
    return constraints;
  }

  /**
   * Get a short constraint summary for inline display
   */
  getConstraintsSummary(propSchema: any): string {
    if (!propSchema) return '';
    const resolved = this.resolveSchema(propSchema);
    if (!resolved) return '';
    
    const parts: string[] = [];
    
    // Length/Range
    if (resolved.minLength !== undefined || resolved.maxLength !== undefined) {
      const min = resolved.minLength ?? 0;
      const max = resolved.maxLength ?? 'âˆž';
      parts.push(`len: ${min}-${max}`);
    }
    
    if (resolved.minimum !== undefined || resolved.maximum !== undefined) {
      const min = resolved.minimum ?? '-âˆž';
      const max = resolved.maximum ?? '+âˆž';
      parts.push(`${min}..${max}`);
    }
    
    if (resolved.format) {
      parts.push(resolved.format);
    }
    
    if (resolved.pattern) {
      parts.push('regex');
    }
    
    if (resolved.enum && resolved.enum.length > 0 && resolved.enum.length <= 3) {
      parts.push(resolved.enum.join('|'));
    } else if (resolved.enum && resolved.enum.length > 3) {
      parts.push(`${resolved.enum.length} valeurs`);
    }
    
    return parts.join(' Â· ');
  }

  // ========================================
  // EXAMPLE GENERATION
  // ========================================

  generateExampleFromSchemaResolved(schema: any, depth: number = 0): string {
    if (depth > 5) return '"..."';
    const resolved = this.resolveSchema(schema);
    if (!resolved) return '{}';
    
    if (resolved.example !== undefined) {
      return JSON.stringify(resolved.example, null, 2);
    }
    if (resolved.examples && Array.isArray(resolved.examples) && resolved.examples.length > 0) {
      return JSON.stringify(resolved.examples[0], null, 2);
    }
    
    if (resolved.oneOf && Array.isArray(resolved.oneOf) && resolved.oneOf.length > 0) {
      for (const option of resolved.oneOf) {
        const resolvedOption = this.resolveSchema(option);
        if (resolvedOption?.example) {
          return JSON.stringify(resolvedOption.example, null, 2);
        }
        if (resolvedOption?.examples && Array.isArray(resolvedOption.examples) && resolvedOption.examples.length > 0) {
          return JSON.stringify(resolvedOption.examples[0], null, 2);
        }
      }
      return this.generateExampleFromSchemaResolved(resolved.oneOf[0], depth + 1);
    }
    
    if (resolved.anyOf && Array.isArray(resolved.anyOf) && resolved.anyOf.length > 0) {
      return this.generateExampleFromSchemaResolved(resolved.anyOf[0], depth + 1);
    }
    
    if (resolved.allOf && Array.isArray(resolved.allOf) && resolved.allOf.length > 0) {
      const mergedObj: Record<string, any> = {};
      for (const subSchema of resolved.allOf) {
        const resolvedSub = this.resolveSchema(subSchema);
        if (resolvedSub?.properties) {
          for (const [key, prop] of Object.entries(resolvedSub.properties) as [string, any][]) {
            mergedObj[key] = this.generateExampleValueResolved(prop, depth + 1);
          }
        }
      }
      return JSON.stringify(mergedObj, null, 2);
    }
    
    if (resolved.type === 'object' && resolved.properties) {
      const obj: Record<string, any> = {};
      for (const [key, prop] of Object.entries(resolved.properties) as [string, any][]) {
        obj[key] = this.generateExampleValueResolved(prop, depth + 1);
      }
      return JSON.stringify(obj, null, 2);
    }
    
    if (resolved.type === 'array' && resolved.items) {
      const item = this.generateExampleValueResolved(resolved.items, depth + 1);
      return JSON.stringify([item], null, 2);
    }
    
    if (resolved.properties && !resolved.type) {
      const obj: Record<string, any> = {};
      for (const [key, prop] of Object.entries(resolved.properties) as [string, any][]) {
        obj[key] = this.generateExampleValueResolved(prop, depth + 1);
      }
      return JSON.stringify(obj, null, 2);
    }
    
    return JSON.stringify(this.generateExampleValueResolved(resolved, depth), null, 2);
  }

  private generateExampleValueResolved(schema: any, depth: number = 0): any {
    if (depth > 5) return '...';
    const resolved = this.resolveSchema(schema);
    if (!resolved) return null;
    
    if (resolved.example !== undefined) return resolved.example;
    if (resolved.default !== undefined) return resolved.default;
    if (resolved.examples && Array.isArray(resolved.examples) && resolved.examples.length > 0) {
      return resolved.examples[0];
    }
    
    if (resolved.oneOf && Array.isArray(resolved.oneOf) && resolved.oneOf.length > 0) {
      return this.generateExampleValueResolved(resolved.oneOf[0], depth + 1);
    }
    if (resolved.anyOf && Array.isArray(resolved.anyOf) && resolved.anyOf.length > 0) {
      return this.generateExampleValueResolved(resolved.anyOf[0], depth + 1);
    }
    if (resolved.allOf && Array.isArray(resolved.allOf) && resolved.allOf.length > 0) {
      const mergedObj: Record<string, any> = {};
      for (const subSchema of resolved.allOf) {
        const resolvedSub = this.resolveSchema(subSchema);
        if (resolvedSub?.properties) {
          for (const [key, prop] of Object.entries(resolvedSub.properties) as [string, any][]) {
            mergedObj[key] = this.generateExampleValueResolved(prop, depth + 1);
          }
        }
      }
      return mergedObj;
    }
    
    switch (resolved.type) {
      case 'string':
        if (resolved.format === 'date') return '2024-01-15';
        if (resolved.format === 'date-time') return '2024-01-15T10:30:00Z';
        if (resolved.format === 'email') return 'user@example.com';
        if (resolved.format === 'uuid') return '550e8400-e29b-41d4-a716-446655440000';
        if (resolved.format === 'uri') return 'https://example.com';
        if (resolved.enum) return resolved.enum[0];
        return 'string';
      case 'integer':
      case 'number':
        if (resolved.minimum !== undefined) return resolved.minimum;
        return 0;
      case 'boolean':
        return true;
      case 'array':
        if (resolved.items) {
          return [this.generateExampleValueResolved(resolved.items, depth + 1)];
        }
        return [];
      case 'object':
        if (resolved.properties) {
          const obj: Record<string, any> = {};
          for (const [key, prop] of Object.entries(resolved.properties) as [string, any][]) {
            obj[key] = this.generateExampleValueResolved(prop, depth + 1);
          }
          return obj;
        }
        return {};
      default:
        if (resolved.properties) {
          const obj: Record<string, any> = {};
          for (const [key, prop] of Object.entries(resolved.properties) as [string, any][]) {
            obj[key] = this.generateExampleValueResolved(prop, depth + 1);
          }
          return obj;
        }
        return null;
    }
  }

  // ========================================
  // NESTED PROPERTY METHODS
  // ========================================

  hasNestedSchema(propSchema: any): boolean {
    if (!propSchema) return false;
    const resolved = this.resolveSchema(propSchema);
    if (!resolved) return false;
    if (propSchema.$ref) return true;
    if (resolved.type === 'object' && resolved.properties) return true;
    if (resolved.type === 'array' && resolved.items) {
      const itemsResolved = this.resolveSchema(resolved.items);
      if (resolved.items.$ref) return true;
      if (itemsResolved?.type === 'object' && itemsResolved?.properties) return true;
    }
    if (resolved.oneOf || resolved.anyOf || resolved.allOf) return true;
    return false;
  }

  getNestedSchema(propSchema: any): any {
    if (!propSchema) return null;
    const resolved = this.resolveSchema(propSchema);
    if (!resolved) return null;
    if (resolved.type === 'array' && resolved.items) {
      return resolved.items;
    }
    return propSchema;
  }

  getNestedSchemaProperties(propSchema: any): { name: string; type: string; required: boolean; description: string; schema?: any }[] {
    const nestedSchema = this.getNestedSchema(propSchema);
    if (!nestedSchema) return [];
    return this.getSchemaProperties(nestedSchema);
  }

  getNestedSchemaName(propSchema: any): string {
    if (!propSchema) return '';
    if (propSchema.$ref) {
      return this.getSchemaNameFromRef(propSchema.$ref);
    }
    const resolved = this.resolveSchema(propSchema);
    if (resolved?.type === 'array' && resolved.items?.$ref) {
      return this.getSchemaNameFromRef(resolved.items.$ref);
    }
    if (resolved?.type === 'array' && resolved.items?.title) {
      return resolved.items.title;
    }
    if (resolved?.title) {
      return resolved.title;
    }
    return '';
  }

  toggleNestedProp(context: string, propName: string): void {
    const key = `${context}-${propName}`;
    this.expandedNestedProps[key] = !this.expandedNestedProps[key];
    this.cdr.detectChanges();
  }

  isNestedPropExpanded(context: string, propName: string): boolean {
    const key = `${context}-${propName}`;
    return this.expandedNestedProps[key] || false;
  }

  getNestedContext(endpoint: ParsedEndpoint, code: string, propName: string): string {
    return `${endpoint.method}-${endpoint.path}-${code}-${propName}`;
  }

  getParamNestedContext(endpoint: ParsedEndpoint, paramName: string, propName: string): string {
    return `param-${endpoint.method}-${endpoint.path}-${paramName}-${propName}`;
  }

  // ========================================
  // PARAMETER SCHEMA METHODS
  // ========================================

  hasComplexParamSchema(param: ParameterDef): boolean {
    if (!param.schema) return false;
    const schema = param.schema;
    if (schema.$ref) return true;
    if (schema.type === 'object' && schema.properties) return true;
    if (schema.type === 'array' && schema.items) {
      if (schema.items.$ref) return true;
      if (schema.items.type === 'object' && schema.items.properties) return true;
    }
    if (schema.oneOf || schema.anyOf || schema.allOf) return true;
    if (schema.enum && schema.enum.length > 0) return true;
    return false;
  }

  getParamSchema(param: ParameterDef): any {
    if (!param.schema) return null;
    return this.resolveSchema(param.schema);
  }

  getParamSchemaProperties(param: ParameterDef): { name: string; type: string; required: boolean; description: string; schema?: any }[] {
    if (!param.schema) return [];
    return this.getSchemaProperties(param.schema);
  }

  isParamSchemaRef(param: ParameterDef): boolean {
    return param.schema?.$ref ? true : false;
  }

  getParamSchemaName(param: ParameterDef): string | null {
    if (param.schema?.$ref) {
      return this.getSchemaNameFromRef(param.schema.$ref);
    }
    return null;
  }

  getParamExample(param: ParameterDef): string {
    if (!param.schema) {
      if (param.example !== undefined) {
        return typeof param.example === 'object' 
          ? JSON.stringify(param.example, null, 2) 
          : String(param.example);
      }
      return '';
    }
    if (param.schema.example !== undefined) {
      return typeof param.schema.example === 'object'
        ? JSON.stringify(param.schema.example, null, 2)
        : String(param.schema.example);
    }
    const example = this.generateExampleFromSchemaResolved(param.schema, 0);
    if (example === null || example === undefined) return '';
    return typeof example === 'object'
      ? JSON.stringify(example, null, 2)
      : String(example);
  }

  hasParamEnum(param: ParameterDef): boolean {
    return !!(param.schema?.enum && param.schema.enum.length > 0);
  }

  getParamEnumValues(param: ParameterDef): string[] {
    return param.schema?.enum || [];
  }

  /**
   * Check if parameter has constraints (excluding enum which is shown separately)
   */
  hasParamConstraints(param: ParameterDef): boolean {
    if (!param.schema) return false;
    const schema = param.schema;
    return !!(
      schema.minimum !== undefined ||
      schema.maximum !== undefined ||
      schema.exclusiveMinimum !== undefined ||
      schema.exclusiveMaximum !== undefined ||
      schema.minLength !== undefined ||
      schema.maxLength !== undefined ||
      schema.minItems !== undefined ||
      schema.maxItems !== undefined ||
      schema.pattern ||
      schema.format ||
      schema.enum ||
      schema.nullable ||
      schema.default !== undefined
    );
  }

  /**
   * Check if parameter has enum in constraints (to avoid duplicate display)
   */
  hasParamConstraintsWithEnum(param: ParameterDef): boolean {
    return this.hasParamConstraints(param) && this.hasParamEnum(param);
  }

  /**
   * Get constraints for a parameter
   */
  getParamConstraints(param: ParameterDef): { label: string; value: string; type: 'range' | 'format' | 'pattern' | 'enum' | 'flag' | 'default' }[] {
    if (!param.schema) return [];
    return this.getConstraints(param.schema);
  }

  toggleParamSchema(endpoint: ParsedEndpoint, paramName: string): void {
    const key = `${endpoint.method}-${endpoint.path}-${paramName}`;
    this.expandedParams[key] = !this.expandedParams[key];
    this.cdr.detectChanges();
  }

  isParamSchemaExpanded(endpoint: ParsedEndpoint, paramName: string): boolean {
    const key = `${endpoint.method}-${endpoint.path}-${paramName}`;
    return this.expandedParams[key] || false;
  }

  // ========================================
  // GLOBAL SEARCH NAVIGATION METHODS
  // ========================================

  /**
   * Handle navigation from global search query params
   */
  private handleSearchNavigation(tab?: string, endpointKey?: string): void {
    // Validate and set tab
    const validTabs = ['overview', 'documentation', 'reference', 'sandbox'];
    if (tab && validTabs.includes(tab)) {
      this.activeTab = tab as 'overview' | 'documentation' | 'reference' | 'sandbox';
    }
    
    // If we have an endpoint to navigate to
    if (endpointKey) {
      if (this.endpoints.length > 0) {
        // Data is loaded, navigate immediately
        setTimeout(() => {
          this.navigateToEndpoint(endpointKey);
        }, 50);
      } else {
        // Data not loaded yet, store for later
        this.pendingEndpointNavigation = endpointKey;
      }
    }
    
    this.cdr.detectChanges();
  }

  /**
   * Navigate to a specific endpoint from global search
   * @param endpointKey Format: "method:encodedPath" e.g. "get:%2Fpayments%2F%7Bid%7D"
   */
  navigateToEndpoint(endpointKey: string): void {
    // Parse the key (format: "method:encodedPath")
    const colonIndex = endpointKey.indexOf(':');
    if (colonIndex === -1) return;
    
    const method = endpointKey.substring(0, colonIndex).toUpperCase();
    const path = decodeURIComponent(endpointKey.substring(colonIndex + 1));
    
    // Find the matching endpoint
    const endpoint = this.endpoints.find(e => 
      e.method.toUpperCase() === method && e.path === path
    );
    
    if (!endpoint) {
      console.warn(`Endpoint not found: ${method} ${path}`);
      return;
    }
    
    // 1. Switch to reference tab
    this.activeTab = 'reference';
    
    // 2. Find and expand the tag group containing this endpoint
    for (const group of this.tagGroups) {
      const found = group.endpoints.find(e => 
        e.method === endpoint.method && e.path === endpoint.path
      );
      if (found) {
        // Expand the group
        group.expanded = true;
        // Expand the endpoint
        found.expanded = true;
        break;
      }
    }
    
    // 3. Mark endpoint as highlighted
    this.highlightedEndpointKey = `${endpoint.method}-${endpoint.path}`;
    
    this.cdr.detectChanges();
    
    // 4. Scroll to the endpoint after DOM update
    setTimeout(() => {
      this.scrollToEndpoint(endpoint);
    }, 150);
    
    // 5. Remove highlight after 3 seconds
    setTimeout(() => {
      this.highlightedEndpointKey = null;
      this.cdr.detectChanges();
    }, 3000);
  }

  /**
   * Scroll to an endpoint element
   */
  private scrollToEndpoint(endpoint: ParsedEndpoint): void {
    const elementId = this.getEndpointElementId(endpoint);
    const element = document.getElementById(elementId);
    
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }

  /**
   * Generate a unique element ID for an endpoint
   */
  getEndpointElementId(endpoint: ParsedEndpoint): string {
    const sanitizedPath = endpoint.path.replace(/[^a-zA-Z0-9]/g, '-');
    return `endpoint-${endpoint.method.toLowerCase()}-${sanitizedPath}`;
  }

  /**
   * Check if an endpoint is currently highlighted (from search navigation)
   */
  isEndpointHighlighted(endpoint: ParsedEndpoint): boolean {
    return this.highlightedEndpointKey === `${endpoint.method}-${endpoint.path}`;
  }
}
