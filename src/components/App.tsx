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
            // <Loader ref={ref}/>
        <div id='app-wrapper'>
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
                maxStrokeLen={200}
                rerenderAll={true} // Warning: slows down quickly when true
            />
        </div>
    );
}

export default App;
