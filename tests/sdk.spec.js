// @ts-check
const { test, expect } = require('@playwright/test');

const API = 'https://nom.telemetrydeck.com/v2/w/';
const APP_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE';
const PAGE_LEAVE = 'TelemetryDeck.Web.pageLeave';

const isPageLeave = (request) =>
  request.url() === API && request.postDataJSON()['type'] === PAGE_LEAVE;

const isPageview = (request) =>
  request.url() === API && request.postDataJSON()['type'] === undefined;

test.beforeEach(async ({ page }) => {
  await page.route(API, async (route) => {
    await route.fulfill({
      body: 'Likely OK',
    });
  });
});

test('Loads and calls TelemetryDeck Web SDK', async ({ page }) => {
  const requestPromise = page.waitForRequest(API);

  await page.goto('/simple-request.html');

  const request = await requestPromise;

  expect(request.method()).toBe('POST');
  expect(request.postDataJSON()).toHaveProperty('url');
  expect(request.postDataJSON()).toHaveProperty('appID');
  expect(request.postDataJSON()['url']).toBe('http://127.0.0.1:3000/simple-request.html');
  expect(request.postDataJSON()['appID']).toBe(APP_ID);
  expect(request.postDataJSON()['type']).toBeUndefined();
});

test('Script fails if `data-app-id` is not set', async ({ page }) => {
  const exceptions = [];

  page.on('pageerror', async (exception) => {
    exceptions.push(exception);
  });

  await page.goto('/missing-app-id.html');

  expect(exceptions).toEqual([new Error('TelemetryDeck: "data-app-id" missing')]);
});

test('Script fails if `data-app-id` is empty', async ({ page }) => {
  const exceptions = [];

  page.on('pageerror', async (exception) => {
    exceptions.push(exception);
  });

  await page.goto('/empty-app-id.html');

  expect(exceptions).toEqual([new Error('TelemetryDeck: "data-app-id" missing')]);
});

test('Referrer is set after navigating from one page to another', async ({ page }) => {
  await page.goto('/request-with-referrer.html');

  const requestPromise = page.waitForRequest(
    (request) =>
      isPageview(request) &&
      request.postDataJSON()['url'] === 'http://127.0.0.1:3000/simple-request.html'
  );

  await page.getByTestId('next-page-link').click();

  const request = await requestPromise;

  expect(request.method()).toBe('POST');
  expect(request.postDataJSON()).toHaveProperty('url');
  expect(request.postDataJSON()).toHaveProperty('appID');
  expect(request.postDataJSON()).toHaveProperty('referrer');
  expect(request.postDataJSON()['url']).toBe('http://127.0.0.1:3000/simple-request.html');
  expect(request.postDataJSON()['appID']).toBe(APP_ID);
  expect(request.postDataJSON()['referrer']).toBe(
    'http://127.0.0.1:3000/request-with-referrer.html'
  );
});

test('Sends a page leave signal with scroll depth and engaged time', async ({ page }) => {
  const pageLeaveRequests = [];
  page.on('request', (request) => {
    if (isPageLeave(request)) {
      pageLeaveRequests.push(request);
    }
  });

  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/page-engagement.html');
  await pageviewPromise;

  // Scroll one viewport height down on a page that is four viewports tall,
  // so two of four viewports have been seen: 50%.
  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  // Stay on the page for a little over a second so engaged time reaches 1s.
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1100)));

  const pageLeavePromise = page.waitForRequest(isPageLeave);
  const nextPageviewPromise = page.waitForRequest(
    (request) =>
      isPageview(request) &&
      request.postDataJSON()['url'] === 'http://127.0.0.1:3000/simple-request.html'
  );

  await page.getByTestId('next-page-link').click();

  const request = await pageLeavePromise;
  await nextPageviewPromise;

  const body = request.postDataJSON();

  expect(request.method()).toBe('POST');
  expect(body['appID']).toBe(APP_ID);
  expect(body['url']).toBe('http://127.0.0.1:3000/page-engagement.html');
  expect(body['type']).toBe(PAGE_LEAVE);
  expect(body['payload']['TelemetryDeck.PageEngagement.scrollDepth']).toBeGreaterThanOrEqual(50);
  expect(body['payload']['TelemetryDeck.PageEngagement.scrollDepth']).toBeLessThan(75);
  expect(body['payload']['TelemetryDeck.PageEngagement.scrollDepthMilestone']).toBe('50');
  expect(body['payload']['TelemetryDeck.PageEngagement.engagedSeconds']).toBeGreaterThanOrEqual(1);

  // visibilitychange and pagehide both fire on navigation; only one signal is sent.
  expect(pageLeaveRequests).toHaveLength(1);
});

test('A page that fits the viewport reports a scroll depth of 100', async ({ page }) => {
  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/simple-request.html');
  await pageviewPromise;

  const pageLeavePromise = page.waitForRequest(isPageLeave);

  await page.goto('/missing-app-id.html');

  const request = await pageLeavePromise;
  const body = request.postDataJSON();

  expect(body['url']).toBe('http://127.0.0.1:3000/simple-request.html');
  expect(body['payload']['TelemetryDeck.PageEngagement.scrollDepth']).toBe(100);
  expect(body['payload']['TelemetryDeck.PageEngagement.scrollDepthMilestone']).toBe('100');
});

test('No page leave signal is sent when `data-page-engagement` is "false"', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => {
    if (request.url() === API) {
      requests.push(request.postDataJSON());
    }
  });

  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/page-engagement-disabled.html');
  await pageviewPromise;

  await page.evaluate(() => window.scrollTo(0, window.innerHeight));

  const nextPageviewPromise = page.waitForRequest(
    (request) =>
      isPageview(request) &&
      request.postDataJSON()['url'] === 'http://127.0.0.1:3000/simple-request.html'
  );

  await page.getByTestId('next-page-link').click();
  await nextPageviewPromise;

  expect(requests.filter((body) => body['type'] === PAGE_LEAVE)).toHaveLength(0);
  expect(
    requests.filter((body) => body['url'] === 'http://127.0.0.1:3000/page-engagement-disabled.html')
  ).toHaveLength(1);
});
