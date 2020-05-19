import React, { useEffect, useState } from 'react';

import './styles/Paint.scss';

import {
    TimerProps
} from '../utils/PaintUtils';
import { millisToMinSec } from '../utils/MathUtils';
import { debug } from '../utils/Utils';

// A threshold beyond which the displayed number is considered "unreasonably large".
const UPPER_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

// Component to hold the onscreen timer.
function Timer(props: TimerProps) {
    const [ waitTime, setWaitTime ] = useState(0);
    const [ timerVisible, setTimerVisible ] = useState(false);

    // Every tenth of a second, update the timer accordingly.
    useEffect(() => {
        debug('watching timer with limit = ' + props.limit);
        const interval = setInterval(() => {
            setWaitTime(Math.max(0, props.limit - Date.now() + props.lastSend));
        }, 100);

        return () => {
            clearInterval(interval);
        }
    }, [props.limit, props.lastSend]);

    useEffect(() => {
        if (waitTime > 0 && waitTime <= UPPER_THRESHOLD)
            setTimerVisible(true);
        else setTimerVisible(false);
    }, [waitTime]);

    return (
        <h3 id='timer' className={timerVisible ? 'shown' : 'hidden'}>
            {millisToMinSec(waitTime)}
        </h3>
    );
}

export default Timer;
