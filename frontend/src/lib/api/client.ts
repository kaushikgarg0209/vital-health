const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiErrorBody = {
  error?: {
    message?: string;
    code?: string;
  };
};

function resolveUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { headers, ...rest } = options;

  const response = await fetch(resolveUrl(path), {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    const errorBody = body as ApiErrorBody | undefined;
    const message =
      errorBody?.error?.message ?? `API request failed: ${response.statusText}`;
    const code = errorBody?.error?.code;

    throw new ApiError(message, response.status, code, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export { API_URL };
