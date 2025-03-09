import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import DynamicPolygon from "./ui/DynamicPolygon";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
} from "@react-three/postprocessing";
import SeqRingWrapper from "./ui/SeqRingWrapper";
import { SequencerProvider } from "../context/SequencerProvider";

interface SceneProps {
  sides: number;
  angleOfRotation: number;
  className?: string;
}

const Scene: React.FC<SceneProps> = ({
  sides,
  angleOfRotation,
  className = "",
}) => {
  return (
    <div
      id="canvas-container"
      className={`w-11/12 aspect-square mx-auto ${className}`}
    >
      <SequencerProvider>
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <color attach="background" args={["#c1c1c1"]} />
          <Environment preset="night" environmentIntensity={0.8} />
          <ambientLight intensity={0.1} />
          <directionalLight position={[3, 13, 2]} intensity={0.8} />
          <OrbitControls enableZoom={false} />
          <DynamicPolygon
            sides={sides}
            outerRadius={2}
            innerRadius={1.8}
            height={0.2}
            color="#dbdbdb"
            transparent={true}
            metalness={1.8}
            roughness={0.5}
            angleOfRotation={angleOfRotation}
          />
          <SeqRingWrapper
            radius={2.1}
            markerSize={0.15}
            color="#ffffff"
            activeColor="#ffffff"
            inactiveColor="#666666"
          />
          <EffectComposer>
            <Bloom
              intensity={0.12}
              luminanceThreshold={0.8}
              luminanceSmoothing={0.8}
            />
            <ChromaticAberration opacity={2} />
          </EffectComposer>
        </Canvas>
      </SequencerProvider>
    </div>
  );
};

export default Scene;
