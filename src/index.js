const PENDING = 'PENDING';
const FULLFILLED = 'FULLFILLED';
const REJECTED = 'REJECTED';

class TinyPromise {
  constructor(handler) {
    if (typeof handler !== 'function') {
      throw new Error('handler should be function');
    }

    this._status = PENDING;
    this._value = undefined;

    this._fullFillQueue = [];
    this._rejectQueue = [];

    try {
      handler(this._resolve.bind(this), this._reject.bind(this));
    } catch (error) {
      this._reject(error);
    }
  }

  _resolve(value) {
    if (this._status !== PENDING) return;

    this._status = FULLFILLED;
    this._value = value;

    let callback;

    while (callback = this._fullFillQueue.shift()) {
      callback(value);
    }
  }

  _reject(value) {
    if (this._status !== PENDING) return;

    this._status = REJECTED;
    this._value = value;

    let callback;

    while (callback = this._rejectQueue.shift()) {
      callback(value);
    }
  }

  static resolve(value) {
    if (value instanceof TinyPromise) return value;
    return new TinyPromise((resolve) => {
      resolve(value);
    });
  }

  static reject(value) {
    return new TinyPromise((resolve, reject) => {
      reject(value);
    });
  }

  static all(promises) {
    let count = 0;
    const result = [];

    return new TinyPromise((resolve, reject) => {
      promises.forEach(promise => {
        TinyPromise.resolve(promise).then((value) => {
          count++;
          result.push(value);
          if(count === promise.length) {
            resolve(result)
          }
        }, (err) => {
          reject(err);
        });
        promise.finally(finishCallBack);
      });
    });
  }

  then(onFullfilled, onRejected) {
    const currentStatus = this._status;
    const currentValue = this._value;
    
    return new TinyPromise((onFullfilledNext, onRejectedNext) => {
      const resolveCall = (value) => {
        try {
          if (typeof onFullfilled !== 'function') {
            // 值穿透
            onFullfilledNext(value);
          } else {
            const ret = onFullfilled(value);
            if (ret instanceof TinyPromise) {
              ret.then(onFullfilledNext, onRejectedNext);
            } else {
              onFullfilledNext(ret);
            }
          }
        } catch (error) {
          onRejectedNext(error);
        }
      };

      const rejectCall = (value) => {
        try {
          if (typeof onRejected !== 'function') {
            // 值穿透
            onRejectedNext(value);
          } else {
            const ret = onRejected(value);
            if (ret instanceof TinyPromise) {
              ret.then(onFullfilledNext, onRejectedNext);
            } else {
              onFullfilledNext(ret);
            }
          }
        } catch (error) {
          onRejectedNext(error);
        }
      };

      switch (currentStatus) {
        case PENDING:
          this._fullFillQueue.push(resolveCall);
          this._rejectQueue.push(rejectCall);
          break;
        case FULLFILLED:
          resolveCall(currentValue);
          break;
        case REJECTED:
          rejectCall(currentValue);
          break;
      }
    });
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  finally(callback) {
    return this.then((value) => {
      callback();
      return value;
    }, (error) => {
      callback();
      throw error;
    });
  }
}

export default TinyPromise;