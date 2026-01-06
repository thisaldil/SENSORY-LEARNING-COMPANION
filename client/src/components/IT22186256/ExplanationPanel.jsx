export default function ExplanationPanel({ concept, script }) {
  if (!concept || !script) return null;

  // Extract information from JSON script structure
  const scriptStr = JSON.stringify(script).toLowerCase();
  const scenes = script?.scenes || [];
  const duration = script?.duration || 0;
  const durationSeconds = Math.round(duration / 1000);

  // Detect key concepts from script content
  const hasGravity = scriptStr.includes('gravity');
  const hasForce = scriptStr.includes('force');
  const hasVelocity = scriptStr.includes('velocity');
  const hasMass = scriptStr.includes('mass');
  const hasTrajectory = scriptStr.includes('trajectory');
  
  // Detect actor types present
  const actorTypes = new Set();
  scenes.forEach(scene => {
    scene.actors?.forEach(actor => {
      if (actor.type) actorTypes.add(actor.type);
    });
  });
  
  const hasPlant = actorTypes.has('plant');
  const hasSun = actorTypes.has('sun');
  const hasWater = actorTypes.has('water');
  const hasCO2 = actorTypes.has('co2');
  const hasGlucose = actorTypes.has('glucose');
  const hasOxygen = actorTypes.has('oxygen');

  return (
    <div style={{
      marginTop: "20px",
      padding: "16px",
      background: "#f6f8fa",
      borderRadius: "8px",
      border: "1px solid #d1d9e0",
    }}>
      <h3 style={{ 
        fontSize: "16px", 
        fontWeight: "600", 
        marginBottom: "12px",
        color: "#1f2328",
      }}>
        📚 What You're Seeing
      </h3>
      
      <div style={{ fontSize: "14px", color: "#656d76", lineHeight: "1.6" }}>
        <p style={{ marginBottom: "10px" }}>
          This visualization demonstrates: <strong style={{ color: "#1f2328" }}>{concept}</strong>
        </p>
        
        {durationSeconds > 0 && (
          <p style={{ marginBottom: "10px", fontSize: "13px" }}>
            Duration: <strong>{durationSeconds} seconds</strong> • <strong>{scenes.length} scenes</strong>
          </p>
        )}

        {/* Show actor types present */}
        {actorTypes.size > 0 && (
          <div style={{ marginTop: "12px" }}>
            <p style={{ fontWeight: "600", marginBottom: "8px", color: "#1f2328" }}>
              Visual Elements:
            </p>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              {hasPlant && <li>🌱 Plant</li>}
              {hasSun && <li>☀️ Sun</li>}
              {hasWater && <li>💧 Water</li>}
              {hasCO2 && <li>💨 Carbon Dioxide (CO₂)</li>}
              {hasGlucose && <li>🍯 Glucose (Food)</li>}
              {hasOxygen && <li>💨 Oxygen (O₂)</li>}
            </ul>
          </div>
        )}

        {/* Show physics concepts if present */}
        {(hasGravity || hasForce || hasVelocity || hasMass || hasTrajectory) && (
          <div style={{ marginTop: "12px" }}>
            <p style={{ fontWeight: "600", marginBottom: "8px", color: "#1f2328" }}>
              Key Concepts:
            </p>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              {hasGravity && <li>Gravitational force and acceleration</li>}
              {hasForce && <li>Force vectors and direction</li>}
              {hasVelocity && <li>Velocity and motion</li>}
              {hasMass && <li>Mass and its effects</li>}
              {hasTrajectory && <li>Object trajectories</li>}
            </ul>
          </div>
        )}

        {/* Show scene breakdown */}
        {scenes.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <p style={{ fontWeight: "600", marginBottom: "8px", color: "#1f2328" }}>
              Animation Scenes:
            </p>
            <div style={{ fontSize: "12px" }}>
              {scenes.map((scene, idx) => (
                <div key={scene.id || idx} style={{ marginBottom: "6px", paddingLeft: "8px", borderLeft: "2px solid #d1d9e0" }}>
                  <strong>{idx + 1}. {scene.text}</strong>
                  <span style={{ opacity: 0.7, marginLeft: "8px" }}>
                    ({Math.round(scene.duration / 1000)}s)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div style={{ marginTop: "12px", padding: "10px", background: "#ffffff", borderRadius: "6px", border: "1px solid #d1d9e0" }}>
          <p style={{ margin: 0, fontSize: "13px", fontStyle: "italic" }}>
            💡 <strong>Tip:</strong> Use the controls below to pause, adjust speed, or reset the animation to observe different aspects of the concept.
          </p>
        </div>
      </div>
    </div>
  );
}

