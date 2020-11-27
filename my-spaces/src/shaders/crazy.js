import { Color, Vector2, Vector3, Vector4 } from "three";
import { extend } from "react-three-fiber";
import { shaderMaterial } from "@react-three/drei";

const CrazyMaterial = shaderMaterial(
  {
    resolution: new Vector2(2000, 2000),
    time: 0,
    fogColor: new Color(0xffffff),
    fogNear: 10,
    fogFar: 110,
    fog: true
  },
  `
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix 
      * modelViewMatrix 
      * vec4( position, 1.0 );
  }`,
  `
  #define FOGMODE_NONE 0.
#define FOGMODE_EXP 1.
#define FOGMODE_EXP2 2.
#define FOGMODE_LINEAR 3.
#define E 2.71828

  precision highp float;
  precision highp int;
  const float RAINBOW_SPLINE_SIZE = 6.0;
  
  uniform float time;
  varying vec2 vUv;
  uniform float fogNear;
  uniform float fogFar;
  uniform vec3 fogColor;

  vec3 GetRainbowColor(float i){
    if(i == 0.0){
      return vec3(1.0, 0.0, 0.0); // Red
    }
      else if(i == 1.0){
      return vec3(1.0, 0.5, 0.0); // Orange
    }
    else if(i == 2.0){
      return vec3(1.0, 1.0, 0.0); // Yellow
    }
    else if(i == 3.0){
      return vec3(0.0, 1.0, 0.0); // Green	
      }
    else if(i == 4.0){
      return vec3(0.0, 0.0, 1.0); // Blue	
    }
    else if (i == 5.0){
          return vec3(0.27, 0.0, 0.51); // Purple
    }
    else if (i == 6.0){
      return vec3(0.57, 0.0, 1.0); // Violet	
    }
  
    return vec3(1.0, 1.0, 1.0); // should never get here.
  }

  vec3 CatmullRomSpline(float x, vec3 v0, vec3 v1, vec3 v2, vec3 v3) 
{
    // Note: this spline will go through it's support points.
	vec3 c2 = -.5 * v0				+ 0.5 *v2;
	vec3 c3 = 		v0	+ -2.5*v1 	+ 2.0 *v2 + -.5*v3;
	vec3 c4 = -.5 * v0	+ 1.5 *v1 	+ -1.5*v2 + 0.5*v3;
	return(((c4 * x + c3) * x + c2) * x + v1);
}

  vec3 EvaluateRainbowSpline(float x){
    // x must be in range [0.0,1.0]
    float scaledX = clamp(x, 0.0, 1.0) * RAINBOW_SPLINE_SIZE;
    
    // Determine which 'rainbox segment' we are evluating:
    float segmentIndex = floor(scaledX);
    
    // Note that you evaluate between v1 and v2, using v0 and v3 as control points:
    vec3 v0 = GetRainbowColor(segmentIndex-1.0);
    vec3 v1 = GetRainbowColor(segmentIndex+0.0);
    vec3 v2 = GetRainbowColor(segmentIndex+1.0);
    vec3 v3 = GetRainbowColor(segmentIndex+2.0);
    
    return CatmullRomSpline(fract(scaledX), v0,v1,v2,v3);
}

  float hash(in vec2 p){
    // Transform 2D parameter into a 1D value:
    // Note: higher value means 'higher frequency' when plugging uv coordinates.
    float h = dot(p, vec2(12.34, 56.78));
    
    // Use a sinusoid function to create both positive and negative numbers.
    // Multiply by a big enough number and then taking only the fractional part creates a pseudo-random value.
    return fract(cos(h)*12345.6789);
}

  float perlinNoise( in vec2 p )
{
    // see: http://webstaff.itn.liu.se/~stegu/TNM022-2005/perlinnoiselinks/perlin-noise-math-faq.html#whatsnoise
    vec2 i = floor(p); // Use hashing with this to fake a gridbased value noise.
    vec2 f = fract(p);
	
    // Using this 'ease curve' generates more visually pleasing noise then without.
    // Function describes a function similar to a smoothstep.
	vec2 u = f*f*(3.0-2.0*f);

    return mix( mix(hash(i + vec2(0.0,0.0)), 
                    hash(i + vec2(1.0,0.0)), u.x),
                mix(hash(i + vec2(0.0,1.0)), 
                    hash(i + vec2(1.0,1.0)), u.x), u.y);
}

  float fractalSumNoise(in vec2 p){
    float value = 0.0;
    
    float f = 1.0;
    
    // Experimentation yielded 5 itterations gave optimal results. Less itterations gave too
    // blotchy result, and more itterations did no longer have any significant visual impact.
    for (int i = 0; i < 10; i++){
        value += perlinNoise(p * f)/f;
        f = f * 2.0;
    }
    
    return value;
}

  float hash3(in vec3 p){
    // Transform 3D parameter into a 1D value:
    // Note: higher value means 'higher frequency' when plugging uv coordinates.
    float h = dot(p, vec3(123.45, 678.91, 234.56));
    
    // Use a sinusoid function to create both positive and negative numbers.
    // Multiply by a big enough number and then taking only the fractional part creates a pseudo-random value.
    return fract(cos(h)*12345.6789);
}

  float perlinNoise3( in vec3 p )
{
    // see: http://webstaff.itn.liu.se/~stegu/TNM022-2005/perlinnoiselinks/perlin-noise-math-faq.html#whatsnoise
    vec3 i = floor(p); // Use hashing with this to fake a gridbased value noise.
    vec3 f = fract(p);
	
    // Using this 'ease curve' generates more visually pleasing noise then without.
    // Function describes a function similar to a smoothstep.
	vec3 u = f*f*(3.0-2.0*f);

    float dx1 = mix(hash3(i + vec3(0.0,0.0,0.0)), 
                    hash3(i + vec3(1.0,0.0,0.0)), u.x);
    float dx2 = mix(hash3(i + vec3(0.0,1.0,0.0)), 
                    hash3(i + vec3(1.0,1.0,0.0)), u.x);
    float dy1 = mix(dx1, dx2, u.y);
    
    float dx3 = mix(hash3(i + vec3(0.0,0.0,1.0)), 
                    hash3(i + vec3(1.0,0.0,1.0)), u.x);
    float dx4 = mix(hash3(i + vec3(0.0,1.0,1.0)), 
                    hash3(i + vec3(1.0,1.0,1.0)), u.x);
    float dy2 = mix(dx3, dx4, u.y);
    
    return mix(dy1, dy2, u.z);
}
  
  float fractalSumNoise3(in vec3 p){
    float value = 0.0;
    
    float f = 1.0;
    
    // Experimentation yielded 5 itterations gave optimal results. Less itterations gave too
    // blotchy result, and more itterations did no longer have any significant visual impact.
    for (int i = 0; i < 5; i++){
        value += perlinNoise3(p * f)/f;
        f = f * 2.0;
    }
    
    return value/2.0;
  }

  float pattern( in vec3 p )
  {
    vec3 q = vec3( fractalSumNoise3( p + vec3(0.0,0.0,0.0)),
                    fractalSumNoise3( p + vec3(5.2,1.3,0.7)),
                    fractalSumNoise3( p + vec3(6.7,2.6,1.2)));

    return fractalSumNoise3( p + 4.0*q );
  }

  void main() {
    float depth = gl_FragCoord.z / gl_FragCoord.w;
    float fogFactor = smoothstep( fogNear, fogFar, depth );

    gl_FragColor = vec4(pattern(vec3(5.0*vUv,0.5+0.5*sin(0.3*time))),
    pattern(vec3(5.0*vUv,0.5+0.5*cos(0.3*time))),
    pattern(vec3(0.5+0.5*sin(0.3*time),5.0*vUv)),
    1.0);

    gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
  }
`
);

export default CrazyMaterial;
extend({ CrazyMaterial });
