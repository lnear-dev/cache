# @lnear/cache

`@lnear/cache` is a TypeScript library that provides implementations for two types of caching mechanisms: Least Recently Used (LRU) and Least Frequently Used (LFU). Caching is crucial in applications to improve performance by storing frequently accessed data in memory.

This package offers flexibility through generic implementations, allowing developers to cache any type of data with customizable options for maximum size and expiration times.

## Installation

Install the package via npm:

```bash
npm install @lnear/cache
```

## Usage

### Importing

Import the cache classes into your TypeScript project:

```typescript
import { LRUCache, LFUCache } from "@lnear/cache";
```

### Creating a Cache Instance

#### LRU Cache Example:

```typescript
// Create an LRU cache with a maximum size of 100 items
const lruCache = new LRUCache<string, number>({ maxSize: 100 });

// Adding entries to the cache
lruCache.set("key1", 1);
lruCache.set("key2", 2);

// Retrieving a value from the cache
const value = lruCache.get("key1").ToChecked(); // Returns 1

// Iterating through cache entries
for (const [key, value] of lruCache.entries()) {
  console.log(`Key: ${key}, Value: ${value}`);
}
```

#### LFU Cache Example:

```typescript
// Create an LFU cache with a maximum size of 100 items
const lfuCache = new LFUCache<string, number>({ maxSize: 100 });

// Adding entries to the cache
lfuCache.set("key1", 1);
lfuCache.set("key2", 2);

// Retrieving a value from the cache
const value = lfuCache.get("key1").ToChecked(); // Returns 1

// Iterating through cache entries
for (const [key, value] of lfuCache.entries()) {
  console.log(`Key: ${key}, Value: ${value}`);
}
```

### API

#### Common Methods for LRUCache and LFUCache

- `set(key: K, value: V, options?: { maxAge?: number }): this`: Adds or updates a key-value pair in the cache.
- `get(key: K): Maybe<V>`: Retrieves the value associated with the key, if present.
- `has(key: K): boolean`: Checks if the cache contains the specified key.
- `delete(key: K): boolean`: Deletes a key-value pair from the cache.
- `clear(): void`: Clears all entries from the cache.
- `resize(newSize: number): void`: Resizes the cache to the new size, evicting entries if necessary.
- `entries(): IterableIterator<[K, V]>`: Returns an iterator for all entries in the cache.
- `forEach(callback: (value: V, key: K, map: Cache<K, V>) => void, thisArg?: any): void`: Executes a callback for each entry in the cache.
- `peek(key: K): Maybe<V>`: Retrieves the value associated with the key without updating its frequency.

### License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

### Support

For questions or issues regarding the package, please [open an issue](https://github.com/lnear-dev/cache/issues) on GitHub.
