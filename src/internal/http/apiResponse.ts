export interface ApiResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string | undefined>;
}
