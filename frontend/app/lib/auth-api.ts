export const PROFESSIONAL_TYPES = ["Médecin", "Infirmier·ère", "Sage-femme"] as const;
export type ProfessionalType = (typeof PROFESSIONAL_TYPES)[number];

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  professionalType: ProfessionalType;
  professionalTitle: string | null;
  specialty: string | null;
  practiceCity: string | null;
  practiceAddress: string | null;
  phone: string | null;
  profilePhotoUrl: string | null;
  spokenLanguages: string[];
  bio: string | null;
  experienceYears: number | null;
  services: string[];
  consultationFee: number | null;
  consultationModes: string[];
  consultationDurationMinutes: number;
  isVerified: boolean;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  role: "PROFESSIONAL" | "ADMIN";
  verificationNote: string | null;
  availabilities: AvailabilityWindow[];
  createdAt: string;
};

export type AvailabilityWindow = {
  id?: string;
  weekday: number;
  startTime: string;
  endTime: string;
};

export type PublicDoctorProfile = Omit<AuthUser, "email" | "createdAt">;

export type Appointment = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reason: string | null;
  status: "REQUESTED" | "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED";
};

export type PublicDoctorSummary = Pick<
  PublicDoctorProfile,
  | "id"
  | "name"
  | "professionalType"
  | "professionalTitle"
  | "specialty"
  | "practiceCity"
  | "practiceAddress"
  | "profilePhotoUrl"
  | "isVerified"
>;

type LoginResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function doctorPhotoUrl(path: string | null) {
  if (!path) return null;
  return new URL(path, `${apiUrl}/`).toString();
}

function getErrorMessage(payload: unknown) {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const { message } = payload as { message?: unknown };
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
  }

  return "Une erreur est survenue. Veuillez réessayer.";
}

async function request<T>(path: string, body: unknown) {
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
  if (!response.ok) throw new AuthApiError(getErrorMessage(payload), response.status);

  return payload as T;
}

export function registerDoctor(input: {
  email: string;
  password: string;
  name: string;
  professionalType: ProfessionalType;
  specialty: string;
  practiceCity: string;
  phone: string;
}) {
  return request<AuthUser>("/auth/register", input);
}

export function login(input: { email: string; password: string }) {
  return request<LoginResponse>("/auth/login", input);
}

export function requestPasswordReset(email: string) {
  return request<{ accepted: true }>("/auth/password-reset/request", { email });
}

export function resetPassword(token: string, password: string) {
  return request<undefined>("/auth/password-reset/confirm", { token, password });
}

export async function getDoctorProfile(accessToken: string) {
  return authenticatedRequest<AuthUser>("/auth/me", accessToken);
}

async function authenticatedRequest<T>(
  path: string,
  accessToken: string,
  method = "GET",
  body?: unknown,
) {
  let response: Response;

  try {
    response = await fetch(`${apiUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body === undefined || body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
      },
      ...(body === undefined
        ? {}
        : { body: body instanceof FormData ? body : JSON.stringify(body) }),
    });
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez qu’il est bien démarré.");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new AuthApiError(getErrorMessage(payload), response.status);

  return payload as T;
}

export function updateDoctorProfile(accessToken: string, input: Partial<Omit<AuthUser, "id" | "email" | "createdAt" | "isVerified" | "availabilities" | "profilePhotoUrl">>) {
  return authenticatedRequest<AuthUser>("/auth/me/profile", accessToken, "PATCH", input);
}

export async function uploadDoctorPhoto(accessToken: string, file: File) {
  const formData = new FormData();
  formData.append("photo", file);
  return authenticatedRequest<AuthUser>("/auth/me/photo", accessToken, "POST", formData);
}

export function removeDoctorPhoto(accessToken: string) {
  return authenticatedRequest<AuthUser>("/auth/me/photo", accessToken, "DELETE");
}

export function updateDoctorAvailability(accessToken: string, windows: AvailabilityWindow[]) {
  return authenticatedRequest<AuthUser>(
    "/auth/me/availability",
    accessToken,
    "PATCH",
    { windows },
  );
}

export function getDoctorAppointments(accessToken: string) {
  return authenticatedRequest<Appointment[]>("/auth/me/appointments", accessToken);
}

export function uploadVerificationDocument(accessToken: string, file: File) {
  const formData = new FormData();
  formData.append("document", file);
  return authenticatedRequest<{ document: { id: string }; profile: AuthUser }>(
    "/auth/me/verification-document",
    accessToken,
    "POST",
    formData,
  );
}

export function setAppointmentStatus(
  accessToken: string,
  appointmentId: string,
  status: "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED",
) {
  return authenticatedRequest<{ id: string; status: Appointment["status"] }>(
    `/auth/me/appointments/${encodeURIComponent(appointmentId)}/status`,
    accessToken,
    "PATCH",
    { status },
  );
}

export function rescheduleAppointment(
  accessToken: string,
  appointmentId: string,
  startsAt: string,
) {
  return authenticatedRequest<Pick<Appointment, "id" | "startsAt" | "status" | "durationMinutes">>(
    `/auth/me/appointments/${encodeURIComponent(appointmentId)}/reschedule`,
    accessToken,
    "PATCH",
    { startsAt },
  );
}

export function deleteMyAccount(accessToken: string) {
  return authenticatedRequest<{ deleted: boolean }>("/auth/me", accessToken, "DELETE");
}

export function cancelAppointmentWithToken(token: string) {
  return request<{ id: string; status: "CANCELLED" }>(
    "/auth/public/appointments/cancel",
    { token },
  );
}

export function erasePatientDataWithToken(token: string) {
  return request<{ erased: boolean; appointmentsAnonymized: number }>(
    "/auth/public/appointments/erase-data",
    { token },
  );
}

export function getPendingProfessionals(accessToken: string) {
  return authenticatedRequest<PendingProfessional[]>("/admin/professionals/pending", accessToken);
}

export function reviewProfessional(
  accessToken: string,
  doctorId: string,
  decision: "approve" | "reject",
  reason?: string,
) {
  return authenticatedRequest<{ id: string; isVerified: boolean; verificationNote?: string }>(
    `/admin/professionals/${encodeURIComponent(doctorId)}/${decision}`,
    accessToken,
    "PATCH",
    decision === "reject" ? { reason } : {},
  );
}

export type PendingProfessional = {
  id: string;
  name: string | null;
  email: string;
  professionalType: ProfessionalType;
  specialty: string | null;
  practiceCity: string | null;
  phone: string | null;
  createdAt: string;
  verificationNote: string | null;
  verificationDocuments: Array<{ id: string; fileName: string; mimeType: string; createdAt: string }>;
};

export function verificationDocumentUrl(documentId: string) {
  return `${apiUrl}/admin/verification-documents/${encodeURIComponent(documentId)}`;
}

export async function downloadVerificationDocument(accessToken: string, documentId: string) {
  let response: Response;
  try {
    response = await fetch(verificationDocumentUrl(documentId), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez qu’il est bien démarré.");
  }
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw new AuthApiError(getErrorMessage(payload), response.status);
  }
  return response.blob();
}

export async function getPublicDoctorProfile(doctorId: string) {
  return publicRequest<PublicDoctorProfile>(`/auth/public/${encodeURIComponent(doctorId)}`);
}

export async function searchPublicDoctors(specialty: string, city: string) {
  const query = new URLSearchParams();
  if (specialty) query.set("specialty", specialty);
  if (city) query.set("city", city);
  return publicRequest<PublicDoctorSummary[]>(`/auth/public${query.size ? `?${query}` : ""}`);
}

export async function getPublicBookedSlots(doctorId: string, date: string) {
  return publicRequest<Array<{ startsAt: string; durationMinutes: number }>>(
    `/auth/public/${encodeURIComponent(doctorId)}/slots?date=${encodeURIComponent(date)}`,
  );
}

export async function createAppointment(
  doctorId: string,
  input: {
    startsAt: string;
    privacyConsent: boolean;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    reason?: string;
  },
) {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/auth/public/${encodeURIComponent(doctorId)}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez qu’il est bien démarré.");
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new AuthApiError(getErrorMessage(payload), response.status);
  return payload as { id: string; startsAt: string; durationMinutes: number };
}

async function publicRequest<T>(path: string) {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`);
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez qu’il est bien démarré.");
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new AuthApiError(getErrorMessage(payload), response.status);
  return payload as T;
}
