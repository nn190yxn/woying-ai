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
    await page.goto(`http://127.0.0.1:5173${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(200);
    const name = route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
    const path = `E:/程序开发/我赢AI/woying-ai/.monkeycode/task10-${viewport.name}-${name}.png`;
    await page.screenshot({ path, fullPage: true });
    results.push({ viewport: viewport.name, route, screenshot: path });
  }
}
return { verified: true, screenshots: results.length, results };