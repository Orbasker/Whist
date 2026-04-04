#!/usr/bin/env node

/**
 * Skeleton Generator — boneyard-js inspired
 *
 * Uses Playwright to visit your running app at different viewports,
 * calls getBoundingClientRect() on every visible element, and generates
 * Angular skeleton component files from the real DOM layout.
 *
 * Usage:
 *   npx playwright install chromium   # one-time browser install
 *   ng serve                          # start dev server in another terminal
 *   node tools/generate-skeletons.mjs [--url http://localhost:4200] [--route /dashboard]
 *
 * Options:
 *   --url       Base URL of the running app (default: http://localhost:4200)
 *   --route     Specific route to capture (default: captures all configured routes)
 *   --viewport  Viewport preset: mobile, tablet, desktop (default: all three)
 *   --out       Output directory (default: src/app/shared/components/skeletons/generated)
 *   --selector  CSS selector scope (default: main, .mobile-main)
 *   --dry-run   Print captured layout JSON without generating files
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parseArgs } from 'node:util';

// ─── Config ────────────────────────────────────────────────────────────────

const VIEWPORTS = {
  mobile: { width: 375, height: 812, label: 'mobile' },
  tablet: { width: 768, height: 1024, label: 'tablet' },
  desktop: { width: 1280, height: 900, label: 'desktop' },
};

const ROUTES = [
  { path: '/dashboard', name: 'dashboard', requiresAuth: true },
  { path: '/leaderboard', name: 'leaderboard', requiresAuth: true },
  { path: '/history', name: 'history', requiresAuth: true },
  { path: '/', name: 'landing', requiresAuth: false },
];

// Elements to skip when scanning
const SKIP_TAGS = new Set([
  'script', 'style', 'link', 'meta', 'head', 'html', 'body',
  'noscript', 'br', 'wbr', 'template',
]);

const SKIP_SELECTORS = [
  'app-loader',       // Skip existing loaders
  '[aria-hidden]',    // Skip hidden elements
  '.sr-only',         // Skip screen-reader-only
];

// ─── CLI args ──────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    url: { type: 'string', default: 'http://localhost:4200' },
    route: { type: 'string' },
    viewport: { type: 'string' },
    out: { type: 'string', default: 'src/app/shared/components/skeletons/generated' },
    selector: { type: 'string', default: 'main, .mobile-main, .desktop-main' },
    'dry-run': { type: 'boolean', default: false },
  },
  strict: false,
});

const BASE_URL = args.url;
const OUT_DIR = resolve(process.cwd(), args.out);
const DRY_RUN = args['dry-run'];

// Filter routes/viewports by CLI args
const targetRoutes = args.route
  ? ROUTES.filter((r) => r.path === args.route)
  : ROUTES;

const targetViewports = args.viewport
  ? [VIEWPORTS[args.viewport]].filter(Boolean)
  : Object.values(VIEWPORTS);

// ─── DOM scanning function (runs in browser context) ───────────────────────

/**
 * Injected into the page via page.evaluate().
 * Walks the DOM tree within a scope selector and captures element rects.
 */
function scanElements(scopeSelector, skipTags, skipSelectors) {
  const scopes = document.querySelectorAll(scopeSelector);
  if (!scopes.length) return { elements: [], viewport: { width: window.innerWidth, height: window.innerHeight } };

  const elements = [];
  const seen = new Set();

  for (const scope of scopes) {
    const scopeRect = scope.getBoundingClientRect();

    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        const tag = node.tagName.toLowerCase();
        if (skipTags.has(tag)) return NodeFilter.FILTER_REJECT;
        for (const sel of skipSelectors) {
          if (node.matches(sel)) return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node = walker.nextNode();
    while (node) {
      const rect = node.getBoundingClientRect();

      // Skip invisible elements
      if (rect.width < 2 || rect.height < 2) {
        node = walker.nextNode();
        continue;
      }

      // Skip elements outside viewport
      if (rect.bottom < 0 || rect.top > window.innerHeight * 1.5) {
        node = walker.nextNode();
        continue;
      }

      const tag = node.tagName.toLowerCase();
      const styles = window.getComputedStyle(node);

      // Only capture leaf-ish elements (no children with layout significance)
      // or elements that look like cards/containers
      const isLeaf = node.children.length === 0;
      const isTextNode = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'label'].includes(tag);
      const isImage = ['img', 'svg', 'picture', 'video'].includes(tag);
      const isInput = ['input', 'textarea', 'select'].includes(tag);
      const isButton = ['button'].includes(tag) || node.getAttribute('role') === 'button';
      const isContainer = styles.display === 'flex' || styles.display === 'grid';
      const hasBg = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                    styles.backgroundColor !== 'transparent';
      const hasBorder = styles.borderWidth !== '0px' && styles.borderStyle !== 'none';
      const borderRadius = styles.borderRadius;
      const isRounded = parseFloat(borderRadius) > 0;

      // Determine element type for skeleton mapping
      let type = 'block';
      if (isTextNode || isLeaf) type = 'text';
      if (isImage) type = 'image';
      if (isButton) type = 'button';
      if (isInput) type = 'input';
      if (isRounded && rect.width === rect.height) type = 'circle';

      // For container elements with backgrounds, capture them as blocks
      if (isContainer && (hasBg || hasBorder) && !isLeaf) type = 'card';

      // Create a unique key to deduplicate
      const key = `${Math.round(rect.x)}-${Math.round(rect.y)}-${Math.round(rect.width)}-${Math.round(rect.height)}`;
      if (seen.has(key)) {
        node = walker.nextNode();
        continue;
      }
      seen.add(key);

      elements.push({
        tag,
        type,
        x: Math.round(rect.x - scopeRect.x),
        y: Math.round(rect.y - scopeRect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        borderRadius,
        className: node.className?.toString().slice(0, 100) || '',
        text: (node.textContent || '').trim().slice(0, 50),
      });

      node = walker.nextNode();
    }
  }

  return {
    elements,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  };
}

// ─── Template generation ───────────────────────────────────────────────────

function classifyElement(el) {
  if (el.type === 'circle') return { variant: 'circle', width: `${el.width}px`, height: `${el.height}px` };
  if (el.type === 'text') return { variant: 'text', width: `${el.width}px`, height: `${Math.min(el.height, 20)}px` };
  if (el.type === 'button') return { variant: 'block', width: `${el.width}px`, height: `${el.height}px`, radius: el.borderRadius };
  if (el.type === 'image') return { variant: 'block', width: `${el.width}px`, height: `${el.height}px`, radius: el.borderRadius };
  if (el.type === 'input') return { variant: 'block', width: `${el.width}px`, height: `${el.height}px`, radius: '0.5rem' };
  return { variant: 'block', width: `${el.width}px`, height: `${el.height}px`, radius: el.borderRadius };
}

function groupIntoRows(elements, threshold = 12) {
  if (!elements.length) return [];

  // Sort by Y then X
  const sorted = [...elements].sort((a, b) => a.y - b.y || a.x - b.x);

  const rows = [];
  let currentRow = [sorted[0]];
  let rowY = sorted[0].y;

  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i].y - rowY) <= threshold) {
      currentRow.push(sorted[i]);
    } else {
      rows.push(currentRow);
      currentRow = [sorted[i]];
      rowY = sorted[i].y;
    }
  }
  rows.push(currentRow);
  return rows;
}

function generateTemplate(routeName, viewportLabel, elements) {
  const rows = groupIntoRows(elements);

  let template = `    <!-- ${viewportLabel} skeleton for ${routeName} -->\n`;
  template += `    <div class="space-y-3">\n`;

  for (const row of rows) {
    if (row.length === 1) {
      const el = classifyElement(row[0]);
      template += `      <app-ui-skeleton variant="${el.variant}" width="${el.width}" height="${el.height}"`;
      if (el.radius) template += ` radius="${el.radius}"`;
      template += `></app-ui-skeleton>\n`;
    } else {
      template += `      <div class="flex items-center gap-3">\n`;
      for (const item of row) {
        const el = classifyElement(item);
        template += `        <app-ui-skeleton variant="${el.variant}" width="${el.width}" height="${el.height}"`;
        if (el.radius) template += ` radius="${el.radius}"`;
        template += `></app-ui-skeleton>\n`;
      }
      template += `      </div>\n`;
    }
  }

  template += `    </div>`;
  return template;
}

function generateComponentFile(routeName, captures) {
  const componentName = routeName.charAt(0).toUpperCase() + routeName.slice(1) + 'GeneratedSkeletonComponent';
  const selector = `app-${routeName}-generated-skeleton`;

  // Build responsive template with breakpoint wrappers
  let template = '';
  const desktopCapture = captures.find((c) => c.viewport === 'desktop');
  const mobileCapture = captures.find((c) => c.viewport === 'mobile');

  if (desktopCapture && mobileCapture) {
    template += `    <!-- Desktop -->\n`;
    template += `    <div class="hidden lg:block">\n`;
    template += generateTemplate(routeName, 'desktop', desktopCapture.elements);
    template += `\n    </div>\n\n`;
    template += `    <!-- Mobile -->\n`;
    template += `    <div class="lg:hidden">\n`;
    template += generateTemplate(routeName, 'mobile', mobileCapture.elements);
    template += `\n    </div>`;
  } else {
    const capture = captures[0];
    template = generateTemplate(routeName, capture.viewport, capture.elements);
  }

  return `/**
 * Auto-generated skeleton for "${routeName}" page.
 * Generated by tools/generate-skeletons.mjs on ${new Date().toISOString().slice(0, 10)}
 *
 * To regenerate: node tools/generate-skeletons.mjs --route /${routeName}
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiSkeletonComponent } from '../../ui/skeleton/skeleton.component';

@Component({
  selector: '${selector}',
  standalone: true,
  imports: [CommonModule, UiSkeletonComponent],
  template: \`
${template}
  \`,
})
export class ${componentName} {}
`;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n  Skeleton Generator`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  URL:       ${BASE_URL}`);
  console.log(`  Routes:    ${targetRoutes.map((r) => r.path).join(', ')}`);
  console.log(`  Viewports: ${targetViewports.map((v) => v.label).join(', ')}`);
  console.log(`  Output:    ${OUT_DIR}`);
  console.log();

  const browser = await chromium.launch({ headless: true });
  const results = new Map(); // routeName -> [{ viewport, elements }]

  try {
    for (const route of targetRoutes) {
      const captures = [];

      for (const vp of targetViewports) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: vp.label === 'mobile' ? 3 : 2,
        });
        const page = await context.newPage();

        const url = `${BASE_URL}${route.path}`;
        console.log(`  Scanning ${url} @ ${vp.label} (${vp.width}x${vp.height})...`);

        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
          // Wait a bit for Angular to render
          await page.waitForTimeout(1500);
        } catch (e) {
          console.log(`    Skipped (page load failed: ${e.message.slice(0, 60)})`);
          await context.close();
          continue;
        }

        const result = await page.evaluate(scanElements, args.selector, [...SKIP_TAGS], SKIP_SELECTORS);

        console.log(`    Found ${result.elements.length} elements`);

        captures.push({
          viewport: vp.label,
          viewportSize: result.viewport,
          elements: result.elements,
        });

        await context.close();
      }

      results.set(route.name, captures);
    }
  } finally {
    await browser.close();
  }

  // Output
  if (DRY_RUN) {
    console.log('\n  Dry run — captured layout data:\n');
    for (const [name, captures] of results) {
      console.log(`  ${name}:`);
      for (const cap of captures) {
        console.log(`    ${cap.viewport}: ${cap.elements.length} elements`);
        for (const el of cap.elements.slice(0, 5)) {
          console.log(`      ${el.type} ${el.width}x${el.height} @ (${el.x},${el.y}) "${el.text.slice(0, 20)}"`);
        }
        if (cap.elements.length > 5) {
          console.log(`      ... and ${cap.elements.length - 5} more`);
        }
      }
    }
    return;
  }

  // Generate files
  mkdirSync(OUT_DIR, { recursive: true });

  let generated = 0;
  for (const [name, captures] of results) {
    if (!captures.length || captures.every((c) => c.elements.length === 0)) {
      console.log(`  Skipping ${name} (no elements captured)`);
      continue;
    }

    const code = generateComponentFile(name, captures);
    const filePath = join(OUT_DIR, `${name}-skeleton.generated.ts`);
    writeFileSync(filePath, code, 'utf-8');
    console.log(`  Generated: ${filePath}`);
    generated++;
  }

  // Also write a barrel export
  const barrel = results
    .entries()
    .filter(([, caps]) => caps.some((c) => c.elements.length > 0))
    .map(([name]) => {
      const className = name.charAt(0).toUpperCase() + name.slice(1) + 'GeneratedSkeletonComponent';
      return `export { ${className} } from './${name}-skeleton.generated';`;
    })
    .toArray()
    .join('\n');

  if (barrel) {
    writeFileSync(join(OUT_DIR, 'index.ts'), barrel + '\n', 'utf-8');
  }

  console.log(`\n  Done! Generated ${generated} skeleton component(s).\n`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
