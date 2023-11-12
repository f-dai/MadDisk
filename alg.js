export class SSTF {
  constructor(n) {
    this.n = n;  // Unused, just to unify all classes' parameters
    this.requests = [];
    this.pointer = 0; 
  }

  init() {
    this.requests = [];
    this.pointer = 0;
  }

  add(request) {
    this.requests.push(request);
  }

  get() {
    if(this.requests.length === 0) {
      return -1; 
    }

    let minDistance = Infinity;
    let closestIndex = -1;

    for(let i = 0; i < this.requests.length; i++) {
      if(i !== this.pointer) {
        let distance = Math.abs(this.requests[i] - this.requests[this.pointer]);
        if(distance < minDistance) {
          minDistance = distance;
          closestIndex = i;
        }
      }
    }

    this.pointer = closestIndex;
    return closestIndex;
  }
}


export class SCAN {
  constructor(n) {
    this.n = n;
    this.requests = new Array(n).fill(0); 
    this.direction = 1; 
    this.pointer = 0;
  }

  init() {
    this.requests.fill(0);
    this.direction = 1; 
    this.pointer = 0; 
  }

  isEmpty() {
    return !this.requests.some(r => r === 1);
  }

  add(request) {
    this.requests[request] = 1;
  }

  get() {
    if(this.isEmpty()) {
      return -1;
    }

    while(true) {
      if(this.direction === 1) {
        for(; this.pointer < this.n; this.pointer++) {
          if(this.requests[this.pointer] === 1) {
            this.requests[this.pointer] = 0;
            return this.pointer;
          }
        }
        this.pointer--;
        this.direction = 0;
      }
      else {
        for(; this.pointer >= 0; this.pointer--) {
          if(this.requests[this.pointer] === 1) {
            this.requests[this.pointer] = 0;
            return this.pointer;  
          }
        }
        this.pointer++;
        this.direction = 1;
      }
    }
  }
}
