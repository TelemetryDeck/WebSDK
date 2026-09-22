// @ts-check
const { test, expect } = require('@playwright/test');

const API = 'https://nom.telemetrydeck.com/v3/w/';
const APP_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE';
const PAGE_LEAVE = 'TelemetryDeck.Web.pageLeave';

// Every request carries exactly one flat event.
const eventOf = (request) => request.postDataJSON();

const isPageLeave = (request) => request.url() === API && eventOf(request)['type'] === PAGE_LEAVE;

const isPageview = (request) => request.url() === API && eventOf(request)['type'] === undefined;

test.beforeEach(async ({ page }) => {
  await page.route(API, async (route) => {
    await route.fulfill({
      body: 'OK',
    });
  });
});

test('Loads and calls TelemetryDeck Web SDK', async ({ page }) => {
  const requestPromise = page.waitForRequest(API);

  await page.goto('/simple-request.html');

  const request = await requestPromise;
  const event = eventOf(request);

  expect(request.method()).toBe('POST');
  expect(request.headers()['content-type']).toBe('application/json');
  expect(Array.isArray(event)).toBe(false);
  expect(event).toHaveProperty('url');
  expect(event).toHaveProperty('appID');
  expect(event['url']).toBe('http://127.0.0.1:3000/simple-request.html');
  expect(event['appID']).toBe(APP_ID);
  expect(event['type']).toBeUndefined();
  expect(event['receivedAt']).toBeUndefined();
  expect(event['payload']).toBeUndefined();
  expect(event['locale']).toEqual(expect.any(String));
  expect(event['telemetryClientVersion']).toBeUndefined();
  expect(event['TelemetryDeck.SDK.name']).toBe('WebSDK');
  expect(event['TelemetryDeck.SDK.version']).toMatch(/^\d+\.\d+\.\d+/);
  expect(event['TelemetryDeck.SDK.nameAndVersion']).toBe(
    `WebSDK ${event['TelemetryDeck.SDK.version']}`
  );
});

test('Marks events from 127.0.0.1 as test mode, as a string', async ({ page }) => {
  const requestPromise = page.waitForRequest(isPageview);

  await page.goto('/simple-request.html');

  const event = eventOf(await requestPromise);

  expect(event['isTestMode']).toBe('true');
});

test('Works when the script tag is loaded with `async`', async ({ page }) => {
  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/async-request.html');
  const pageview = eventOf(await pageviewPromise);

  expect(pageview['url']).toBe('http://127.0.0.1:3000/async-request.html');
  expect(pageview['appID']).toBe(APP_ID);

  const pageLeavePromise = page.waitForRequest(isPageLeave);
  await page.goto('/missing-app-id.html');
  const pageLeave = eventOf(await pageLeavePromise);

  expect(pageLeave['url']).toBe('http://127.0.0.1:3000/async-request.html');
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
      isPageview(request) && eventOf(request)['url'] === 'http://127.0.0.1:3000/simple-request.html'
  );

  await page.getByTestId('next-page-link').click();

  const request = await requestPromise;
  const event = eventOf(request);

  expect(request.method()).toBe('POST');
  expect(event).toHaveProperty('url');
  expect(event).toHaveProperty('appID');
  expect(event).toHaveProperty('referrer');
  expect(event['url']).toBe('http://127.0.0.1:3000/simple-request.html');
  expect(event['appID']).toBe(APP_ID);
  expect(event['referrer']).toBe('http://127.0.0.1:3000/request-with-referrer.html');
});

test('Sends a page leave event with scroll depth and engaged time', async ({ page }) => {
  const pageLeaveRequests = [];
  page.on('request', (request) => {
    if (isPageLeave(request)) {
      pageLeaveRequests.push(request);
    }
  });

  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/page-engagement.html');
  await pageviewPromise;

  // Scroll 1.2 viewport heights down on a page that is four viewports tall,
  // so 2.2 of 4 viewports have been seen: 55%. Staying clear of the 50%
  // boundary keeps the milestone assertion stable across browsers.
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
  // Stay on the page for a little over a second so engaged time reaches 1s.
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 1100)));

  const pageLeavePromise = page.waitForRequest(isPageLeave);
  const nextPageviewPromise = page.waitForRequest(
    (request) =>
      isPageview(request) && eventOf(request)['url'] === 'http://127.0.0.1:3000/simple-request.html'
  );

  await page.getByTestId('next-page-link').click();

  const request = await pageLeavePromise;
  await nextPageviewPromise;

  const event = eventOf(request);

  expect(request.method()).toBe('POST');
  expect(event['appID']).toBe(APP_ID);
  expect(event['url']).toBe('http://127.0.0.1:3000/page-engagement.html');
  expect(event['type']).toBe(PAGE_LEAVE);
  // Page engagement parameters sit at the top level of the flat event, and
  // the numeric ones stay numbers.
  expect(event['payload']).toBeUndefined();
  expect(event['TelemetryDeck.PageEngagement.scrollDepth']).toBeGreaterThanOrEqual(52);
  expect(event['TelemetryDeck.PageEngagement.scrollDepth']).toBeLessThanOrEqual(58);
  expect(event['TelemetryDeck.PageEngagement.scrollDepthMilestone']).toBe('50');
  expect(event['TelemetryDeck.PageEngagement.engagedSeconds']).toBeGreaterThanOrEqual(1);
  expect(typeof event['TelemetryDeck.PageEngagement.engagedSeconds']).toBe('number');

  // visibilitychange and pagehide both fire on navigation; only one event is sent.
  expect(pageLeaveRequests).toHaveLength(1);
});

test('A page that fits the viewport reports a scroll depth of 100', async ({ page }) => {
  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/simple-request.html');
  await pageviewPromise;

  const pageLeavePromise = page.waitForRequest(isPageLeave);

  await page.goto('/missing-app-id.html');

  const event = eventOf(await pageLeavePromise);

  expect(event['url']).toBe('http://127.0.0.1:3000/simple-request.html');
  expect(event['TelemetryDeck.PageEngagement.scrollDepth']).toBe(100);
  expect(event['TelemetryDeck.PageEngagement.scrollDepthMilestone']).toBe('100');
});

test('No page leave event is sent when `data-page-engagement` is "false"', async ({ page }) => {
  const events = [];
  page.on('request', (request) => {
    if (request.url() === API) {
      events.push(eventOf(request));
    }
  });

  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/page-engagement-disabled.html');
  await pageviewPromise;

  await page.evaluate(() => window.scrollTo(0, window.innerHeight));

  const nextPageviewPromise = page.waitForRequest(
    (request) =>
      isPageview(request) && eventOf(request)['url'] === 'http://127.0.0.1:3000/simple-request.html'
  );

  await page.getByTestId('next-page-link').click();
  await nextPageviewPromise;

  expect(events.filter((event) => event['type'] === PAGE_LEAVE)).toHaveLength(0);
  expect(
    events.filter((event) => event['url'] === 'http://127.0.0.1:3000/page-engagement-disabled.html')
  ).toHaveLength(1);
});
