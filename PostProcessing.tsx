
import React from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

const PostProcessing: React.FC = () => {
  return (
    <EffectComposer disableNormalPass>
      <Bloom 
        intensity={1.5} 
        luminanceThreshold={0.1} 
        luminanceSmoothing={0.9} 
        radius={0.4}
      />
    </EffectComposer>
  );
};

export default PostProcessing;
