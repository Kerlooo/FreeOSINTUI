import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { parseOffice } from './office.js';
import { officeResult } from './extract.js';

const CORE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>Q3 plan &amp; budget</dc:title><dc:subject></dc:subject>
<dc:creator>Mario Rossi</dc:creator><cp:keywords/>
<cp:lastModifiedBy>Anna Bianchi</cp:lastModifiedBy><cp:revision>7</cp:revision>
<dcterms:created xsi:type="dcterms:W3CDTF">2024-05-01T10:34:56Z</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">2024-05-02T08:00:00Z</dcterms:modified>
</cp:coreProperties>`;

const APP = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
<Template>Normal.dotm</Template><TotalTime>125</TotalTime><Pages>3</Pages><Words>812</Words>
<Application>Microsoft Office Word</Application><Company>ACME S.p.A.</Company><AppVersion>16.0000</AppVersion>
</Properties>`;

const CUSTOM = `<Properties><property fmtid="{D5CDD505}" pid="2" name="Client"><vt:lpwstr>Globex</vt:lpwstr></property></Properties>`;

const COMMENTS = `<w:comments><w:comment w:id="0" w:author="Luca Verdi" w:date="2024-05-02T00:00:00Z"><w:p/></w:comment><w:comment w:id="1" w:author="Luca Verdi"/></w:comments>`;

function makeDocx() {
	return zipSync({
		'[Content_Types].xml': strToU8('<Types/>'),
		'word/document.xml': strToU8('<w:document/>'),
		'word/comments.xml': strToU8(COMMENTS),
		'docProps/core.xml': strToU8(CORE),
		'docProps/app.xml': strToU8(APP),
		'docProps/custom.xml': strToU8(CUSTOM)
	});
}

describe('parseOffice', () => {
	it('reads core, app and custom properties and comment authors', () => {
		const office = parseOffice(makeDocx());
		expect(office?.kind).toBe('word');
		expect(office?.core).toEqual({
			title: 'Q3 plan & budget',
			creator: 'Mario Rossi',
			lastModifiedBy: 'Anna Bianchi',
			revision: '7',
			created: '2024-05-01 10:34:56 UTC',
			modified: '2024-05-02 08:00:00 UTC'
		});
		expect(office?.app).toMatchObject({
			application: 'Microsoft Office Word',
			company: 'ACME S.p.A.',
			template: 'Normal.dotm',
			totalTime: '125 min (2 h 5 min)',
			pages: '3',
			words: '812'
		});
		expect(office?.custom).toEqual({ Client: 'Globex' });
		expect(office?.commentAuthors).toEqual(['Luca Verdi']);
	});

	it('detects spreadsheets and presentations', () => {
		const xlsx = zipSync({
			'[Content_Types].xml': strToU8('<Types/>'),
			'xl/workbook.xml': strToU8('<w/>')
		});
		expect(parseOffice(xlsx)?.kind).toBe('excel');
		const pptx = zipSync({
			'[Content_Types].xml': strToU8('<Types/>'),
			'ppt/presentation.xml': strToU8('<p/>')
		});
		expect(parseOffice(pptx)?.kind).toBe('powerpoint');
	});

	it('returns null for a plain zip', () => {
		expect(parseOffice(zipSync({ 'readme.txt': strToU8('hi') }))).toBeNull();
		expect(officeResult(zipSync({ 'readme.txt': strToU8('hi') }))).toBeNull();
	});
});

describe('officeResult', () => {
	it('lists the key fields as highlights', () => {
		const result = officeResult(makeDocx());
		const rows = Object.fromEntries(
			(result?.highlights ?? []).map((row) => [row.label, row.value])
		);
		expect(rows).toMatchObject({
			Type: 'Word document',
			'Author (creator)': 'Mario Rossi',
			'Last modified by': 'Anna Bianchi',
			Company: 'ACME S.p.A.',
			'Comment authors': 'Luca Verdi'
		});
		expect(result?.groups.map((group) => group.id)).toEqual(['core', 'app', 'custom']);
	});
});
