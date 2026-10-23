const API_URL = "http://localhost:5000/api";

export interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
}

export interface DuplicateMatch {
  type: "Lead" | "Customer";
  name: string;
  email: string;
  status: string;
}

/*
 * Error thrown for any non-2xx API response.
 * `data` holds the JSON body so callers can read extra fields.
 */
export class ApiError extends Error {
  status: number;
  data: {
    message?: string;
    duplicate?: boolean;
    matches?: DuplicateMatch[];
  };

  constructor(
    message: string,
    status: number,
    data: ApiError["data"]
  ) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function getErrorMessage(
  err: unknown,
  fallback: string
): string {
  return err instanceof Error && err.message
    ? err.message
    : fallback;
}

/*
 * Role of the logged-in user, read from the stored login data.
 */
export function getCurrentRole(): string {
  try {
    const raw =
      sessionStorage.getItem("user") ||
      localStorage.getItem("user");

    return raw ? JSON.parse(raw).role || "" : "";
  } catch {
    return "";
  }
}

export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" = "GET",
  body?: unknown
): Promise<T> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message || "Request failed.",
      response.status,
      data
    );
  }

  return data as T;
}

/*
 * Staff members that leads/customers can be assigned to.
 * The endpoint is Admin-only, so other roles get an empty list.
 */
export async function fetchAssignableStaff(): Promise<
  StaffMember[]
> {
  if (getCurrentRole() !== "Admin") {
    return [];
  }

  const data = await apiRequest<{ users: StaffMember[] }>(
    "/users"
  );

  return (data.users || []).filter(
    (user) => user.status !== "Inactive"
  );
}

/*
 * Send a create/update request. When the server reports a possible
 * duplicate (same email or phone), ask the user whether to continue
 * and resend with confirmDuplicate = true.
 *
 * Returns null if the user cancels.
 */
export async function sendWithDuplicateCheck<T>(
  path: string,
  method: "POST" | "PUT",
  body: Record<string, unknown>
): Promise<T | null> {
  try {
    return await apiRequest<T>(path, method, body);
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.status === 409 &&
      err.data.duplicate
    ) {
      const list = (err.data.matches || [])
        .map(
          (match) =>
            `• ${match.type}: ${match.name} (${match.email})`
        )
        .join("\n");

      const proceed = window.confirm(
        `Possible duplicate found:\n\n${list}\n\nDo you still want to save this record?`
      );

      if (!proceed) {
        return null;
      }

      return apiRequest<T>(path, method, {
        ...body,
        confirmDuplicate: true,
      });
    }

    throw err;
  }
}
