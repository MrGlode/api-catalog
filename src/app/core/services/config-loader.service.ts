/**
 * Config Loader Service
 * Loads external configuration from assets/config.json at application startup
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * External configuration interface
 */
export interface AppConfig {
  wso2: {
    clientId: string;
    clientSecret: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ConfigLoaderService {
  private config: AppConfig | null = null;
  private configLoaded = false;

  constructor(private http: HttpClient) {}

  /**
   * Load configuration from external file
   * Called at application startup via APP_INITIALIZER
   */
  async loadConfig(): Promise<void> {
    try {
      const config = await firstValueFrom(
        this.http.get<AppConfig>('/config.json')
      );
      
      this.config = config;
      this.configLoaded = true;
      
      // Also store in localStorage for AuthService compatibility
      if (config.wso2.clientId && config.wso2.clientSecret) {
        localStorage.setItem('wso2_dcr_client', JSON.stringify({
          clientId: config.wso2.clientId,
          clientSecret: config.wso2.clientSecret
        }));
      }
      
      console.log('✅ Configuration loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load configuration from public/config.json', error);
      console.warn('⚠️ Please create public/config.json with your WSO2 credentials');
      console.warn('📄 See public/config.example.json for the expected format');
      
      // Don't throw - app can still work without auth
      this.configLoaded = true;
    }
  }

  /**
   * Get the loaded configuration
   */
  getConfig(): AppConfig | null {
    return this.config;
  }

  /**
   * Check if configuration is loaded
   */
  isLoaded(): boolean {
    return this.configLoaded;
  }

  /**
   * Check if WSO2 credentials are configured
   */
  hasWso2Credentials(): boolean {
    return !!(
      this.config?.wso2.clientId && 
      this.config?.wso2.clientSecret &&
      !this.config.wso2.clientId.includes('REMPLACER') &&
      !this.config.wso2.clientId.includes('YOUR_')
    );
  }

  /**
   * Get WSO2 client ID
   */
  getClientId(): string | undefined {
    return this.config?.wso2.clientId;
  }

  /**
   * Get WSO2 client secret
   */
  getClientSecret(): string | undefined {
    return this.config?.wso2.clientSecret;
  }
}

/**
 * Factory function for APP_INITIALIZER
 */
export function initializeApp(configLoader: ConfigLoaderService): () => Promise<void> {
  return () => configLoader.loadConfig();
}
