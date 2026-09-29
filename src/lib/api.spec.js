import { describe, expect, it } from 'vitest';
import { ApiError, apiGet } from './api.js';

/** @param {number} status @param {unknown} body @param {string} type */
function mockFetch(status, body, type = 'application/json') {
	return async () =>
		new Response(typeof body === 'string' ? body : JSON.stringify(body), {
			status,
			headers: { 'content-type': type }
		});
}

describe('apiGet', () => {
	it('returns JSON and builds the query string', async () => {
		let requested = '';
		const data = await apiGet('/api/username/check', {
			params: { username: 'a b', site: 'x' },
			fetch: async (url) => {
				requested = String(url);
				return mockFetch(200, { ok: true })();
			}
		});
		expect(data).toEqual({ ok: true });
		expect(requested).toBe('/api/username/check?username=a+b&site=x');
	});

	it('flags network errors as unreachable', async () => {
		const error = await apiGet('/api/health', {
			fetch: async () => {
				throw new TypeError('fetch failed');
			}
		}).catch((e) => e);
		expect(error).toBeInstanceOf(ApiError);
		expect(error.unreachable).toBe(true);
	});

	it('flags non-JSON answers (proxy error, static 404 page) as unreachable', async () => {
		const error = await apiGet('/api/health', {
			fetch: mockFetch(404, '<html></html>', 'text/html')
		}).catch((e) => e);
		expect(error.unreachable).toBe(true);
	});

	it('uses the backend detail message on HTTP errors', async () => {
		const error = await apiGet('/api/telegram/ab', {
			fetch: mockFetch(422, { detail: 'Invalid Telegram username.' })
		}).catch((e) => e);
		expect(error.unreachable).toBe(false);
		expect(error.status).toBe(422);
		expect(error.message).toBe('Invalid Telegram username.');
	});
});
