# Telemetry Deck JavaScript SDK

This package allows you to send signals to [TelemetryDeck](https://telemetrydeck.com) from your JavaScript code.

Signals sent with this version of the SDK automatically send the following payload items:

- `url`
- `useragent`
- `locale`
- `platform`

You can filter and show these values in the TelemetryDeck dashboard.

Test Mode is enabled on `localhost` and local IP addresses, as well as when serving via `file://` protocol.

## Usage

### 📄 Usage via Script tag

```html
<script src="https://cdn.jsdelivr.net/npm/@telemetrydeck/web" data-app-id="<YOUR APP ID>"></script>
```

#### Alternative usage for more complex tracking needs

See JavaScript SDK.

## More Info

### 📱 You need an App ID

Every application and website registered to TelemetryDeck has its own unique ID that we use to assign incoming signals to the correct app. To get started, create a new app in the TelemetryDeck UI and copy its ID.


### 📚 Full Docs

Go to [telemetrydeck.com/docs](https://telemetrydeck.com/docs) to see all documentation articles
