/**
 * One way to call the backend: every request goes through the gateway (/api), carries the
 * signed-in user's id, and every error comes back as an ApiError built from the backend's
 * Problem Details (RFC 9457), so screens can show the server's own message and field errors.
 */

export type Query = Record<string, string | number | boolean | null | undefined>;

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, title: string, detail: string, fieldErrors: Record<string, string> = {}) {
    super(detail || title);
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
    this.fieldErrors = fieldErrors;
  }

  /** The message for one form field, if the server rejected it. */
  field(name: string): string | undefined {
    return this.fieldErrors[name];
  }
}

let userId: string | null = null;

/** Set by the session; until Phase 8 adds login the gateway trusts this header. */
export function setApiUser(id: string | null): void {
  userId = id;
}

export function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    }
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function authHeaders(): Record<string, string> {
  return userId ? { 'X-User-Id': userId } : {};
}

interface RequestOptions {
  query?: Query;
  body?: unknown;
  form?: FormData;
  signal?: AbortSignal;
}

export async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...authHeaders() };
  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), { method, headers, body, signal: options.signal });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw error;
    }
    throw new ApiError(0, 'Network error', 'Could not reach the server. Is the gateway running on :8080?');
  }
  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function toApiError(response: Response): Promise<ApiError> {
  const text = await response.text().catch(() => '');
  try {
    const problem = JSON.parse(text) as { title?: string; detail?: string; errors?: Record<string, string> };
    return new ApiError(response.status, problem.title ?? response.statusText, problem.detail ?? '', problem.errors ?? {});
  } catch {
    const fallback = response.status === 404 ? 'Not found.' : response.status >= 500 ? 'The server had a problem.' : '';
    return new ApiError(response.status, response.statusText, text.slice(0, 300) || fallback);
  }
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown, query?: Query) => request<T>('POST', path, { body, query }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  del: <T = void>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, { form }),
};

/** A readable message for any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong.';
}
