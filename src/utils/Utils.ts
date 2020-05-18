// General utility functions

// Print a message to the console only if in development mode.
export function debug(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV !== 'production')
        console.log(message);
}
