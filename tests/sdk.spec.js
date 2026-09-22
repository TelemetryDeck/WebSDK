// @ts-check
const { test, expect } = require('@playwright/test');

const API = 'https://nom.telemetrydeck.com/v2/w/';
const APP_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE';
const PAGE_LEAVE = 'TelemetryDeck.Web.pageLeave';
const LINK_CLICK = 'TelemetryDeck.Web.linkClick';

const isPageLeave = (request) =>
  request.url() === API && request.postDataJSON()['type'] === PAGE_LEAVE;

const isPageview = (request) =>
  request.url() === API && request.postDataJSON()['type'] === undefined;

const isLinkClick = (request) =>
  request.url() === API && request.postDataJSON()['type'] === LINK_CLICK;

// Collects the bodies of all link click signals sent while the test runs.
const collectLinkClicks = (page) => {
  const bodies = [];

  page.on('request', (request) => {
    if (isLinkClick(request)) {
      bodies.push(request.postDataJSON());
    }
  });

  return bodies;
};

test.beforeEach(async ({ page }) => {
  await page.route(API, async (route) => {
    await route.fulfill({
      body: 'Likely OK',
    });
  });

  // Outbound destinations never leave the test environment.
  await page.route('https://example.com/**', async (route) => {
    await route.fulfill({
      contentType: 'text/html',
      body: '<!DOCTYPE html><title>Example</title><h1>Example</h1>',
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

test('Works when the script tag is loaded with `async`', async ({ page }) => {
  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/async-request.html');
  const pageview = await pageviewPromise;

  expect(pageview.postDataJSON()['url']).toBe('http://127.0.0.1:3000/async-request.html');
  expect(pageview.postDataJSON()['appID']).toBe(APP_ID);

  const pageLeavePromise = page.waitForRequest(isPageLeave);
  await page.goto('/missing-app-id.html');
  const pageLeave = await pageLeavePromise;

  expect(pageLeave.postDataJSON()['url']).toBe('http://127.0.0.1:3000/async-request.html');
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

  // Scroll 1.2 viewport heights down on a page that is four viewports tall,
  // so 2.2 of 4 viewports have been seen: 55%. Staying clear of the 50%
  // boundary keeps the milestone assertion stable across browsers.
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.2));
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
  expect(body['payload']['TelemetryDeck.PageEngagement.scrollDepth']).toBeGreaterThanOrEqual(52);
  expect(body['payload']['TelemetryDeck.PageEngagement.scrollDepth']).toBeLessThanOrEqual(58);
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

test('Clicking an outbound link sends a link click signal', async ({ page }) => {
  const linkClicks = collectLinkClicks(page);

  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/outbound-links.html');
  await pageviewPromise;

  const linkClickPromise = page.waitForRequest(isLinkClick);

  // The click lands on the <span> inside the link.
  await page.getByTestId('outbound').locator('span').click();

  const request = await linkClickPromise;
  await page.waitForURL('https://example.com/target?utm_source=td#top');

  const body = request.postDataJSON();

  expect(request.method()).toBe('POST');
  expect(body['appID']).toBe(APP_ID);
  expect(body['url']).toBe('http://127.0.0.1:3000/outbound-links.html');
  expect(body['type']).toBe(LINK_CLICK);
  expect(body['payload']).toEqual({
    'TelemetryDeck.Link.url': 'https://example.com/target?utm_source=td#top',
    'TelemetryDeck.Link.host': 'example.com',
    'TelemetryDeck.Link.isOutbound': 'true',
  });
  expect(linkClicks).toHaveLength(1);
});

test('Internal, mailto and ignored links do not send a link click signal', async ({ page }) => {
  const linkClicks = collectLinkClicks(page);

  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/outbound-links.html');
  await pageviewPromise;

  // Neither of these navigates: the ignored link is opened in a new window
  // and the mailto link has no handler.
  await page.getByTestId('ignored').click({ modifiers: ['Shift'] });
  await page.getByTestId('mailto').click();

  const nextPageviewPromise = page.waitForRequest(
    (request) =>
      isPageview(request) &&
      request.postDataJSON()['url'] === 'http://127.0.0.1:3000/simple-request.html'
  );
  await page.getByTestId('internal').click();
  await nextPageviewPromise;

  expect(linkClicks).toHaveLength(0);
});

test('A button marked with `data-td-link` sends a link click signal', async ({ page }) => {
  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/outbound-links.html');
  await pageviewPromise;

  const linkClickPromise = page.waitForRequest(isLinkClick);
  await page.getByTestId('button').click();
  const request = await linkClickPromise;
  await page.waitForURL('https://example.com/button');

  expect(request.postDataJSON()['payload']).toEqual({
    'TelemetryDeck.Link.url': 'https://example.com/button',
    'TelemetryDeck.Link.host': 'example.com',
    'TelemetryDeck.Link.isOutbound': 'true',
  });
});

test('Links added to the page after load are tracked', async ({ page }) => {
  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/outbound-links.html');
  await pageviewPromise;

  await page.evaluate(() => {
    const link = document.createElement('a');
    link.href = 'https://example.com/dynamic';
    link.dataset.testid = 'dynamic-link';
    link.textContent = 'Dynamic link';
    document.querySelector('[data-testid="dynamic"]').append(link);
  });

  const linkClickPromise = page.waitForRequest(isLinkClick);
  await page.getByTestId('dynamic-link').click();
  const request = await linkClickPromise;

  expect(request.postDataJSON()['payload']['TelemetryDeck.Link.url']).toBe(
    'https://example.com/dynamic'
  );
});

test('Middle clicking an outbound link sends a link click signal', async ({ page }) => {
  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/outbound-links.html');
  await pageviewPromise;

  const linkClickPromise = page.waitForRequest(isLinkClick);
  await page.getByTestId('outbound').click({ button: 'middle' });
  const request = await linkClickPromise;

  expect(request.postDataJSON()['payload']['TelemetryDeck.Link.url']).toBe(
    'https://example.com/target?utm_source=td#top'
  );
});

test('Only `data-td-link` elements are tracked when `data-outbound-links` is "false"', async ({
  page,
}) => {
  const linkClicks = collectLinkClicks(page);

  const pageviewPromise = page.waitForRequest(isPageview);
  await page.goto('/outbound-links-disabled.html');
  await pageviewPromise;

  // Opened in a new window so the page stays put.
  await page.getByTestId('outbound').click({ modifiers: ['Shift'] });

  const linkClickPromise = page.waitForRequest(isLinkClick);
  await page.getByTestId('button').click();
  await linkClickPromise;
  await page.waitForURL('https://example.com/button');

  expect(linkClicks).toHaveLength(1);
  expect(linkClicks[0]['payload']['TelemetryDeck.Link.url']).toBe('https://example.com/button');
});
