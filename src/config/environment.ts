export enum ParceleMaisEnvironment {
  Staging = 'staging',
  Production = 'production',
}

const BASE_URLS: Record<ParceleMaisEnvironment, string> = {
  [ParceleMaisEnvironment.Staging]: 'https://api.staging.parcelemais.com.br/integration/',
  [ParceleMaisEnvironment.Production]: 'https://api.parcelemais.com.br/integration/',
};

export function environmentBaseUrl(environment: ParceleMaisEnvironment): string {
  return BASE_URLS[environment];
}
