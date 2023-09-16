
export class Queue<T> {
    private elements: Set<T>;
  
    constructor() {
      this.elements = new Set<T>();
    }
  
    enqueue(element: T) {
      this.elements.add(element);
    }
  
    dequeue(): T | undefined {
      const firstElement = this.peek();
      if (firstElement !== undefined) {
        this.elements.delete(firstElement);
      }
      return firstElement;
    }
  
    peek(): T | undefined {
      return this.elements.values().next().value;
    }
  
    get size(): number {
      return this.elements.size;
    }
  
    get isEmpty(): boolean {
      return this.size === 0;
    }
  }
  