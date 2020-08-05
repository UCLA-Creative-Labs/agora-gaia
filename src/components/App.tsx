import React, { useRef } from 'react';

import Paint from './Paint';
import Loader from './Loader'

import { useWindowSize } from '../utils/Hooks';

import './styles/App.scss';

// Wrapper for the entire window. Used to define global properties and settings.
function App() {
    const ref = useRef(null);

    const size = useWindowSize();
    const maxWidth = 3840;
    const maxHeight = 2160;
    const canvasWidth = Math.min(0.8 * size.width, maxWidth);
    const canvasHeight = Math.min(0.85 * size.height, maxHeight);

    const connected = () => {
        ref.current.connected();
    }
    const loaded = () => {
        ref.current.loaded();
    }

    return (
        <div id='app-wrapper'>
            <Loader ref={ref}/>
            <Paint
                connected={connected}
                loaded={loaded}
                width={canvasWidth}
                height={canvasHeight}
                maxWidth={maxWidth}
                maxHeight={maxHeight}
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
                rerenderAll={true} // Warning: slows down quickly when true
            />
        </div>
    );
}

export default App;
