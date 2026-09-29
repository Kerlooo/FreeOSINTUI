import { t } from '$lib/i18n/i18n.svelte.js';

/**
 * Client for the optional Python backend (backend/). In dev, Vite proxies /api to it;
 * when frontend and backend are hosted separately, set VITE_API_BASE to the backend origin.
 */

export const API_BASE = (import.meta.env?.VITE_API_BASE ?? '').replace(/\/$/, '');

/** Command shown to the user when the backend is not running. */
export const BACKEND_START_COMMAND = 'cd backend && uv run uvicorn app.main:app --port 8000';

/** Error thrown by apiGet. `unreachable` is true when the backend is not running at all. */
export class ApiError extends Error {
	/**
	 * @param {string} message
	 * @param {{ status?: number | null, unreachable?: boolean }} [options]
	 */
	constructor(message, { status = null, unreachable = false } = {}) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.unreachable = unreachable;
	}
}

/**
 * GETs a JSON endpoint of the backend.
 * Anything that is not a JSON answer (network error, proxy error, static host 404 page)
 * means the backend is not reachable.
 * @param {string} path e.g. '/api/health'
 * @param {{ params?: Record<string, string>, signal?: AbortSignal, timeoutMs?: number, fetch?: typeof fetch }} [options]
 */
export async function apiGet(path, options = {}) {
	const { params, signal, timeoutMs = 20000, fetch: fetchFn = fetch } = options;
	const query = params ? `?${new URLSearchParams(params)}` : '';
	const timeout = AbortSignal.timeout(timeoutMs);
	const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

	let response;
	try {
		response = await fetchFn(`${API_BASE}${path}${query}`, {
			signal: combined,
			headers: { accept: 'application/json' }
		});
	} catch (error) {
		if (signal?.aborted) throw error;
		if (timeout.aborted) throw new ApiError(t('common.backendTimeout'));
		throw new ApiError(t('common.backendDown'), { unreachable: true });
	}

	const type = response.headers.get('content-type') ?? '';
	if (!type.includes('application/json')) {
		throw new ApiError(t('common.backendDown'), { status: response.status, unreachable: true });
	}

	let data;
	try {
		data = await response.json();
	} catch {
		throw new ApiError(t('common.backendInvalid'), { status: response.status });
	}
	if (!response.ok) {
		const detail = typeof data?.detail === 'string' ? data.detail : `HTTP ${response.status}`;
		throw new ApiError(detail, { status: response.status });
	}
	return data;
}
