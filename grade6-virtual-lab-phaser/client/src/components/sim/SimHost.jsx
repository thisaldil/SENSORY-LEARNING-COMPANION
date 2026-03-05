import React, { useEffect, useRef } from "react";

// Dynamic scene imports — maps labKey → scene module path
const SCENE_MAP = {
  L1_LivingSortScene:       () => import("../../scenes/L1_LivingSortScene.js"),
  L2_AirHasMassScene:       () => import("../../scenes/L2_AirHasMassScene.js"),
  L3_SalinityMassScene:     () => import("../../scenes/L3_SalinityMassScene.js"),
  L4_WindTurbineScene:      () => import("../../scenes/L4_WindTurbineScene.js"),
  L5_LightTransmissionScene:() => import("../../scenes/L5_LightTransmissionScene.js"),
  L6_SoundVibrationScene:   () => import("../../scenes/L6_SoundVibrationScene.js"),
  L7_MagnetStrengthScene:   () => import("../../scenes/L7_MagnetStrengthScene.js"),
  L8_SimpleCircuitScene:    () => import("../../scenes/L8_SimpleCircuitScene.js"),
  L9_SolarHeatingScene:     () => import("../../scenes/L9_SolarHeatingScene.js"),
  L10_FoodWebScene:         () => import("../../scenes/L10_FoodWebScene.js"),
  L11_RainGaugeScene:       () => import("../../scenes/L11_RainGaugeScene.js"),
};

export default function SimHost({ labKey, config, onMeasurement }) {
  const containerRef = useRef(null);
  const gameRef      = useRef(null);
  const cleanupRef   = useRef(null);

  useEffect(() => {
    if (!labKey || !containerRef.current) return;

    let cancelled = false;

    async function boot() {
      // Lazy-load Phaser only when needed
      const [{ default: Phaser }, sceneModule] = await Promise.all([
        import("phaser"),
        (SCENE_MAP[labKey] ?? (() => Promise.resolve({ default: null })))(),
      ]);

      if (cancelled) return;

      const SceneClass = sceneModule?.default;
      if (!SceneClass) {
        console.warn(`[SimHost] No scene found for labKey: ${labKey}`);
        return;
      }

      // Destroy any existing game
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }

      const scene = new SceneClass({ labConfig: config ?? {} });

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        width: 960,
        height: 540,
        backgroundColor: "#080d14",
        parent: containerRef.current,
        scene,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        audio: { disableWebAudio: true },
      });

      gameRef.current = game;

      // Bridge: receive MEASUREMENT events from scene → React
      const handler = (payload) => onMeasurement?.(payload);
      game.events.on("MEASUREMENT", handler);
      cleanupRef.current = () => game.events.off("MEASUREMENT", handler);
    }

    boot().catch(console.error);

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [labKey]);   // intentionally omit config/onMeasurement to avoid restarts

  return (
    <div className="canvas-wrap" ref={containerRef} style={{ minHeight: 320 }} />
  );
}