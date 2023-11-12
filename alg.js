class SSTF {
  constructor() {
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
