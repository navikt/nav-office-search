import { JSDOM } from 'jsdom';

export const parseHtml = (html: string) => new JSDOM(html).window.document;

// useId output: Preact's P0-1, React's «r0», :r0: or _r_0_
const generatedId = /P\d+-\d+|«[rR][0-9a-z]*»|:[rR][0-9a-z]*:|_[rR]_[0-9a-z]+_/g;

// Vite's CSS-module names (_appContainer_1i9jd_5) and content-hashed asset files (index-CyRxih4s.js)
const cssModuleClass = /^_([A-Za-z][\w-]*?)_[a-z0-9]{5}_\d+$/;
const assetHash = /-[\w-]{8}\.(js|css)\b/g;

const collapse = (text: string) => text.replace(/\s+/g, ' ').trim();

const voidElements = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'source',
	'wbr',
]);

/**
 * Serializes a document or element so that only differences a user could notice show up: one element or text per
 * line, attributes sorted, comments and blank text dropped, whitespace collapsed. Generated names become stable:
 * CSS-module classes their local name, asset files index-[hash].js, and useId ids id1, id2, … in document order.
 */
export const normalizeHtml = (root: Document | Element) => {
	const ids = new Map<string, string>();
	const stableIds = (value: string) =>
		value.replace(generatedId, (id) => {
			if (!ids.has(id)) {
				ids.set(id, `id${ids.size + 1}`);
			}
			return ids.get(id) as string;
		});

	const attributeValue = (name: string, value: string) => {
		if (name === 'class') {
			return value
				.split(/\s+/)
				.filter(Boolean)
				.map((name) => name.replace(cssModuleClass, '$1'))
				.sort()
				.join(' ');
		}
		if (name === 'style') {
			return value
				.split(';')
				.map((declaration) => declaration.split(':').map(collapse).join(': '))
				.filter((declaration) => declaration !== '')
				.join('; ');
		}
		return stableIds(value).replace(assetHash, '-[hash].$1');
	};

	const lines: string[] = [];

	const visit = (node: Node, depth: number) => {
		const indent = '  '.repeat(depth);
		if (node.nodeType === node.TEXT_NODE) {
			const text = collapse(node.textContent ?? '');
			if (text) {
				lines.push(`${indent}${text}`);
			}
			return;
		}
		if (node.nodeType !== node.ELEMENT_NODE) {
			return;
		}

		const element = node as Element;
		const tag = element.tagName.toLowerCase();
		const attributes = [...element.attributes]
			.sort((a, b) => (a.name < b.name ? -1 : 1))
			.map(({ name, value }) => (value === '' ? name : `${name}="${attributeValue(name, value)}"`));
		const open = `<${[tag, ...attributes].join(' ')}>`;
		const children = [...element.childNodes].filter(
			(child) =>
				child.nodeType === child.ELEMENT_NODE ||
				(child.nodeType === child.TEXT_NODE && collapse(child.textContent ?? '') !== ''),
		);

		if (voidElements.has(tag)) {
			lines.push(`${indent}${open}`);
		} else if (children.length === 0) {
			lines.push(`${indent}${open}</${tag}>`);
		} else if (children.length === 1 && children[0].nodeType === node.TEXT_NODE) {
			lines.push(`${indent}${open}${collapse(children[0].textContent ?? '')}</${tag}>`);
		} else {
			lines.push(`${indent}${open}`);
			children.forEach((child) => visit(child, depth + 1));
			lines.push(`${indent}</${tag}>`);
		}
	};

	visit('documentElement' in root ? root.documentElement : root, 0);
	return lines.join('\n') + '\n';
};
