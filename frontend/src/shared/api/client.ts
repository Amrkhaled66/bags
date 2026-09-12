import { apiUrl } from "./config";
import { sessionStorage } from "./session-storage";

export class ApiError extends Error {
  status: number;
  details: unknown;
  requestId?: string;
  constructor(
    message: string,
    status: number,
    details?: unknown,
    requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  authenticated?: boolean;
};

export async function request<T>(
  path: string,
  { body, authenticated = true, ...options }: RequestOptions = {},
): Promise<T> {
  const token = authenticated ? sessionStorage.getToken() : null;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm)
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers,
      body:
        body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      "Cannot reach the server. Check your connection and try again.",
      0,
    );
  }
  const data: unknown =
    response.status === 204
      ? undefined
      : await response.json().catch(() => undefined);
  if (!response.ok) {
    if (response.status === 401 && token && token === sessionStorage.getToken())
      sessionStorage.setToken(null);
    const payload =
      data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    throw new ApiError(
      typeof payload.message === "string"
        ? payload.message
        : "The request could not be completed.",
      response.status,
      payload.details,
      response.headers.get("X-Request-Id") ?? undefined,
    );
  }
  return data as T;
}
