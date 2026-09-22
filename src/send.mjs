import { version } from '../package.json';
import { api, appId, isTestMode } from './config.mjs';

const { location = {} } = globalThis;

// Captured once so that every signal of this page load reports the same URL.
const url = location.href;

export function buildBody(extra = {}) {
  const body = {
    appID: appId,
    url,
    referrer: document.referrer,
    telemetryClientVersion: `WebSDK ${version}`,
    locale: navigator.language,
    ...extra,
  };

  if (isTestMode) {
    body.isTestMode = true;
  }

  return body;
}

export function send(body) {
  return fetch(api, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// Used while the page is being hidden or unloaded. The body is sent as a plain
// string (`text/plain`), which needs no CORS preflight and therefore survives
// the unload; the ingest server parses JSON regardless of the content type.
export function sendBeacon(body) {
  const data = JSON.stringify(body);

  if (navigator.sendBeacon && navigator.sendBeacon(api, data)) {
    return;
  }

  fetch(api, {
    method: 'POST',
    mode: 'cors',
    keepalive: true,
    body: data,
  }).catch(() => {});
}
