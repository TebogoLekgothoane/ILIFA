declare module '*.jpg' {
  const value: number;
  export default value;
}

declare module '*.png' {
  const value: number;
  export default value;
}

declare module '*.wav' {
  const value: number;
  export default value;
}

declare module '*.mp3' {
  const value: number;
  export default value;
}

declare module '*.mp4' {
  const value: number;
  export default value;
}

declare module '*.glb' {
  const value: number;
  export default value;
}

declare module 'expo-gl' {
  export const GLView: any;
}

declare module 'expo-three' {
  export const Renderer: any;
  export const THREE: any;
  export const loadAsync: any;
}

declare module 'three/examples/jsm/loaders/GLTFLoader' {
  export const GLTFLoader: any;
}
