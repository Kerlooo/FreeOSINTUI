import { describe, expect, it } from 'vitest';
import { formatBytes, formatLocalDate, formatValue, mapLinks } from './format.js';
import { detectFormat } from './detect.js';
import { buildReverseSearchLinks } from './reverse.js';
import { decodeXmlEntities, readXmpProperty } from './xml.js';

describe('formatValue', () => {
	it('formats common exifr values', () => {
		expect(formatValue(new Date(2024, 4, 1, 12, 34, 56))).toBe('2024-05-01 12:34:56');
		expect(formatValue([45, 27, 51.12])).toBe('45, 27, 51.12');
		expect(formatValue({ 0: 1, 1: 2, 2: 3, 3: 0 })).toBe('1, 2, 3, 0');
		expect(formatValue(new Uint8Array(2048))).toBe('(binary data, 2.0 KB)');
		expect(formatValue(1 / 3)).toBe('0.333333');
		expect(formatValue('Canon\0\0')).toBe('Canon');
		expect(formatValue(null)).toBe('');
	});

	it('formats sizes and dates', () => {
		expect(formatBytes(512)).toBe('512 B');
		expect(formatBytes(1536)).toBe('1.5 KB');
		expect(formatLocalDate(new Date('invalid'))).toBe('');
	});

	it('builds map links', () => {
		expect(mapLinks(45.4642, 9.19).google).toBe(
			'https://www.google.com/maps/search/?api=1&query=45.4642,9.19'
		);
	});
});

describe('detectFormat', () => {
	const head = (text) => new Uint8Array([...text].map((char) => char.charCodeAt(0)));
	it('detects formats by magic number', () => {
		expect(detectFormat(head('\x89PNG\r\n\x1a\n\0\0\0\0\0\0\0\0'))).toBe('png');
		expect(detectFormat(head('%PDF-1.7\n%\xe2\xe3'))).toBe('pdf');
		expect(detectFormat(head('PK\x03\x04\0\0\0\0\0\0\0\0'))).toBe('zip');
		expect(detectFormat(head('\0\0\0\x18ftypheic\0\0\0\0'))).toBe('heic');
		expect(detectFormat(head('II*\0\x08\0\0\0\0\0\0\0'))).toBe('tiff');
		expect(detectFormat(head('hello world, text'))).toBeNull();
	});
});

describe('buildReverseSearchLinks', () => {
	it('builds encoded links for every engine', () => {
		const { error, links } = buildReverseSearchLinks(' https://example.com/a b.jpg?x=1&y=2 ');
		expect(error).toBeNull();
		expect(links.map((link) => link.id)).toEqual(['google', 'bing', 'yandex', 'tineye']);
		expect(links[0].url).toBe(
			'https://lens.google.com/uploadbyurl?url=https%3A%2F%2Fexample.com%2Fa%2520b.jpg%3Fx%3D1%26y%3D2'
		);
		expect(links[1].url).toContain('q=imgurl:https%3A%2F%2Fexample.com');
	});

	it('rejects invalid or non-http URLs', () => {
		expect(buildReverseSearchLinks('')).toEqual({ error: null, links: [] });
		expect(buildReverseSearchLinks('example.com/a.jpg').error).toMatch(/full URL/);
		expect(buildReverseSearchLinks('javascript:alert(1)').error).toMatch(/http/);
	});
});

describe('xml helpers', () => {
	it('decodes entities', () => {
		expect(decodeXmlEntities('A &amp; B &lt;x&gt; &#233;&#x41;')).toBe('A & B <x> éA');
	});

	it('reads XMP properties as attributes, elements and lists', () => {
		const xmp = `<rdf:Description pdf:Producer="Skia &amp; co" xmlns:dc="x">
			<dc:creator><rdf:Seq><rdf:li>Jane</rdf:li><rdf:li>John</rdf:li></rdf:Seq></dc:creator>
			<xmp:CreatorTool>Word</xmp:CreatorTool></rdf:Description>`;
		expect(readXmpProperty(xmp, 'pdf:Producer')).toBe('Skia & co');
		expect(readXmpProperty(xmp, 'dc:creator')).toBe('Jane, John');
		expect(readXmpProperty(xmp, 'xmp:CreatorTool')).toBe('Word');
		expect(readXmpProperty(xmp, 'dc:title')).toBe('');
	});
});
