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

## Events

The SDK sends two events per page load to the Web events v3 endpoint (`https://nom.telemetrydeck.com/v3/w/`). Each request carries one flat event; every parameter sits at the top level of the event and keeps its JSON type. The ingest server fills in `receivedAt` and the default `type` (`pageview`), and derives browser, system, location and campaign data from the request itself.

### `pageview`

Sent as soon as the script loads. Contains the page `url`, the `referrer`, the browser `locale`, `isTestMode` (`"true"` or `"false"`) and the SDK version (`TelemetryDeck.SDK.name`, `TelemetryDeck.SDK.version` and `TelemetryDeck.SDK.nameAndVersion`).

### `TelemetryDeck.Web.pageLeave`

Sent once per page load, the first time the page is hidden or unloaded (tab switched, tab closed, navigation to another page). It reports how far visitors scrolled and how long the page was actually visible, as top-level parameters of the event:

| Parameter                                           | Value                                                                                                                       |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `TelemetryDeck.PageEngagement.scrollDepth`          | Deepest point of the page that was in view, in percent (`0`–`100`). A page that fits the viewport counts as `100`.          |
| `TelemetryDeck.PageEngagement.scrollDepthMilestone` | The highest milestone reached: `"0"`, `"25"`, `"50"`, `"75"` or `"100"`. Handy as a dimension for donut charts and funnels. |
| `TelemetryDeck.PageEngagement.engagedSeconds`       | Seconds the page was visible in the foreground, rounded to whole seconds.                                                   |

The event carries the same `url` and `referrer` as the `pageview`, so both can be joined per page.

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

## Testing locally

Events sent from `localhost`, `127.0.0.1` or `file:` URLs are marked as test mode automatically. You can force test mode with `data-is-test-mode="true"` and point the SDK at a different ingest server with `data-api` (for example `data-api="http://localhost:8080/v3/w/"` for a locally running ingest server).

## 📱 You need an App ID

Every application and website registered to TelemetryDeck has its own unique ID that we use to assign incoming signals to the correct app. To get started, create a new app in the TelemetryDeck UI and copy its ID.

## 📚 Full Docs

Go to [telemetrydeck.com/docs](https://telemetrydeck.com/docs) to see all documentation articles
