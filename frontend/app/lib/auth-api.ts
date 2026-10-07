export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  specialty: string | null;
  practiceCity: string | null;
  phone: string | null;
  createdAt: string;
};

type LoginResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

function getErrorMessage(payload: unknown) {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const { message } = payload as { message?: unknown };
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
  }

  return "Une erreur est survenue. Veuillez réessayer.";
}

async function request<T>(path: string, body: Record<string, string>) {
  let response: Response;

  try {
    response = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez qu’il est bien démarré.");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getErrorMessage(payload));

  return payload as T;
}

export function registerDoctor(input: {
  email: string;
  password: string;
  name: string;
  specialty: string;
  practiceCity: string;
  phone: string;
}) {
  return request<AuthUser>("/auth/register", input);
}

export function login(input: { email: string; password: string }) {
  return request<LoginResponse>("/auth/login", input);
}
