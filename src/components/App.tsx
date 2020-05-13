import React from 'react';

import Paint from './Paint';

import './styles/App.scss';

function App() {
    return (
        <div>
            <Paint
                width={1000}
                height={800}
                lineWidth={2}
                smoothness={2}
                thinning={0.3}
                colors={[
                    'black',
                    'red', 'orange', 'yellow',
                    'green',
                    'blue', 'indigo', 'violet'
                ]}
            />
        </div>
    );
}

export default App;
