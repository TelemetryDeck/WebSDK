export const assert = (value, message) => {
  if (!value) {
    throw new Error(`TelemetryDeck: ${message}`);
  }
};
