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
  src="https://cdn.telemetrydeck.com/websdk/telemetrydeck.min.js"
  data-app-id="<YOUR APP ID>"
></script>
```

## Signals

The SDK sends two signals per page load.

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

## Testing locally

Signals sent from `localhost`, `127.0.0.1` or `file:` URLs are marked as test mode automatically. You can force test mode with `data-is-test-mode="true"` and point the SDK at a different ingest server with `data-api`.

## 📱 You need an App ID

Every application and website registered to TelemetryDeck has its own unique ID that we use to assign incoming signals to the correct app. To get started, create a new app in the TelemetryDeck UI and copy its ID.

## 📚 Full Docs

Go to [telemetrydeck.com/docs](https://telemetrydeck.com/docs) to see all documentation articles
