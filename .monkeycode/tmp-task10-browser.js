const routes = ['/', '/growth', '/diagnosis', '/growth/acquisition', '/douyin/quick-plan', '/douyin/video-diagnoser', '/membership', '/admin'];
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];
const results = [];
for (const viewport of viewports) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  for (const route of routes) {
    const errors = [];
    const onPageError = error => errors.push(String(error));
    page.on('pageerror', onPageError);
    await page.goto(`http://127.0.0.1:5173${route}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(250);
    const layout = await page.evaluate(() => ({
      title: document.title,
      path: location.pathname,
      viewportWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      h1: document.querySelector('h1')?.textContent?.trim() || '',
      mainVisible: !!document.querySelector('main, #app > div')
    }));
    page.off('pageerror', onPageError);
    const overflow = Math.max(layout.scrollWidth, layout.bodyScrollWidth) - layout.viewportWidth;
    if (!layout.mainVisible) throw new Error(`${viewport.name} ${route}: no main content`);
    if (overflow > 2) throw new Error(`${viewport.name} ${route}: horizontal overflow ${overflow}px`);
    results.push({ viewport: viewport.name, route, renderedPath: layout.path, h1: layout.h1, overflow, pageErrors: errors.length });
  }
}
return { verified: true, checks: results.length, results };