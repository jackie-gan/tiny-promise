import TinyPromise from '../src/index';

describe('test promise', () => {
  it('test case 1', () => {
    const promise = new TinyPromise((resolve) => {
      setTimeout(() => {
        resolve(1);
      }, 1000);
    });

    return promise.then((res) => {
      expect(res).toBe(1);
    });
  })

  it('test case 2', () => {
    TinyPromise.resolve(TinyPromise.resolve(1)).then((res) => { expect(res).toBe(1); })
  })
});