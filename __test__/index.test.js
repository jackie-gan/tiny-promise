import TestPromise from '../src';

describe('test promise', () => {
  it('test case 1', () => {
    const promise = new TestPromise((resolve) => {
      setTimeout(() => {
        resolve(1);
      }, 1000);
    });

    return promise.then((res) => {
      expect(res).toBe(1);
    });
  })

  it('test case 2', () => {
    TestPromise.resolve(TestPromise.resolve(1)).then((res) => { expect(res).toBe(1); })
  })

  it('test case 3', () => {
    const promise = new TestPromise((resolve) => {
      setTimeout(() => {
        resolve(1);
      }, 1000);
    });

    return promise.finally(() => {
      expect(1).toBe(1);
    });
  })

  it('test case 4', () => {
    const promise = new TestPromise((resolve, reject) => {
      setTimeout(() => {
        reject(1);
      }, 1000);
    });

    return promise.catch((res) => {
      expect(res).toBe(1);
    });
  })

  it('test case 5', () => {
    return TestPromise.resolve(TestPromise.resolve(123)).then((res) => {
      expect(res).toBe(123);
    });
  })

  it('test case 6', () => {
    return TestPromise.resolve(TestPromise.reject(123)).catch((res) => {
      expect(res).toBe(123);
    });
  })

  it('test case 7', () => {
    return TestPromise.reject(123).catch((res) => {
      expect(res).toBe(123);
    });
  })

  it('test case 8', () => {
    const promise1 = new TestPromise((resolve) => {
      setTimeout(() => {
        resolve(1);
      }, 1000);
    });

    const promise2 = new TestPromise((resolve) => {
      setTimeout(() => {
        resolve(2);
      }, 1500);
    });

    return TestPromise.all([promise1, promise2]).then((res) => {
      expect(res).toEqual([1, 2]);
    });
  })

  it('test case 9', () => {
    const promise1 = new TestPromise((resolve) => {
      setTimeout(resolve, 500, 'one');
    });
    
    const promise2 = new TestPromise((resolve) => {
      setTimeout(resolve, 100, 'two');
    });
    
    return TestPromise.race([promise1, promise2]).then((res) => {
      expect(res).toEqual('two');
    });
  })
});