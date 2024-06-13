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
import { LRUCache, LFUCache } from './cache'; // Adjust the import path as necessary
import { expect, test, describe, beforeEach, vi } from 'vitest';
describe('LRUCache', () => {
    let lru: LRUCache<string, number>;

    beforeEach(() => {
        lru = new LRUCache<string, number>({ maxSize: 3 });
    });

    test('should set and get values', () => {
        lru.set('a', 1);
        lru.set('b', 2);
        lru.set('c', 3);

        expect(lru.get('a').FromJust()).toBe(1);
        expect(lru.get('b').FromJust()).toBe(2);
        expect(lru.get('c').FromJust()).toBe(3);
    });

    test('should overwrite existing values', () => {
        lru.set('a', 1);
        lru.set('a', 2);

        expect(lru.get('a').FromJust()).toBe(2);
    });

    test('should delete values', () => {
        lru.set('a', 1);
        lru.delete('a');

        expect(lru.get('a').IsNothing()).toBe(true);
    });

    test('should clear all values', () => {
        lru.set('a', 1);
        lru.set('b', 2);
        lru.set('c', 3);
        lru.clear();

        expect(lru.get('a').IsNothing()).toBe(true);
        expect(lru.get('b').IsNothing()).toBe(true);
        expect(lru.get('c').IsNothing()).toBe(true);
    });

    test('should evict the oldest item when maxSize is exceeded', () => {
        lru.set('a', 1);
        lru.set('b', 2);
        lru.set('c', 3);
        lru.set('d', 4);

        console.log(lru.get('a'));
        expect(lru.get('a').IsNothing()).toBe(true);
        expect(lru.get('b').FromJust()).toBe(2);
        expect(lru.get('c').FromJust()).toBe(3);
        expect(lru.get('d').FromJust()).toBe(4);
    });

    test('should respect maxAge and delete expired items', () => {
        vi.useFakeTimers();
        lru = new LRUCache<string, number>({ maxSize: 3, maxAge: 1000 });

        lru.set('a', 1);
        vi.advanceTimersByTime(1500);
        expect(lru.get('a').IsNothing()).toBe(true);
        vi.useRealTimers();
    });

    test('should handle onEviction callback', () => {
        const onEviction = vi.fn();
        lru = new LRUCache<string, number>({ maxSize: 3, onEviction });

        lru.set('a', 1);
        lru.set('b', 2);
        lru.set('c', 3);
        lru.set('d', 4);

        expect(onEviction).toHaveBeenCalledWith('a', 1);
    });

    test('should resize the cache correctly', () => {
        lru.set('a', 1);
        lru.set('b', 2);
        lru.set('c', 3);

        lru.resize(2);

        expect(lru.get('a').IsNothing()).toBe(true);
        expect(lru.get('b').FromJust()).toBe(2);
        expect(lru.get('c').FromJust()).toBe(3);
    });

    test('should handle entries() method correctly', () => {
        lru.set('a', 1);
        lru.set('b', 2);
        lru.set('c', 3);

        const entries = Array.from(lru.entries());
        expect(entries).toEqual([['a', 1], ['b', 2], ['c', 3]]);
    });

    test('should handle keys() method correctly', () => {
        lru.set('a', 1);
        lru.set('b', 2);
        lru.set('c', 3);

        const keys = Array.from(lru.keys());
        expect(keys).toEqual(['a', 'b', 'c']);
    });

    test('should handle values() method correctly', () => {
        lru.set('a', 1);
        lru.set('b', 2);
        lru.set('c', 3);

        const values = Array.from(lru.values());
        expect(values).toEqual([1, 2, 3]);
    });

    test('should handle iteration correctly', () => {
        lru.set('a', 1);
        lru.set('b', 2);
        lru.set('c', 3);

        const items = Array.from(lru);
        expect(items).toEqual([['a', 1], ['b', 2], ['c', 3]]);
    });

    test('should handle peek() method correctly', () => {
        lru.set('a', 1);
        lru.set('b', 2);

        expect(lru.peek('a').FromJust()).toBe(1);
        expect(lru.peek('b').FromJust()).toBe(2);
        expect(lru.peek('c').IsNothing()).toBe(true);
    });

    test('should get the correct size', () => {
        lru.set('a', 1);
        lru.set('b', 2);

        expect(lru.size).toBe(2);

        lru.set('c', 3);
        expect(lru.size).toBe(3);

        lru.set('d', 4);
        expect(lru.size).toBe(3); // maxSize is 3
    });
});

describe('LFUCache', () => {
    let lfu: LFUCache<string, number>;

    beforeEach(() => {
        lfu = new LFUCache<string, number>({ maxSize: 3 });
    });

    test('should set and get values', () => {
        lfu.set('a', 1);
        lfu.set('b', 2);
        lfu.set('c', 3);

        expect(lfu.get('a').FromJust()).toBe(1);
        expect(lfu.get('b').FromJust()).toBe(2);
        expect(lfu.get('c').FromJust()).toBe(3);
    });

    test('should overwrite existing values', () => {
        lfu.set('a', 1);
        lfu.set('a', 2);

        expect(lfu.get('a').FromJust()).toBe(2);
    });

    test('should delete values', () => {
        lfu.set('a', 1);
        lfu.delete('a');

        expect(lfu.get('a').IsNothing()).toBe(true);
    });

    test('should clear all values', () => {
        lfu.set('a', 1);
        lfu.set('b', 2);
        lfu.set('c', 3);
        lfu.clear();

        expect(lfu.get('a').IsNothing()).toBe(true);
        expect(lfu.get('b').IsNothing()).toBe(true);
        expect(lfu.get('c').IsNothing()).toBe(true);
    });

    test('should evict the least frequently used item when maxSize is exceeded', () => {
        lfu.set('a', 1);
        lfu.set('b', 2);
        lfu.set('c', 3);
        lfu.get('a');
        lfu.get('a');
        lfu.get('b');
        lfu.set('d', 4);

        expect(lfu.get('a').FromJust()).toBe(1);
        expect(lfu.get('b').FromJust()).toBe(2);
        expect(lfu.get('c').IsNothing()).toBe(true);
        expect(lfu.get('d').FromJust()).toBe(4);
    });

    test('should handle onEviction callback', () => {
        const onEviction = vi.fn();
        const lfu = new LFUCache<string, number>({ maxSize: 3, onEviction });

        lfu.set('a', 1);
        lfu.set('b', 2);
        lfu.set('c', 3);

        // Access 'a' to increase its frequency
        lfu.get('a');

        // Insert 'd', this should evict 'b' because 'a' was accessed
        lfu.set('d', 4);

        expect(onEviction).toHaveBeenCalledWith('b', 2);

        // Access 'a' again to increase its frequency further
        lfu.get('a');

        // Access 'c' to increase its frequency
        lfu.get('c');

        // Insert 'e', this should evict 'd' as it is the least frequently used now
        lfu.set('e', 5);

        expect(onEviction).toHaveBeenCalledWith('d', 4);
    });
    test('should iterate over items', () => {
        lfu.set('a', 1);
        lfu.set('b', 2);
        lfu.set('c', 3);

        const items = Array.from(lfu);
        expect(items).toEqual([['a', 1], ['b', 2], ['c', 3]]);
    });

    test('should get the correct size', () => {
        lfu.set('a', 1);
        lfu.set('b', 2);

        expect(lfu.size).toBe(2);

        lfu.set('c', 3);
        expect(lfu.size).toBe(3);
        lfu.set('d', 4);
        expect(lfu.size).toBe(3); // maxSize is 3
    });

    test('should return correct maxSizeValue', () => {
        expect(lfu.maxSizeValue).toBe(3);
    });
});