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

  then(onFullfilled, onRejected) {
    const currentStatus = this._status;
    const currentValue = this._value;
    
    return new TinyPromise((onFullfilledNext, onRejectedNext) => {
      const resolveCall = (value) => {
        try {
          if (typeof onFullfilled !== 'function') {
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
}