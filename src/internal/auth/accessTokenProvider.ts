import type { TokenApiClient } from './tokenApiClient';

const CLOCK_SKEW_MS = 60_000;

interface CachedToken {
  value: string;
  expiresAtEpochMs: number;
}

export interface AccessTokenProvider {
  getToken(): Promise<string>;
  invalidate(): void;
}

export class AccessTokenProviderImpl implements AccessTokenProvider {
  private cached: CachedToken | null = null;
  private refreshing: Promise<string> | null = null;

  constructor(
    private readonly tokenApiClient: TokenApiClient,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  async getToken(): Promise<string> {
    const current = this.cached;
    if (current && !this.isCloseToExpiry(current)) return current.value;

    if (this.refreshing) return this.refreshing;

    this.refreshing = this.refresh();
    try {
      return await this.refreshing;
    } finally {
      this.refreshing = null;
    }
  }

  invalidate(): void {
    this.cached = null;
  }

  private async refresh(): Promise<string> {
    const current = this.cached;
    if (current && !this.isCloseToExpiry(current)) return current.value;

    const response = await this.tokenApiClient.generate(this.clientId, this.clientSecret);
    const fresh: CachedToken = {
      value: response.token_de_acesso,
      expiresAtEpochMs: Date.now() + response.expira_em_segundos * 1000,
    };

    this.cached = fresh;
    return fresh.value;
  }

  private isCloseToExpiry(token: CachedToken): boolean {
    return Date.now() + CLOCK_SKEW_MS >= token.expiresAtEpochMs;
  }
}
