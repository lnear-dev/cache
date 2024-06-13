/**
 * This file is part of a Lnear project.
 *
 * (c) 2024 Lanre Ajao(lnear)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 * .........<-..(`-')_..(`-').._(`-').._....(`-').
 * ...<-.......\(.OO).).(.OO).-/(OO.).-/.<-.(OO.).
 * .,--..)..,--./.,--/.(,------./.,---...,------,)
 * .|..(`-')|...\.|..|..|...---'|.\./`.\.|.../`..'
 * .|..|OO.)|....'|..|)(|..'--..'-'|_.'.||..|_.'.|
 * (|..'__.||..|\....|..|...--'(|...-...||.......'
 * .|.....|'|..|.\...|..|..`---.|..|.|..||..|\..\.
 * .`-----'.`--'..`--'..`------'`--'.`--'`--'.'--'
 */
import { Maybe, Just, Nothing } from "perhaps-ts";

/**
 * Represents a generic cache interface.
 * @template K - Type of the key.
 * @template V - Type of the value.
 */
interface Cache<K, V> {
    /**
     * Sets a value in the cache for the specified key.
     * @param {K} key - The key to set.
     * @param {V} value - The value to set.
     * @returns {this} The cache instance.
     */
    set(key: K, value: V): this;

    /**
     * Gets a value from the cache for the specified key.
     * @param {K} key - The key to get.
     * @returns {Maybe<V>} The value if found, otherwise Nothing.
     */
    get(key: K): Maybe<V>;

    /**
     * Checks if the cache has the specified key.
     * @param {K} key - The key to check.
     * @returns {boolean} True if the key exists, otherwise false.
     */
    has(key: K): boolean;

    /**
     * Deletes the value from the cache for the specified key.
     * @param {K} key - The key to delete.
     * @returns {boolean} True if the key was deleted, otherwise false.
     */
    delete(key: K): boolean;

    /**
     * Clears all values from the cache.
     */
    clear(): void;

    /**
     * Gets an iterable iterator of keys in the cache.
     * @returns {IterableIterator<K>} An iterator of keys.
     */
    keys(): IterableIterator<K>;

    /**
     * Gets an iterable iterator of values in the cache.
     * @returns {IterableIterator<V>} An iterator of values.
     */
    values(): IterableIterator<V>;

    /**
     * Gets an iterable iterator of entries (key-value pairs) in the cache.
     * @returns {IterableIterator<[K, V]>} An iterator of entries.
     */
    entries(): IterableIterator<[K, V]>;

    /**
     * Executes a callback function for each entry in the cache.
     * @param {(value: V, key: K) => void} callback - The callback function to execute.
     * @param {any} [thisArg] - Value to use as this when executing the callback.
     */
    forEach(callback: (value: V, key: K) => void, thisArg?: any): void;
    /**
     * Peeks at a value in the cache without updating its position.
     * @param {K} key - The key to peek at.
     * @returns {Maybe<V>} The value if found, otherwise Nothing.
    */
    peek(key: K): Maybe<V>

    /**
     * Gets the number of entries in the cache.
     * @readonly
     * @type {number}
     */
    readonly size: number;

}

/**
 * Options for creating a cache.
 * @typedef {Object} CacheOptions
 * @property {number} maxSize - The maximum size of the cache.
 * @property {number} [maxAge] - The maximum age of a cache entry in milliseconds.
 * @property {(key: any, value: any) => void} [onEviction] - Callback function to execute when an entry is evicted.
 */
interface CacheOptions {
    maxSize: number;
    maxAge?: number;
    onEviction?: (key: any, value: any) => void;
}

/**
 * Represents a node in the LRU cache.
 * @template K - Type of the key.
 * @template V - Type of the value.
 * @typedef {Object} LRUNode
 * @property {K} key - The key of the node.
 * @property {V} value - The value of the node.
 * @property {Maybe<LRUNode<K, V>>} prev - The previous node.
 * @property {Maybe<LRUNode<K, V>>} next - The next node.
 * @property {Maybe<number>} expiry - The expiration time of the node.
 */
interface LRUNode<K, V> {
    key: K;
    value: V;
    prev: Maybe<LRUNode<K, V>>;
    next: Maybe<LRUNode<K, V>>;
    expiry: Maybe<number>;
}

/**
 * Represents a Least Recently Used (LRU) cache.
 * @template K - Type of the key.
 * @template V - Type of the value.
 * @implements {Cache<K, V>}
 */
class LRUCache<K, V> implements Cache<K, V> {
    private capacity: number;
    private cache: Map<K, LRUNode<K, V>>;
    private head: Maybe<LRUNode<K, V>>;
    private tail: Maybe<LRUNode<K, V>>;
    public size: number;
    private maxAge: number;
    private onEviction?: ((key: K, value: V) => void);

    /**
     * Creates an instance of LRUCache.
     * @param {CacheOptions} options - The options for the cache.
     */
    constructor(options: CacheOptions) {
        this.capacity = options.maxSize;
        this.cache = new Map();
        this.head = Nothing<LRUNode<K, V>>();
        this.tail = Nothing<LRUNode<K, V>>();
        this.size = 0;
        this.maxAge = options.maxAge || Number.POSITIVE_INFINITY;
        this.onEviction = options.onEviction;
    }

    /**
     * Moves a node to the head of the LRU list.
     * @private
     * @param {LRUNode<K, V>} node - The node to move.
     */
    private moveToHead(node: LRUNode<K, V>): void {
        const n = Just(node);
        if (this.head.equals(n)) return;
        if (node.prev.IsJust()) node.prev.FromJust().next = node.next;
        if (node.next.IsJust()) node.next.FromJust().prev = node.prev;
        if (this.tail.equals(n)) this.tail = node.prev;
        if (this.head.IsJust()) this.head.FromJust().prev = n;

        node.next = this.head;
        node.prev = Nothing<LRUNode<K, V>>();
        this.head = n;
        if (this.tail.IsNothing()) this.tail = this.head;
    }

    /**
     * Sets a value in the cache for the specified key.
     * @param {K} key - The key to set.
     * @param {V} value - The value to set.
     * @param {{ maxAge?: number }} [options={}] - Options for the entry.
     * @returns {this} The cache instance.
     */
    public set(key: K, value: V, { maxAge = this.maxAge }: { maxAge?: number } = {}): this {
        const expiry = maxAge !== Number.POSITIVE_INFINITY ? Just(Date.now() + maxAge) : Nothing<number>();
        let node = this.cache.get(key);
        if (node) {
            node.value = value;
            this.moveToHead(node);
        } else {
            node = {
                key,
                value,
                prev: Nothing<LRUNode<K, V>>(),
                next: this.head,
                expiry
            };
            const n = Just(node);
            if (this.head.IsJust()) this.head.FromJust().prev = n;

            this.head = n;
            if (this.tail.IsNothing()) this.tail = this.head;
            this.cache.set(key, node);
            this.size++;

            if (this.size > this.capacity) {
                // Evict the least recently used node (tail)
                const evictedNode = this.tail;
                this.cache.delete(evictedNode.ToChecked().key);
                if (evictedNode.ToChecked().prev) {
                    evictedNode.ToChecked().prev.FromJust().next = Nothing<LRUNode<K, V>>();
                }
                this.tail = evictedNode.ToChecked().prev;
                this.size--;

                if (this.onEviction) {
                    this.onEviction(evictedNode.ToChecked().key, evictedNode.ToChecked().value);
                }
            }
        }
        return this;
    }

    /**
     * Deletes a value from the cache if it is expired.
     * @private
     * @param {K} key - The key to check.
     * @param {LRUNode<K, V>} item - The cache node to check.
     * @returns {boolean} True if the item was deleted, otherwise false.
     */
    private deleteIfExpired(key: K, item: LRUNode<K, V>): boolean {
        if (item.expiry.FromMaybe(Number.MAX_SAFE_INTEGER) <= Date.now()) {
            this.delete(key);
            return true;
        }
        return false;
    }

    /**
     * Gets a value from the cache if it is not expired, otherwise deletes it.
     * @private
     * @param {K} key - The key to get.
     * @param {LRUNode<K, V>} item - The cache node to get.
     * @returns {Maybe<V>} The value if found and not expired, otherwise Nothing.
     */
    private getOrDeleteIfExpired(key: K, item: LRUNode<K, V>): Maybe<V> {
        return this.deleteIfExpired(key, item) ? Nothing<V>() : (this.moveToHead(item), Just(item.value));
    }

    /**
     * Peeks at a value in the cache without updating its position.
     * @param {K} key - The key to peek at.
     * @returns {Maybe<V>} The value if found, otherwise Nothing.
     */
    public peek(key: K): Maybe<V> {
        const item = this.cache.get(key);
        return item ? this.getOrDeleteIfExpired(key, item) : Nothing<V>();
    }

    /**
     * Gets a value from the cache for the specified key.
     * @param {K} key - The key to get.
     * @returns {Maybe<V>} The value if found, otherwise Nothing.
     */
    public get(key: K): Maybe<V> {
        const node = this.cache.get(key);
        return node ? this.getOrDeleteIfExpired(key, node) : Nothing<V>();
    }

    /**
     * Checks if the cache has the specified key.
     * @param {K} key - The key to check.
     * @returns {boolean} True if the key exists, otherwise false.
     */
    public has(key: K): boolean {
        return this.cache.has(key);
    }

    /**
     * Deletes the value from the cache for the specified key.
     * @param {K} key - The key to delete.
     * @returns {boolean} True if the key was deleted, otherwise false.
     */
    public delete(key: K): boolean {
        const node = this.cache.get(key);
        if (node) {
            if (node.prev.IsJust()) {
                node.prev.FromJust().next = node.next;
            } else {
                this.head = node.next;
            }
            if (node.next.IsJust()) {
                node.next.FromJust().prev = node.prev;
            } else {
                this.tail = node.prev;
            }

            this.cache.delete(key);
            this.size--;
            return true;
        }
        return false;
    }

    /**
     * Clears all values from the cache.
     */
    public clear(): void {
        this.cache.clear();
        this.head = Nothing();
        this.tail = Nothing();
        this.size = 0;
    }

    /**
     * Gets an iterable iterator of entries in the cache in ascending order.
     * @private
     * @returns {IterableIterator<[K, LRUNode<K, V>]>} An iterator of entries.
     */
    private *entriesAscendingInternal(): IterableIterator<[K, LRUNode<K, V>]> {
        for (const [key, value] of this.cache)
            if (!this.deleteIfExpired(key, value))
                yield [key, value];
    }

    /**
     * Emits eviction events for a set of cache entries.
     * @private
     * @param {Map<K, LRUNode<K, V>>} cache - The cache entries to evict.
     */
    private emitEvictions(cache: Map<K, LRUNode<K, V>>) {
        if (typeof this.onEviction !== "function") return;
        for (const [key, item] of cache) this.onEviction(key, item.value);
    }

    /**
     * Resizes the cache to the new size.
     * @param {number} newSize - The new size of the cache.
     * @throws {TypeError} If the new size is not a positive number.
     */
    public resize(newSize: number) {
        if (typeof newSize !== "number" || newSize <= 0) throw new TypeError("`maxSize` must be a number greater than 0");
        const items = [...this.entriesAscendingInternal()];
        const removeCount = items.length - newSize;
        if (removeCount > 0) {
            this.emitEvictions(new Map(items.slice(0, removeCount)));
            this.cache = new Map(items.slice(removeCount));
            this.size = newSize;
        } else {
            this.cache = new Map(items);
            this.size = items.length;
        }
    }

    /**
     * Gets an iterable iterator of keys in the cache.
     * @returns {IterableIterator<K>} An iterator of keys.
     */
    public *keys(): IterableIterator<K> {
        for (const [key] of this.entriesAscendingInternal()) {
            yield key;
        }
    }

    /**
     * Gets an iterable iterator of values in the cache.
     * @returns {IterableIterator<V>} An iterator of values.
     */
    public *values(): IterableIterator<V> {
        for (const [, value] of this.entriesAscendingInternal()) {
            yield value.value;
        }
    }

    /**
     * Gets an iterable iterator of entries (key-value pairs) in the cache.
     * @returns {IterableIterator<[K, V]>} An iterator of entries.
     */
    public *[Symbol.iterator](): IterableIterator<[K, V]> {
        for (const [key, value] of this.entriesAscendingInternal()) {
            yield [key, value.value];
        }
    }

    /**
     * Gets an iterable iterator of entries in the cache in descending order.
     * @returns {IterableIterator<[K, V]>} An iterator of entries.
     */
    public *entriesDescending(): IterableIterator<[K, V]> {
        const items = [...this.cache].reverse();
        for (const [key, value] of items)
            if (!this.deleteIfExpired(key, value)) yield [key, value.value];
    }

    /**
     * Gets an iterable iterator of entries in the cache in ascending order.
     * @returns {IterableIterator<[K, V]>} An iterator of entries.
     */
    public *entriesAscending(): IterableIterator<[K, V]> {
        for (const [key, value] of this.entriesAscendingInternal()) {
            yield [key, value.value];
        }
    }

    /**
     * Gets the maximum size of the cache.
     * @readonly
     * @type {number}
     */
    public get maxSizeValue(): number {
        return this.capacity;
    }

    /**
     * Gets an iterable iterator of entries in the cache.
     * @returns {IterableIterator<[K, V]>} An iterator of entries.
     */
    public entries() {
        return this.entriesAscending();
    }

    /**
     * Executes a callback function for each entry in the cache.
     * @param {(value: V, key: K, map: Cache<K, V>) => void} callback - The callback function to execute.
     * @param {any} [thisArg=this] - Value to use as this when executing the callback.
     */
    public forEach(callback: (value: V, key: K, map: Cache<K, V>) => void, thisArg = this) {
        for (const [key, value] of this.entriesAscending()) {
            callback.call(thisArg, value, key, this);
        }
    }

    /**
     * Gets the string tag representation of the cache.
     * @readonly
     * @type {string}
     */
    public get [Symbol.toStringTag](): string {
        return JSON.stringify([...this.entriesAscending()]);
    }
}

/**
 * Represents a node in the LFU cache.
 * @template K - Type of the key.
 * @template V - Type of the value.
 * @typedef {Object} LFUNode
 * @property {K} key - The key of the node.
 * @property {V} value - The value of the node.
 * @property {number} freq - The frequency count of the node.
 * @property {Maybe<number>} expiry - The expiration time of the node.
 */
interface LFUNode<K, V> {
    key: K;
    value: V;
    freq: number;
    expiry: Maybe<number>;
}

/**
 * Represents a Least Frequently Used (LFU) cache.
 * @template K - Type of the key.
 * @template V - Type of the value.
 * @implements {Cache<K, V>}
 */
class LFUCache<K, V> implements Cache<K, V> {
    private capacity: number;
    private cache: Map<K, LFUNode<K, V>>;
    private freqMap: Map<number, Set<K>>;
    private minFreq: number;
    public size: number;
    private maxAge: number;
    private onEviction?: ((key: K, value: V) => void);

    /**
     * Creates an instance of LFUCache.
     * @param {CacheOptions} options - The options for the cache.
     */
    constructor(options: CacheOptions) {
        this.capacity = options.maxSize;
        this.cache = new Map();
        this.freqMap = new Map();
        this.minFreq = 0;
        this.size = 0;
        this.maxAge = options.maxAge || Number.POSITIVE_INFINITY;
        this.onEviction = options.onEviction;
    }

    /**
     * Updates the frequency of a node.
     * @private
     * @param {LFUNode<K, V>} node - The node to update.
     */
    private updateFrequency(node: LFUNode<K, V>): void {
        const freq = node.freq;
        this.freqMap.get(freq)?.delete(node.key);
        if (this.freqMap.get(freq)?.size === 0) {
            this.freqMap.delete(freq);
            if (this.minFreq === freq) {
                this.minFreq++;
            }
        }
        node.freq++;
        if (!this.freqMap.has(node.freq)) {
            this.freqMap.set(node.freq, new Set());
        }
        this.freqMap.get(node.freq)?.add(node.key);
    }

    /**
     * Sets a value in the cache for the specified key.
     * @param {K} key - The key to set.
     * @param {V} value - The value to set.
     * @param {{ maxAge?: number }} [options={}] - Options for the entry.
     * @returns {this} The cache instance.
     */
    public set(key: K, value: V, { maxAge = this.maxAge }: { maxAge?: number } = {}): this {
        const expiry = maxAge !== Number.POSITIVE_INFINITY ? Just(Date.now() + maxAge) : Nothing<number>();
        let node = this.cache.get(key);
        if (node) {
            node.value = value;
            node.expiry = expiry;
            this.updateFrequency(node);
        } else {
            if (this.size >= this.capacity) {
                this.evict();
            }
            node = {
                key,
                value,
                freq: 1,
                expiry
            };
            this.cache.set(key, node);
            if (!this.freqMap.has(1)) {
                this.freqMap.set(1, new Set());
            }
            this.freqMap.get(1)?.add(key);
            this.minFreq = 1;
            this.size++;
        }
        return this;
    }

    /**
     * Evicts the least frequently used node from the cache.
     * @private
     */
    private evict(): void {
        const keys = this.freqMap.get(this.minFreq);
        if (keys) {
            const key = keys.values().next().value;
            keys.delete(key);
            if (keys.size === 0) {
                this.freqMap.delete(this.minFreq);
            }
            const node = this.cache.get(key);
            if (node) {
                this.cache.delete(key);
                this.size--;
                if (this.onEviction) {
                    this.onEviction(key, node.value);
                }
            }
        }
    }

    /**
     * Deletes a node from the cache if it has expired.
     * @private
     * @param {K} key - The key to check.
     * @param {LFUNode<K, V>} item - The node to check.
     * @returns {boolean} True if the node was deleted, otherwise false.
     */
    private deleteIfExpired(key: K, item: LFUNode<K, V>): boolean {
        if (item.expiry.FromMaybe(Number.MAX_SAFE_INTEGER) <= Date.now()) {
            this.delete(key);
            return true;
        }
        return false;
    }

    /**
     * Gets a node from the cache if it has not expired, otherwise deletes it.
     * @private
     * @param {K} key - The key to get.
     * @param {LFUNode<K, V>} item - The node to get.
     * @returns {Maybe<V>} The value if found, otherwise Nothing.
     */
    private getOrDeleteIfExpired(key: K, item: LFUNode<K, V>): Maybe<V> {
        return this.deleteIfExpired(key, item) ? Nothing<V>() : (this.updateFrequency(item), Just(item.value));
    }

    /**
     * Peeks at the value in the cache for the specified key without updating its frequency.
     * @param {K} key - The key to peek.
     * @returns {Maybe<V>} The value if found, otherwise Nothing.
     */
    public peek(key: K): Maybe<V> {
        const item = this.cache.get(key);
        return item ? this.getOrDeleteIfExpired(key, item) : Nothing<V>();
    }

    /**
     * Gets the value in the cache for the specified key.
     * @param {K} key - The key to get.
     * @returns {Maybe<V>} The value if found, otherwise Nothing.
     */
    public get(key: K): Maybe<V> {
        const node = this.cache.get(key);
        return node ? this.getOrDeleteIfExpired(key, node) : Nothing<V>();
    }

    /**
     * Checks if the cache has the specified key.
     * @param {K} key - The key to check.
     * @returns {boolean} True if the key exists, otherwise false.
     */
    public has(key: K): boolean {
        return this.cache.has(key);
    }

    /**
     * Deletes the value from the cache for the specified key.
     * @param {K} key - The key to delete.
     * @returns {boolean} True if the key was deleted, otherwise false.
     */
    public delete(key: K): boolean {
        const node = this.cache.get(key);
        if (node) {
            const freq = node.freq;
            this.freqMap.get(freq)?.delete(key);
            if (this.freqMap.get(freq)?.size === 0) {
                this.freqMap.delete(freq);
                if (this.minFreq === freq) {
                    this.minFreq++;
                }
            }
            this.cache.delete(key);
            this.size--;
            return true;
        }
        return false;
    }

    /**
     * Clears all values from the cache.
     */
    public clear(): void {
        this.cache.clear();
        this.freqMap.clear();
        this.minFreq = 0;
        this.size = 0;
    }

    /**
     * Gets an iterable iterator of entries in the cache in ascending order.
     * @private
     * @returns {IterableIterator<[K, LFUNode<K, V>]>} An iterator of entries.
     */
    private *entriesAscendingInternal(): IterableIterator<[K, LFUNode<K, V>]> {
        for (const [key, value] of this.cache)
            if (!this.deleteIfExpired(key, value))
                yield [key, value];
    }

    /**
     * Emits eviction events for a set of cache entries.
     * @private
     * @param {Map<K, LFUNode<K, V>>} cache - The cache entries to evict.
     */
    private emitEvictions(cache: Map<K, LFUNode<K, V>>) {
        if (typeof this.onEviction !== "function") return;
        for (const [key, item] of cache) this.onEviction(key, item.value);
    }

    /**
     * Resizes the cache to the new size.
     * @param {number} newSize - The new size of the cache.
     * @throws {TypeError} If the new size is not a positive number.
     */
    public resize(newSize: number) {
        if (typeof newSize !== "number" || newSize <= 0) throw new TypeError("`maxSize` must be a number greater than 0");
        const items = [...this.entriesAscendingInternal()];
        const removeCount = items.length - newSize;
        if (removeCount > 0) {
            this.emitEvictions(new Map(items.slice(0, removeCount)));
            this.cache = new Map(items.slice(removeCount));
            this.size = newSize;
        } else {
            this.cache = new Map(items);
            this.size = items.length;
        }
    }

    /**
     * Gets an iterable iterator of keys in the cache.
     * @returns {IterableIterator<K>} An iterator of keys.
     */
    public *keys(): IterableIterator<K> {
        for (const [key] of this.entriesAscendingInternal()) {
            yield key;
        }
    }

    /**
     * Gets an iterable iterator of values in the cache.
     * @returns {IterableIterator<V>} An iterator of values.
     */
    public *values(): IterableIterator<V> {
        for (const [, value] of this.entriesAscendingInternal()) {
            yield value.value;
        }
    }

    /**
     * Gets an iterable iterator of entries (key-value pairs) in the cache.
     * @returns {IterableIterator<[K, V]>} An iterator of entries.
     */
    public *[Symbol.iterator](): IterableIterator<[K, V]> {
        for (const [key, value] of this.entriesAscendingInternal()) {
            yield [key, value.value];
        }
    }

    /**
     * Gets an iterable iterator of entries in the cache in ascending order.
     * @returns {IterableIterator<[K, V]>} An iterator of entries.
     */
    public *entriesAscending(): IterableIterator<[K, V]> {
        for (const [key, value] of this.entriesAscendingInternal()) {
            yield [key, value.value];
        }
    }

    /**
     * Gets the maximum size of the cache.
     * @readonly
     * @type {number}
     */
    public get maxSizeValue(): number {
        return this.capacity;
    }

    /**
     * Gets an iterable iterator of entries in the cache.
     * @returns {IterableIterator<[K, V]>} An iterator of entries.
     */
    public entries() {
        return this.entriesAscending();
    }

    /**
     * Executes a callback function for each entry in the cache.
     * @param {(value: V, key: K, map: Cache<K, V>) => void} callback - The callback function to execute.
     * @param {any} [thisArg=this] - Value to use as this when executing the callback.
     */
    public forEach(callback: (value: V, key: K, map: Cache<K, V>) => void, thisArg = this) {
        for (const [key, value] of this.entriesAscending()) {
            callback.call(thisArg, value, key, this);
        }
    }

    /**
     * Gets the string tag representation of the cache.
     * @readonly
     * @type {string}
     */
    public get [Symbol.toStringTag](): string {
        return JSON.stringify([...this.entriesAscending()]);
    }
}

export { type Cache, LRUCache, LFUCache };

