import { outboundLinks } from './config.mjs';
import { buildBody, sendBeacon } from './send.mjs';

const TYPE = 'TelemetryDeck.Web.linkClick';

const { location = {} } = globalThis;

const isElement = (node) => node && node.nodeType === 1;

// The element that was clicked and its ancestors, innermost first. Prefers
// `composedPath()` so that links inside shadow roots are found too.
function ancestorsOf(event) {
  if (typeof event.composedPath === 'function') {
    return event.composedPath().filter((node) => isElement(node));
  }

  const path = [];

  for (let node = event.target; isElement(node); node = node.parentNode) {
    path.push(node);
  }

  return path;
}

const isAnchor = (element) => element.localName === 'a' && element.getAttribute('href') !== null;

// The innermost element that is either explicitly marked with `data-td-link`
// or an anchor with an `href`. Returns `undefined` when the click happened
// inside an element marked `data-td-ignore`.
function findLink(event) {
  let link;

  for (const element of ancestorsOf(event)) {
    if (element.hasAttribute('data-td-ignore')) {
      return;
    }

    if (!link && (element.hasAttribute('data-td-link') || isAnchor(element))) {
      link = element;
    }
  }

  return link;
}

// The absolute destination URL of a tracked element: the value of
// `data-td-link` if it has one, otherwise the anchor's `href`.
function destinationOf(element) {
  const href = element.getAttribute('data-td-link') || element.getAttribute('href');

  if (!href) {
    return;
  }

  try {
    return new URL(href, location.href);
  } catch {
    return;
  }
}

const isOutbound = (url) => /^https?:$/.test(url.protocol) && url.host !== location.host;

export function trackLinkClicks() {
  const onClick = (event) => {
    // `auxclick` also fires for right clicks, which open the context menu
    // rather than the link.
    if (event.type === 'auxclick' && event.button !== 1) {
      return;
    }

    const element = findLink(event);

    if (!element) {
      return;
    }

    const url = destinationOf(element);

    if (!url) {
      return;
    }

    const outbound = isOutbound(url);

    // Explicitly marked elements are always tracked; everything else only
    // when it leads off-site and automatic tracking is on.
    if (!element.hasAttribute('data-td-link') && !(outboundLinks && outbound)) {
      return;
    }

    url.username = '';
    url.password = '';

    sendBeacon(
      buildBody({
        type: TYPE,
        payload: {
          'TelemetryDeck.Link.url': url.href,
          'TelemetryDeck.Link.host': url.hostname,
          'TelemetryDeck.Link.isOutbound': String(outbound),
        },
      })
    );
  };

  // Capture phase, so that handlers on the link itself cannot stop the
  // event from reaching us, and links added to the page later are covered.
  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);
}
