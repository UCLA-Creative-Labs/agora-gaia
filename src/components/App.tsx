import React, { useState, useEffect } from 'react';

import Paint from './Paint';

import { useWindowSize } from '../utils/Hooks';

import './styles/App.scss';

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
                rerenderAll={false} // Warning: slows down fast when true
            />
        </div>
    );
}

export default App;
