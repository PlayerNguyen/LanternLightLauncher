import { Queue } from "./../common/Queue";
import { expect } from "chai";
describe("Queue Data structure", () => {
  /**
   * Test push method with number
   */
  it(`Push method with number`, () => {
    let queue: Queue<number> = new Queue();
    expect(queue.push(12)).to.equal(12);
    expect(queue.head?.data).to.equal(12);
    expect(queue.push(32)).to.equal(32);
    expect(queue.push(1)).to.equal(1);
    expect(queue.head?.data).to.equal(1);
    expect(queue.tail?.data).to.equal(12);
    expect(queue.head?.next?.data).to.equal(32);
    expect(queue.head?.next?.back?.data).to.eq(1);
  });
  it(`Push method with character`, () => {
    let queue: Queue<String> = new Queue();

    expect(queue.push("T")).to.equal("T");
    expect(queue.push("S")).to.equal("S");
    expect(queue.push("A")).to.eq("A");
    expect(queue.push("L")).to.eq("L");
  });

  it(`Pop method `, () => {
    let queue = new Queue();
    expect(queue.push(12)).to.eq(12);
    expect(queue.pop()).to.equal(12);
    expect(queue.head).to.be.undefined;
    expect(queue.tail).to.undefined;
    // 12
    expect(queue.push(12)).to.eq(12);
    // 24 12
    expect(queue.push(24)).to.eq(24);
    // 48 24 12
    expect(queue.push(48)).to.eq(48);
    // 48 24
    expect(queue.pop()).to.eq(12);
    if (queue.head && queue.tail) {
      expect(queue.head.data).to.eq(48);
      expect(queue.tail.data).to.eq(24);
    }

    // 48 24
    expect(queue.pop()).to.eq(24);
    // 48
    expect(queue.tail).eq(queue.head);
    expect(queue.pop()).to.eq(48);
    expect(queue.tail).to.undefined;
    expect(queue.head).to.undefined;
  });

  it(`isEmpty method`, () => {
    let _asset = [1, 2, 3, 4, 5];
    let queue: Queue<number> = new Queue();

    expect(queue.isEmpty()).to.be.true;
    queue.pushAll(_asset);
    expect(queue.isEmpty()).false;

    let _i = 0;

    while (!queue.isEmpty()) {
      expect(queue.pop()).to.eq(_asset[_i]);
      _i++;
    }
  });
  it(`Pop method without element`, () => {
    let _q = new Queue();
    expect(() => {
      _q.pop();
    }).to.throws("Empty queue");
  });
});
