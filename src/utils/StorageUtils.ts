// Checks if storage is available (either local or session). Defaults to
// false if the storage type is unknown.
//
// Adapted from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
function isStorageAvailable(type: string): boolean {
    let storage;
    switch (type) {
        case 'local'  : storage = window.localStorage;   break;
        case 'session': storage = window.sessionStorage; break;
        default: return false;
    }

    try {
        const x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return e instanceof DOMException && (
            e.code === 22
            || e.code === 1014
            || e.name === 'QuotaExceededError'
            || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        ) && (storage && storage.length !== 0);
    }
}

// Check if local storage specifically is available.
export function isLocalStorageAvailable(): boolean {
   return isStorageAvailable('local');
}

// Check if session storage specifically is available (unused).
export function isSessionStorageAvailable(): boolean {
   return isStorageAvailable('session');
}
