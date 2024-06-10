import { version } from '../package.json';
import { assert } from './utils/assert.mjs';

const script = document.currentScript;
const appId = script.dataset.appId;
const isTestMode = script.dataset.isTestMode === 'true';
const api = script.dataset.api ?? 'https://nom.telemetrydeck.com/v2/w/';
const { language: locale } = navigator;
const { location = {} } = globalThis;

assert(appId, '"data-app-id" missing');

const body = {
  appID: appId,
  url: location.href,
  referrer: document.referrer,
  telemetryClientVersion: `WebSDK ${version}`,
  locale,
};

if (
  isTestMode ||
  /^localhost$|^127(\.\d+){0,2}\.\d+$|^\[::1?]$/.test(location.hostname) ||
  'file:' === location.protocol
) {
  body.isTestMode = true;
}

fetch(api, {
  method: 'POST',
  mode: 'cors',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});
