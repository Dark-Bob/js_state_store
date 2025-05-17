let createServer;
let puppeteer;

try {
  ({ createServer } = await import('http-server'));
  ({ default: puppeteer } = await import('puppeteer'));
} catch (e) {
  console.log('Required modules not found, skipping tests');
  process.exit(0);
}

async function run() {
  const server = createServer({ root: '.', cache: -1 });
  await new Promise(resolve => server.listen(8080, resolve));

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let failed = false;
  page.on('console', msg => {
    const text = msg.text();
    console.log(text);
    if (text.includes('FAILED')) {
      failed = true;
    }
  });

  await page.goto('http://localhost:8080/unit_tests.html');
  await page.waitForFunction(() => window.tests_done === true, { timeout: 0 });

  await browser.close();
  server.close();

  if (failed) {
    console.error('Some tests failed');
    process.exit(1);
  } else {
    console.log('All tests passed');
  }
}

run();
