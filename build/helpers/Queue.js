"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
class Queue {
    constructor() {
        this.elements = new Set();
    }
    enqueue(element) {
        this.elements.add(element);
    }
    dequeue() {
        const firstElement = this.peek();
        if (firstElement !== undefined) {
            this.elements.delete(firstElement);
        }
        return firstElement;
    }
    peek() {
        return this.elements.values().next().value;
    }
    get size() {
        return this.elements.size;
    }
    get isEmpty() {
        return this.size === 0;
    }
}
exports.Queue = Queue;
