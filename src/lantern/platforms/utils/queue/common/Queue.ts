export class QueueItem<T> {
  data: T;
  back: QueueItem<T> | undefined = undefined;
  next: QueueItem<T> | undefined = undefined;

  constructor(data: T) {
    this.data = data;
  }
}

export class Queue<T> {
  head: QueueItem<T> | undefined;
  tail: QueueItem<T> | undefined;

  public push(data: T): T {
    const _pushItem = new QueueItem<T>(data);
    if (this.head === undefined || this.head === null) {
      this.tail = _pushItem;
    } else {
      _pushItem.next = this.head;
      this.head.back = _pushItem;
    }
    this.head = _pushItem;
    return data;
  }

  public pushAll(data: T[]) {
    for (let _item of data) {
      this.push(_item);
    }
  }

  public pop(): T {
    if (this.tail === undefined || this.tail === null) {
      throw new Error("Empty queue");
    }

    let _t = this.tail;
    let _pre = this.tail.back;

    if (_pre) _pre.next = undefined;
    if (this.head === this.tail) {
      this.head = undefined;
    }
    this.tail = this.tail.back;

    return _t.data;
  }

  public isEmpty(): boolean {
    return this.tail === undefined;
  }
}
