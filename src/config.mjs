// Read once at load time: `document.currentScript` is only available while the
// script element is executing, so this module must be evaluated first.
const script = document.currentScript;
const dataset = script ? script.dataset : {};
const { location = {} } = globalThis;

export const appId = dataset.appId;
export const api = dataset.api ?? 'https://nom.telemetrydeck.com/v2/w/';

// Page engagement (scroll depth, engaged time) is on by default; opt out with
// `data-page-engagement="false"`.
export const pageEngagement = dataset.pageEngagement !== 'false';

// Automatic tracking of clicks on outbound links is on by default; opt out
// with `data-outbound-links="false"`. Elements marked `data-td-link` are
// tracked either way.
export const outboundLinks = dataset.outboundLinks !== 'false';

export const isTestMode =
  dataset.isTestMode === 'true' ||
  /^localhost$|^127(\.\d+){0,2}\.\d+$|^\[::1?]$/.test(location.hostname) ||
  'file:' === location.protocol;
