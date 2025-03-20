import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import DynamicPolygon from "../components/ui/DynamicPolygon";
import SeqRingWrapper from "../components/ui/SeqRingWrapper";
import { Environment, OrbitControls } from "@react-three/drei";
import { colors } from "../styles/colors";

interface SceneProps {
  sidesA: number;
  sidesB: number;
  angleOfRotation: number;
  className?: string;
}

const Scene: React.FC<SceneProps> = ({ sidesA, sidesB, angleOfRotation }) => {
  return (
    <div className="w-full min-h-[900px]">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={[colors.background]} />
        <Environment preset="sunset" environmentIntensity={0.5} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[-2, 8, 4]} intensity={0.3} />
        <OrbitControls enableZoom={false} />

        {/* Polygon A (outer) */}
        <DynamicPolygon
          sides={sidesA}
          outerRadius={2.4}
          innerRadius={2.1}
          color={colors.polygon}
          angleOfRotation={angleOfRotation}
        />
        <SeqRingWrapper target="A" radius={2.55} markerSize={0.15} posZ={0} />

        {/* Polygon B (inner) */}
        <DynamicPolygon
          sides={sidesB}
          outerRadius={1.6}
          innerRadius={1.3}
          position={[0, 0, 0.6]}
          color={colors.polygon}
          angleOfRotation={angleOfRotation}
        />
        <SeqRingWrapper target="B" radius={1.75} markerSize={0.15} posZ={0.6} />

        <EffectComposer>
          <Bloom
            intensity={0.12}
            luminanceThreshold={0.8}
            luminanceSmoothing={0.8}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default Scene;
