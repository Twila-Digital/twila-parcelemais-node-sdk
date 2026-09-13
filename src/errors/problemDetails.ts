export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  correlationId?: string;
}

export function parseProblemDetails(body: unknown): ProblemDetails {
  if (typeof body !== 'object' || body === null) return {};

  const raw = body as Record<string, unknown>;

  return {
    type: typeof raw.tipo === 'string' ? raw.tipo : undefined,
    title: typeof raw.titulo === 'string' ? raw.titulo : undefined,
    status: typeof raw.status === 'number' ? raw.status : undefined,
    detail: typeof raw.detalhe === 'string' ? raw.detalhe : undefined,
    instance: typeof raw.instancia === 'string' ? raw.instancia : undefined,
    errors: isFieldErrorMap(raw.erros) ? raw.erros : undefined,
    correlationId: typeof raw.correlationId === 'string' ? raw.correlationId : undefined,
  };
}

function isFieldErrorMap(value: unknown): value is Record<string, string[]> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
