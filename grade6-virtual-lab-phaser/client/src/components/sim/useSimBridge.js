export function attachBridge(game, { onMeasurement }) {
  const handler = (payload) => onMeasurement?.(payload);
  game.events.on("MEASUREMENT", handler);

  return () => {
    game.events.off("MEASUREMENT", handler);
  };
}