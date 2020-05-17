import io from 'socket.io-client'

import { CoordPath } from './PaintUtils';
const socket = io({path: '/socket'});
// const socket = io("http://129.146.146.29:3000/");

export function handleHandshake(callback: (data: any) => any) {
    socket.on('handshake', callback);
}

export function handlePackage(callback: (data: CoordPath[]) => any) {
    socket.on('package', callback);
}

export function handleStroke(callback: (data: CoordPath) => any) {
    socket.on('stroke', callback);
}

export function reset(callback: (data: any) => any){
    socket.on('reset', callback);
}

export function handleUndo(callback: (isErased: boolean) => any){
    socket.on('erase', callback);
}

export function handleDrawLimit(callback: (limit: number) => any){
    socket.on('limit', callback);
}


export function sendStroke(stroke: CoordPath) {
    socket.emit('update', stroke);
}

export function sendUndo(isErased: boolean) {
    socket.emit('undo', null);
}

export default socket;

export interface Handshake{
    last_send: any, can_undo: boolean
}