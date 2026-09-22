# Telemetry Deck Web

This package allows you to send signals to [TelemetryDeck](https://telemetrydeck.com) from your website or blog.

## Prerequisites

- You'll need access to your website's code to install this package. If you're using a CMS like WordPress, you'll need to be able to edit the theme files.
- You'll need a TelemetryDeck account. [Sign up for free](https://dashboard.telemetrydeck.com/registration/organization?source=websdk) if you don't have one yet.
- You'll need a TelemetryDeck App ID. [Create a new app](https://dashboard.telemetrydeck.com/apps/create) if you don't have one yet.

Note that if you are a programmer working on a node package based JavaScript application, we recommend you use the [TelemetryDeck JavaScript SDK](https://github.com/TelemetryDeck/JavaScriptSDK) instead.

## Installation

Once you have your App ID, edit the source code of your website and add the following code snippet to the `<head>` section of every page, making sure to replace `<YOUR APP ID>` with your actual App ID:

```html
<script
  async
  src="https://cdn.telemetrydeck.com/websdk/telemetrydeck.min.js"
  data-app-id="<YOUR APP ID>"
></script>
```

## Signals

The SDK sends a `pageview` when a page loads, a `TelemetryDeck.Web.pageLeave` signal when it is left, and a `TelemetryDeck.Web.linkClick` signal for every click on an outbound link.

### `pageview`

Sent as soon as the script loads. Contains the page `url`, the `referrer`, the browser `locale` and the SDK version.

### `TelemetryDeck.Web.pageLeave`

Sent once per page load, the first time the page is hidden or unloaded (tab switched, tab closed, navigation to another page). It reports how far visitors scrolled and how long the page was actually visible:

| Parameter                                           | Value                                                                                                                       |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `TelemetryDeck.PageEngagement.scrollDepth`          | Deepest point of the page that was in view, in percent (`0`–`100`). A page that fits the viewport counts as `100`.          |
| `TelemetryDeck.PageEngagement.scrollDepthMilestone` | The highest milestone reached: `"0"`, `"25"`, `"50"`, `"75"` or `"100"`. Handy as a dimension for donut charts and funnels. |
| `TelemetryDeck.PageEngagement.engagedSeconds`       | Seconds the page was visible in the foreground, rounded to whole seconds.                                                   |

The signal carries the same `url` and `referrer` as the `pageview`, so both can be joined per page.

Page engagement tracking is on by default. To turn it off, add `data-page-engagement="false"` to the script tag:

```html
<script
  async
  src="https://cdn.telemetrydeck.com/websdk/telemetrydeck.min.js"
  data-app-id="<YOUR APP ID>"
  data-page-engagement="false"
></script>
```

#### Example: average scroll depth per page

```json
{
  "queryType": "groupBy",
  "granularity": "all",
  "filter": {
    "type": "selector",
    "dimension": "type",
    "value": "TelemetryDeck.Web.pageLeave"
  },
  "dimensions": [{ "type": "default", "dimension": "url", "outputName": "URL" }],
  "aggregations": [
    {
      "type": "doubleMean",
      "name": "Average Scroll Depth",
      "fieldName": "TelemetryDeck.PageEngagement.scrollDepth"
    }
  ]
}
```

### `TelemetryDeck.Web.linkClick`

Sent whenever a visitor clicks a link that leads to another site (a different host than the current page, over `http` or `https`). Same-site links, `mailto:` and `tel:` links are not tracked. The signal is sent with `navigator.sendBeacon`, so it never delays the navigation, and it works for links that are added to the page after it has loaded.

| Parameter                       | Value                                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `TelemetryDeck.Link.url`        | The absolute destination URL. Credentials in the URL are removed; query and fragment are kept.      |
| `TelemetryDeck.Link.host`       | The destination host name, e.g. `example.com`. Handy for a "top outbound sites" chart.              |
| `TelemetryDeck.Link.isOutbound` | `"true"` when the destination is on another site, `"false"` for explicitly tracked same-site links. |

The signal carries the same `url` and `referrer` as the `pageview`, so you can see which pages send visitors where.

#### Tracking buttons and chosen links

Add `data-td-link` to any element to track clicks on it, whether or not it is an outbound link. On a link the attribute can be left empty; on a button or any other element, set it to the destination:

```html
<a href="/pricing" data-td-link>Pricing</a>

<button
  data-td-link="https://buy.example.com/checkout"
  onclick="location.href = 'https://buy.example.com/checkout'"
>
  Buy now
</button>
```

Add `data-td-ignore` to a link, or to any of its ancestors, to never track it:

```html
<a href="https://example.com" data-td-ignore>Not tracked</a>

<nav data-td-ignore>
  <a href="https://mastodon.social/@example">Not tracked either</a>
</nav>
```

#### Tracking only chosen links

To track only the links you marked with `data-td-link` and no other outbound links, add `data-outbound-links="false"` to the script tag:

```html
<script
  async
  src="https://cdn.telemetrydeck.com/websdk/telemetrydeck.min.js"
  data-app-id="<YOUR APP ID>"
  data-outbound-links="false"
></script>
```

#### Example: most clicked outbound sites

```json
{
  "queryType": "topN",
  "granularity": "all",
  "filter": {
    "type": "selector",
    "dimension": "type",
    "value": "TelemetryDeck.Web.linkClick"
  },
  "dimension": { "type": "default", "dimension": "TelemetryDeck.Link.host", "outputName": "Site" },
  "metric": { "type": "numeric", "metric": "Clicks" },
  "threshold": 10,
  "aggregations": [{ "type": "longSum", "name": "Clicks", "fieldName": "count" }]
}
```

## Testing locally

Signals sent from `localhost`, `127.0.0.1` or `file:` URLs are marked as test mode automatically. You can force test mode with `data-is-test-mode="true"` and point the SDK at a different ingest server with `data-api`.

## 📱 You need an App ID

Every application and website registered to TelemetryDeck has its own unique ID that we use to assign incoming signals to the correct app. To get started, create a new app in the TelemetryDeck UI and copy its ID.

## 📚 Full Docs

Go to [telemetrydeck.com/docs](https://telemetrydeck.com/docs) to see all documentation articles
