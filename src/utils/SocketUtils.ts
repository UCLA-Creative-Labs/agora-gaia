import io from 'socket.io-client'

import { CoordPath } from './PaintUtils';

const socket = io({ path: '/socket' });

export function handlePackage(callback: (data: CoordPath[]) => any) {
    socket.on('package', callback);
}

export function handleStroke(callback: (data: CoordPath) => any) {
    socket.on('stroke', callback);
}

export function sendStroke(stroke: CoordPath) {
    socket.emit('update', stroke);
}

export default socket;
