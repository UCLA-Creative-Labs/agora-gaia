import io from 'socket.io-client'

import { CoordPath } from './PaintUtils';
const socket = io({path: '/socket'});
// const socket = io("http://129.146.146.29:3000/");

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

export default socket;

export interface Handshake{
    last_send: any, can_undo: boolean
}
