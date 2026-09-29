// Turns dist/index.html into build/artifact.html: the page *content* only (title, fonts, style, markup, script),
// because the artifact host wraps it in its own <html>/<head>/<body>.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'));
const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
const keep = head
  .split('\n')
  .filter((l) => /<title>|<link rel="(stylesheet|preconnect)"/.test(l))
  .join('\n');
const styles = [...head.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]).join('\n');
const scripts = [...head.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]).join('\n');
mkdirSync('build', { recursive: true });
writeFileSync('build/artifact.html', `${keep}\n${styles}\n${body.trim()}\n${scripts}\n`);
console.log('build/artifact.html written');
