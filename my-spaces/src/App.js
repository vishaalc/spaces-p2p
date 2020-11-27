import React from "react";
import { Color, Vector3 } from "three";
import {
  StandardEnvironment,
  Background,
  Logo,
  Interactable,
  Image
} from "spacesvr";
import Clouds from "./components/Cloud";
import Mountain from "./components/Mountain";

export default function App() {
  return (
    <StandardEnvironment
      player={{ pos: new Vector3(0, 1, -48), rot: Math.PI / 2 }}
      canvasProps={{ camera: { far: 300 } }}
    >
      <Background color={0xffffff} />
      <Logo floating rotating position={new Vector3(0, 1.25, 0)} />
      <fog attach="fog" args={[0xffffff, 10, 110]} />
      <ambientLight />
      <directionalLight />
      <Clouds />
      <Mountain />
      <Image
        src="https://pbs.twimg.com/profile_images/1328479719268917248/IfA5A1_S_400x400.jpg"
        ratio={[1, 1]}
      />
      <mesh position-z={-30} position-y={-0.01}>
        <boxBufferGeometry args={[2, 0.2, 50, 4, 1, 100]} />
        <meshStandardMaterial color={0xc377e0} transparent opacity={0.94} />
      </mesh>
      <mesh position-z={-30} position-y={-0.01}>
        <boxBufferGeometry args={[2, 0.2, 50, 4, 1, 100]} />
        <meshStandardMaterial color={0xc377e0} wireframe />
      </mesh>
    </StandardEnvironment>
  );
}