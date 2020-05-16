import React, { useState, useEffect } from 'react';

import Paint from './Paint';

import { useWindowSize } from '../utils/Hooks';

import './styles/App.scss';

function App() {
    const size = useWindowSize();
    const canvasWidth = 0.8 * size.width;
    const canvasHeight = 0.85 * size.height;
    let socket;

    return (
        <div id='app-wrapper'>
            <Paint
                width={canvasWidth}
                height={canvasHeight}
                maxWidth={3840}
                maxHeight={2160}
                lineWidth={2}
                smoothness={2}
                thinning={0.3}
                // The 16 4-bit ANSI colors
                colors={[
                    'white',
                    'lightgray',
                    'gray',
                    'black',
                    'maroon',
                    'red',
                    'fuchsia',
                    'purple',
                    'navy',
                    'blue',
                    'aqua',
                    'teal',
                    'green',
                    'lime',
                    'olive',
                    'yellow',
                ]}
                maxStrokeLen={0}
                rerenderAll={false} // Warning: slows down quickly when true
            />
        </div>
    );
}

export default App;
