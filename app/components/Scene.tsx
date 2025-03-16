import { Canvas } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
} from "@react-three/postprocessing";
import DynamicPolygon from "../components/ui/DynamicPolygon";
import SeqRingWrapper from "../components/ui/SeqRingWrapper";
import { Environment, OrbitControls } from "@react-three/drei";
import { colors } from "../styles/colors";

interface SceneProps {
  sides: number;
  angleOfRotation: number;
  className?: string;
}

const Scene: React.FC<SceneProps> = ({ sides, angleOfRotation }) => {
  return (
    <div className="w-full h-[800px]">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={[colors.background]} />
        <Environment preset="night" environmentIntensity={0.8} />
        <ambientLight intensity={0.1} />
        <directionalLight position={[3, 13, 2]} intensity={0.8} />
        <OrbitControls enableZoom={false} />
        <DynamicPolygon
          sides={sides}
          outerRadius={2.1}
          innerRadius={1.8}
          height={0.2}
          color={colors.polygon}
          transparent
          metalness={2.4}
          roughness={0.27}
          angleOfRotation={angleOfRotation}
        />
        <SeqRingWrapper radius={2.3} markerSize={0.15} />
        <EffectComposer>
          <Bloom
            intensity={0.12}
            luminanceThreshold={0.8}
            luminanceSmoothing={0.8}
          />
          <ChromaticAberration opacity={2} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default Scene;
