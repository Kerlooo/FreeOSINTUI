import { describe, expect, it } from 'vitest';
import { zlibSync } from 'fflate';
import { bytesToLatin1, decodePdfString, formatPdfDate, parsePdf } from './pdf.js';
import { pdfResult } from './extract.js';

/** @param {string} text latin1 text, one char per byte */
const toBytes = (text) => Uint8Array.from(text, (char) => char.charCodeAt(0));

const PAGES = `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R >> endobj
4 0 obj << /Type /Page /Parent 2 0 R >> endobj
`;

const XMP = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF><rdf:Description rdf:about=""
 xmp:CreatorTool="Microsoft Word" pdf:Producer="macOS Quartz">
<dc:creator><rdf:Seq><rdf:li>Jos\xc3\xa9 Doe</rdf:li></rdf:Seq></dc:creator>
<xmp:CreateDate>2024-05-01T12:34:56+02:00</xmp:CreateDate>
</rdf:Description></rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>`;

const SIMPLE_PDF = `%PDF-1.4
%\xe2\xe3\xcf\xd3
${PAGES}5 0 obj
<< /Title (Report \\(draft\\) \\351t\\351) /Author <FEFF004A006F007300E9>
   /CreationDate (D:20240501123456+02'00') /ModDate (D:2024)
   /Producer 6 0 R /Custom /SomeName >>
endobj
6 0 obj (Ghostscript 10) endobj
7 0 obj << /Type /Metadata /Subtype /XML /Length ${XMP.length} >>
stream
${XMP}
endstream
endobj
trailer << /Root 1 0 R /Info 5 0 R >>
%%EOF`;

describe('decodePdfString', () => {
	it('decodes UTF-16 and PDFDocEncoding strings', () => {
		expect(decodePdfString('\xfe\xff\x00J\x00o\x00s\x00\xe9')).toBe('José');
		expect(decodePdfString('\xff\xfeJ\x00o\x00')).toBe('Jo');
		expect(decodePdfString('caf\xe9')).toBe('café');
	});
});

describe('formatPdfDate', () => {
	it('formats full, partial and UTC dates', () => {
		expect(formatPdfDate("D:20240501123456+02'00'")).toBe('2024-05-01 12:34:56 +02:00');
		expect(formatPdfDate("D:20240501123456-05'30")).toBe('2024-05-01 12:34:56 -05:30');
		expect(formatPdfDate('D:20240501123456Z')).toBe('2024-05-01 12:34:56 UTC');
		expect(formatPdfDate('D:2024')).toBe('2024-01-01');
		expect(formatPdfDate('yesterday')).toBe('yesterday');
	});
});

describe('parsePdf', () => {
	it('reads the Info dictionary, XMP, version and pages', () => {
		const pdf = parsePdf(toBytes(SIMPLE_PDF));
		expect(pdf.version).toBe('1.4');
		expect(pdf.pages).toBe(2);
		expect(pdf.encrypted).toBe(false);
		expect(pdf.infoStatus).toBe('ok');
		expect(pdf.info).toEqual({
			Title: 'Report (draft) été',
			Author: 'José',
			CreationDate: '2024-05-01 12:34:56 +02:00',
			ModDate: '2024-01-01',
			Producer: 'Ghostscript 10',
			Custom: 'SomeName'
		});
		expect(pdf.xmp).toMatchObject({
			creator: 'José Doe',
			creatorTool: 'Microsoft Word',
			producer: 'macOS Quartz',
			created: '2024-05-01 12:34:56+02:00'
		});
	});

	it('reads the Info dictionary from a compressed object stream', () => {
		const objects = '<< /Author (Hidden Author) /Producer (pdfTeX-1.40) >>';
		const header = '9 0 ';
		const data = bytesToLatin1(zlibSync(toBytes(header + objects)));
		const file = `%PDF-1.5
${PAGES}8 0 obj << /Type /ObjStm /N 1 /First ${header.length} /Filter /FlateDecode /Length ${data.length} >>
stream
${data}
endstream
endobj
10 0 obj << /Type /XRef /Root 1 0 R /Info 9 0 R /Size 11 >>
stream
endstream
endobj
%%EOF`;
		const pdf = parsePdf(toBytes(file));
		expect(pdf.objectStreams).toBe(true);
		expect(pdf.infoStatus).toBe('ok');
		expect(pdf.info).toEqual({ Author: 'Hidden Author', Producer: 'pdfTeX-1.40' });
	});

	it('is honest when the Info dictionary cannot be read', () => {
		const file = `%PDF-1.5
8 0 obj << /Type /ObjStm /N 1 /First 4 /Filter /LZWDecode /Length 3 >>
stream
abc
endstream
endobj
trailer << /Root 1 0 R /Info 9 0 R >>`;
		const pdf = parsePdf(toBytes(file));
		expect(pdf.infoStatus).toBe('unreadable');
		expect(pdfResult(toBytes(file)).notes.join(' ')).toMatch(/could not be read/);
	});

	it('does not decode strings of encrypted files', () => {
		const file = `%PDF-1.6
5 0 obj << /Title (\x8a\x9b\x01) >> endobj
trailer << /Root 1 0 R /Info 5 0 R /Encrypt 6 0 R >>`;
		const pdf = parsePdf(toBytes(file));
		expect(pdf.encrypted).toBe(true);
		expect(pdf.infoStatus).toBe('encrypted');
		expect(pdf.info).toEqual({});
	});
});

describe('pdfResult', () => {
	it('builds highlights from Info and XMP', () => {
		const { highlights, groups } = pdfResult(toBytes(SIMPLE_PDF));
		const rows = Object.fromEntries(highlights.map((row) => [row.label, row.value]));
		expect(rows).toMatchObject({
			'PDF version': '1.4',
			'Pages (estimate)': '2',
			Author: 'José',
			'Producer (PDF library)': 'Ghostscript 10',
			'Creator (application)': 'Microsoft Word (XMP)'
		});
		expect(groups.map((group) => group.id)).toEqual(['info', 'xmp']);
	});
});
