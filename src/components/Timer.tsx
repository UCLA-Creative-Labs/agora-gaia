import React, { useEffect, useState } from 'react';

import './styles/Paint.scss';

import {
    TimerProps
} from '../utils/PaintUtils';
import { millisToMinSec } from '../utils/MathUtils';
import { debug } from '../utils/Utils';

const UPPER_THRESHOLD = 10 * 60 * 1000;

function Timer(props: TimerProps) {
    const [ waitTime, setWaitTime ] = useState(0);
    const [ timerVisible, setTimerVisible ] = useState(false);

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
        if (waitTime > 0 && waitTime < Number.MAX_SAFE_INTEGER - UPPER_THRESHOLD)
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
