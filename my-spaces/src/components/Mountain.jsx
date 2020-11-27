import React, { useEffect } from "react";
import SimplexNoise from "simplex-noise";
import { BufferGeometry, PlaneBufferGeometry } from "three";
import CrazyMaterial from "../shaders/crazy";
import { useFrame } from "react-three-fiber";

const RESOLUTION = 3;
const GRADUAL_INCLINE = 0.25;
const SMOOTHNESS = 20;
const WIDTH = 250;
const HEIGHT = 250;
const TALL = 60;

const Mountain = () => {
  const material = React.useRef(new CrazyMaterial());
  const material1 = React.useRef(new CrazyMaterial());
  const hillRef = React.useRef();
  const simplex = React.useMemo(() => new SimplexNoise(), []);
  const hillGeo = React.useMemo(() => {
    const hillBufferGeo = new PlaneBufferGeometry(
      WIDTH,
      HEIGHT,
      WIDTH * RESOLUTION,
      HEIGHT * RESOLUTION
    );

    const vertices = hillBufferGeo.attributes.position.array;
    const count = hillBufferGeo.attributes.position.count;

    const inclineX = GRADUAL_INCLINE * WIDTH;
    const inclineY = GRADUAL_INCLINE * HEIGHT;
    const MAX_DIST = WIDTH / 2;

    for (let i = 0; i < count; i++) {
      const x = vertices[i * 3];
      const y = vertices[i * 3 + 1];

      const distToCenter = Math.sqrt(x * x + y * y) / MAX_DIST;

      let newZ = 0;
      if (distToCenter < 0.6) {
        let locDistToCenter = (distToCenter - 0.08) / (0.6 - 0.08); // 1 at the outside
        locDistToCenter = 1 - locDistToCenter;
        const mult = Math.pow(locDistToCenter, 1.5);
        newZ = TALL;
        newZ *= mult;
        // newZ += 4 * simplex.noise2D(x / SMOOTHNESS, y / SMOOTHNESS);
        newZ +=
          1 *
          simplex.noise2D(
            (x + 5000) / (SMOOTHNESS * 0.7),
            (y + 5000) / (SMOOTHNESS * 0.7)
          );
        newZ +=
          0.5 *
          simplex.noise2D((x + 10000) / SMOOTHNESS, (y + 10000) / SMOOTHNESS);
        newZ = Math.min(newZ, TALL);
      } else {
        let locDistFromSides = (distToCenter - 0.6) / 0.4;
        // locDistFromSides = Math.abs(2 * (locDistFromSides - 0.5));
        newZ =
          4 * simplex.noise2D(x / (SMOOTHNESS * 0.5), y / (SMOOTHNESS * 0.5));
        newZ *= 1 - locDistFromSides;
      }

      hillBufferGeo.attributes.position.setZ(i, newZ);
    }

    return hillBufferGeo;
  }, []);

  useFrame(({ clock }, delta) => {
    if (material?.current) {
      // @ts-ignore
      material.current.time += delta;
    }
  });

  if (material.current) {
    material.current.fog = true;
  }

  if (material1.current) {
    material1.current.fog = true;
  }

  return (
    <group position-y={-TALL - 0.01}>
      {hillGeo && (
        <mesh
          ref={hillRef}
          rotation-x={-Math.PI / 2}
          geometry={hillGeo}
          position-y={-0.01}
          material={material.current}
        />
      )}
      <mesh
        position-y={0}
        rotation-x={-Math.PI / 2}
        material={material1.current}
      >
        <planeBufferGeometry args={[800, 800]} />
      </mesh>
    </group>
  );
};

export default Mountain;
