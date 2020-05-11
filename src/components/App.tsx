import React from 'react';

import Paint from './Paint';

import './styles/App.scss';

function App() {
    return (
        <div className="test">
            <Paint width={500} height={500} lineWidth={2} />
        </div>
    );
}

export default App;
