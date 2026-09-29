import { describe, expect, it } from 'vitest';
import { gravatarAvatarUrl, gravatarHash, lookupGravatarProfile } from './gravatar.js';

describe('gravatarHash', () => {
	it('hashes the trimmed lowercase address with SHA-256', async () => {
		expect(await gravatarHash(' Beau@DentedReality.com.au ')).toBe(
			'a919f0e9932ec2c866cf67ec327efb57b47ff3085acd375529af076d1ac56f27'
		);
	});

	it('builds an avatar URL that 404s when missing', () => {
		expect(gravatarAvatarUrl('abc')).toBe('https://gravatar.com/avatar/abc?d=404&s=200');
	});
});

describe('lookupGravatarProfile', () => {
	it('summarizes a profile and hides hidden accounts', async () => {
		const fetch = async () =>
			Response.json({
				display_name: 'Beau',
				profile_url: 'https://gravatar.com/beau',
				location: '',
				verified_accounts: [
					{ service_label: 'GitHub', url: 'https://github.com/b', is_hidden: false },
					{ service_label: 'X', url: 'https://x.com/b', is_hidden: true }
				]
			});
		expect(await lookupGravatarProfile('h', { fetch })).toMatchObject({
			displayName: 'Beau',
			location: null,
			accounts: [{ label: 'GitHub', url: 'https://github.com/b' }]
		});
	});

	it('returns null when there is no profile', async () => {
		const fetch = async () => Response.json({ error: 'Profile not found' }, { status: 404 });
		expect(await lookupGravatarProfile('h', { fetch })).toBeNull();
	});
});
