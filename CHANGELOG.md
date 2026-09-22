## v3.0.0 (unreleased)

#### :rocket: Enhancement
* Send a `TelemetryDeck.Web.pageLeave` event when a page is hidden or unloaded, carrying scroll depth and engaged time as `TelemetryDeck.PageEngagement.*` parameters. On by default, opt out with `data-page-engagement="false"`.
* Send events to the Web events v3 endpoint (`/v3/w/`) as flat events. Parameters sit at the top level of the event instead of inside a `payload` object and keep their JSON types, so numbers such as scroll depth arrive as numbers. `isTestMode` is always sent, as the string `"true"` or `"false"`.

#### :boom: Breaking Change
* The default `data-api` is now `https://nom.telemetrydeck.com/v3/w/`. A custom `data-api` must point at a Web events v3 endpoint; the `/v2/w/` endpoint does not accept the new request format.
* `telemetryClientVersion` is no longer sent. Use `TelemetryDeck.SDK.name`, `TelemetryDeck.SDK.version` or `TelemetryDeck.SDK.nameAndVersion` instead.

## v1.0.5 (2022-05-27)

#### :rocket: Enhancement
* [#10](https://github.com/TelemetryDeck/JavaScriptSDK/pull/10) Improve error message when crypto is not available ([@winsmith](https://github.com/winsmith))

#### Committers: 1
- Daniel Jilg ([@winsmith](https://github.com/winsmith))

## v1.0.4 (2022-03-23)

#### :bug: Bug Fix
* [#8](https://github.com/TelemetryDeck/JavaScriptSDK/pull/8) Always attach a TelemetryDeck SDK instance to window ([@pichfl](https://github.com/pichfl))

#### Committers: 1
- Florian Pichler ([@pichfl](https://github.com/pichfl))

## v1.0.3 (2022-03-21)

#### :bug: Bug Fix
* [#7](https://github.com/TelemetryDeck/JavaScriptSDK/pull/7) Publish SDK Version with each request ([@winsmith](https://github.com/winsmith))

#### Committers: 1
- Daniel Jilg ([@winsmith](https://github.com/winsmith))

## v1.0.2 (2022-03-21)

#### :house: Internal
* [#6](https://github.com/TelemetryDeck/JavaScriptSDK/pull/6) Fix release action ([@winsmith](https://github.com/winsmith))

#### Committers: 1
- Daniel Jilg ([@winsmith](https://github.com/winsmith))

## v1.0.1 (2022-01-21)

#### :house: Internal
* [#3](https://github.com/TelemetryDeck/JavaScriptSDK/pull/3) Update package and release configuration ([@pichfl](https://github.com/pichfl))

#### Committers: 1
- Florian Pichler ([@pichfl](https://github.com/pichfl))

## v1.0.0 (2022-01-21)

#### :rocket: Enhancement
* [#2](https://github.com/TelemetryDeck/JavaScriptSDK/pull/2) Allow loading of script to be deferred ([@pichfl](https://github.com/pichfl))

#### Committers: 1
- Florian Pichler ([@pichfl](https://github.com/pichfl))

