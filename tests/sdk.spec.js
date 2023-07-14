// @ts-check
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route('https://nom.telemetrydeck.com/v2/w/', async (route) => {
    await route.fulfill({
      body: 'Likely OK',
    });
  });
});

test('Loads and calls TelemetryDeck Web SDK', async ({ page }) => {
  const requestPromise = page.waitForRequest('https://nom.telemetrydeck.com/v2/w/');

  await page.goto('/simple-request.html');

  const request = await requestPromise;

  expect(request.method()).toBe('POST');
  expect(request.postDataJSON()).toHaveProperty('url');
  expect(request.postDataJSON()).toHaveProperty('appID');
  expect(request.postDataJSON()['url']).toBe('http://127.0.0.1:3000/simple-request.html');
  expect(request.postDataJSON()['appID']).toBe('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE');
});

test('Script fails if `data-test-app-id` is not set', async ({ page }) => {
  const exceptions = [];

  page.on('pageerror', async (exception) => {
    exceptions.push(exception);
  });

  await page.goto('/missing-app-id.html');

  expect(exceptions).toEqual([new Error('TelemetryDeck: "data-app-id" missing')]);
});

test('Script fails if `data-test-app-id` is empty', async ({ page }) => {
  const exceptions = [];

  page.on('pageerror', async (exception) => {
    exceptions.push(exception);
  });

  await page.goto('/missing-app-id.html');

  expect(exceptions).toEqual([new Error('TelemetryDeck: "data-app-id" missing')]);
});

test('Referrer is set after navigating from one page to another', async ({ page }) => {
  await page.goto('/request-with-referrer.html');

  const requestPromise = page.waitForRequest('https://nom.telemetrydeck.com/v2/w/');

  await page.getByTestId('next-page-link').click();

  const request = await requestPromise;

  expect(request.method()).toBe('POST');
  expect(request.postDataJSON()).toHaveProperty('url');
  expect(request.postDataJSON()).toHaveProperty('appID');
  expect(request.postDataJSON()).toHaveProperty('referrer');
  expect(request.postDataJSON()['url']).toBe('http://127.0.0.1:3000/simple-request.html');
  expect(request.postDataJSON()['appID']).toBe('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE');
  expect(request.postDataJSON()['referrer']).toBe(
    'http://127.0.0.1:3000/request-with-referrer.html'
  );
});
