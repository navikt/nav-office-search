import { AppLocale } from '../../../../common/localization/types';
import { localeString } from '../../../../common/localization/localeString';

const appOrigin = (process.env.VITE_APP_ORIGIN || '').replace(/\/$/, '');
const appBasePath = (process.env.VITE_APP_BASEPATH || '').replace(/\/$/, '');

const shareImageUrl = 'https://www.nav.no/gfx/social-share-fallback.png';

const localePaths: { [key in AppLocale]: string } = {
    nb: '',
    nn: '/nn',
    en: '/en',
};

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const metaTag = (attr: 'name' | 'property', key: string, content: string) =>
    `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;

export const buildMetaTags = (locale: AppLocale) => {
    const title = localeString('documentTitle', locale) as string;
    const description = localeString('ingressLine1', locale) as string;
    const url = `${appOrigin}${appBasePath}${localePaths[locale]}`;
    const domain = appOrigin.replace(/^https?:\/\/(www\.)?/, '');

    return [
        `<title>${escapeHtml(title)}</title>`,
        metaTag('name', 'description', description),
        metaTag('property', 'og:title', title),
        metaTag('property', 'og:description', description),
        metaTag('property', 'og:site_name', domain),
        metaTag('property', 'og:url', url),
        metaTag('property', 'og:image', shareImageUrl),
        metaTag('property', 'og:image:width', '200'),
        metaTag('property', 'og:image:height', '200'),
        metaTag('name', 'twitter:card', 'summary'),
        metaTag('name', 'twitter:domain', domain),
        metaTag('name', 'twitter:title', title),
        metaTag('name', 'twitter:description', description),
        metaTag('name', 'twitter:image:src', shareImageUrl),
    ].join('\n    ');
};
