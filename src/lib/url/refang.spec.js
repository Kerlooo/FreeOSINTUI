import { describe, expect, it } from 'vitest';
import { defang, refang } from './refang.js';

describe('refang', () => {
	it('restores common defanging styles', () => {
		expect(refang('hxxps://evil[.]com/path')).toBe('https://evil.com/path');
		expect(refang('hXXp://evil(.)example{.}org')).toBe('http://evil.example.org');
		expect(refang('hxxps[://]evil[dot]com')).toBe('https://evil.com');
		expect(refang('http://evil.com[:]8080/')).toBe('http://evil.com:8080/');
		expect(refang('https://user[at]evil.com')).toBe('https://user@evil.com');
		expect(refang('  <https://a.b/c>  ')).toBe('https://a.b/c');
	});

	it('leaves normal URLs untouched', () => {
		expect(refang('https://example.com/a?b=c#d')).toBe('https://example.com/a?b=c#d');
	});
});

describe('defang', () => {
	it('defangs scheme and host only', () => {
		expect(defang('https://evil.example.com/a.php?x=1.2')).toBe(
			'hxxps[://]evil[.]example[.]com/a.php?x=1.2'
		);
		expect(defang('http://user@1.2.3.4:8080/')).toBe('hxxp[://]user[@]1[.]2[.]3[.]4:8080/');
	});

	it('round-trips with refang', () => {
		const url = 'https://login.example.co.uk/path?q=1';
		expect(refang(defang(url))).toBe(url);
	});
});
