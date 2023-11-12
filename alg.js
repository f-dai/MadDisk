export class SSTF {
  constructor(n, sectors) {
    this.n = n;
    this.sectors = sectors;
    this.requests = [];
    this.pointer = 0;  // cur track id
  }

  init() {
    this.requests = [];
    this.pointer = 0;
  }

  add(request) {
    this.requests.push(request);
    console.log('add', this.requests);
  }

  get() {
    console.log('get', this.requests);
    if(this.requests.length === 0) {
      return -1; 
    }

    let minDistance = Infinity;
    let closestIndex = -1;

    for(let i = 0; i < this.requests.length; i++) {
      let distance = Math.abs(this.requests[i] % this.sectors - this.pointer);
      if(distance < minDistance) {
        console.log('dist', i, this.requests[i], distance);
        minDistance = distance;
        closestIndex = i;
      }
    }

    if (closestIndex === -1) return -1;
    this.pointer = this.requests[closestIndex] % this.sectors;
    return this.requests[closestIndex];
  }

  delete(number) {
    console.log('delete before', this.requests, number);
    for (let i = 0; i < this.requests.length; ++i)
      if (this.requests[i] === number) {
        this.requests.splice(i, 1);
        console.log('delete', this.requests);
        return;
      }
  }
}


export class SCAN {
  constructor(n, sectors) {
    this.n = n;
    this.sectors = sectors;
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
            return this.pointer;
          }
        }
        this.pointer--;
        this.direction = 0;
      }
      else {
        for(; this.pointer >= 0; this.pointer--) {
          if(this.requests[this.pointer] === 1) {
            return this.pointer;
          }
        }
        this.pointer++;
        this.direction = 1;
      }
    }
  }
  delete(number) {
    this.requests[number] = 0;
  }
}
