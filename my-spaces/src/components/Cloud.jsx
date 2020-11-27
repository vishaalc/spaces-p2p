import React from "react";
import SimplexNoise from "simplex-noise";
import Cloud from "../models/Cloud";
import { Floating } from "spacesvr";
import { useFrame } from "react-three-fiber";
import { Vector3 } from "three";

const MOVEMENT_SPEED = 1;
const NUM_CLOUDS = 50;

// sky
// movement
// position
const Clouds = (props) => {
  const group = React.useRef();
  const simplex = React.useMemo(() => new SimplexNoise(), []);

  const clouds = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < NUM_CLOUDS; i++) {
      // edit initial data for cloud
      const num = Math.floor(Math.random() * 3) + 1;
      const x = 100 * 2 * (Math.random() - 0.5);
      const y = -70 * Math.random();
      //const y = 100 * 2 * (Math.random() - 0.5);
      const z = 100 * 2 * (Math.random() - 0.5);

      const rotX = (Math.PI / 2) * 2 * (Math.random() - 0.5);

      const scaleX = 1 + 0.9 * Math.random();

      arr.push({
        seed: Math.random(),
        num: num,
        position: [x, y, z],
        rotation: [rotX, y, z],
        scale: [scaleX, scaleX, scaleX]
      });
    }
    return arr;
  }, []);

  console.log(clouds);

  useFrame(({ clock }, delta) => {
    if (group.current) {
      let count = 0;
      for (const child of group.current.children) {
        const cloud = clouds[count];

        // edit values over time
        //child.position.y = 5 * Math.sin(clock.getElapsedTime() * cloud.seed);
        child.position.x += delta * cloud.scale[0];

        if (child.position.x > 100) {
          child.position.x = -100;
        }

        // child.position.z = 5 * Math.sin(clock.getElapsedTime() * cloud.seed);

        count++;
      }
    }
  });

  return (
    <group ref={group} position={[0, 15, 0]}>
      {clouds.map((cloud) => (
        <Cloud {...cloud} key={cloud.seed} />
      ))}
    </group>
  );
};

export default Clouds;
