/**
 * Types shared between the Hono server and the Inertia React client.
 * Keep this file free of runtime imports — it must be importable from
 * both `src/server` (Bun runtime) and `src/client` (browser bundle).
 */

export type Role = "user" | "admin";

export interface User {
	id: string;
	name: string;
	email: string;
	role: Role;
	/** Relative path to the avatar image (served from /uploads), null when unset. */
	avatarUrl: string | null;
	/** Whether the user has verified their email address. */
	emailVerified: boolean;
	createdAt: string;
}

/** One-shot session flash messages, persisted in the `sessions` table. */
export interface FlashData {
	success?: string;
	error?: string;
	/** Validation errors for the redirect-back (non-Inertia) flow. */
	errors?: Record<string, string>;
}

/** Props the server merges into every Inertia page response. */
export interface SharedPageProps {
	[key: string]: unknown;
	auth: { user: User | null };
	errors: Record<string, string>;
}

/** Props for the dashboard page. */
export interface DashboardStats {
	userCount: number;
	recentUsers: User[];
}

/** A personal API token as exposed to the dashboard (never the raw value
 *  or its hash — the raw token is returned only once at creation). */
export interface ApiToken {
	id: string;
	name: string;
	/** First 12 chars of the token, e.g. `dlk_a1b2c3d4` — for recognition. */
	tokenPrefix: string;
	expiresAt: string | null;
	revokedAt: string | null;
	lastUsedAt: string | null;
	createdAt: string;
}

/** Generic pagination envelope, mirroring what the server returns. */
export interface Paginated<T> {
	data: T[];
	meta: {
		currentPage: number;
		perPage: number;
		lastPage: number;
		total: number;
	};
}
