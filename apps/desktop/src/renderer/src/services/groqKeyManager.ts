/**
 * Multi-Key Rotation and Automatic Rate Limit Fallback Manager for Groq API.
 * Ensures 100% uninterrupted streaming if any key hits HTTP 429 (Rate Limit / Quota Exceeded).
 */

export class GroqKeyManager {
  private primaryKey: string = '';
  private fallbackKey: string = '';
  private activeKeyIndex: number = 0;
  private keyRateLimitUntil: number[] = [0, 0];
  private cooldownDurationMs: number = 60000; // 60s rate-limit cooldown

  constructor() {
    this.reloadKeys();
  }

  public reloadKeys(): void {
    const envPrimary = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
    const envFallback = (import.meta as any).env?.VITE_GROQ_API_KEY_FALLBACK || '';

    const savedPrimary = typeof localStorage !== 'undefined' ? localStorage.getItem('ghostpilot_groq_api_key') : null;
    const savedFallback = typeof localStorage !== 'undefined' ? localStorage.getItem('ghostpilot_groq_fallback_key') : null;

    this.primaryKey = (savedPrimary || envPrimary).trim();
    this.fallbackKey = (savedFallback || envFallback).trim();

    // Ensure primary key is stored
    if (typeof localStorage !== 'undefined' && !savedPrimary && this.primaryKey) {
      localStorage.setItem('ghostpilot_groq_api_key', this.primaryKey);
    }
    if (typeof localStorage !== 'undefined' && !savedFallback && this.fallbackKey) {
      localStorage.setItem('ghostpilot_groq_fallback_key', this.fallbackKey);
    }
  }

  public getPrimaryApiKey(): string {
    return this.primaryKey;
  }

  public getFallbackApiKey(): string {
    return this.fallbackKey;
  }

  public setPrimaryApiKey(key: string): void {
    this.primaryKey = key.trim();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ghostpilot_groq_api_key', this.primaryKey);
    }
    this.keyRateLimitUntil[0] = 0;
  }

  public setFallbackApiKey(key: string): void {
    this.fallbackKey = key.trim();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ghostpilot_groq_fallback_key', this.fallbackKey);
    }
    this.keyRateLimitUntil[1] = 0;
  }

  public getAllApiKeys(): string[] {
    const keys: string[] = [];
    if (this.primaryKey) keys.push(this.primaryKey);
    if (this.fallbackKey && this.fallbackKey !== this.primaryKey) keys.push(this.fallbackKey);
    return keys;
  }

  public getActiveKey(): string {
    const keys = this.getAllApiKeys();
    if (keys.length === 0) return '';
    if (keys.length === 1) return keys[0];

    const now = Date.now();
    // If active key is in rate limit cooldown, try other key
    if (this.keyRateLimitUntil[this.activeKeyIndex] > now) {
      const otherIndex = (this.activeKeyIndex + 1) % keys.length;
      if (this.keyRateLimitUntil[otherIndex] <= now) {
        return keys[otherIndex];
      }
    }

    return keys[this.activeKeyIndex];
  }

  public markRateLimited(key: string): void {
    const keys = this.getAllApiKeys();
    const idx = keys.indexOf(key);
    const targetIdx = idx >= 0 ? idx : this.activeKeyIndex;

    this.keyRateLimitUntil[targetIdx] = Date.now() + this.cooldownDurationMs;
    console.warn(
      `[GroqKeyManager] Key #${targetIdx + 1} (${key.slice(0, 8)}...${key.slice(-4)}) rate limited (429). Setting ${this.cooldownDurationMs / 1000}s cooldown.`
    );

    // Switch active index to the other key
    if (keys.length > 1) {
      this.activeKeyIndex = (targetIdx + 1) % keys.length;
      console.log(`[GroqKeyManager] Switched active Groq key to key #${this.activeKeyIndex + 1}.`);
    }
  }

  /**
   * Executes fetch with automatic retry using the fallback key if status 429 (Rate Limit) occurs.
   */
  public async fetchWithFallback(
    url: string,
    buildInit: (apiKey: string) => RequestInit
  ): Promise<Response> {
    const keys = this.getAllApiKeys();
    if (keys.length === 0) {
      throw new Error('No Groq API key configured. Provide an API key starting with gsk_.');
    }

    let lastResponse: Response | null = null;
    let lastError: any = null;

    // Determine start index based on cooldown
    const now = Date.now();
    let startIdx = this.activeKeyIndex;
    if (keys.length > 1 && this.keyRateLimitUntil[startIdx] > now) {
      const altIdx = (startIdx + 1) % keys.length;
      if (this.keyRateLimitUntil[altIdx] <= now) {
        startIdx = altIdx;
      }
    }

    for (let attempt = 0; attempt < keys.length; attempt++) {
      const currentIdx = (startIdx + attempt) % keys.length;
      const currentApiKey = keys[currentIdx];

      try {
        const init = buildInit(currentApiKey);
        const res = await fetch(url, init);

        // Check if rate limited
        if (res.status === 429) {
          this.markRateLimited(currentApiKey);
          lastResponse = res;

          if (attempt < keys.length - 1) {
            console.warn(
              `[GroqKeyManager] Key #${currentIdx + 1} hit rate limit (429). Retrying immediately with fallback key...`
            );
            continue; // Retry with next available key
          }
        }

        // Success or non-429 error
        this.activeKeyIndex = currentIdx;
        return res;
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') {
          throw err; // Do not retry on explicit cancellation
        }
        if (attempt < keys.length - 1) {
          console.warn(`[GroqKeyManager] Network error with key #${currentIdx + 1}. Retrying with fallback key...`, err);
          continue;
        }
      }
    }

    if (lastResponse) return lastResponse;
    throw lastError || new Error('All Groq API keys failed or rate-limited.');
  }
}

export const groqKeyManager = new GroqKeyManager();
