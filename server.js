'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const readline = require('node:readline');

const scrypt = promisify(crypto.scrypt);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const STORAGE = path.join(ROOT, 'storage', 'private');
const PORT = Number(process.env.PORT) || 3000;
const SESSION_TTL = 8 * 60 * 60 * 1000;
const BODY_LIMIT = 64 * 1024;
const IMAGE_UPLOAD_LIMIT = 10 * 1024 * 1024;
const STATUS_OPTIONS = [
  'Pending Review', 'Reviewed', 'Quotation Sent', 'Approved', 'In Progress',
  'Awaiting Client Feedback', 'Revision Requested', 'Completed', 'Cancelled'
];

const servicesSeed = [
  ['website-design-development', 'Website Design & Development', 'Digital', 'Purposeful digital experiences, designed to make the next step feel effortless.', 'From considered landing pages to full-featured websites, we bring strategy, design and development into one clear process.', ['Responsive layouts built around your audience', 'Accessible, considered user journeys', 'A flexible foundation for future growth']],
  ['e-commerce-development', 'E-commerce Development', 'Digital', 'A thoughtful storefront that makes browsing, choosing and buying feel natural.', 'We shape online stores around your products and the way your customers prefer to shop, with clear information architecture and a considered checkout.', ['Product-first storefront design', 'Responsive shopping journeys', 'Practical catalog and checkout planning']],
  ['custom-software-solutions', 'Custom Software Solutions', 'Digital', 'Software shaped around the way your business actually works.', 'We help map operational needs into clear, useful software experiences, from early product definition through interface and development planning.', ['Workflow discovery and product definition', 'Interfaces designed for everyday use', 'A solution scoped to your requirements']],
  ['erp-crm-solutions', 'ERP & CRM Solutions', 'Digital', 'Bring customer relationships and business operations into a clearer view.', 'We help businesses plan and implement ERP and CRM experiences that make essential information easier to manage and act on.', ['Process and information mapping', 'Role-based workflow planning', 'Practical implementation support']],
  ['pos-management-systems', 'POS Management Systems', 'Digital', 'Make the point of sale a more connected part of your business.', 'We design POS management experiences for the real pace of retail and service environments, with clarity for teams and customers.', ['Sales workflow planning', 'Clear operational interfaces', 'Requirements shaped around your business']],
  ['graphic-design', 'Graphic Design', 'Creative', 'Distinctive visual communication with a clear point of view.', 'From a single campaign asset to a connected suite of creative, we bring consistency and character to the way your brand shows up.', ['Campaign and brand-led artwork', 'Consistent visual systems', 'Production-ready design files']],
  ['logo-design', 'Logo Design', 'Creative', 'A memorable mark built to represent what makes your brand different.', 'We explore the visual language of your business and develop a logo direction that feels distinctive, considered and useful across real-world applications.', ['Discovery and creative direction', 'Distinctive identity concepts', 'Practical brand asset delivery']],
  ['marketing-materials', 'Marketing Materials', 'Creative', 'Keep every touchpoint working together, from the first impression to the follow-up.', 'We create clear, on-brand marketing materials for print and digital use, with the right hierarchy for the message and audience.', ['Brochures and company profiles', 'Campaign collateral', 'Consistent brand application']],
  ['social-media-design', 'Social Media Design', 'Creative', 'A recognisable social presence, built one considered post at a time.', 'We design social content systems that help your brand stay coherent across channels while giving individual campaigns room to stand out.', ['Channel-ready creative formats', 'Reusable visual direction', 'Campaign and content assets']],
  ['digital-marketing', 'Digital Marketing', 'Growth', 'Connect the right message with the right audience across digital channels.', 'We help shape practical digital marketing activity around your goals, audience and available channels.', ['Audience and channel planning', 'Campaign creative alignment', 'Clear activity and goal definition']],
  ['seo', 'SEO', 'Growth', 'Help the people looking for your work find a clearer path to it.', 'We focus on the foundations of search visibility: useful content, clear page structure and technical considerations that support discoverability.', ['Search-focused content planning', 'On-page structure and metadata', 'Technical SEO fundamentals']],
  ['video-editing', 'Video Editing', 'Production', 'Turn raw footage into a story people want to stay with.', 'We shape footage into focused video content, with considered pacing, graphics and delivery formats for your intended audience.', ['Story-first editing', 'Motion graphics and titles', 'Formats for digital channels']],
  ['photo-editing', 'Photo Editing', 'Production', 'Polished imagery that feels true to the original and ready for its next use.', 'We refine and prepare photography for campaigns, products and brand communications with a consistent, deliberate finish.', ['Colour and tonal refinement', 'Retouching and image cleanup', 'Channel-ready exports']],
  ['printing-services', 'Printing Services', 'Production', 'Bring your brand into the physical world with care at every stage.', 'We help prepare and coordinate print materials so the finished piece feels considered in hand as well as on screen.', ['Print-ready artwork preparation', 'Materials and finish guidance', 'Brand-consistent production']],
  ['branding', 'Branding', 'Creative', 'Build a brand identity people can recognise and remember.', 'We shape a clear visual identity and brand direction, from the logo and visual language to the practical assets that keep every touchpoint consistent.', ['Brand discovery and direction', 'Logo and visual identity', 'Consistent brand applications']],
  ['ui-ux-design', 'UI/UX Design', 'Digital', 'Make digital experiences easier to understand and use.', 'We organise content and interactions around real user needs, bringing clear information architecture and considered interface design to websites and digital products.', ['User journeys and information structure', 'Interface design for mobile and desktop', 'Usability-focused design decisions']],
  ['communications-strategy', 'Communications Strategy', 'Strategy', 'Bring a clear, consistent message to every audience and channel.', 'We help define the communication priorities, audience and channel mix that support your brand and campaign goals.', ['Audience and message planning', 'Channel and content direction', 'A consistent communications approach']],
  ['advertising-campaigns', 'Advertising Campaigns', 'Growth', 'Turn a useful insight into a campaign with a clear point of view.', 'We develop campaign concepts and creative assets for digital and traditional advertising, shaped to the audience, objective and channels involved.', ['Campaign concept and creative direction', 'Digital and traditional campaign assets', 'Channel-ready creative formats']],
];

const homeServiceHeadlines = [
  { service: 'Website Design & Development', title: 'Websites Made Clear', summary: 'Thoughtful, responsive websites help people find what they need and take the next step.' },
  { service: 'E-commerce Development', title: 'Shopping Made Simple', summary: 'Product-first online stores make browsing, choosing and buying feel straightforward.' },
  { service: 'Custom Software Solutions', title: 'Software That Fits', summary: 'Custom software is shaped around your workflows, requirements and the people who use it.' },
  { service: 'ERP & CRM Solutions', title: 'Systems Work Together', summary: 'Connected ERP and CRM workflows bring important customer and business information into clearer view.' },
  { service: 'POS Management Systems', title: 'Sales Flow Smoothly', summary: 'Practical point-of-sale systems support the pace of retail and service teams.' },
  { service: 'Graphic Design', title: 'Design With Purpose', summary: 'Consistent visual design helps your brand communicate clearly across campaigns and channels.' },
  { service: 'Logo Design', title: 'Logos Leave Impressions', summary: 'A distinctive logo gives your brand a recognisable mark across real-world applications.' },
  { service: 'Marketing Materials', title: 'Materials Make Impact', summary: 'On-brand brochures, profiles and campaign collateral keep every touchpoint working together.' },
  { service: 'Social Media Design', title: 'Social Content Connects', summary: 'Considered social creative keeps your brand coherent while giving each campaign room to stand out.' },
  { service: 'Digital Marketing', title: 'Campaigns Reach People', summary: 'Audience and channel planning helps shape practical digital activity around your goals.' },
  { service: 'SEO', title: 'Search Made Visible', summary: 'Useful content, clear page structure and technical foundations support search discoverability.' },
  { service: 'Video Editing', title: 'Videos Tell Stories', summary: 'Thoughtful editing, pacing and graphics turn footage into focused stories for digital channels.' },
  { service: 'Photo Editing', title: 'Photos Feel Polished', summary: 'Careful refinement prepares your photography for products, campaigns and brand communications.' },
  { service: 'Printing Services', title: 'Print Makes Impact', summary: 'Print-ready artwork and considered materials bring your brand into the physical world.' },
  { service: 'Sparks Advertising Agency', title: 'Brands Move Forward', summary: 'Creative, digital and production services come together to help your brand take its next step.' },
];

const siteContentSeed = {
  homeIntroTitle: 'We make the complicated',
  homeIntroAccent: 'feel clear.',
  homeIntroCopy: 'From the first sketch to the final hand-off, good work comes from asking better questions, bringing the right people together and caring about the details.',
  homeServicesKicker: 'What we bring to the table',
  homeServicesTitle: 'One team.',
  homeServicesAccent: 'Many ways forward.',
  homeServicesDescription: 'Creative, digital and production capabilities that meet your brand where it is and help it get where it wants to go.',
  homeWorkKicker: 'Selected work',
  homeWorkTitle: 'Good work',
  homeWorkAccent: 'speaks up.',
  homeWorkDescription: 'Every project starts with a different question. Here are a few answers we have been shaping together.',
  homeStatementKicker: 'A small spark can travel a long way',
  homeStatementTitle: "Let's give your",
  homeStatementAccent: 'next idea',
  homeJournalKicker: 'From the journal',
  homeJournalTitle: 'Notes from',
  homeJournalAccent: 'the studio.',
  aboutTitle: 'Creative excellence.',
  aboutAccent: 'Digital innovation.',
  aboutIntro: 'Founded in 2020 by Muhammad Faizan, Sparks Advertising Agency is a full-service creative and digital solutions agency. For over five years, we have helped businesses around the world turn ideas into successful digital experiences.',
  aboutHeadingTitle: 'Ideas into impact.',
  aboutHeadingAccent: 'Since 2020.',
  aboutCopy: 'Our expertise spans web development, graphic design and software design. From visual identity to digital platforms, we pair creativity with precision to deliver thoughtful, performance-minded work.',
  aboutLocation: 'Based between the UAE and Pakistan, we collaborate with clients wherever a good idea needs to go.',
  aboutValuesTitleOne: 'Listen closely',
  aboutValuesCopyOne: 'Good work starts with understanding the people and purpose behind the brief.',
  aboutValuesTitleTwo: 'Make it matter',
  aboutValuesCopyTwo: 'We look for the clearest, most distinctive way to get the message across.',
  aboutValuesTitleThree: 'Finish with care',
  aboutValuesCopyThree: 'Small details have a way of becoming the whole experience.',
  contactTitle: 'A little spark',
  contactAccent: 'starts somewhere.',
  contactIntro: 'Tell us what you are working on. We will save your enquiry for the team to review.',
  footerLineOne: 'Ideas with a little more voltage.',
  footerLineTwo: 'Built for brands going somewhere.'
};

const siteContentFields = [
  ['homeIntroTitle', 'Home / Intro headline', 1], ['homeIntroAccent', 'Home / Intro accent line', 1], ['homeIntroCopy', 'Home / Intro paragraph', 3],
  ['homeServicesKicker', 'Home / Services eyebrow', 1], ['homeServicesTitle', 'Home / Services headline', 1], ['homeServicesAccent', 'Home / Services accent line', 1], ['homeServicesDescription', 'Home / Services paragraph', 3],
  ['homeWorkKicker', 'Home / Work eyebrow', 1], ['homeWorkTitle', 'Home / Work headline', 1], ['homeWorkAccent', 'Home / Work accent line', 1], ['homeWorkDescription', 'Home / Work paragraph', 3],
  ['homeStatementKicker', 'Home / Closing eyebrow', 1], ['homeStatementTitle', 'Home / Closing headline', 1], ['homeStatementAccent', 'Home / Closing accent line', 1],
  ['homeJournalKicker', 'Home / Journal eyebrow', 1], ['homeJournalTitle', 'Home / Journal headline', 1], ['homeJournalAccent', 'Home / Journal accent line', 1],
  ['aboutTitle', 'About / Main headline', 1], ['aboutAccent', 'About / Accent line', 1], ['aboutIntro', 'About / Intro paragraph', 3], ['aboutHeadingTitle', 'About / Section heading', 1], ['aboutHeadingAccent', 'About / Section heading accent', 1], ['aboutCopy', 'About / Section paragraph', 4], ['aboutLocation', 'About / Location paragraph', 3],
  ['aboutValuesTitleOne', 'About / Value one title', 1], ['aboutValuesCopyOne', 'About / Value one copy', 2], ['aboutValuesTitleTwo', 'About / Value two title', 1], ['aboutValuesCopyTwo', 'About / Value two copy', 2], ['aboutValuesTitleThree', 'About / Value three title', 1], ['aboutValuesCopyThree', 'About / Value three copy', 2],
  ['contactTitle', 'Contact / Main headline', 1], ['contactAccent', 'Contact / Accent line', 1], ['contactIntro', 'Contact / Intro paragraph', 3],
  ['footerLineOne', 'Footer / First line', 1], ['footerLineTwo', 'Footer / Second line', 1]
];

const stores = {
  services: { file: 'services.json', seed: servicesSeed.map(([slug, title, category, summary, description, benefits]) => ({ id: crypto.randomUUID(), slug, title, category, summary, description, benefits, faqs: [{ question: 'How do we get started?', answer: 'Share a little about your goals using the enquiry form and our team can discuss a suitable next step.' }, { question: 'Can the scope be tailored?', answer: 'Yes. Scope and deliverables are discussed around your needs before work begins.' }], active: true })) },
  projects: { file: 'projects.json', seed: [] },
  posts: { file: 'posts.json', seed: [] },
  enquiries: { file: 'enquiries.json', seed: [] },
  users: { file: 'users.json', seed: [] },
  orders: { file: 'orders.json', seed: [] },
  content: { file: 'content.json', seed: siteContentSeed },
  siteEdits: { file: 'site-edits.json', seed: [] },
  settings: { file: 'settings.json', seed: { company: 'Sparks Advertising Agency', email: 'sales@sparksadvert.com', uaePhone: '+971 55 823 1400', pakistanPhone: '+92 306 8222355', website: 'https://www.sparksadvert.com/', brandPrimary: '#f7941d', brandAccent: '#da7410', brandBackground: '#f7f6f2', logoLight: '/assets/logo-light.png', logoDark: '/assets/logo-dark.png' } },
};

const sessions = new Map();
const loginAttempts = new Map();
const writeQueues = new Map();
let setupToken = '';
let heroSceneMarkup = '';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function id() { return crypto.randomUUID(); }
function token(bytes = 32) { return crypto.randomBytes(bytes).toString('base64url'); }

function safeEqual(left, right) {
  const first = Buffer.from(String(left || ''));
  const second = Buffer.from(String(right || ''));
  return first.length === second.length && crypto.timingSafeEqual(first, second);
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => part.trim().split(/=(.*)/s).slice(0, 2)).filter(([key, value]) => key && value !== undefined).map(([key, value]) => [key, decodeURIComponent(value)]));
}

function cookieHeader(value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `sparks_session=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function getSession(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const existing = sessions.get(cookies.sparks_session);
  if (existing && existing.expires > Date.now()) return existing;
  if (existing) sessions.delete(cookies.sparks_session);
  const session = { id: token(), csrf: token(24), role: '', userId: '', expires: Date.now() + SESSION_TTL };
  sessions.set(session.id, session);
  res.setHeader('Set-Cookie', cookieHeader(session.id, Math.floor(SESSION_TTL / 1000)));
  return session;
}

function rotateSession(session, res, role, userId) {
  sessions.delete(session.id);
  const next = { id: token(), csrf: token(24), role, userId, expires: Date.now() + SESSION_TTL };
  sessions.set(next.id, next);
  res.setHeader('Set-Cookie', cookieHeader(next.id, Math.floor(SESSION_TTL / 1000)));
  return next;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
}

function redirect(res, location, status = 303) {
  res.writeHead(status, { Location: location, 'Cache-Control': 'no-store' });
  res.end();
}

function notice(message, kind = 'info') {
  return `<div class="notice notice-${kind}" role="status">${escapeHtml(message)}</div>`;
}

function formCsrf(session) { return `<input type="hidden" name="_csrf" value="${escapeHtml(session.csrf)}">`; }

function validAssetPath(value) {
  return typeof value === 'string' && /^\/assets\/[A-Za-z0-9][A-Za-z0-9._/-]{0,180}$/.test(value) && !value.split('/').includes('..');
}

function shell(title, content, session, options = {}) {
  content = content.replaceAll(`onclick="return confirm('Delete this record?')"`, 'data-confirm="Delete this record?"');
  const settings = options.settings || stores.settings.seed;
  const active = options.active || '';
  const links = [['Services', '/services'], ['Work', '/work'], ['About', '/about'], ['Journal', '/blog'], ['Contact', '/contact']];
  const account = session.role === 'admin'
    ? '<a href="/admin/dashboard">Admin</a>'
    : session.role === 'client' ? '<a href="/client/dashboard">My account</a>' : '<a href="/client/login">Client portal</a>';
  const logoLight = validAssetPath(settings.logoLight) ? settings.logoLight : '/assets/logo-light.png';
  const logoDark = validAssetPath(settings.logoDark) ? settings.logoDark : '/assets/logo-dark.png';
  const themeColor = /^#[0-9a-f]{6}$/i.test(settings.brandPrimary || '') ? settings.brandPrimary : '#f7941d';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="${themeColor}"><meta name="description" content="Sparks Advertising Agency brings brand, digital and production together with a spark of its own."><meta name="csrf-token" content="${session.role === 'admin' ? escapeHtml(session.csrf) : ''}"><title>${escapeHtml(title)} | Sparks Advertising Agency</title><script src="/assets/theme.js"></script><link rel="stylesheet" href="/assets/site.css?v=11"><link rel="stylesheet" href="/brand.css"><script src="/assets/site.js?v=5" defer></script></head><body class="${options.bodyClass || ''}"><header class="site-header"><a class="brand" href="/" aria-label="${escapeHtml(settings.company || 'Sparks Advertising Agency')} home"><img src="${escapeHtml(logoLight)}" data-logo-light="${escapeHtml(logoLight)}" data-logo-dark="${escapeHtml(logoDark)}" alt="${escapeHtml(settings.company || 'Sparks Advertising Agency')}"></a><button class="menu-toggle" aria-label="Open navigation" aria-expanded="false"><span></span><span></span></button><nav class="main-nav" aria-label="Main navigation">${links.map(([label, href]) => `<a class="${active === href ? 'is-active' : ''}" href="${href}">${label}</a>`).join('')}<a href="/contact" class="nav-cta">Start a project <span aria-hidden="true">↗</span></a><a class="account-link" href="${session.role === 'admin' ? '/admin/dashboard' : session.role === 'client' ? '/client/dashboard' : '/client/login'}">${account.replace(/<a[^>]*>|<\/a>/g, '')}</a>${session.role === 'admin' ? '<button class="website-editor-launch" type="button">Edit Website</button>' : ''}<button class="theme-toggle" type="button" aria-label="Toggle color theme" title="Toggle color theme"><span class="theme-icon">◐</span></button></nav></header><main>${content}</main><footer class="site-footer"><div class="footer-top"><a class="footer-brand" href="/"><img src="${escapeHtml(logoDark)}" alt="${escapeHtml(settings.company || 'Sparks Advertising Agency')}"></a><p>Ideas with a little more voltage.<br>Built for brands going somewhere.</p><a class="footer-contact" href="/contact">Have a project in mind? <b>Let's talk ↗</b></a></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${escapeHtml(settings.company || 'Sparks Advertising Agency')}</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div><span>UAE · Pakistan · Everywhere</span></div></footer></body></html>`;
}

function pageTitle(kicker, title, description = '') {
  return `<section class="page-heading"><p class="eyebrow">${escapeHtml(kicker)}</p><h1>${title}</h1>${description ? `<p class="intro">${escapeHtml(description)}</p>` : ''}</section>`;
}

function button(href, label, secondary = false) {
  return `<a class="button ${secondary ? 'button-outline' : ''}" href="${escapeHtml(href)}">${escapeHtml(label)} <span aria-hidden="true">↗</span></a>`;
}

function applySiteCopy(markup, copy) {
  const replacements = [
    ['We make the complicated', copy.homeIntroTitle], ['feel clear.', copy.homeIntroAccent],
    ['From the first sketch to the final hand-off, good work comes from asking better questions, bringing the right people together and caring about the details.', copy.homeIntroCopy],
    ['What we bring to the table', copy.homeServicesKicker], ['One team.', copy.homeServicesTitle], ['Many ways forward.', copy.homeServicesAccent],
    ['Creative, digital and production capabilities that meet your brand where it is and help it get where it wants to go.', copy.homeServicesDescription],
    ['Selected work', copy.homeWorkKicker], ['Good work', copy.homeWorkTitle], ['speaks up.', copy.homeWorkAccent],
    ['Every project starts with a different question. Here are a few answers we have been shaping together.', copy.homeWorkDescription],
    ['A small spark can travel a long way', copy.homeStatementKicker], ["Let's give your", copy.homeStatementTitle], ['next idea', copy.homeStatementAccent],
    ['From the journal', copy.homeJournalKicker], ['Notes from', copy.homeJournalTitle], ['the studio.', copy.homeJournalAccent],
    ['A sharp idea.', copy.aboutTitle], ['A little electricity.', copy.aboutAccent],
    ['Sparks is an advertising agency built around the belief that clear thinking and good creative can make a real difference to how a brand moves.', copy.aboutIntro],
    ['Curiosity first.', copy.aboutHeadingTitle], ['Craft always.', copy.aboutHeadingAccent],
    ['We work across brand, digital and production, bringing the right mix of creative and technical thinking to each brief. Our aim is simple: make useful work that feels unmistakably yours.', copy.aboutCopy],
    ['Based between the UAE and Pakistan, we collaborate with clients wherever a good idea needs to go.', copy.aboutLocation],
    ['Listen closely', copy.aboutValuesTitleOne], ['Good work starts with understanding the people and purpose behind the brief.', copy.aboutValuesCopyOne],
    ['Make it matter', copy.aboutValuesTitleTwo], ['We look for the clearest, most distinctive way to get the message across.', copy.aboutValuesCopyTwo],
    ['Finish with care', copy.aboutValuesTitleThree], ['Small details have a way of becoming the whole experience.', copy.aboutValuesCopyThree],
    ['A little spark', copy.contactTitle], ['starts somewhere.', copy.contactAccent],
    ['Tell us what you are working on. We will save your enquiry for the team to review.', copy.contactIntro],
    ['Ideas with a little more voltage.', copy.footerLineOne], ['Built for brands going somewhere.', copy.footerLineTwo]
  ];
  for (const [source, value] of replacements) markup = markup.replaceAll(source, escapeHtml(value));
  return markup;
}

function serviceCard(service, index = 0) {
  return `<a class="service-row reveal" style="--i:${index}" href="/services/${encodeURIComponent(service.slug)}"><span class="service-number">${String(index + 1).padStart(2, '0')}</span><span class="service-copy"><small>${escapeHtml(service.category || 'Sparks')}</small><strong>${escapeHtml(service.title)}</strong><span>${escapeHtml(service.summary || '')}</span></span><span class="row-arrow" aria-hidden="true">↗</span></a>`;
}

function projectCard(project, index = 0) {
  const color = /^#[0-9a-f]{6}$/i.test(project.color || '') ? project.color : '#f7941d';
  const image = validAssetPath(project.image) ? `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} project artwork" loading="lazy">` : '';
  return `<a class="project-card reveal" style="--project-color:${color};--i:${index}" href="/work/${encodeURIComponent(project.slug)}"><div class="project-art${image ? ' has-image' : ''}${project.imageFit === 'contain' ? ' image-contain' : ''}">${image}${image ? '' : '<span class="art-spark" aria-hidden="true">✳</span><span class="art-name">' + escapeHtml(project.title) + '</span><span class="art-label">' + escapeHtml(project.category || 'Selected work') + '</span>'}</div><div class="project-meta"><span>${escapeHtml(project.title)}</span><span>${escapeHtml(project.category || 'Project')} <b>↗</b></span></div></a>`;
}

function imageUploadControl(field, label, value = '', multiple = false) {
  const preview = validAssetPath(value) ? `<img src="${escapeHtml(value)}" alt="" loading="lazy">` : '';
  return `<div class="full image-upload" data-upload-for="${field}"><label>${escapeHtml(label)}<input type="file" accept="image/png,image/jpeg,image/webp" data-image-upload ${multiple ? 'multiple' : ''}></label><small data-upload-status>PNG, JPEG or WebP · up to 10 MB per image</small><div class="upload-previews">${preview}</div></div>`;
}

function postCard(post) {
  const image = validAssetPath(post.image) ? `<img class="journal-thumb" src="${escapeHtml(post.image)}" alt="" loading="lazy">` : '';
  return `<a class="journal-row${image ? ' has-image' : ''}" href="/blog/${encodeURIComponent(post.slug)}">${image}<span class="journal-date">${escapeHtml(post.date || 'Sparks Journal')}</span><strong>${escapeHtml(post.title)}</strong><span class="row-arrow" aria-hidden="true">↗</span></a>`;
}

async function ensureDirectories() {
  await fs.promises.mkdir(DATA, { recursive: true });
  await fs.promises.mkdir(STORAGE, { recursive: true });
  await fs.promises.mkdir(PUBLIC, { recursive: true });
  for (const [key, config] of Object.entries(stores)) {
    const file = path.join(DATA, config.file);
    try { await fs.promises.access(file); }
    catch { await fs.promises.writeFile(file, JSON.stringify(config.seed, null, 2) + '\n', { flag: 'wx' }).catch(() => {}); }
    stores[key].filePath = file;
  }
}

async function readStore(name) {
  const config = stores[name];
  if (!config) throw new Error('Unknown data store');
  try {
    const parsed = JSON.parse(await fs.promises.readFile(config.filePath, 'utf8'));
    if (name === 'settings' || name === 'content') return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : { ...config.seed };
    return Array.isArray(parsed) ? parsed : [...config.seed];
  } catch (error) {
    if (error.code !== 'ENOENT' && error instanceof SyntaxError) {
      const backup = `${config.filePath}.invalid-${Date.now()}`;
      await fs.promises.rename(config.filePath, backup).catch(() => {});
      console.error(`Invalid JSON in ${config.file}; moved aside to ${path.basename(backup)}`);
    } else if (error.code !== 'ENOENT') console.error(`Could not read ${config.file}: ${error.message}`);
    return name === 'settings' || name === 'content' ? { ...config.seed } : [...config.seed];
  }
}

async function writeStore(name, value) {
  const config = stores[name];
  if (!config) throw new Error('Unknown data store');
  const prior = writeQueues.get(name) || Promise.resolve();
  const write = prior.catch(() => {}).then(async () => {
    const lockPath = `${config.filePath}.lock`;
    let lock;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try { lock = await fs.promises.open(lockPath, 'wx', 0o600); break; }
      catch (error) {
        if (error.code !== 'EEXIST') throw error;
        await new Promise((resolve) => setTimeout(resolve, 50 + attempt * 10));
      }
    }
    if (!lock) throw new Error(`Timed out acquiring ${name} data lock`);
    const temporary = `${config.filePath}.${process.pid}.${token(8)}.tmp`;
    try {
      await fs.promises.writeFile(temporary, JSON.stringify(value, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
      await fs.promises.rename(temporary, config.filePath);
    } finally {
      await fs.promises.unlink(temporary).catch(() => {});
      await lock.close().catch(() => {});
      await fs.promises.unlink(lockPath).catch(() => {});
    }
  });
  writeQueues.set(name, write);
  return write;
}

async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > BODY_LIMIT) throw Object.assign(new Error('Request body is too large'), { status: 413 });
    chunks.push(chunk);
  }
  if (!String(req.headers['content-type'] || '').includes('application/x-www-form-urlencoded')) {
    throw Object.assign(new Error('Unsupported form encoding'), { status: 415 });
  }
  return Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString('utf8')));
}

async function saveUploadedImage(req) {
  const contentType = String(req.headers['content-type'] || '');
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.slice(1).find(Boolean);
  if (!contentType.toLowerCase().startsWith('multipart/form-data') || !boundary || boundary.length > 200) {
    throw Object.assign(new Error('Choose an image file to upload.'), { status: 415 });
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > IMAGE_UPLOAD_LIMIT + 64 * 1024) throw Object.assign(new Error('Images must be 10 MB or smaller.'), { status: 413 });
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks);
  const headerStart = body.indexOf(Buffer.from('Content-Disposition: form-data;'));
  const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), headerStart);
  const header = headerStart >= 0 && headerEnd >= 0 ? body.subarray(headerStart, headerEnd).toString('utf8') : '';
  if (!/name="image"/i.test(header) || !/filename="[^"]+"/i.test(header)) {
    throw Object.assign(new Error('Choose an image file to upload.'), { status: 400 });
  }
  const imageStart = headerEnd + 4;
  const imageEnd = body.indexOf(Buffer.from(`\r\n--${boundary}`), imageStart);
  if (imageEnd < imageStart) throw Object.assign(new Error('The uploaded image could not be read.'), { status: 400 });
  const image = body.subarray(imageStart, imageEnd);
  if (!image.length || image.length > IMAGE_UPLOAD_LIMIT) throw Object.assign(new Error('Images must be between 1 byte and 10 MB.'), { status: 413 });

  let extension;
  let mime;
  if (image.length >= 8 && image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) { extension = 'png'; mime = 'image/png'; }
  else if (image.length >= 3 && image[0] === 255 && image[1] === 216 && image[2] === 255) { extension = 'jpg'; mime = 'image/jpeg'; }
  else if (image.length >= 12 && image.toString('ascii', 0, 4) === 'RIFF' && image.toString('ascii', 8, 12) === 'WEBP') { extension = 'webp'; mime = 'image/webp'; }
  else throw Object.assign(new Error('Use a valid PNG, JPEG or WebP image.'), { status: 415 });

  const directory = path.join(PUBLIC, 'assets', 'uploads');
  await fs.promises.mkdir(directory, { recursive: true });
  const filename = `${id()}.${extension}`;
  await fs.promises.writeFile(path.join(directory, filename), image, { flag: 'wx', mode: 0o644 });
  return { path: `/assets/uploads/${filename}`, mime, size: image.length };
}

function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '')) && String(value).length <= 254; }
function validText(value, max = 2000) { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }

function validEditorPage(value) {
  return typeof value === 'string' && value.length <= 180 && /^\/(?:|about|services(?:\/[a-zA-Z0-9_-]+)?|work(?:\/[a-zA-Z0-9_-]+)?|blog(?:\/[a-zA-Z0-9_-]+)?|contact|privacy|terms)\/?$/.test(value);
}

function validEditorSelector(value) {
  return typeof value === 'string' && value.length <= 600 && /^(?:main|header|footer)(?: > [a-z][a-z0-9-]*:nth-of-type\([1-9]\d{0,3}\))+$/i.test(value);
}

function sanitizeEditorMarkup(value) {
  return value
    .replace(/<(script|style|iframe|object|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|svg|math)\b[^>]*\/?>/gi, '')
    .replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (tag, name) => {
      const safeTag = name.toLowerCase();
      if (!['br', 'em', 'strong', 'b', 'i', 'span'].includes(safeTag)) return '';
      return tag.startsWith('</') ? `</${safeTag}>` : `<${safeTag}>`;
    });
}

function normalizeSiteEditorEdit(edit) {
  if (!edit || typeof edit !== 'object' || !validEditorSelector(edit.selector)) return null;
  const result = { selector: edit.selector };
  if (typeof edit.html === 'string') {
    if (edit.html.length > 3000) return null;
    result.html = sanitizeEditorMarkup(edit.html);
  }
  if (typeof edit.image === 'string') {
    if (!validAssetPath(edit.image)) return null;
    result.image = edit.image;
  }
  const styleOptions = {
    color: ['default', 'orange', 'light', 'dark'],
    background: ['default', 'paper', 'charcoal', 'orange'],
    size: ['default', 'small', 'medium', 'large', 'xlarge'],
    spacing: ['default', 'compact', 'normal', 'spacious'],
    align: ['default', 'left', 'center', 'right'],
    width: ['default', 'narrow', 'wide', 'full'],
    font: ['default', 'body', 'serif', 'display'],
    corners: ['default', 'square', 'soft', 'round']
  };
  if (edit.styles !== undefined) {
    if (!edit.styles || typeof edit.styles !== 'object' || Array.isArray(edit.styles)) return null;
    result.styles = {};
    for (const [key, value] of Object.entries(edit.styles)) {
      if (!styleOptions[key] || !styleOptions[key].includes(value)) return null;
      result.styles[key] = value;
    }
  }
  if (edit.order !== undefined) {
    if (!Number.isInteger(edit.order) || edit.order < 0 || edit.order > 100) return null;
    result.order = edit.order;
  }
  return result;
}

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = await scrypt(password, salt, 64);
  return { salt, passwordHash: derived.toString('hex') };
}

async function verifyPassword(password, user) {
  const derived = await scrypt(password, user.salt, 64);
  const storedHash = user.passwordHash || user.hash;
  return Boolean(storedHash) && safeEqual(derived.toString('hex'), storedHash);
}

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Run this reset command directly in a terminal that supports hidden password input.');
  }
  readline.emitKeypressEvents(process.stdin);
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error) => {
      process.stdin.off('keypress', onKeypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onKeypress = (character, key = {}) => {
      if ((key.ctrl && key.name === 'c') || character === '\u0003') return finish(new Error('Password reset cancelled.'));
      if (key.name === 'return' || key.name === 'enter' || character === '\r' || character === '\n') return finish();
      if (key.name === 'backspace') { value = value.slice(0, -1); return; }
      if (character && !key.ctrl && !key.meta && character >= ' ') value += character;
    };
    process.stdin.on('keypress', onKeypress);
  });
}

async function resetAdminPassword(email = '') {
  await ensureDirectories();
  const users = await readStore('users');
  const admins = users.filter((user) => user.role === 'admin');
  if (!admins.length) throw new Error('No administrator exists. Start the website and use its one-time setup page first.');
  if (admins.length > 1 && !email) throw new Error('More than one administrator exists. Specify an admin email: node server.js --reset-admin-password admin@example.com');
  const admin = email ? admins.find((user) => user.email === email.toLowerCase()) : admins[0];
  if (!admin) throw new Error('Administrator email not found.');
  console.log(`Resetting password for ${admin.email}.`);
  const password = await readHidden('New password (14+ characters, letters and numbers): ');
  const confirmation = await readHidden('Confirm new password: ');
  if (!safeEqual(password, confirmation)) throw new Error('Passwords do not match. No changes were saved.');
  if (!/^(?=.*[A-Za-z])(?=.*\d).{14,128}$/.test(password)) throw new Error('Password must be 14-128 characters and include at least one letter and one number. No changes were saved.');
  const credentials = await hashPassword(password);
  admin.salt = credentials.salt;
  admin.passwordHash = credentials.passwordHash;
  delete admin.hash;
  await writeStore('users', users);
  console.log('Password updated. Sign in with the email shown above.');
}

function rateLimited(key) {
  const now = Date.now();
  const entry = loginAttempts.get(key) || { count: 0, reset: now + 15 * 60 * 1000 };
  if (entry.reset < now) { entry.count = 0; entry.reset = now + 15 * 60 * 1000; }
  entry.count += 1;
  loginAttempts.set(key, entry);
  return entry.count > 8;
}

function requireRole(session, role, res) {
  if (session.role === role) return true;
  redirect(res, role === 'admin' ? '/admin/login' : '/client/login');
  return false;
}

function serviceEnquiryForm(session, service = '', serviceOptions = stores.services.seed) {
  const activeServices = serviceOptions.filter((item) => item.active !== false);
  return `<form class="form-grid" method="post" action="/client/orders">${formCsrf(session)}<label>Project title<input name="title" maxlength="120" required></label><label>Service<select name="service" required><option value="">Choose a service</option>${activeServices.map((item) => `<option ${item.slug === service ? 'selected' : ''} value="${escapeHtml(item.slug)}">${escapeHtml(item.title)}</option>`).join('')}</select></label><label class="full">Project description<textarea name="description" rows="5" maxlength="5000" required></textarea></label><label>Budget (optional)<input name="budget" maxlength="100"></label><label>Preferred deadline<input name="deadline" type="date"></label><label class="full">Additional requirements<textarea name="requirements" rows="3" maxlength="3000"></textarea></label><button class="button" type="submit">Send project request <span>↗</span></button></form>`;
}

function input(name, label, value = '', type = 'text', required = false, extra = '') {
  return `<label>${escapeHtml(label)}<input name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}" ${required ? 'required' : ''} ${extra}></label>`;
}

function adminNav(current) {
  const entries = [['dashboard', 'Overview', '/admin/dashboard'], ['site-editor', 'Edit Website', '/admin/site-editor?path=/'], ['content', 'Website content', '/admin/content'], ['services', 'Services', '/admin/services'], ['projects', 'Portfolio', '/admin/projects'], ['posts', 'Journal', '/admin/posts'], ['enquiries', 'Enquiries', '/admin/enquiries'], ['orders', 'Orders', '/admin/orders'], ['clients', 'Clients', '/admin/clients'], ['settings', 'Settings', '/admin/settings']];
  return `<aside class="dashboard-nav"><div class="dashboard-label">Workspace</div>${entries.map(([key, label, href]) => `<a class="${key === current ? 'selected' : ''}" href="${href}">${escapeHtml(label)}</a>`).join('')}<a href="/" class="return-link">← View website</a></aside>`;
}

function adminLayout(title, body, session, current, settings) {
  return shell(title, `<section class="dashboard-wrap"><div class="dashboard-head"><div><p class="eyebrow">Sparks / Studio</p><h1>${escapeHtml(title)}</h1></div><form method="post" action="/logout">${formCsrf(session)}<button class="text-button">Log out ↗</button></form></div><div class="dashboard-layout">${adminNav(current)}<div class="dashboard-content">${body}</div></div></section>`, session, { bodyClass: 'dashboard-page', settings });
}

function clientNav(current, session) {
  return `<aside class="dashboard-nav"><div class="dashboard-label">Client space</div><a class="${current === 'overview' ? 'selected' : ''}" href="/client/dashboard">My projects</a><a class="${current === 'new' ? 'selected' : ''}" href="/client/new-request">New request</a><a class="${current === 'profile' ? 'selected' : ''}" href="/client/profile">Profile</a><form method="post" action="/logout">${formCsrf(session)}<button class="text-button">Log out ↗</button></form></aside>`;
}

function clientLayout(title, body, session, current, settings) {
  return shell(title, `<section class="dashboard-wrap"><div class="dashboard-head"><div><p class="eyebrow">Sparks / Client space</p><h1>${escapeHtml(title)}</h1></div></div><div class="dashboard-layout">${clientNav(current, session)}<div class="dashboard-content">${body}</div></div></section>`, session, { bodyClass: 'dashboard-page', settings });
}

async function staticFile(pathname, res) {
  let decoded;
  try { decoded = decodeURIComponent(pathname.slice('/assets/'.length)); }
  catch { return false; }
  if (!decoded || decoded.includes('\0')) return false;
  const assetRoot = path.join(PUBLIC, 'assets');
  const file = path.resolve(assetRoot, decoded);
  if (!file.startsWith(`${assetRoot}${path.sep}`)) return false;
  try {
    const stat = await fs.promises.stat(file);
    if (!stat.isFile()) return false;
    const types = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon' };
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=3600' });
    fs.createReadStream(file).pipe(res);
    return true;
  } catch { return false; }
}

async function handle(req, res) {
  const session = getSession(req, res);
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURI(url.pathname);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");

  if (pathname === '/health' && req.method === 'GET') return send(res, 200, JSON.stringify({ status: 'ok' }), { 'Content-Type': 'application/json; charset=utf-8' });
  if (pathname === '/brand.css' && req.method === 'GET') {
    const settings = await readStore('settings');
    const primary = /^#[0-9a-f]{6}$/i.test(settings.brandPrimary || '') ? settings.brandPrimary : '#f7941d';
    const accent = /^#[0-9a-f]{6}$/i.test(settings.brandAccent || '') ? settings.brandAccent : '#da7410';
    const background = /^#[0-9a-f]{6}$/i.test(settings.brandBackground || '') ? settings.brandBackground : '#f7f6f2';
    return send(res, 200, `:root{--orange:${primary};--orange-deep:${accent};--paper:${background}}`, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-cache' });
  }
  if (pathname === '/admin/uploads' && req.method === 'POST') {
    if (!requireRole(session, 'admin', res)) return;
    const users = await readStore('users');
    if (!users.some((user) => user.id === session.userId && user.role === 'admin')) {
      sessions.delete(session.id);
      return sendJson(res, 401, { error: 'Please sign in again to upload images.' });
    }
    if (!safeEqual(req.headers['x-csrf-token'], session.csrf)) return sendJson(res, 403, { error: 'Your session expired. Refresh the page and try again.' });
    try {
      const uploaded = await saveUploadedImage(req);
      return sendJson(res, 201, uploaded);
    } catch (error) {
      if (!error.status) console.error('Image upload failed:', error);
      return sendJson(res, error.status || 500, { error: error.status ? error.message : 'The image could not be saved.' });
    }
  }
  if (pathname === '/site-edits' && req.method === 'GET') {
    const page = url.searchParams.get('path') || '/';
    if (!validEditorPage(page)) return sendJson(res, 400, { error: 'Invalid page path.' });
    const edits = await readStore('siteEdits');
    const safeEdits = edits.filter((edit) => edit.page === page).map((edit) => normalizeSiteEditorEdit(edit.edit)).filter(Boolean);
    return sendJson(res, 200, safeEdits);
  }
  if (pathname.startsWith('/assets/') && req.method === 'GET') {
    if (await staticFile(pathname, res)) return;
    return send(res, 404, 'Not found');
  }
  if (pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }

  const settings = await readStore('settings');
  settings.siteContent = { ...siteContentSeed, ...(await readStore('content')) };
  const render = (title, content, active = '') => {
    const markup = applySiteCopy(shell(title, content, session, { active, settings }), settings.siteContent)
      .replace('/assets/site.css?v=11', '/assets/site.css?v=14')
      .replace('/assets/site.js?v=5', '/assets/site.js?v=6');
    return send(res, 200, markup);
  };

  if (req.method === 'POST') {
    let form;
    try { form = await readBody(req); }
    catch (error) { return send(res, error.status || 400, shell('Request error', `<section class="content-shell">${notice(error.message, 'error')}</section>`, session, { settings })); }
    if (!safeEqual(form._csrf, session.csrf)) return send(res, 403, shell('Request expired', `<section class="content-shell">${notice('This form expired. Please go back and try again.', 'error')}</section>`, session, { settings }));

    if (pathname === '/contact') {
      if (!validText(form.name, 120) || !validEmail(form.email) || !validText(form.message, 5000)) return render('Contact', `${pageTitle('Get in touch', 'A little spark<br><em>starts somewhere.</em>', 'Tell us what you are working on. We will save your enquiry for the team to review.')}${notice('Please check your name, email and message.', 'error')}${contactSection(session, settings)}`, '/contact');
      const entries = await readStore('enquiries');
      entries.unshift({ id: id(), name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: String(form.phone || '').slice(0, 40), subject: String(form.subject || '').slice(0, 160), message: form.message.trim(), createdAt: new Date().toISOString(), status: 'New' });
      await writeStore('enquiries', entries);
      return render('Contact', `${pageTitle('Get in touch', 'A little spark<br>starts somewhere.')}${notice('Your enquiry has been saved. This form does not send email; the team can review it in the admin panel.', 'success')}${contactSection(session, settings)}`, '/contact');
    }

    if (pathname === '/client/register') {
      if (rateLimited(`register:${req.socket.remoteAddress}`)) return send(res, 429, shell('Please wait', `<section class="content-shell">${notice('Too many attempts. Try again in a little while.', 'error')}</section>`, session, { settings }));
      if (!validText(form.name, 120) || !validEmail(form.email) || !/^(?=.*[A-Za-z])(?=.*\d).{10,128}$/.test(form.password || '')) return render('Create your account', `${authHeading('Client portal', 'Create your account')}${notice('Enter a valid name and email. Passwords must be at least 10 characters and include a letter and a number.', 'error')}${registerForm(session)}`);
      const users = await readStore('users');
      if (users.some((user) => user.email === form.email.trim().toLowerCase())) return render('Create your account', `${authHeading('Client portal', 'Create your account')}${notice('An account already uses that email address.', 'error')}${registerForm(session)}`);
      const credentials = await hashPassword(form.password);
      const user = { id: id(), name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: String(form.phone || '').slice(0, 40), role: 'client', ...credentials, createdAt: new Date().toISOString() };
      users.push(user);
      await writeStore('users', users);
      rotateSession(session, res, 'client', user.id);
      return redirect(res, '/client/dashboard');
    }

    if (pathname === '/client/login' || pathname === '/admin/login') {
      const role = pathname.startsWith('/admin') ? 'admin' : 'client';
      if (rateLimited(`${role}:${req.socket.remoteAddress}`)) return send(res, 429, shell('Please wait', `<section class="content-shell">${notice('Too many sign-in attempts. Try again later.', 'error')}</section>`, session, { settings }));
      const users = await readStore('users');
      const user = users.find((item) => item.email === String(form.email || '').trim().toLowerCase() && item.role === role);
      if (!user || !(await verifyPassword(form.password || '', user))) return render(role === 'admin' ? 'Admin sign in' : 'Client sign in', `${authHeading(role === 'admin' ? 'Studio access' : 'Client portal', role === 'admin' ? 'Welcome back.' : 'Good to see you.')}${notice('The email or password was not recognised.', 'error')}${loginForm(session, role)}`);
      rotateSession(session, res, role, user.id);
      return redirect(res, role === 'admin' ? '/admin/dashboard' : '/client/dashboard');
    }

    if (pathname === '/admin/setup') {
      const users = await readStore('users');
      if (users.some((user) => user.role === 'admin')) return send(res, 410, shell('Setup closed', `<section class="content-shell">${notice('Administrator setup is already complete.', 'info')}</section>`, session, { settings }));
      if (!setupToken || !safeEqual(form.setupToken, setupToken)) return send(res, 403, shell('Setup unavailable', `<section class="content-shell">${notice('The setup token is missing or invalid. Check the server startup log.', 'error')}</section>`, session, { settings }));
      if (!validText(form.name, 120) || !validEmail(form.email) || !/^(?=.*[A-Za-z])(?=.*\d).{14,128}$/.test(form.password || '')) return render('Create administrator', `${authHeading('One-time setup', 'Create the first administrator')}${notice('Use a valid email and a password of at least 14 characters containing a letter and a number.', 'error')}${setupForm(session, form.setupToken)}`);
      const credentials = await hashPassword(form.password);
      const admin = { id: id(), name: form.name.trim(), email: form.email.trim().toLowerCase(), role: 'admin', ...credentials, createdAt: new Date().toISOString() };
      users.push(admin);
      await writeStore('users', users);
      setupToken = '';
      rotateSession(session, res, 'admin', admin.id);
      return redirect(res, '/admin/dashboard');
    }

    if (pathname === '/logout') {
      sessions.delete(session.id);
      res.setHeader('Set-Cookie', cookieHeader('', 0));
      return redirect(res, '/');
    }

    if (pathname === '/client/orders') {
      if (!requireRole(session, 'client', res)) return;
      const users = await readStore('users');
      const user = users.find((item) => item.id === session.userId);
      const services = await readStore('services');
      const selectedService = services.find((item) => item.slug === form.service && item.active !== false);
      if (!validText(form.title, 120) || !validText(form.description, 5000) || !selectedService) return render('New project request', `${pageTitle('Client space', 'Tell us about it')}${notice('Add a title, select an active service and describe your project.', 'error')}${serviceEnquiryForm(session, '', services)}`);
      const orders = await readStore('orders');
      const order = { id: id(), clientId: user.id, clientName: user.name, email: user.email, phone: user.phone || '', service: form.service, serviceName: selectedService.title, title: form.title.trim(), description: form.description.trim(), budget: String(form.budget || '').slice(0, 100), deadline: String(form.deadline || '').slice(0, 30), requirements: String(form.requirements || '').slice(0, 3000), status: STATUS_OPTIONS[0], messages: [], statusHistory: [{ status: STATUS_OPTIONS[0], note: 'Request received.', at: new Date().toISOString(), by: 'Sparks' }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      orders.unshift(order);
      await writeStore('orders', orders);
      return redirect(res, `/client/orders/${order.id}`);
    }

    if (pathname === '/client/profile') {
      if (!requireRole(session, 'client', res)) return;
      const users = await readStore('users');
      const user = users.find((item) => item.id === session.userId && item.role === 'client');
      if (!user || !validText(form.name, 120) || !validEmail(form.email)) return send(res, 400, shell('Profile error', `<section class="content-shell">${notice('Enter a valid name and email address.', 'error')}</section>`, session, { settings }));
      const email = form.email.trim().toLowerCase();
      if (users.some((item) => item.role === 'client' && item.id !== user.id && item.email === email)) return send(res, 409, shell('Profile error', `<section class="content-shell">${notice('Another account already uses that email address.', 'error')}</section>`, session, { settings }));
      user.name = form.name.trim();
      user.email = email;
      user.phone = String(form.phone || '').trim().slice(0, 40);
      await writeStore('users', users);
      const orders = await readStore('orders');
      for (const order of orders) if (order.clientId === user.id) { order.clientName = user.name; order.email = user.email; order.phone = user.phone; }
      await writeStore('orders', orders);
      return redirect(res, '/client/profile?saved=1');
    }

    if (pathname === '/client/orders/message') {
      if (!requireRole(session, 'client', res)) return;
      const orders = await readStore('orders');
      const order = orders.find((item) => item.id === form.id && item.clientId === session.userId);
      if (!order || !validText(form.message, 2000)) return send(res, 400, shell('Message error', `<section class="content-shell">${notice('Write a message of up to 2,000 characters.', 'error')}</section>`, session, { settings }));
      const message = { author: 'Client', text: form.message.trim(), at: new Date().toISOString() };
      order.messages = [...(Array.isArray(order.messages) ? order.messages : []), message];
      order.updatedAt = message.at;
      await writeStore('orders', orders);
      return redirect(res, `/client/orders/${order.id}`);
    }

    if (pathname.startsWith('/admin/')) {
      if (!requireRole(session, 'admin', res)) return;
      const userStore = await readStore('users');
      const admin = userStore.find((user) => user.id === session.userId && user.role === 'admin');
      if (!admin) { sessions.delete(session.id); return redirect(res, '/admin/login'); }
    }

    if (pathname === '/admin/site-editor/save') {
      if (!validEditorPage(form.path)) return sendJson(res, 400, { error: 'Choose a valid website page before saving.' });
      let submitted;
      try { submitted = JSON.parse(form.edits || ''); }
      catch { return sendJson(res, 400, { error: 'The editor changes could not be read. Please try saving again.' }); }
      if (!Array.isArray(submitted) || submitted.length > 300) return sendJson(res, 400, { error: 'There are too many edits on this page to save.' });
      const edits = submitted.map(normalizeSiteEditorEdit);
      if (edits.some((edit) => !edit) || new Set(edits.map((edit) => edit.selector)).size !== edits.length) {
        return sendJson(res, 400, { error: 'An edit is invalid. Review the selected content and try again.' });
      }
      const saved = await readStore('siteEdits');
      const otherPages = saved.filter((item) => item.page !== form.path);
      if (otherPages.length + edits.length > 2000) return sendJson(res, 413, { error: 'The website editor has reached its saved-change limit.' });
      await writeStore('siteEdits', [...otherPages, ...edits.map((edit) => ({ page: form.path, edit }))]);
      return sendJson(res, 200, { saved: edits.length });
    }

    if (pathname === '/admin/content') {
      const next = {};
      for (const [key, label, rows] of siteContentFields) {
        const value = String(form[key] || '').trim();
        const maximum = rows === 1 ? 180 : 500;
        if (!validText(value, maximum)) return send(res, 400, adminLayout('Website content', `${notice(`${label} is required and must be at most ${maximum} characters.`, 'error')}${siteContentForm(session, { ...siteContentSeed, ...next, [key]: value })}`, session, 'content', settings));
        next[key] = value;
      }
      await writeStore('content', next);
      return redirect(res, '/admin/content?saved=1');
    }

    if (pathname === '/admin/orders/update') {
      const orders = await readStore('orders');
      const order = orders.find((item) => item.id === form.id);
      if (!order || !STATUS_OPTIONS.includes(form.status)) return send(res, 400, shell('Invalid update', `<section class="content-shell">${notice('That order or status is not valid.', 'error')}</section>`, session, { settings }));
      const note = String(form.note || '').trim().slice(0, 2000);
      order.status = form.status;
      order.updatedAt = new Date().toISOString();
      order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      order.statusHistory.unshift({ status: form.status, note, at: order.updatedAt, by: 'Sparks' });
      if (note) order.messages = [...(Array.isArray(order.messages) ? order.messages : []), { author: 'Sparks', text: note, at: order.updatedAt }];
      await writeStore('orders', orders);
      return redirect(res, '/admin/orders');
    }

    if (pathname === '/admin/clients/update') {
      const users = await readStore('users');
      const client = users.find((user) => user.id === form.id && user.role === 'client');
      if (!client || !validText(form.name, 120) || !validEmail(form.email)) return send(res, 400, shell('Invalid client', `<section class="content-shell">${notice('Check the client name and email address.', 'error')}</section>`, session, { settings }));
      const email = form.email.trim().toLowerCase();
      if (users.some((user) => user.role === 'client' && user.id !== client.id && user.email === email)) return send(res, 409, shell('Email already in use', `<section class="content-shell">${notice('Another client account already uses that email address.', 'error')}</section>`, session, { settings }));
      client.name = form.name.trim();
      client.email = email;
      client.phone = String(form.phone || '').trim().slice(0, 40);
      await writeStore('users', users);
      const orders = await readStore('orders');
      for (const order of orders) if (order.clientId === client.id) { order.clientName = client.name; order.email = client.email; order.phone = client.phone; }
      await writeStore('orders', orders);
      return redirect(res, '/admin/clients?saved=1');
    }

    if (pathname === '/admin/enquiries/update') {
      const enquiries = await readStore('enquiries');
      const enquiry = enquiries.find((item) => item.id === form.id);
      if (!enquiry || !['New', 'Reviewed', 'Archived'].includes(form.status)) return send(res, 400, shell('Invalid update', `<section class="content-shell">${notice('That enquiry or status is not valid.', 'error')}</section>`, session, { settings }));
      enquiry.status = form.status;
      await writeStore('enquiries', enquiries);
      return redirect(res, '/admin/enquiries');
    }

    if (pathname === '/admin/settings') {
      const next = {
        company: String(form.company || '').trim().slice(0, 120),
        email: String(form.email || '').trim().slice(0, 254),
        uaePhone: String(form.uaePhone || '').trim().slice(0, 40),
        pakistanPhone: String(form.pakistanPhone || '').trim().slice(0, 40),
        website: String(form.website || '').trim().slice(0, 200),
        brandPrimary: String(form.brandPrimary || ''),
        brandAccent: String(form.brandAccent || ''),
        brandBackground: String(form.brandBackground || ''),
        logoLight: String(form.logoLight || '').trim(),
        logoDark: String(form.logoDark || '').trim()
      };
      let websiteUrl;
      try { websiteUrl = new URL(next.website); } catch {}
      if (!validText(next.company, 120) || !validEmail(next.email) || !websiteUrl || !['https:', 'http:'].includes(websiteUrl.protocol)
        || !/^#[0-9a-f]{6}$/i.test(next.brandPrimary) || !/^#[0-9a-f]{6}$/i.test(next.brandAccent) || !/^#[0-9a-f]{6}$/i.test(next.brandBackground)
        || !validAssetPath(next.logoLight) || !validAssetPath(next.logoDark)) {
        return render('Website settings', `${pageTitle('Studio / Settings', 'Website settings')}${notice('Check the company details, HTTP or HTTPS website URL, brand colours and logo image paths.', 'error')}${settingsForm(session, { ...settings, ...next })}`);
      }
      next.website = websiteUrl.href;
      await writeStore('settings', next);
      return redirect(res, '/admin/settings?saved=1');
    }

    const collectionRoute = pathname.match(/^\/admin\/(services|projects|posts)\/save$/);
    if (collectionRoute) {
      const collection = collectionRoute[1];
      const records = await readStore(collection);
      if (form.deleteId) {
        await writeStore(collection, records.filter((record) => record.id !== form.deleteId));
        return redirect(res, `/admin/${collection}?saved=deleted`);
      }
      if (!validText(form.title, 160)) return render(`Manage ${collection}`, adminCollectionPage(collection, records, session, 'Provide a title for this record.'), `/admin/${collection}`);
      const slug = slugify(form.slug || form.title);
      if (!slug) return render(`Manage ${collection}`, adminCollectionPage(collection, records, session, 'Provide a usable URL slug.'), `/admin/${collection}`);
      const image = String(form.image || '').trim();
      const gallery = String(form.gallery || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      if ((collection === 'projects' || collection === 'posts') && image && !validAssetPath(image)) {
        return render(`Manage ${collection}`, adminCollectionPage(collection, records, session, 'Choose a valid local image path.'), `/admin/${collection}`);
      }
      if (collection === 'projects' && (gallery.some((item) => !validAssetPath(item)) || gallery.length > 12)) {
        return render(`Manage ${collection}`, adminCollectionPage(collection, records, session, 'Use valid local image paths and no more than 12 gallery images.'), `/admin/${collection}`);
      }
      const record = {
        id: form.id || id(), slug, title: form.title.trim(), category: String(form.category || '').trim().slice(0, 100),
        summary: String(form.summary || '').trim().slice(0, 500), description: String(form.description || '').trim().slice(0, 5000),
        body: String(form.body || '').trim().slice(0, 10000), date: String(form.date || new Date().toISOString().slice(0, 10)).slice(0, 30),
        color: /^#[0-9a-f]{6}$/i.test(form.color || '') ? form.color : '#f7941d', active: form.active === 'on', published: form.published === 'on',
        benefits: String(form.benefits || '').split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 12), faqs: [],
        ...(collection === 'projects' ? { image, gallery } : {}),
        ...(collection === 'posts' ? { image } : {}),
        ...(collection === 'projects' ? { imageFit: form.imageFit === 'contain' ? 'contain' : 'cover' } : {}),
        updatedAt: new Date().toISOString()
      };
      const sameSlug = records.find((item) => item.slug === slug && item.id !== record.id);
      if (sameSlug) return render(`Manage ${collection}`, adminCollectionPage(collection, records, session, 'That slug is already in use.'), `/admin/${collection}`);
      const index = records.findIndex((item) => item.id === record.id);
      if (index >= 0) records[index] = { ...records[index], ...record };
      else records.unshift({ ...record, createdAt: new Date().toISOString() });
      await writeStore(collection, records);
      return redirect(res, `/admin/${collection}?saved=1`);
    }
    return send(res, 404, shell('Not found', '<section class="content-shell"><h1>That action is not available.</h1></section>', session, { settings }));
  }

  if (req.method !== 'GET') return send(res, 405, 'Method not allowed', { Allow: 'GET, POST' });

  if (pathname === '/') {
    const [services, projects, posts] = await Promise.all([readStore('services'), readStore('projects'), readStore('posts')]);
    const firstHeadline = homeServiceHeadlines[0];
    const serviceSlides = homeServiceHeadlines.map((headline) => {
      return `<span data-service-slide data-category="${escapeHtml(headline.service)}" data-title="${escapeHtml(headline.title)}" data-summary="${escapeHtml(headline.summary)}"></span>`;
    }).join('');
    const heroCopy = `<div class="hero-service-rotator" data-service-rotator><p class="eyebrow reveal" data-service-category>${escapeHtml(firstHeadline.service)}</p><h1 class="reveal hero-service-title" data-service-title>${escapeHtml(firstHeadline.title)}</h1><p class="hero-description reveal" data-service-summary>${escapeHtml(firstHeadline.summary)}</p><div class="hero-service-data" hidden aria-hidden="true">${serviceSlides}</div></div>`;
    const publishedProjects = projects.filter((item) => item.published);
    const publishedPosts = posts.filter((item) => item.published);
    const content = `<section class="hero"><div id="particles-js" class="hero-particles" aria-hidden="true"></div><div class="hero-topline"><span>Independent creative studio</span><span>Dubai · Pakistan · Beyond</span></div><div class="hero-main"><div class="hero-copy">${heroCopy}<div class="hero-actions reveal">${button('/contact', 'Start a conversation')}${button('/work', 'Explore our work', true)}</div></div><div class="hero-art" aria-label="Sparks brand mark"><div class="hero-art-frame"><img class="hero-logo" src="${escapeHtml(validAssetPath(settings.logoDark) ? settings.logoDark : '/assets/logo-dark.png')}" data-logo-dark="${escapeHtml(validAssetPath(settings.logoDark) ? settings.logoDark : '/assets/logo-dark.png')}" alt="${escapeHtml(settings.company)} logo"><svg class="electric-line" viewBox="0 0 600 320" aria-hidden="true"><path d="M4 248 C104 220 92 156 206 168 S356 238 430 148 S516 72 596 62"/></svg><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span><span class="hero-index">S / 01</span></div></div></div><div class="hero-bottom"><span>Ideas, identity & digital experiences</span><a href="#intro">Scroll to explore <span>↓</span></a><span>Since day one, with intent.</span></div></section><section id="intro" class="intro-band"><p class="eyebrow">The Sparks approach</p><h2>We make the complicated<br><span>feel clear.</span></h2><p>From the first sketch to the final hand-off, good work comes from asking better questions, bringing the right people together and caring about the details.</p><a class="under-link" href="/about">A little about us <span>↗</span></a></section><section class="services-section section-pad"><div class="section-top"><div><p class="eyebrow">What we bring to the table</p><h2>One team.<br><em>Many ways forward.</em></h2></div><p>Creative, digital and production capabilities that meet your brand where it is and help it get where it wants to go.</p></div><div class="service-list">${services.filter((service) => service.active !== false).slice(0, 7).map(serviceCard).join('')}</div><div class="section-link">${button('/services', 'See all services', true)}</div></section><section class="work-section section-pad"><div class="section-top"><div><p class="eyebrow">Selected work</p><h2>Good work<br><em>speaks up.</em></h2></div><p>Every project starts with a different question. Here are a few answers we have been shaping together.</p></div>${publishedProjects.length ? `<div class="project-grid">${publishedProjects.slice(0, 3).map(projectCard).join('')}</div>` : `<div class="work-empty"><span class="empty-mark">S<span>✳</span></span><p>Our next case study could start with you.</p><a href="/contact">Let’s make something worth showing <span>↗</span></a></div>`}${button('/work', 'View the portfolio', true)}</section><section class="statement-band"><span class="statement-mark">✳</span><p class="eyebrow">A small spark can travel a long way</p><h2>Let's give your<br><em>next idea</em> a chance.</h2>${button('/contact', 'Tell us what you are thinking')}</section><section class="journal-section section-pad"><div class="section-top"><div><p class="eyebrow">From the journal</p><h2>Notes from<br><em>the studio.</em></h2></div><a class="under-link" href="/blog">All journal notes <span>↗</span></a></div>${publishedPosts.length ? publishedPosts.slice(0, 3).map(postCard).join('') : '<p class="quiet-note">Studio notes are on their way.</p>'}</section><section class="contact-strip"><div><p class="eyebrow">Have a good one brewing?</p><h2>We are all ears.</h2></div>${button('/contact', 'Get in touch')}</section>`;
    const storyMarkup = `<div class="hero-art-frame">${heroSceneMarkup}<img class="hero-sequence-mark" src="${escapeHtml(validAssetPath(settings.logoDark) ? settings.logoDark : '/assets/logo-dark.png')}" alt="${escapeHtml(settings.company)} logo"></div>`;
    const heroContent = content.replace(/<div class="hero-art-frame">[\s\S]*?<\/div>/, storyMarkup);
    return render('Creative that gets things moving', heroContent);
  }

  if (pathname === '/about') {
    return render('About us', `${pageTitle('About Sparks · Est. 2020', 'A sharp idea.<br><em>A little electricity.</em>', 'Sparks is an advertising agency built around the belief that clear thinking and good creative can make a real difference to how a brand moves.') }<section class="content-split"><div class="split-symbol"><img src="${escapeHtml(validAssetPath(settings.logoDark) ? settings.logoDark : '/assets/logo-dark.png')}" alt="${escapeHtml(settings.company)} logo"></div><div><p class="eyebrow">How we think</p><h2>Curiosity first.<br>Craft always.</h2><p>We work across brand, digital and production, bringing the right mix of creative and technical thinking to each brief. Our aim is simple: make useful work that feels unmistakably yours.</p><p>Based between the UAE and Pakistan, we collaborate with clients wherever a good idea needs to go.</p>${button('/contact', 'Meet us at the start', true)}</div></section><section class="registration-feature"><div class="registration-copy"><p class="eyebrow">Professional registration</p><h2>Registered with<br><em>PSEB.</em></h2><p>Muhammad Faizan is registered as a freelancer with the Pakistan Software Export Board (PSEB).</p><p class="registration-validity">Certificate valid from September 2026 through August 2027.</p><p class="registration-privacy">Personal identification and verification details are hidden for privacy.</p></div><figure class="registration-certificate"><img src="/assets/pseb-freelancer-registration-redacted.png" alt="Redacted Pakistan Software Export Board freelancer registration certificate for Muhammad Faizan, valid September 2026 to August 2027"><figcaption>Pakistan Software Export Board · Freelancer registration</figcaption></figure></section><section class="values-band"><div><span>01</span><h3>Listen closely</h3><p>Good work starts with understanding the people and purpose behind the brief.</p></div><div><span>02</span><h3>Make it matter</h3><p>We look for the clearest, most distinctive way to get the message across.</p></div><div><span>03</span><h3>Finish with care</h3><p>Small details have a way of becoming the whole experience.</p></div></section><section class="contact-strip"><div><p class="eyebrow">Ready to start?</p><h2>Bring us the brief.</h2></div>${button('/contact', 'Start a project')}</section>`, '/about');
  }

  if (pathname === '/services') {
    const services = await readStore('services');
    return render('Services', `${pageTitle('What we do', 'Creative that<br><em>does the work.</em>', 'A connected set of creative, digital and production services, shaped around the challenge in front of you.') }<section class="service-directory">${services.filter((service) => service.active !== false).map(serviceCard).join('')}</section><section class="contact-strip"><div><p class="eyebrow">Not sure where to begin?</p><h2>Tell us the challenge.</h2></div>${button('/contact', 'Talk it through')}</section>`, '/services');
  }

  const serviceMatch = pathname.match(/^\/services\/([^/]+)$/);
  if (serviceMatch) {
    const service = (await readStore('services')).find((item) => item.slug === serviceMatch[1] && item.active !== false);
    if (!service) return notFound(res, session, settings);
    const faqs = (service.faqs || []).map((faq) => `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`).join('');
    return render(service.title, `${pageTitle(escapeHtml(service.category || 'Sparks / Services'), escapeHtml(service.title).replace(/ & /g, ' &amp;<br>'), service.summary)}<section class="service-detail"><div><p class="eyebrow">A considered approach</p><h2>Make room for<br><em>what's next.</em></h2><p>${escapeHtml(service.description || service.summary)}</p>${button(`/contact?service=${encodeURIComponent(service.slug)}`, 'Enquire about this service')}</div><div class="benefit-list">${(service.benefits || []).map((benefit, index) => `<div><span>0${index + 1}</span><p>${escapeHtml(benefit)}</p></div>`).join('')}</div></section>${faqs ? `<section class="faq-section"><p class="eyebrow">A few good questions</p><h2>Before we begin.</h2>${faqs}</section>` : ''}<section class="contact-strip"><div><p class="eyebrow">Have a brief?</p><h2>Let's get into it.</h2></div>${button('/contact', 'Start an enquiry')}</section>`, '/services');
  }

  if (pathname === '/work') {
    const projects = (await readStore('projects')).filter((item) => item.published);
    return render('Our work', `${pageTitle('Selected work', 'Ideas made<br><em>visible.</em>', 'A collection of collaborations, identities and digital experiences, each shaped around its own challenge.') }${projects.length ? `<section class="project-grid project-grid-page">${projects.map(projectCard).join('')}</section>` : `<section class="empty-page"><span class="empty-mark">S<span>✳</span></span><h2>Our portfolio is taking shape.</h2><p>We do not publish work without a client’s permission. Ask us about relevant experience for your brief.</p>${button('/contact', 'Ask about our work', true)}</section>`}<section class="contact-strip"><div><p class="eyebrow">Every project has a first page</p><h2>Let's write yours.</h2></div>${button('/contact', 'Start a project')}</section>`, '/work');
  }

  const projectMatch = pathname.match(/^\/work\/([^/]+)$/);
  if (projectMatch) {
    const project = (await readStore('projects')).find((item) => item.slug === projectMatch[1] && item.published);
    if (!project) return notFound(res, session, settings);
    const projectImage = validAssetPath(project.image) ? `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} project artwork">` : `<span class="art-spark">✳</span><span class="art-name">${escapeHtml(project.title)}</span>`;
    const projectLabel = validAssetPath(project.image) ? '' : `<span class="art-label">${escapeHtml(project.category || 'Selected work')}</span>`;
    const gallery = (project.gallery || []).filter(validAssetPath);
    return render(project.title, `${pageTitle(project.category || 'Selected work', escapeHtml(project.title), project.summary)}<section class="project-detail"><div class="project-art project-art-large${validAssetPath(project.image) ? ' has-image' : ''}${project.imageFit === 'contain' ? ' image-contain' : ''}" style="--project-color:${/^#[0-9a-f]{6}$/i.test(project.color || '') ? project.color : '#f7941d'}">${projectImage}${projectLabel}</div><div><p class="eyebrow">The thinking</p><p>${escapeHtml(project.description || project.body || project.summary)}</p>${project.body && project.body !== project.description ? `<p>${escapeHtml(project.body)}</p>` : ''}</div></section>${gallery.length ? `<section class="project-gallery">${gallery.map((image, index) => `<img src="${escapeHtml(image)}" alt="${escapeHtml(project.title)} gallery image ${index + 1}" loading="lazy">`).join('')}</section>` : ''}${button('/contact', 'Discuss a similar project', true)}`, '/work');
  }

  if (pathname === '/blog') {
    const posts = (await readStore('posts')).filter((item) => item.published);
    return render('Journal', `${pageTitle('Sparks journal', 'Ideas worth<br><em>passing on.</em>', 'Thoughts on creative work, digital experiences and the details that make a brand feel like itself.') }<section class="journal-list">${posts.length ? posts.map(postCard).join('') : '<p class="quiet-note">There are no published notes just yet.</p>'}</section>`, '/blog');
  }

  const postMatch = pathname.match(/^\/blog\/([^/]+)$/);
  if (postMatch) {
    const post = (await readStore('posts')).find((item) => item.slug === postMatch[1] && item.published);
    if (!post) return notFound(res, session, settings);
    const cover = validAssetPath(post.image) ? `<figure class="journal-cover"><img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" fetchpriority="high"></figure>` : '';
    const paragraphs = String(post.body || post.description || '').split(/\n\s*\n/).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`).join('');
    return render(post.title, `${pageTitle(escapeHtml(post.category || 'Sparks journal'), escapeHtml(post.title), post.summary)}${cover}<article class="article-body">${paragraphs}</article><a class="under-link journal-back" href="/blog">← Back to the journal</a>`, '/blog');
  }

  if (pathname === '/contact') return render('Contact', `${pageTitle('Get in touch', 'A little spark<br><em>starts somewhere.</em>', 'Tell us what you are working on. We will save your enquiry for the team to review.')}${contactSection(session, settings, url.searchParams.get('service') || '')}`, '/contact');

  if (pathname === '/client/register') return render('Create your account', `${authHeading('Client portal', 'Create your account')}${registerForm(session)}`);
  if (pathname === '/client/login') return render('Client sign in', `${authHeading('Client portal', 'Good to see you.')}${loginForm(session, 'client')}<p class="auth-switch">New to the portal? <a href="/client/register">Create an account ↗</a></p>`);

  if (pathname === '/client/dashboard' || pathname === '/client/new-request') {
    if (!requireRole(session, 'client', res)) return;
    const [users, orders] = await Promise.all([readStore('users'), readStore('orders')]);
    const user = users.find((item) => item.id === session.userId && item.role === 'client');
    if (!user) return redirect(res, '/client/login');
    if (pathname === '/client/new-request') {
      const services = await readStore('services');
      return send(res, 200, clientLayout('New project request', `<p class="dashboard-welcome">A few details help us get to the useful questions sooner.</p>${serviceEnquiryForm(session, '', services)}`, session, 'new', settings));
    }
    const mine = orders.filter((order) => order.clientId === user.id);
    return send(res, 200, clientLayout('Your projects', `<p class="dashboard-welcome">Welcome, ${escapeHtml(user.name)}. Here is where your project updates live.</p>${mine.length ? `<div class="record-list">${mine.map((order) => `<a class="record-row" href="/client/orders/${encodeURIComponent(order.id)}"><span><strong>${escapeHtml(order.title)}</strong><small>${escapeHtml(order.serviceName)} · ${new Date(order.createdAt).toLocaleDateString()}</small></span><span class="status-pill">${escapeHtml(order.status)}</span><b>↗</b></a>`).join('')}</div>` : `<div class="empty-dashboard"><p>No project requests yet.</p>${button('/client/new-request', 'Create a request')}</div>`}`, session, 'overview', settings));
  }

  if (pathname === '/client/profile') {
    if (!requireRole(session, 'client', res)) return;
    const user = (await readStore('users')).find((item) => item.id === session.userId && item.role === 'client');
    if (!user) return redirect(res, '/client/login');
    const saved = url.searchParams.has('saved') ? notice('Profile updated.', 'success') : '';
    const form = `<form method="post" action="/client/profile" class="form-grid">${formCsrf(session)}${input('name', 'Full name', user.name, 'text', true, 'maxlength="120"')}${input('email', 'Email address', user.email, 'email', true, 'maxlength="254"')}${input('phone', 'Phone', user.phone || '', 'tel', false, 'maxlength="40"')}<button class="button">Save profile <span>↗</span></button></form>`;
    return send(res, 200, clientLayout('Your profile', `${saved}${form}`, session, 'profile', settings));
  }

  const clientOrderMatch = pathname.match(/^\/client\/orders\/([a-f0-9-]+)$/i);
  if (clientOrderMatch) {
    if (!requireRole(session, 'client', res)) return;
    const order = (await readStore('orders')).find((item) => item.id === clientOrderMatch[1] && item.clientId === session.userId);
    if (!order) return notFound(res, session, settings);
    const history = (order.statusHistory || []).map((event) => `<div class="timeline-item"><span class="timeline-dot"></span><div><strong>${escapeHtml(event.status)}</strong><small>${new Date(event.at).toLocaleString()}</small>${event.note ? `<p>${escapeHtml(event.note)}</p>` : ''}</div></div>`).join('');
    const messages = (order.messages || []).map((message) => `<div class="conversation-message"><strong>${escapeHtml(message.author)}</strong><small>${new Date(message.at).toLocaleString()}</small><p>${escapeHtml(message.text)}</p></div>`).join('');
    const messageForm = `<form method="post" action="/client/orders/message" class="message-form">${formCsrf(session)}<input type="hidden" name="id" value="${escapeHtml(order.id)}"><label>Send a message<textarea name="message" rows="3" maxlength="2000" required></textarea></label><button class="button button-small">Send message <span>↗</span></button></form>`;
    return send(res, 200, clientLayout(order.title, `<p class="dashboard-welcome">${escapeHtml(order.serviceName)} · submitted ${new Date(order.createdAt).toLocaleDateString()}</p><div class="order-detail"><div><h2>${escapeHtml(order.title)}</h2><p>${escapeHtml(order.description)}</p><div class="order-facts"><span>Current status<strong>${escapeHtml(order.status)}</strong></span><span>Preferred deadline<strong>${escapeHtml(order.deadline || 'Not specified')}</strong></span></div><div class="conversation"><p class="eyebrow">Messages</p>${messages || '<p class="quiet-note">No messages yet.</p>'}${messageForm}</div></div><div><p class="eyebrow">Project updates</p><div class="timeline">${history || '<p>No updates yet.</p>'}</div></div></div>`, session, 'overview', settings));
  }

  if (pathname === '/admin/login') return render('Admin sign in', `${authHeading('Studio access', 'Welcome back.')}${loginForm(session, 'admin')}`);
  if (pathname === '/admin/setup') {
    const users = await readStore('users');
    if (users.some((user) => user.role === 'admin')) return send(res, 410, shell('Setup closed', `<section class="content-shell">${notice('Administrator setup is already complete.', 'info')}</section>`, session, { settings }));
    const provided = url.searchParams.get('token') || '';
    if (!setupToken || !safeEqual(provided, setupToken)) return send(res, 403, shell('Setup unavailable', `<section class="content-shell">${notice('Open the one-time setup URL printed in the server startup log.', 'error')}</section>`, session, { settings }));
    return render('Create administrator', `${authHeading('One-time setup', 'Create the first administrator')}${setupForm(session, provided)}`);
  }

  if (pathname === '/admin/site-editor') {
    if (!requireRole(session, 'admin', res)) return;
    const page = url.searchParams.get('path') || '/';
    if (!validEditorPage(page)) return send(res, 400, shell('Website editor', `<section class="content-shell">${notice('That website page cannot be opened in the visual editor.', 'error')}</section>`, session, { settings }));
    return redirect(res, `${page}${page.includes('?') ? '&' : '?'}edit=1`);
  }

  if (pathname === '/admin' || pathname === '/admin/dashboard') {
    if (!requireRole(session, 'admin', res)) return;
    const [services, projects, posts, enquiries, orders] = await Promise.all(['services', 'projects', 'posts', 'enquiries', 'orders'].map(readStore));
    const stats = [['Services', services.length], ['Published work', projects.filter((item) => item.published).length], ['New enquiries', enquiries.filter((item) => item.status === 'New').length], ['Open orders', orders.filter((item) => !['Completed', 'Cancelled'].includes(item.status)).length]];
    return send(res, 200, adminLayout('Studio overview', `<div class="editor-disclosure"><h2>Edit the website visually</h2><p>Change page text, images, colours, spacing and section order directly on the live page.</p><a class="button" href="/admin/site-editor?path=/">Edit Website <span>↗</span></a></div><div class="stats-grid">${stats.map(([label, value]) => `<div class="stat-box"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`).join('')}</div><div class="dashboard-section-head"><h2>Recent enquiries</h2><a href="/admin/enquiries">View all ↗</a></div>${enquiries.length ? `<div class="record-list">${enquiries.slice(0, 5).map((item) => `<div class="record-row"><span><strong>${escapeHtml(item.subject || item.name)}</strong><small>${escapeHtml(item.name)} · ${new Date(item.createdAt).toLocaleDateString()}</small></span><span class="status-pill">${escapeHtml(item.status || 'New')}</span></div>`).join('')}</div>` : '<p class="quiet-note">No enquiries saved yet.</p>'}`, session, 'dashboard', settings));
  }

  if (pathname === '/admin/services' || pathname === '/admin/projects' || pathname === '/admin/posts') {
    if (!requireRole(session, 'admin', res)) return;
    const collection = pathname.split('/').pop();
    const records = await readStore(collection);
    const saved = url.searchParams.get('saved');
    return send(res, 200, adminLayout(`Manage ${collection}`, `${saved ? notice(saved === 'deleted' ? 'Record deleted.' : 'Changes saved.', 'success') : ''}${adminCollectionPage(collection, records, session)}`, session, collection, settings));
  }

  if (pathname === '/admin/enquiries') {
    if (!requireRole(session, 'admin', res)) return;
    const enquiries = await readStore('enquiries');
    const content = enquiries.length ? `<div class="admin-records">${enquiries.map((item) => `<article class="admin-record"><div class="record-heading"><div><p class="eyebrow">${new Date(item.createdAt).toLocaleString()}</p><h2>${escapeHtml(item.subject || 'Website enquiry')}</h2></div><span class="status-pill">${escapeHtml(item.status || 'New')}</span></div><p><strong>${escapeHtml(item.name)}</strong> · <a href="mailto:${escapeHtml(item.email)}">${escapeHtml(item.email)}</a> ${item.phone ? `· ${escapeHtml(item.phone)}` : ''}</p><p>${escapeHtml(item.message)}</p><form method="post" action="/admin/enquiries/update" class="inline-form">${formCsrf(session)}<input type="hidden" name="id" value="${escapeHtml(item.id)}"><select name="status"><option ${item.status === 'New' ? 'selected' : ''}>New</option><option ${item.status === 'Reviewed' ? 'selected' : ''}>Reviewed</option><option ${item.status === 'Archived' ? 'selected' : ''}>Archived</option></select><button class="button button-small">Update status</button></form></article>`).join('')}</div>` : '<p class="quiet-note">No enquiries have been received yet.</p>';
    return send(res, 200, adminLayout('Contact enquiries', content, session, 'enquiries', settings));
  }

  if (pathname === '/admin/orders') {
    if (!requireRole(session, 'admin', res)) return;
    const orders = await readStore('orders');
    const content = orders.length ? `<div class="admin-records">${orders.map((order) => `<article class="admin-record"><div class="record-heading"><div><p class="eyebrow">${new Date(order.createdAt).toLocaleString()} · ${escapeHtml(order.serviceName)}</p><h2>${escapeHtml(order.title)}</h2></div><span class="status-pill">${escapeHtml(order.status)}</span></div><p><strong>${escapeHtml(order.clientName)}</strong> · <a href="mailto:${escapeHtml(order.email)}">${escapeHtml(order.email)}</a> · ${escapeHtml(order.phone || 'No phone provided')}</p><p>${escapeHtml(order.description)}</p><form method="post" action="/admin/orders/update" class="form-grid order-update">${formCsrf(session)}<input type="hidden" name="id" value="${escapeHtml(order.id)}"><label>Update status<select name="status">${STATUS_OPTIONS.map((status) => `<option ${status === order.status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}</select></label><label>Client update / note<input name="note" maxlength="2000" placeholder="Optional update for the client"></label><button class="button button-small">Save update</button></form></article>`).join('')}</div>` : '<p class="quiet-note">No service orders have been submitted yet.</p>';
    const conversations = orders.filter((order) => (order.messages || []).length).map((order) => `<article class="admin-record"><p class="eyebrow">Conversation / ${escapeHtml(order.title)}</p>${order.messages.map((message) => `<div class="conversation-message"><strong>${escapeHtml(message.author)}</strong><small>${new Date(message.at).toLocaleString()}</small><p>${escapeHtml(message.text)}</p></div>`).join('')}</article>`).join('');
    return send(res, 200, adminLayout('Service orders', `${content}${conversations ? `<div class="dashboard-section-head"><h2>Project messages</h2></div><div class="admin-records">${conversations}</div>` : ''}`, session, 'orders', settings));
  }

  if (pathname === '/admin/clients') {
    if (!requireRole(session, 'admin', res)) return;
    const clients = (await readStore('users')).filter((user) => user.role === 'client');
    const saved = url.searchParams.has('saved') ? notice('Client profile updated.', 'success') : '';
    const content = clients.length ? `<div class="admin-records">${clients.map((client) => `<article class="admin-record"><p class="eyebrow">Created ${new Date(client.createdAt).toLocaleDateString()}</p><form method="post" action="/admin/clients/update" class="form-grid">${formCsrf(session)}<input type="hidden" name="id" value="${escapeHtml(client.id)}">${input('name', 'Client name', client.name, 'text', true, 'maxlength="120"')}${input('email', 'Email address', client.email, 'email', true, 'maxlength="254"')}${input('phone', 'Phone', client.phone || '', 'tel', false, 'maxlength="40"')}<button class="button button-small">Save client</button></form></article>`).join('')}</div>` : '<p class="quiet-note">No client accounts have been registered yet.</p>';
    return send(res, 200, adminLayout('Client accounts', `${saved}${content}`, session, 'clients', settings));
  }

  if (pathname === '/admin/settings') {
    if (!requireRole(session, 'admin', res)) return;
    return send(res, 200, adminLayout('Website settings', `${url.searchParams.has('saved') ? notice('Settings updated.', 'success') : ''}${settingsForm(session, settings)}`, session, 'settings', settings));
  }

  if (pathname === '/admin/content') {
    if (!requireRole(session, 'admin', res)) return;
    const saved = url.searchParams.has('saved') ? notice('Website copy published.', 'success') : '';
    return send(res, 200, adminLayout('Website content', `${saved}${siteContentForm(session, settings.siteContent)}`, session, 'content', settings));
  }

  if (pathname === '/privacy') return render('Privacy policy', `${pageTitle('Information', 'Privacy<br><em>policy.</em>')}<section class="legal-copy"><h2>Information submitted to us</h2><p>Contact enquiries and client portal details are stored on this website’s server in local JSON files so the Sparks team can respond to requests and manage project updates. This installation does not send email from the contact form.</p><h2>Account and project data</h2><p>Client account details and service requests are used to provide the client portal. Passwords are stored as salted scrypt hashes. Session cookies are HTTP-only and expire after eight hours.</p><h2>Data storage and retention</h2><p>Records are held on the hosting account. The site administrator is responsible for access, backups and deletion requests. JSON storage is intended for small installations and is not equivalent to a database-backed production system.</p><h2>Questions</h2><p>Contact <a href="mailto:${escapeHtml(settings.email)}">${escapeHtml(settings.email)}</a> about this policy.</p></section>`);
  if (pathname === '/terms') return render('Terms and conditions', `${pageTitle('Information', 'Terms &<br><em>conditions.</em>')}<section class="legal-copy"><h2>Using this website</h2><p>Website information is provided for general reference. A service enquiry does not create a contract or confirm availability, scope, pricing or a delivery date.</p><h2>Project work</h2><p>Project scope, deliverables, fees, schedules, revisions and ownership are agreed separately in writing before work begins.</p><h2>Client portal</h2><p>Keep account credentials private and provide accurate project information. Portal status updates are informational and do not replace agreed project terms.</p><h2>Contact</h2><p>Questions can be sent to <a href="mailto:${escapeHtml(settings.email)}">${escapeHtml(settings.email)}</a>.</p></section>`);

  return notFound(res, session, settings);
}

function authHeading(kicker, title) { return `<section class="auth-intro"><p class="eyebrow">${escapeHtml(kicker)}</p><h1>${escapeHtml(title)}</h1></section>`; }

function loginForm(session, role) {
  const action = role === 'admin' ? '/admin/login' : '/client/login';
  return `<section class="auth-form-wrap"><form class="auth-form" method="post" action="${action}">${formCsrf(session)}${input('email', 'Email address', '', 'email', true, 'autocomplete="username"')}${input('password', 'Password', '', 'password', true, 'autocomplete="current-password"') }<button class="button" type="submit">Sign in <span>↗</span></button></form>${role === 'admin' ? '<p class="quiet-note">Administrator access is limited to provisioned accounts.</p>' : ''}</section>`;
}

function registerForm(session) {
  return `<section class="auth-form-wrap"><form class="auth-form" method="post" action="/client/register">${formCsrf(session)}${input('name', 'Full name', '', 'text', true, 'autocomplete="name" maxlength="120"')}${input('email', 'Email address', '', 'email', true, 'autocomplete="email"')}${input('phone', 'Phone (optional)', '', 'tel', false, 'autocomplete="tel" maxlength="40"')}${input('password', 'Password', '', 'password', true, 'minlength="10" autocomplete="new-password"')}<button class="button" type="submit">Create account <span>↗</span></button></form><p class="quiet-note">Use at least 10 characters, including a letter and a number.</p></section>`;
}

function setupForm(session, setupTokenValue) {
  return `<section class="auth-form-wrap"><form class="auth-form" method="post" action="/admin/setup">${formCsrf(session)}<input type="hidden" name="setupToken" value="${escapeHtml(setupTokenValue)}">${input('name', 'Administrator name', '', 'text', true, 'maxlength="120"')}${input('email', 'Administrator email', '', 'email', true)}${input('password', 'Strong password', '', 'password', true, 'minlength="14" autocomplete="new-password"')}<button class="button" type="submit">Create administrator <span>↗</span></button></form><p class="quiet-note">This one-time setup closes after the first administrator is created.</p></section>`;
}

function contactSection(session, settings, service = '') {
  return `<section class="contact-layout"><div class="contact-details"><div><p class="eyebrow">Talk to Sparks</p><h2>Every good project<br>starts with a hello.</h2></div><a href="tel:+971558231400"><small>UAE</small>${escapeHtml(settings.uaePhone)} <span>↗</span></a><a href="https://wa.me/923068222355"><small>Pakistan / WhatsApp</small>${escapeHtml(settings.pakistanPhone)} <span>↗</span></a><a href="mailto:${escapeHtml(settings.email)}"><small>Email</small>${escapeHtml(settings.email)} <span>↗</span></a><a href="${escapeHtml(settings.website)}"><small>Website</small>sparksadvert.com <span>↗</span></a></div><form class="form-grid contact-form" method="post" action="/contact">${formCsrf(session)}<label>Your name<input name="name" maxlength="120" required autocomplete="name"></label><label>Email address<input name="email" type="email" maxlength="254" required autocomplete="email"></label><label>Phone (optional)<input name="phone" type="tel" maxlength="40" autocomplete="tel"></label><label>What is this about?<input name="subject" maxlength="160" value="${escapeHtml(service ? `Enquiry: ${servicesSeed.find((item) => item[0] === service)?.[1] || service}` : '')}"></label><label class="full">A little about your project<textarea name="message" rows="6" maxlength="5000" required></textarea></label><button class="button" type="submit">Send enquiry <span>↗</span></button><p class="form-note">Your message is stored for the Sparks team to review. This form does not send email.</p></form></section>`;
}

function adminCollectionPage(collection, records, session, error = '') {
  const title = collection === 'projects' ? 'Portfolio project' : collection === 'posts' ? 'Journal post' : 'Service';
  const activeField = collection === 'projects' || collection === 'posts' ? 'published' : 'active';
  const projectFields = collection === 'projects' ? `${input('image', 'Cover image path', '', 'text', false, 'maxlength="190" placeholder="/assets/uploads/..."')}${imageUploadControl('image', 'Upload cover image')}<label>Cover image fit<select name="imageFit"><option value="cover">Fill frame</option><option value="contain">Keep full image inside frame</option></select></label><label class="full">Gallery image paths (one per line)<textarea name="gallery" rows="3" maxlength="1000"></textarea></label>${imageUploadControl('gallery', 'Upload gallery images', '', true)}` : '';
  const postFields = collection === 'posts' ? `${input('image', 'Cover image path', '', 'text', false, 'maxlength="190" placeholder="/assets/journal/..."')}${imageUploadControl('image', 'Upload cover image')}` : '';
  const fields = `<div class="form-grid">${input('title', 'Title', '', 'text', true, 'maxlength="160"')}${input('slug', 'URL slug', '', 'text', false, 'maxlength="80"')} ${input('category', 'Category', '', 'text', false, 'maxlength="100"')} ${input('date', 'Date', '', 'date')}<label class="full">Short summary<textarea name="summary" rows="2" maxlength="500"></textarea></label><label class="full">Description / article text<textarea name="description" rows="3" maxlength="5000"></textarea></label><label class="full">${collection === 'posts' ? 'Article body' : 'Details'}<textarea name="body" rows="5" maxlength="10000"></textarea></label>${projectFields}${postFields}${collection === 'services' ? '<label class="full">Benefits (one per line)<textarea name="benefits" rows="3"></textarea></label>' : collection === 'projects' ? '<label>Artwork accent<input name="color" type="color" value="#f7941d"></label>' : ''}<label class="check-label"><input type="checkbox" name="${activeField}" checked> ${collection === 'services' ? 'Active' : 'Published'}</label><div class="full"><button class="button" type="submit">Save ${escapeHtml(collection.slice(0, -1))} <span>↗</span></button></div></div>`;
  const savedRecords = records.map((record) => {
    const recordProjectFields = collection === 'projects' ? `${input('image', 'Cover image path', record.image || '', 'text', false, 'maxlength="190" placeholder="/assets/uploads/..."')}${imageUploadControl('image', 'Replace cover image', record.image || '')}<label>Cover image fit<select name="imageFit"><option value="cover" ${record.imageFit !== 'contain' ? 'selected' : ''}>Fill frame</option><option value="contain" ${record.imageFit === 'contain' ? 'selected' : ''}>Keep full image inside frame</option></select></label><label class="full">Gallery image paths (one per line)<textarea name="gallery" rows="3" maxlength="1000">${escapeHtml((record.gallery || []).join('\n'))}</textarea></label>${imageUploadControl('gallery', 'Add gallery images', '', true)}` : '';
    const recordPostFields = collection === 'posts' ? `${input('image', 'Cover image path', record.image || '', 'text', false, 'maxlength="190" placeholder="/assets/journal/..."')}${imageUploadControl('image', 'Replace cover image', record.image || '')}` : '';
    return `<details class="admin-record editor-record"><summary><strong>${escapeHtml(record.title)}</strong><span>${escapeHtml(record.slug)}</span></summary><form method="post" action="/admin/${collection}/save">${formCsrf(session)}<input type="hidden" name="id" value="${escapeHtml(record.id)}"><div class="form-grid">${input('title', 'Title', record.title, 'text', true, 'maxlength="160"')}${input('slug', 'URL slug', record.slug, 'text', false, 'maxlength="80"')}${input('category', 'Category', record.category || '')}${input('date', 'Date', record.date || '', 'date')}<label class="full">Short summary<textarea name="summary" rows="2" maxlength="500">${escapeHtml(record.summary || '')}</textarea></label><label class="full">Description<textarea name="description" rows="3" maxlength="5000">${escapeHtml(record.description || '')}</textarea></label><label class="full">Details / article body<textarea name="body" rows="4" maxlength="10000">${escapeHtml(record.body || '')}</textarea></label>${recordProjectFields}${recordPostFields}${collection === 'services' ? `<label class="full">Benefits (one per line)<textarea name="benefits" rows="3">${escapeHtml((record.benefits || []).join('\n'))}</textarea></label>` : collection === 'projects' ? `<label>Artwork accent<input name="color" type="color" value="${/^#[0-9a-f]{6}$/i.test(record.color || '') ? record.color : '#f7941d'}"></label>` : ''}<label class="check-label"><input type="checkbox" name="${activeField}" ${record[activeField] ? 'checked' : ''}> ${collection === 'services' ? 'Active' : 'Published'}</label><div class="full editor-actions"><button class="button button-small">Save changes</button><button class="text-button danger" name="deleteId" value="${escapeHtml(record.id)}" formnovalidate onclick="return confirm('Delete this record?')">Delete</button></div></div></form></details>`;
  }).join('');
  return `${error ? notice(error, 'error') : ''}<details class="editor-disclosure" open><summary>Add a ${escapeHtml(title.toLowerCase())}</summary><form method="post" action="/admin/${collection}/save">${formCsrf(session)}${fields}</form></details><div class="dashboard-section-head"><h2>Saved records <span>${records.length}</span></h2></div>${records.length ? `<div class="admin-records">${savedRecords}</div>` : '<p class="quiet-note">No records saved yet.</p>'}`;
}

function siteContentForm(session, content) {
  let activeGroup = '';
  const fields = siteContentFields.map(([key, label, rows]) => {
    const group = key.startsWith('home') ? 'Homepage' : key.startsWith('about') ? 'About page' : 'Contact page';
    const heading = group === activeGroup ? '' : `<h2 class="content-group-title">${group}</h2>`;
    activeGroup = group;
    const value = escapeHtml(content[key] || '');
    const control = rows === 1
      ? `<input name="${key}" maxlength="180" value="${value}" required>`
      : `<textarea name="${key}" rows="${rows}" maxlength="500" required>${value}</textarea>`;
    return `${heading}<label>${escapeHtml(label)}${control}</label>`;
  }).join('');
  return `<form method="post" action="/admin/content" class="form-grid content-editor">${formCsrf(session)}${fields}<button class="button">Publish text changes <span>↗</span></button></form>`;
}

function settingsForm(session, settings) {
  return `<form method="post" action="/admin/settings" class="form-grid settings-form">${formCsrf(session)}<h2 class="content-group-title">Business details</h2>${input('company', 'Company name', settings.company || '')}${input('email', 'Contact email', settings.email || '', 'email', true)}${input('uaePhone', 'UAE phone', settings.uaePhone || '', 'tel')}${input('pakistanPhone', 'Pakistan / WhatsApp phone', settings.pakistanPhone || '', 'tel')}${input('website', 'Website URL', settings.website || '', 'url')}<h2 class="content-group-title">Brand identity</h2>${input('brandPrimary', 'Primary brand colour', /^#[0-9a-f]{6}$/i.test(settings.brandPrimary || '') ? settings.brandPrimary : '#f7941d', 'color')}${input('brandAccent', 'Accent colour', /^#[0-9a-f]{6}$/i.test(settings.brandAccent || '') ? settings.brandAccent : '#da7410', 'color')}${input('brandBackground', 'Page background', /^#[0-9a-f]{6}$/i.test(settings.brandBackground || '') ? settings.brandBackground : '#f7f6f2', 'color')}${input('logoLight', 'Light logo path', settings.logoLight || '/assets/logo-light.png', 'text', false, 'maxlength="190"')}${imageUploadControl('logoLight', 'Upload light-background logo', settings.logoLight || '/assets/logo-light.png')}${input('logoDark', 'Dark logo path', settings.logoDark || '/assets/logo-dark.png', 'text', false, 'maxlength="190"')}${imageUploadControl('logoDark', 'Upload dark-background logo', settings.logoDark || '/assets/logo-dark.png')}<p class="form-note">Brand colours and logos apply across the website after saving.</p><button class="button">Save settings <span>↗</span></button></form>`;
}

function notFound(res, session, settings) {
  return send(res, 404, shell('Not found', `<section class="not-found"><p class="eyebrow">404 / Not found</p><h1>That page<br><em>is out of orbit.</em></h1><p>The page may have moved, or the link may be out of date.</p><a class="button" href="/">Back to Sparks <span>↗</span></a></section>`, session, { settings }));
}

async function start() {
  await ensureDirectories();
  heroSceneMarkup = (await fs.promises.readFile(path.join(PUBLIC, 'assets', 'hero-code.svg'), 'utf8'))
    .replace(/<style>[\s\S]*?<\/style>/, '')
    .replace('<svg xmlns=', '<svg class="hero-story-art" xmlns=');
  const users = await readStore('users');
  if (!users.some((user) => user.role === 'admin')) {
    setupToken = token(32);
    console.log(`One-time administrator setup: http://localhost:${PORT}/admin/setup?token=${setupToken}`);
    console.log('On cPanel, replace localhost with the configured application domain. Keep this URL private.');
  }
  const server = http.createServer((req, res) => {
    handle(req, res).catch((error) => {
      console.error(`${req.method} ${req.url}:`, error);
      if (res.headersSent) return res.destroy();
      const status = error.status || 500;
      send(res, status, `<h1>${status === 404 ? 'Not found' : 'Something went wrong'}</h1><p>Please try again shortly.</p>`);
    });
  });
  server.listen(PORT, '0.0.0.0', () => console.log(`Sparks website listening on port ${PORT}`));
}

if (process.argv[2] === '--reset-admin-password') {
  resetAdminPassword(process.argv[3] || '').catch((error) => { console.error(error.message); process.exitCode = 1; });
} else {
  start().catch((error) => { console.error('Startup failed:', error); process.exitCode = 1; });
}