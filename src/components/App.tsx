import React, { useState, useEffect } from 'react';

import Paint from './Paint';

import './styles/App.scss';

function useWindowSize() {
  const isClient = typeof window === 'object';

  function getSize() {
    return {
      width: isClient ? window.innerWidth : undefined,
      height: isClient ? window.innerHeight : undefined
    };
  }

  const [windowSize, setWindowSize] = useState(getSize);

  useEffect(() => {
    if (!isClient) {
      return null;
    }

    function handleResize() {
      setWindowSize(getSize());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return windowSize;
}

function App() {
    const size = useWindowSize();
    console.log(size);

    const canvasWidth = 0.8 * size.width;
    const canvasHeight = 0.85 * size.height;

    return (
        <div id='app-wrapper'>
            <Paint
                width={canvasWidth}
                height={canvasHeight}
                lineWidth={2}
                smoothness={2}
                thinning={0.3}
                colors={[
                    'black',
                    'red', 'orange', 'yellow',
                    'green',
                    'blue', 'indigo', 'violet'
                ]}
                maxStrokeLen={0}
            />
        </div>
    );
}

export default App;
