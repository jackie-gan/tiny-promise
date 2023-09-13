/**
 * Promise/A+规范：https://promisesaplus.com/
 */

// 三种Promise状态
const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

class TestPromise {
  constructor(handler) {
    this._status = PENDING;
    this._value = undefined;
    this._fulfillQueue = [];
    this._rejectQueue = [];

    function _resolve(val) {
      // 当构造函数中多次调用resolve时，只认可第一次调用
      if (this._status !== PENDING) return;

      this._status = FULFILLED;
      this._value = val;

      let currentFunc;

      while (currentFunc = this._fulfillQueue.shift()) {
        currentFunc(this._value);
      }
    }
    
    function _reject(err) {
      // 当构造函数中多次调用reject时，只认可第一次调用
      if (this._status !== PENDING) return;

      this._status = REJECTED;
      this._value = err;

      let currentFunc;

      while (currentFunc = this._rejectQueue.shift()) {
        currentFunc(this._value);
      }
    }

    try {
      handler(_resolve.bind(this), _reject.bind(this));
    } catch (e) {
      this._reject(e);
    }
  }

  then(onFulfilled, onRejected) {
    const currentStatus = this._status;
    const currentValue = this._value;
    // then和catch必须返回一个Promise
    return new TestPromise((resolveNext, rejectNext) => {
      const resolveCall = (value) => {
        try {
          if (typeof onFulfilled !== 'function') {
            // 当 onFulfilled 不是function时，则忽略
            resolveNext(value);
          } else {
            // 当 onFulfilled 是function时，则执行
            const ret = onFulfilled(value);
            if (ret instanceof TestPromise) {
              // 返回值是Promise，则透传Promise的结果
              ret.then(resolveNext, rejectNext);
            } else {
              // 范围值不是Promise，则正常执行
              resolveNext(ret);
            }
          }
        } catch (e) {
          rejectNext(e);
        }
      };

      const rejectCall = (err) => {
        try {
          if (typeof onRejected !== 'function') {
            // 当 onRejected 不是function时，则忽略
            rejectNext(err);
          } else {
            // 当 onRejected 是function时，则执行
            const ret = onRejected(err);
            if (ret instanceof TestPromise) {
              // 返回值是Promise，则透传Promise的结果
              ret.then(resolveNext, rejectNext);
            } else {
              // 范围值不是Promise，则正常执行
              resolveNext(ret);
            }
          }
        } catch (e) {
          rejectNext(e);
        }
      };

      // 核心：需要根据当前Promise的状态，作不同的处理
      switch (currentStatus) {
        case PENDING:
          // 当Promise状态为PENDING，表示需要等待异步操作完成后，才执行resolve 或 reject callback
          this._fulfillQueue.push(resolveCall);
          this._rejectQueue.push(rejectCall);
          break;
        case FULFILLED:
          // 当Promise状态为FULFILLED，则立即执行then中的resolve callback
          resolveCall(currentValue);
          break;
        case REJECTED:
          // 当Promise状态为REJECTED，则立即执行catch中的reject callback
          rejectCall(currentValue);
          break;
      }
    });
  }

  catch(onRejected) {
    // catch只借用reject部分
    // 此处调用then时，除了返回promise外，还将onReject回调添加到_rejectQueue队列中
    return this.then(undefined, onRejected);
  }

  finally(callback) {
    // 返回Promise
    // 无论当前Promise是什么状态，都会执行finally的callback
    return this.then((value) => {
      callback();
      return value;
    }, (error) => {
      callback();
      throw error;
    });
  }

  /**
   * 如果入参value为Promise，则直接返回Promise
   * 否则，返回包装value后的Promise 
   */
  static resolve(value) {
    if (value instanceof TestPromise) {
      return value;
    } else {
      return new TestPromise((resolve) => {
        resolve(value);
      });
    }
  }

  // 返回一个带拒绝原因的Promise
  // 这里不会对入参进行类型判断
  static reject(err) {
    return new TestPromise((resolve, reject) => {
      reject(err);
    });
  }

  // promises中所有的任务执行完成，则resolve
  // 中间有报错，则reject
  static all(iterables) {
    let count = 0;
    const promiseResult = [];

    return new TestPromise((resolve, reject) => {
      for (const item of iterables) {
        Promise.resolve(item).then((value) => {
          count += 1;
          promiseResult.push(value);
          if (count === iterables.length) {
            resolve(promiseResult);
          }
        }, (err) => {
          reject(err);
        });
      }
    });
  }

  // 返回一个 promise，一旦迭代器中的某个promise解决或拒绝，返回的 promise就会解决或拒绝
  static race(iterables) {
    return new TestPromise((resolve, reject) => {
      for (const item of iterables) {
        Promise.resolve(item).then((value) => {
          resolve(value);
        }, (err) => {
          reject(err);
        });
      }
    });
  }
}

export default TestPromise;