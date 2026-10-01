import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { TOOLS } from './tools.js';
import { SITE_URL, absoluteUrl, structuredDataTag } from './site.js';

const read = (file) => readFileSync(new URL(`../../static/${file}`, import.meta.url), 'utf8');

describe('absoluteUrl', () => {
	it('joins the site origin and drops trailing slashes', () => {
		expect(absoluteUrl('/')).toBe(`${SITE_URL}/`);
		expect(absoluteUrl('/hash/')).toBe(`${SITE_URL}/hash`);
	});
});

describe('static SEO files', () => {
	const pages = ['/', ...TOOLS.map((tool) => tool.route)];

	it('sitemap.xml lists exactly the home page and every tool', () => {
		const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
		expect(locs.sort()).toEqual(pages.map(absoluteUrl).sort());
	});

	it('robots.txt points to the sitemap', () => {
		expect(read('robots.txt')).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
	});

	it('llms.txt links every tool', () => {
		const llms = read('llms.txt');
		for (const tool of TOOLS) expect(llms).toContain(`](${absoluteUrl(tool.route)})`);
	});
});

describe('structuredDataTag', () => {
	it('builds valid JSON-LD that cannot close the script tag', () => {
		const tag = structuredDataTag({
			description: 'a </script> b',
			tools: [{ name: 'Hash', route: '/hash' }]
		});
		const json = tag.slice(tag.indexOf('>') + 1, tag.lastIndexOf('</script>'));
		expect(json).not.toContain('</');
		const data = JSON.parse(json);
		expect(data.description).toBe('a </script> b');
		expect(data.hasPart[0].url).toBe(`${SITE_URL}/hash`);
	});
});
