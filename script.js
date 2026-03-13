let cells = [];
let cols, rows;
let baseResolution = 25; // 기본 글자 크기
let resolution = 25;     // 현재 적용된 글자 크기
let particles = [];

let cursorX = 0;
let cursorY = 0;
let cursorSize = 35;

// [확대/축소 관련]
let lastDist = 0; // 직전 터치 거리를 저장해요.

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.style('display', 'block');
    canvas.style('touch-action', 'none'); // 모바일 기본 브라우저 줌 기능을 꺼서 우리 코드가 작동하게 해요.

    textFont('Liu Jian Mao Cao');
    textAlign(CENTER, CENTER);
    initGrid();

    noCursor();
    cursorX = width / 2;
    cursorY = height / 2;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    initGrid();
}

// --- [추가] 모바일 확대/축소 감지 로직 ---
function touchMoved() {
    // 손가락이 2개일 때만 확대/축소를 계산해요.
    if (touches.length === 2) {
        // 두 손가락 사이의 거리를 계산해요.
        let currentDist = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);

        if (lastDist > 0) {
            // 직전 거리보다 멀어지면(확대) 글자를 키우고, 가까워지면(축소) 글자를 작게(더 많이) 만들어요.
            let diff = currentDist - lastDist;

            // 축소하면 resolution이 작아져서 글자가 더 촘촘해집니다.
            resolution -= diff * 0.1;

            // 너무 작아지거나 커지지 않게 제한을 둬요 (5~100 사이)
            resolution = constrain(resolution, 10, 80);

            // 변화가 생겼으니 격자를 다시 그려요.
            initGrid();
        }
        lastDist = currentDist;
    }
    return false; // 화면이 출렁거리는 것을 막아요.
}

function touchEnded() {
    lastDist = 0; // 손을 떼면 거리 기록을 초기화해요.
}

function initGrid() {
    cells = [];
    cols = floor(width / resolution) + 1;
    rows = floor(height / resolution) + 1;

    for (let i = 0; i < cols; i++) {
        cells[i] = [];
        for (let j = 0; j < rows; j++) {
            cells[i][j] = new Cell(i, j, resolution);
        }
    }
}

function draw() {
    background('#000000');

    if (frameCount % 4 === 0) {
        spreadHeat();
    }

    let targetX = touches.length > 0 ? touches[0].x : mouseX;
    let targetY = touches.length > 0 ? touches[0].y : mouseY;

    cursorX = lerp(cursorX, targetX, 0.1);
    cursorY = lerp(cursorY, targetY, 0.1);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            cells[i][j].interact(cursorX, cursorY);
            cells[i][j].update();
            cells[i][j].display();
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].display();
        if (particles[i].isDead() || particles.length > 50) {
            particles.splice(i, 1);
        }
    }

    drawOrganicCursor();
}

function drawOrganicCursor() {
    push();
    blendMode(DIFFERENCE);
    noStroke();
    fill(200, 200, 200);
    circle(cursorX, cursorY, cursorSize);
    pop();
}

function spreadHeat() {
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let c = cells[i][j];
            if (c.state === 'BURNING') {
                for (let xOff = -1; xOff <= 1; xOff++) {
                    for (let yOff = -1; yOff <= 1; yOff++) {
                        if (xOff === 0 && yOff === 0) continue;
                        let ni = i + xOff;
                        let nj = j + yOff;
                        if (ni >= 0 && ni < cols && nj >= 0 && nj < rows) {
                            let neighbor = cells[ni][nj];
                            if (neighbor.state !== 'BURNING' && neighbor.state !== 'ASH') {
                                if (random(1) < 0.12) {
                                    neighbor.temp += 25;
                                    neighbor.temp = min(neighbor.temp, 100);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

class Cell {
    constructor(i, j, size) {
        this.i = i;
        this.j = j;
        this.x = i * size + size / 2;
        this.y = j * size + size / 2;
        this.size = size;
        this.temp = 0;
        this.state = 'IDLE';
        this.burnTime = 0;
        this.maxBurnTime = random(60, 150);
        this.ashTime = 0;
        this.maxAshTime = random(120, 250);
        this.offset = random(1000);
    }

    interact(mx, my) {
        if (this.state === 'ASH') return;
        let d = dist(mx, my, this.x, this.y);
        let interactionRadius = this.size * 3.0;

        if (d < interactionRadius) {
            let heatIncrease = map(d, 0, interactionRadius, 45, 0);
            this.temp += heatIncrease;
            this.temp = min(this.temp, 100);
        }
    }

    update() {
        if (this.state === 'ASH') {
            this.ashTime++;
            if (this.ashTime > this.maxAshTime) {
                this.state = 'IDLE';
                this.temp = 0;
                this.burnTime = 0;
                this.ashTime = 0;
            }
            return;
        }

        if (this.temp >= 100) {
            this.state = 'BURNING';
        } else if (this.temp > 0) {
            this.state = 'IGNITING';
            this.temp -= 0.8;
            if (this.temp <= 0) {
                this.temp = 0;
                this.state = 'IDLE';
            }
        }

        if (this.state === 'BURNING') {
            this.burnTime++;
            if (this.burnTime > this.maxBurnTime) {
                this.state = 'ASH';
            }
            if (random(1) < 0.1) {
                particles.push(new Particle(this.x, this.y));
            }
        }
    }

    display() {
        if (this.x < -this.size || this.x > width + this.size || this.y < -this.size || this.y > height + this.size) return;

        push();
        translate(this.x, this.y);

        let col;
        let scaleAmount = 1;

        if (this.state === 'IDLE') {
            col = color('#444444');
        } else if (this.state === 'IGNITING') {
            col = lerpColor(color('#801500'), color('#ff3300'), this.temp / 100.0);
            scaleAmount = map(this.temp, 0, 100, 1, 1.15);
        } else if (this.state === 'BURNING') {
            let phase = this.burnTime / this.maxBurnTime;
            col = phase < 0.1 ? color('#f2f2f2') : lerpColor(color('#ffcc00'), color('#ff0000'), phase);
            scaleAmount = 1.15 + sin(frameCount * 0.2 + this.offset) * 0.1;
        } else if (this.state === 'ASH') {
            col = color('#1a1a1a');
        }

        scale(scaleAmount);
        fill(col);
        noStroke();
        textSize(this.size * 0.85);
        text('火', 0, 0);
        pop();
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = random(-0.5, 0.5);
        this.vy = random(-0.5, -2);
        this.life = 150;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 10;
    }
    display() {
        noStroke();
        fill(255, 100, 0, this.life);
        circle(this.x, this.y, 3);
    }
    isDead() { return this.life <= 0; }
}
