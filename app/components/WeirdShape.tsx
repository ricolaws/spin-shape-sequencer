import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  N8AO,
  TiltShift2,
} from "@react-three/postprocessing";

export const WeirdShape = () => {
  const Knot = (props: any) => (
    <mesh receiveShadow castShadow {...props}>
      <torusKnotGeometry args={[1.6, 0.6, 258, 32]} />
      <meshPhysicalMaterial
        transmission={0.27} // Transparency level
        thickness={0.95} // Glass thickness
        roughness={0.1} // Surface smoothness
        ior={1.7} // Index of refraction (1.5 is close to real glass)
        envMapIntensity={1} // Environment map brightness
        clearcoat={0.19} // Additional reflective layer
        clearcoatRoughness={0.27}
        transparent={true}
        opacity={0.8}
      />
    </mesh>
  );
  return (
    <div id="canvas-container" className="w-11/12 aspect-square">
      <Canvas camera={{ position: [0, 0, 10] }} shadows>
        <ambientLight intensity={0.03} />
        <pointLight position={[10, 8, 12]} intensity={0.8} />
        <Float floatIntensity={3}>
          <mesh>
            <Knot />
          </mesh>
        </Float>
        <ContactShadows
          scale={100}
          position={[0, -7.5, 0]}
          blur={1}
          far={100}
          opacity={0.85}
        />
        <Environment preset="sunset">
          <Lightformer
            intensity={5}
            position={[12, 25, 1]}
            scale={[10, 50, 2]}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
          />
        </Environment>
        <EffectComposer enableNormalPass={false}>
          <N8AO aoRadius={11} intensity={11} />
          <Bloom
            mipmapBlur
            luminanceThreshold={0.9}
            intensity={0.13}
            levels={2}
          />
          <TiltShift2 blur={12} />
        </EffectComposer>
        <OrbitControls />
      </Canvas>
    </div>
  );
};
