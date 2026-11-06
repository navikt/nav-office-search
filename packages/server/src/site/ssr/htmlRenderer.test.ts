import { expect, test } from 'vitest';
import { processTemplate } from './htmlRenderer';

test('puts the markup right inside its parent, however the template is formatted', () => {
	const template = '<main id="maincontent">\n  <!--ssr-app-html-->\n</main>';

	expect(processTemplate('nb', template, '<div></div>')).toBe('<main id="maincontent"><div></div></main>');
});

test('inserts the markup literally, also what looks like a replacement pattern', () => {
	const markup = "<p>$& $1 $' 100 $</p>";

	expect(processTemplate('nb', '<main><!--ssr-app-html--></main>', markup)).toBe(`<main>${markup}</main>`);
});

test('fills in the language', () => {
	expect(processTemplate('nn', '<html lang="%%LANG%%">', '')).toBe('<html lang="nn">');
});
