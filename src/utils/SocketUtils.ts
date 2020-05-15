import io from 'socket.io-client'

const socket = io({ path: '/socket' });

export default socket;
