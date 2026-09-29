import { version } from '../package.json';
import { api, appId, isTestMode } from './config.mjs';

const { location = {} } = globalThis;

// Captured once so that every event of this page load reports the same URL.
const url = location.href;

const sdkName = 'WebSDK';
const sdkNameAndVersion = `${sdkName} ${version}`;

// Web events v3 are flat: every parameter sits at the top level of the event
// and may be any JSON value, not only strings. The ingest server fills in
// `receivedAt` and `type` (`pageview`) when they are missing and derives
// browser, system, location and campaign data itself.
export function buildEvent(extra = {}) {
  return {
    appID: appId,
    url,
    referrer: document.referrer,
    locale: navigator.language,
    // A string rather than a boolean, matching what every other SDK sends.
    isTestMode: isTestMode ? 'true' : 'false',
    'TelemetryDeck.SDK.name': sdkName,
    'TelemetryDeck.SDK.version': version,
    'TelemetryDeck.SDK.nameAndVersion': sdkNameAndVersion,
    ...extra,
  };
}

// The endpoint takes exactly one event per request.
function serialize(event) {
  return JSON.stringify(event);
}

export function send(event) {
  return fetch(api, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: serialize(event),
  });
}

// Used while the page is being hidden or unloaded. The body is sent as a plain
// string (`text/plain`), which needs no CORS preflight and therefore survives
// the unload; the ingest server parses JSON regardless of the content type.
export function sendBeacon(event) {
  const data = serialize(event);

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
