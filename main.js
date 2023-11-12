import { SSTF, SCAN } from './alg.js';

// Number of actual tracks plus 1 (we will leave the inner most circle empty). Must be at least 3
const tracks = 4;
// Number of sectors per track.
const sectors = 12;
// Total sector numbers.
const total = (tracks-1) * sectors;
// Number of queries in a level. Does not include duplicates so cannot be larger than `total`.
const queries = 20;
// negative = counterclockwise
const degPerTick = -2;
// In miliseconds
const tickLength = 40;
// All sizes are in px
const disk_diameter = 600;
const head_diameter = 30;
// Each keydown will move head this distance in px.
const head_speed = 6;
// Size of each number <span>
const number_width = 10;
const number_height = 20;
// The ratio of radius of the outer track and diameter of the disk, to evenly distribute all numbers
const max_radius_ratio = (1 - 0.5 / tracks) / 2;
const min_radius_ratio = 0.5 / tracks / 2;
// Maximum movement of head: to the inner most track; innermost circle is empty
const head_max_left = disk_diameter / 2 * (1 - min_radius_ratio * 6) - head_diameter / 4;
const head_min_left = disk_diameter / 2 * (1 - max_radius_ratio * 2) - head_diameter / 4;
let head_target = head_min_left;
// Background colors of inner most and outer most disk.
const innerRGB = [255, 255, 255];
const outerRGB = [32, 48, 64];
// AI Algorithms (see alg.js)
const alg = ['[SSTF]', '[SCAN]'];
const algClass = [SSTF, SCAN];

// 1.5 laps
const red_threshold = 360 / (Math.abs(degPerTick) / tickLength) * 1.5;
const yellow_threshold = 360 / (Math.abs(degPerTick) / tickLength) * 1.1;
const red_pts = 5;
const yellow_pts = 50;
const green_pts = 100;

let started = false;
let startTime = 0;
let aiPlaying = false;
let AI = null;
let aiNext = -1;  // Next sector AI wants to read

const disk = document.getElementById('disk');
let head = document.getElementById('head');
const start = document.getElementById('status');
const queue = document.getElementById('queue');
const replay = document.getElementById('replay');
const replayAlg = document.getElementById('replay-alg');

let numbers = [];
let lines = [];
let rotationDegree = 0;
let intervalID = 0;
let pendingQueue = [];
let lastQueue = [];  // All queries of the last game, for AI replay
let curq = [];
const queueCap = Math.min(Math.max(3, queries - 2), 10);
let lastq = 0;  // Last tick since we popped a query to user
const queryInterval = 2000;  // miliseconds between each query
let curReading = -1;
let startReadingDeg = null;
let headCanMove = true;

replayAlg.addEventListener('click', () => {
  let id = parseInt(replayAlg.dataset.id) || 0;
  // Alternating between available algorithms
  id = (id + 1) % alg.length;
  replayAlg.dataset.id = id;
  replayAlg.textContent = alg[id];
});

start.addEventListener('click', () => {
  if (started) {
    stopGame(false);
  } else {
    startGame(false);
  }
});

document.getElementById('replay-text').addEventListener('click', () => {
  startGame(true);
});

function startGame(isAI) {
  // Start the game
  document.getElementById('status-text').textContent = '> Shutdown';
  if (isAI) {
    // Replay, reuse last game
    pendingQueue = lastQueue.slice();  // copy
    aiPlaying = true;
    // Init ai class
    let id = parseInt(replayAlg.dataset.id) || 0;
    AI = new (algClass[id])(total);
    AI.init();
  } else {
    // Generate queries for human games
    pendingQueue = generateQueries(queries);
    lastQueue = pendingQueue.slice();
  }
  // Output the puzzle for debugging
  console.log(pendingQueue.slice());
  // Start rotating
  intervalID = setInterval(() => {
    tick(degPerTick);
  }, tickLength);
  startTime = new Date();
  started = true;
  replay.style.visibility = 'hidden';
}

function stopGame(success) {
  // End the game
  document.getElementById('status-text').textContent = '> Boot';
  // Stop rotating
  clearInterval(intervalID);
  // Show results
  alert(`${aiPlaying ? 'AI' : 'You'} ${success ? 'won' : 'lost'}! Score: ${parseInt(document.getElementById('curscore').textContent)}, time: ${document.getElementById('curtime').textContent}`);
  // Clear queue
  queue.innerHTML = '';
  // Reset score
  document.getElementById('curscore').textContent = '0';
  document.getElementById('curtime').textContent = '00:00';
  started = false;
  aiPlaying = false;
  curReading = -1;
  startReadingDeg = null;
  lastq = 0;
  pendingQueue = [];
  curq = [];
  headCanMove = true;
  aiNext = -1;
  replay.style.visibility = 'visible';
}

// Generate `count` random numbers from 0 to (tracks-1) * sectors - 1 without duplicate
function generateQueries(count) {
  let ret = [];
  // Failed - too many numbers to generate
  if (count > total)
    return [];
  let candidates = [];
  for (let i = 0; i < total; ++i) candidates.push(i);
  while (ret.length < count) {
    let idx = Math.floor(Math.random() * candidates.length);
    ret.push(candidates[idx]);
    // Remove the random number from candidates
    candidates.splice(idx, 1);
  }
  return ret;
}

function init() {
  // Reset
  numbers = [];
  lines = [];
  rotationDegree = 0;
  disk.innerHTML = '<div id="head"></div>';
  head = document.getElementById('head');

  disk.style.width = `${disk_diameter}px`;
  disk.style.height = `${disk_diameter}px`;
  head.style.width = `${head_diameter}px`;
  head.style.height = `${head_diameter}px`;
  // Make the head just cover the outer sectors
  head.style.left = `${head_min_left}px`;
  // head.style.left = `${disk_diameter * (1 - max_radius_ratio * 2) - number_width - head_diameter / 2}px`;
  head.style.zIndex = 9;
  // head.style.top = `calc(50% - ${head_diameter / 2}px)`;
  head.style.top = '50%';

  // Draw circles to split tracks from outer to inner (so inners will be at the top)
  for (let i = tracks - 2; i >= 0; --i) {
    let rgb = [];
    for (let k = 0; k < 3; ++k) {
      rgb.push(innerRGB[k] + i * (outerRGB[k] - innerRGB[k]) / tracks);
    }
    let diameter = (i + 1) / tracks * disk_diameter;
    let circle = document.createElement("span");
    circle.className = 'circle';
    circle.style.width = diameter + 'px';
    circle.style.height = diameter + 'px';
    circle.style.left = circle.style.top = `calc(50% - ${diameter / 2}px)`;
    circle.style.backgroundColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    disk.appendChild(circle);
  }

  // Global index of the numbers
  let index = 0;
  // Generate numbers
  for (let i = 1; i < tracks; ++i) {
    for (let j = 0; j < sectors; ++j) {
      let number = document.createElement("span");
      // outer display is smaller
      number.textContent = total - 1 - index;
      // outer index is larger
      number.dataset.index = (index++);
      // relative degree within the same track
      number.dataset.degree = j / sectors * 360;
      number.className = 'number';
      number.dataset.track = i;
      number.dataset.sector = j;
      number.style.width = `${number_width}px`;
      number.style.height = `${number_height}px`;
      numbers.push(number);
      disk.appendChild(number);
    }
  }

  // Draw lines to split sectors
  for (let j = 0; j < sectors; ++j) {
    let line = document.createElement("span");
    line.style.borderBottom = '1px solid deeppink';
    const degree = 360 / sectors;
    line.style.left = `50%`;
    line.style.top = `50%`;
    line.style.width = '50%';
    line.style.height = '2px';
    line.dataset.degree = -90 + degree / 2 + j * degree;
    line.style.transform = `rotateZ(${line.dataset.degree}deg)`;
    line.style.transformOrigin = `left`;
    line.className = 'line';
    disk.appendChild(line);
    lines.push(line);
  }
}

init();

// Cur numbers that are under header sectors (all tracks from inner to outer, not necessary the one being read)
let curNumbers = [];
const curAngleMin = 270 - 180 / sectors;
const curAngleMax = 270 + 180 / sectors;

function updateNumbersPosition() {
  curNumbers = [];
  numbers.forEach((number, i) => {
    // The angles rotated clockwise relative to the 12 o'clock direction, in deg
    const degree = parseInt(number.dataset.degree);
    const rotatedDegree = degree + rotationDegree;
    const track = parseInt(number.dataset.track);
    const index = parseInt(number.dataset.index);
    const radius_ratio = track / (tracks - 1) * (max_radius_ratio - min_radius_ratio) + min_radius_ratio;

    const remainder = ((rotatedDegree % 360) + 360) % 360; // Can be negative so be cautious!
    if (curAngleMin <= remainder && curAngleMax >= remainder) {
      curNumbers.push(i);
    }

    const x = Math.sin(rotatedDegree * (Math.PI / 180)) * radius_ratio * 100;
    const y = Math.cos(rotatedDegree * (Math.PI / 180)) * radius_ratio * 100;

    // If too many numbers, add back the height of num_height to compensate
    number.style.left = `calc(${50 + x}% - ${(index * number_width) % disk_diameter}px - ${number_width / 2}px)`;
    number.style.top = `calc(${50 - y}% - ${number_height / 2 + Math.floor(index * number_width / disk_diameter) * number_height}px)`;
  });
}

function renderQueue() {
  queue.innerHTML = '';
  for (let item of curq) {
    let idx = item.idx;  // Index in numbers array
    let time = item.time;  // Time arrived in ms
    let timeInQue = new Date() - time;
    let query = document.createElement('span');
    query.className = 'queue-box text';
    query.textContent = numbers[idx].textContent;
    if (curReading === idx)
      query.textContent += ' ⌛️';
    if (timeInQue > red_threshold) {
      query.style.backgroundColor = 'red';
    } else if (timeInQue > yellow_threshold) {
      query.style.backgroundColor = 'orange';
    } else {
      query.style.backgroundColor = 'green';
    }
    queue.appendChild(query);
  }
}

// Things to do on each tick
function tick(degrees) {
  // Update time
  let ticks = new Date() - startTime;
  let seconds = Math.floor(ticks / 1000);
  let minutes = Math.floor(seconds / 60);
  seconds %= 60;
  document.getElementById('curtime').textContent = `${(minutes < 10 ? "0" : "") + minutes}:${(seconds < 10 ? "0" : "") + seconds}`;
  // Check if we need to pop a query to user: game just started or last query is too old
  if (((curq.length === 0 && pendingQueue.length === queries) || ticks - lastq >= queryInterval) && pendingQueue.length) {
    let idx = pendingQueue.splice(0, 1)[0];
    // If queue is full, game over
    if (curq.length + 1 >= queueCap) {
      stopGame(false);
      return;
    }
    curq.push({idx: idx, time: new Date()});
    if (aiPlaying) AI.add(total - 1 - idx);  // Add the number displayed on sector
    lastq = ticks;
  }

  // rotate the disk
  rotationDegree += degrees;
  updateNumbersPosition();
  lines.forEach((line) => {
    line.dataset.degree = parseFloat(line.dataset.degree) + degrees;
    line.style.transform = `rotateZ(${line.dataset.degree}deg)`;
  });

  let head_left = parseFloat(document.getElementById('head').style.left);
  // Outer track is smaller
  let curTrack = Math.round((head_left - head_min_left) / (disk_diameter / tracks / 2));

  // If idle, check the next we want to read
  if (aiPlaying && aiNext === -1) {
    aiNext = AI.get();
  }

  // Move head if away from the target
  if (Math.abs(head_left - head_target) > 3) {
    head.style.left = head_left + (head_target > head_left ? 1 : -1) * head_speed + 'px';
  } else {
    // Stable - can read
    if (aiPlaying && aiNext !== -1) {
      // Check if AI needs to move head
      let track = Math.floor(aiNext / sectors);
      if (curTrack > track) {
        // Move left (to outer)
        handleKeyDown({key: 'ArrowLeft', isAI: 1});
      } else if (curTrack < track) {
        handleKeyDown({key: 'ArrowRight', isAI: 1});
      }
    }
    // curNumbers are from inner to outer so take negative
    curTrack = tracks - 2 - curTrack;
    // If there are reading numbers in queue and current number is not the reading number, reading complete!
    if (curReading !== -1 && curReading !== curNumbers[curTrack]) {
      // Re-enable head movement
      headCanMove = true;
      // If startReadingDeg is null, reading not start yet, always fail
      let readDeg = Math.abs(rotationDegree - (startReadingDeg === null ? rotationDegree : startReadingDeg));
      startReadingDeg = null;
      if (readDeg >= 360 / sectors) {
        // Read the whole sector success (deg is safer than time for possible lagging)
        // Remove first occurance from curq
        let i = 0;
        for (; i < curq.length; ++i) {
          if (curq[i].idx == curReading) break;
        }
        
        if (i < curq.length) {
            let score = parseInt(document.getElementById('curscore').textContent);
            if (new Date() - curq[i].time > red_threshold)
                score += red_pts;
            else if (new Date() - curq[i].time > yellow_threshold)
                score += yellow_pts;
            else
                score += green_pts;
            document.getElementById('curscore').textContent = score;
            curq.splice(i, 1);
        }
        // If no more queries to pop, user wins
        if (curq.length === 0 && pendingQueue.length === 0) {
          stopGame(true);
          return;
        }
        curReading = -1;
        if (aiPlaying) aiNext = AI.get();
      }
    }
    // If current number is in the queue, begin reading, and disable head movement
    for (let item of curq) {
      if (curNumbers[curTrack] === item.idx) {
        curReading = item.idx;
        headCanMove = false;
        if (startReadingDeg === null) startReadingDeg = rotationDegree;
        break;
      }
    }
  }
  renderQueue();
}

function handleKeyDown(event) {
  if (!started || !headCanMove || (aiPlaying && !event.isAI)) return;
  if (event.key === 'ArrowLeft') {
    if (head_target <= head_min_left) return;
    head_target -= disk_diameter / tracks / 2;
  } else if (event.key === 'ArrowRight') {
    if (head_target >= head_max_left) return;
    head_target += disk_diameter / tracks / 2;
  }
}

document.addEventListener('keydown', handleKeyDown);

updateNumbersPosition();
