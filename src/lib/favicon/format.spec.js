import { describe, expect, it } from 'vitest';
import { detectImageFormat } from './format.js';

const bytes = (/** @type {number[]} */ ...values) => Uint8Array.from(values);
const text = (/** @type {string} */ value) => new TextEncoder().encode(value);

describe('detectImageFormat', () => {
	it('recognises binary formats by magic bytes', () => {
		expect(detectImageFormat(bytes(0, 0, 1, 0, 1, 0))?.label).toBe('ICO');
		expect(detectImageFormat(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a))?.label).toBe('PNG');
		expect(detectImageFormat(text('GIF89a'))?.label).toBe('GIF');
		expect(detectImageFormat(bytes(0xff, 0xd8, 0xff, 0xe0))?.label).toBe('JPEG');
		expect(detectImageFormat(text('RIFF\0\0\0\0WEBPVP8 '))?.label).toBe('WebP');
	});

	it('recognises SVG, with or without an XML declaration', () => {
		expect(detectImageFormat(text('  <svg xmlns="http://www.w3.org/2000/svg">'))?.label).toBe(
			'SVG'
		);
		expect(detectImageFormat(text('<?xml version="1.0"?>\n<svg>'))?.label).toBe('SVG');
	});

	it('returns null for anything else', () => {
		expect(detectImageFormat(text('<!doctype html><html>'))).toBeNull();
		expect(detectImageFormat(new Uint8Array())).toBeNull();
	});
});
