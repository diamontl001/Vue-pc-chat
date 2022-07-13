"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getOwnerKey = (webContents, contextId) => {
    return `${webContents.id}-${contextId}`;
};
class ObjectsRegistry {
    constructor() {
        this.nextId = 0;
        // Stores all objects by ref-counting.
        // (id) => {object, count}
        this.storage = {};
        // Stores the IDs + refCounts of objects referenced by WebContents.
        // (ownerKey) => { id: refCount }
        this.owners = {};
        this.electronIds = new WeakMap();

        setInterval(()=> {
            let electronIdCount = 0;
            for (const id in this.electronIds) {
                electronIdCount ++;
            }
            let ownnerCount = 0;
            for (const o in this.owners){
                ownnerCount ++;
                if (o instanceof Map) {
                    console.log('------------o', o.size);
                }
            }
            console.log('----------------- object-registry', electronIdCount, ownnerCount);
        }, 60 * 1000)
    }
    // Register a new object and return its assigned ID. If the object is already
    // registered then the already assigned ID would be returned.
    add(webContents, contextId, obj) {
        // Get or assign an ID to the object.
        const id = this.saveToStorage(obj);
        // Add object to the set of referenced objects.
        const ownerKey = getOwnerKey(webContents, contextId);
        let owner = this.owners[ownerKey];
        if (!owner) {
            owner = this.owners[ownerKey] = new Map();
            this.registerDeleteListener(webContents, contextId);
        }
        if (!owner.has(id)) {
            owner.set(id, 0);
            // Increase reference count if not referenced before.
            this.storage[id].count++;
        }
        owner.set(id, owner.get(id) + 1);

        let ownersCount = 0;
        for (const o in this.owners) {
            ownersCount ++;
        }
        let storageCount = 0;
        for (const s in this.storage) {
            storageCount ++;
        }

        // console.log('----- objects-registry add', ownersCount, storageCount, owner.size, contextId, obj);
        return id;
    }
    // Get an object according to its ID.
    get(id) {
        const pointer = this.storage[id];
        if (pointer != null)
            return pointer.object;
    }
    // Dereference an object according to its ID.
    // Note that an object may be double-freed (cleared when page is reloaded, and
    // then garbage collected in old page).
    remove(webContents, contextId, id) {
        const ownerKey = getOwnerKey(webContents, contextId);
        const owner = this.owners[ownerKey];
        if (owner && owner.has(id)) {
            const newRefCount = owner.get(id) - 1;
            // Only completely remove if the number of references GCed in the
            // renderer is the same as the number of references we sent them
            if (newRefCount <= 0) {
                // Remove the reference in owner.
                owner.delete(id);
                // Dereference from the storage.
                this.dereference(id);
            }
            else {
                owner.set(id, newRefCount);
            }
        }
    }
    // Clear all references to objects refrenced by the WebContents.
    clear(webContents, contextId) {
        const ownerKey = getOwnerKey(webContents, contextId);
        const owner = this.owners[ownerKey];
        if (!owner)
            return;
        for (const id of owner.keys())
            this.dereference(id);
        delete this.owners[ownerKey];
    }
    // Saves the object into storage and assigns an ID for it.
    saveToStorage(object) {
        let id = this.electronIds.get(object);
        if (!id) {
            id = ++this.nextId;
            this.storage[id] = {
                count: 0,
                object: object
            };
            console.log('---- objects-registry saveToStorage', object)
            this.electronIds.set(object, id);
        }
        return id;
    }
    // Dereference the object from store.
    dereference(id) {
        const pointer = this.storage[id];
        if (pointer == null) {
            return;
        }
        pointer.count -= 1;
        if (pointer.count === 0) {
            this.electronIds.delete(pointer.object);
            delete this.storage[id];
        }
    }
    // Clear the storage when renderer process is destroyed.
    registerDeleteListener(webContents, contextId) {
        // contextId => ${processHostId}-${contextCount}
        const processHostId = contextId.split('-')[0];
        const listener = (_, deletedProcessHostId) => {
            if (deletedProcessHostId &&
                deletedProcessHostId.toString() === processHostId) {
                webContents.removeListener('render-view-deleted', listener);
                this.clear(webContents, contextId);
            }
        };
        // Note that the "render-view-deleted" event may not be emitted on time when
        // the renderer process get destroyed because of navigation, we rely on the
        // renderer process to send "ELECTRON_BROWSER_CONTEXT_RELEASE" message to
        // guard this situation.
        webContents.on('render-view-deleted', listener);
    }

    roughSizeOfObject( object ) {

        var objectList = [];
        var stack = [ object ];
        var bytes = 0;

        while ( stack.length ) {
            var value = stack.pop();

            if ( typeof value === 'boolean' ) {
                bytes += 4;
            }
            else if ( typeof value === 'string' ) {
                bytes += value.length * 2;
            }
            else if ( typeof value === 'number' ) {
                bytes += 8;
            }
            else if
            (
                typeof value === 'object'
                && objectList.indexOf( value ) === -1
            )
            {
                objectList.push( value );

                for( var i in value ) {
                    stack.push( value[ i ] );
                }
            }
        }
        return bytes;
    }
}
exports.default = new ObjectsRegistry();
