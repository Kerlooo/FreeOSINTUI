import { describe, expect, it } from 'vitest';
import {
	extractGps,
	imageHighlights,
	imageTagGroups,
	readImageMetadata,
	webpToJpegSegments
} from './image.js';
import { detectFormat } from './detect.js';

// 1x1 JPEG (APP1 segment only) written with exiftool: Canon EOS 5D, EF 50mm, GIMP,
// 2024:05:01 12:34:56 +02:00, artist John Doe, GPS 45.4642 N 9.19 W, altitude 120 m.
const JPEG_BASE64 =
	'/9j/4AAQSkZJRgABAQAAAQABAAD/4QHGRXhpZgAATU0AKgAAAAgACgEPAAIAAAAGAAAAhgEQAAIAAAANAAAAjAEaAAUAAAABAAAAmgEbAAUAAAABAAAAogEoAAMAAAABAAEAAAExAAIAAAAFAAAAqgE7AAIAAAAJAAAAsAITAAMAAAABAAEAAIdpAAQAAAABAAAAuoglAAQAAAABAAABLAAAAABDYW5vbgBDYW5vbiBFT1MgNUQAAAAAAAEAAAABAAAAAQAAAAFHSU1QAABKb2huIERvZQAAAAaQAAAHAAAABDAyMzKQAwACAAAAFAAAAQiQEQACAAAABwAAARyRAQAHAAAABAECAwCgAQADAAAAAf//AACkNAACAAAACAAAASQAAAAAMjAyNDowNTowMSAxMjozNDo1NgArMDI6MDAAAEVGIDUwbW0AAAcAAAABAAAABAIDAAAAAQACAAAAAk4AAAAAAgAFAAAAAwAAAYYAAwACAAAAAlcAAAAABAAFAAAAAwAAAZ4ABQABAAAAAQAAAAAABgAFAAAAAQAAAbYAAAAAAAAALQAAAAEAAAAbAAAAAQAABP4AAAAZAAAACQAAAAEAAAALAAAAAQAAABgAAAABAAAAeAAAAAH/2Q==';

// 1x1 WebP with an EXIF chunk: Make Sony, Model A7.
const WEBP_BASE64 =
	'UklGRpYAAABXRUJQVlA4WAoAAAAIAAAAAAAAAAAAVlA4IDAAAADQAQCdASoBAAEAAgA0JaACdLoB+AADsAD+8MQL/yC5YXXI1/8gP+QH/ID/+PIAAABFWElGQAAAAE1NACoAAAAQRXhpZk1ldGEAAwEPAAIAAAAFAAAAOgEQAAIAAAADQTcAAAITAAMAAAABAAEAAAAAAABTb255AAA=';

const bytes = (base64) => new Uint8Array(Buffer.from(base64, 'base64'));

describe('readImageMetadata', () => {
	it('reads EXIF and GPS from a JPEG', async () => {
		const jpeg = bytes(JPEG_BASE64);
		expect(detectFormat(jpeg)).toBe('jpeg');
		const segments = await readImageMetadata(jpeg, 'jpeg');
		const rows = Object.fromEntries(imageHighlights(segments).map((row) => [row.label, row]));

		expect(rows.Camera.value).toBe('Canon EOS 5D');
		expect(rows.Lens.value).toBe('EF 50mm');
		expect(rows.Software.value).toBe('GIMP');
		expect(rows.Author.value).toBe('John Doe');
		// The camera's wall-clock time is kept, whatever the local time zone.
		expect(rows['Original date'].value).toBe('2024-05-01 12:34:56 +02:00');
		expect(rows['GPS coordinates'].value).toBe('45.464200, -9.190000');
		expect(rows['GPS altitude'].value).toBe('120 m');
		expect(rows.OpenStreetMap.href).toContain('mlat=45.4642&mlon=-9.19');

		const groups = imageTagGroups(segments);
		expect(groups.map((group) => group.id)).toEqual(
			expect.arrayContaining(['ifd0', 'exif', 'gps'])
		);
	});

	it('reads EXIF from a WebP through a JPEG wrapper', async () => {
		const webp = bytes(WEBP_BASE64);
		expect(detectFormat(webp)).toBe('webp');
		expect(webpToJpegSegments(webp)?.subarray(0, 2)).toEqual(new Uint8Array([0xff, 0xd8]));
		const segments = await readImageMetadata(webp, 'webp');
		expect(segments.ifd0).toMatchObject({ Make: 'Sony', Model: 'A7' });
	});
});

describe('extractGps', () => {
	it('ignores missing and 0,0 coordinates', () => {
		expect(extractGps({})).toBeNull();
		expect(extractGps({ gps: { latitude: 0, longitude: 0 } })).toBeNull();
	});

	it('makes altitudes below sea level negative', () => {
		expect(
			extractGps({ gps: { latitude: 31.5, longitude: 35.5, GPSAltitude: 430, GPSAltitudeRef: 1 } })
		).toEqual({ latitude: 31.5, longitude: 35.5, altitude: -430 });
	});
});

describe('imageHighlights', () => {
	it('does not repeat the make when the model contains it', () => {
		const rows = imageHighlights({ ifd0: { Make: 'Apple', Model: 'iPhone 13' } });
		expect(rows.find((row) => row.label === 'Camera')?.value).toBe('Apple iPhone 13');
		const canon = imageHighlights({ ifd0: { Make: 'Canon', Model: 'Canon EOS R5' } });
		expect(canon.find((row) => row.label === 'Camera')?.value).toBe('Canon EOS R5');
	});
});
