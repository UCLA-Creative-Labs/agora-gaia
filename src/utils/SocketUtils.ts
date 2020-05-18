import io from 'socket.io-client'

import { CoordPath } from './PaintUtils';
import { isLocalStorageAvailable } from './StorageUtils';
import { debug } from './Utils';

const socket = process.env.NODE_ENV === 'production'
                ? io(process.env.REACT_APP_SOCKET_SERVER)
                : io({path: '/socket'});
console.log(process.env.NODE_ENV);
console.log(process.env.REACT_APP_SOCKET_SERVER);

socket.emit('init', getTimestampFromStorage());

function getTimestampFromStorage(): number {
    if (!isLocalStorageAvailable()) return 0;

    return Number(window.localStorage.getItem('most_recent') || 0);
}

export function handleHandshake(callback: (data: Handshake) => any) {
    socket.on('handshake', callback);
}

export function unregisterHandshake(callback: (data: Handshake) => any) {
    socket.off('handshake', callback);
}

export function unregisterAllHandshake() {
    socket.off('handshake');
}

export function handlePackage(callback: (data: CoordPath[]) => any) {
    socket.on('package', callback);
}

export function unregisterPackage(callback: (data: CoordPath[]) => any) {
    socket.off('package', callback);
}

export function handleStroke(callback: (data: CoordPath) => any) {
    socket.on('stroke', callback);
}

export function unregisterStroke(callback: (data: CoordPath) => any) {
    socket.off('stroke', callback);
}

export function reset(callback: (data: any) => any){
    socket.on('reset', callback);
}

export function unregisterReset(callback: (data: any) => any) {
    socket.off('reset', callback);
}

export function handleUndo(callback: (isErased: boolean) => any){
    socket.on('erase', callback);
}

export function unregisterUndo(callback: (isErased: boolean) => any){
    socket.off('erase', callback);
}

export function unregisterAllUndo() {
    socket.off('erase');
}

export function handleDisableUndo(callback: (disableUndo: boolean) => any) {
    socket.on('disableundo', callback);
}

export function unregisterDisableUndo(callback: (disableUndo: boolean) => any) {
    socket.off('disableundo', callback);
}

export function handleDrawLimit(callback: (limit: number) => any){
    socket.on('limit', callback);
    debug('registering draw limit handler');
}

export function unregisterDrawLimit(callback: (limit: number) => any) {
    socket.off('limit', callback);
}

export function sendStroke(stroke: CoordPath) {
    socket.emit('update', stroke);
}

export function sendUndo(isErased: boolean) {
    socket.emit('undo', null);
}

export interface Handshake{
    last_send: any, can_undo: boolean
}

export default socket;
