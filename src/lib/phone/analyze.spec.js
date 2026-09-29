import { describe, expect, it } from 'vitest';
import { analyzePhone } from './analyze.js';
import { countryName, flagEmoji, listCountries } from './countries.js';

describe('analyzePhone', () => {
	it('describes an international mobile number', () => {
		const { error, result } = analyzePhone('+39 333 123 4567', 'US');
		expect(error).toBeNull();
		expect(result).toMatchObject({
			valid: true,
			possible: true,
			country: 'IT',
			countryName: 'Italy',
			flag: '🇮🇹',
			callingCode: '+39',
			nationalNumber: '3331234567',
			type: 'MOBILE',
			typeLabel: 'Mobile'
		});
		expect(result.formats.map((f) => f.value)).toEqual([
			'+393331234567',
			'+39 333 123 4567',
			'333 123 4567',
			'tel:+393331234567'
		]);
	});

	it('uses the default country for numbers without a prefix', () => {
		expect(analyzePhone('06 1234 5678', 'IT').result).toMatchObject({
			country: 'IT',
			type: 'FIXED_LINE'
		});
		expect(analyzePhone('020 7946 0958', 'GB').result).toMatchObject({
			country: 'GB',
			callingCode: '+44'
		});
	});

	it('detects special number types', () => {
		expect(analyzePhone('+1 800 555 0199').result.type).toBe('TOLL_FREE');
		expect(analyzePhone('+39 899 123456').result.typeLabel).toBe('Premium rate');
	});

	it('builds contact and search links from the E.164 digits', () => {
		const links = analyzePhone('+39 333 123 4567').result.links;
		expect(links.find((l) => l.id === 'whatsapp').url).toBe('https://wa.me/393331234567');
		expect(links.find((l) => l.id === 'telegram').url).toBe('https://t.me/+393331234567');
		const google = decodeURIComponent(links.find((l) => l.id === 'google').url);
		expect(google).toContain('"+393331234567" OR "+39 333 123 4567"');
	});

	it('reports invalid and empty input', () => {
		expect(analyzePhone('   ')).toEqual({ error: null, result: null });
		expect(analyzePhone('call me').error).toMatch(/digits/);
		expect(analyzePhone('+999 1234').error).toMatch(/calling code/);
		const short = analyzePhone('12', 'IT').result;
		expect(short.valid).toBe(false);
		expect(short.lengthProblem).toMatch(/too short/);
	});
});

describe('countries', () => {
	it('builds flag emoji and names', () => {
		expect(flagEmoji('us')).toBe('🇺🇸');
		expect(flagEmoji(null)).toBe('');
		expect(countryName('DE')).toBe('Germany');
	});

	it('lists countries sorted by name with calling codes', () => {
		const countries = listCountries();
		expect(countries.length).toBeGreaterThan(200);
		expect(countries.find((c) => c.code === 'IT')).toMatchObject({ callingCode: '39' });
		const names = countries.map((c) => c.name);
		expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
	});
});
