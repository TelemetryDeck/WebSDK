import { appId, pageEngagement } from './config.mjs';
import { assert } from './utils/assert.mjs';
import { buildBody, send } from './send.mjs';
import { trackPageEngagement } from './page-engagement.mjs';
import { trackLinkClicks } from './outbound-links.mjs';

assert(appId, '"data-app-id" missing');

send(buildBody());

if (pageEngagement) {
  trackPageEngagement();
}

trackLinkClicks();
