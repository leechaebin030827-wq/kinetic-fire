// --- [변수 설정] 프로그램의 기본 설정값들을 준비해요. ---
let cells = [];        // '火' 글자들을 담아두는 바구니예요.
let cols, rows;        // 가로, 세로에 들어갈 글자 줄 수예요.
let resolution = 25;   // 글자 하나가 차지하는 크기(격자)예요.
let particles = [];    // 불타오를 때 튀는 작은 가루들을 담는 바구니예요.

// [커서 관련] 쫀득하게 따라오는 마우스 효과를 위한 변수예요.
let cursorX = 0;
let cursorY = 0;
let cursorSize = 35;

// [확대/축소 관련] 모바일에서 두 손가락 거리를 기억하기 위한 변수예요.
let lastDist = 0;

// --- [setup] 프로그램 시작 시 딱 한 번 실행되는 설정창이에요. ---
function setup() {
    let canvas = createCanvas(windowWidth, windowHeight); // 화면 꽉 차게 도화지를 만들어요.
    canvas.style('display', 'block');
    canvas.style('touch-action', 'none'); // 모바일 브라우저의 기본 줌 기능을 꺼서 우리 코드가 작동하게 해요.

    textFont('Liu Jian Mao Cao'); // 붓글씨 폰트를 불러와요.
    textAlign(CENTER, CENTER);    // 글자를 가운데 정렬해요.
    initGrid();                   // 글자들을 화면에 배치해요.

    noCursor(); // 화살표 모양의 기본 마우스 커서를 숨겨요.
    cursorX = width / 2;
    cursorY = height / 2;
}

// --- [windowResized] 브라우저 창 크기를 바꾸면 실행돼요. ---
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    initGrid(); // 새 크기에 맞춰 글자들을 다시 배치해요.
}

// --- [touchMoved] 손가락을 움직이거나 마우스를 드래그할 때 실행돼요. ---
function touchMoved() {
    // 손가락이 2개일 때 (확대/축소 제스처)
    if (touches.length === 2) {
        // 두 손가락 사이의 거리를 계산해요.
        let currentDist = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y);

        if (lastDist > 0) {
            // [수정된 로직] 벌리면(확대) 글자가 커지고, 오므리면(축소) 글자가 작고 촘촘해져요.
            let diff = currentDist - lastDist;
            resolution += diff * 0.1; // 0.1은 민감도예요. 숫자를 높이면 더 빨리 변해요.

            // 글자 크기가 너무 작거나 커지지 않게 제한해요 (10~80 사이).
            resolution = constrain(resolution, 10, 80);

            // 크기가 바뀌었으니 격자를 새로 짜요.
            initGrid();
        }
        lastDist = currentDist;
    }
    return false; // 화면이 출렁거리는 것을 방지해요.
}

// --- [touchEnded] 화면에서 손을 떼면 실행돼요. ---
function touchEnded() {
    lastDist = 0; // 거리 기록을 초기화해요.
}

// --- [initGrid] 글자들을 바둑판 모양으로 깔아주는 함수예요. ---
function initGrid() {
    cells = [];
    cols = floor(width / resolution) + 1;
    rows = floor(height / resolution) + 1;

    for (let i = 0; i < cols; i++) {
        cells[i] = [];
        for (let j = 0; j < rows; j++) {
            // 모든 칸에 글자 객체를 생성해요.
            cells[i][j] = new Cell(i, j, resolution);
        }
    }
}

// --- [draw] 화면을 계속 새로 그리는 함수예요 (1초에 60번). ---
function draw() {
    background('#000000'); // 화면을 매번 검은색으로 지워요.

    if (frameCount % 4 === 0) {
        spreadHeat(); // 불길이 옆으로 번지게 해요.
    }

    // 마우스나 손가락이 어디 있는지 확인해요.
    let targetX = touches.length > 0 ? touches[0].x : mouseX;
    let targetY = touches.length > 0 ? touches[0].y : mouseY;

    // 커서가 목표 지점을 쫀득하게(10% 속도로) 쫓아오게 해요.
    cursorX = lerp(cursorX, targetX, 0.1);
    cursorY = lerp(cursorY, targetY, 0.1);

    // 모든 '火' 글자들에게 각자 할 일을 시켜요.
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            cells[i][j].interact(cursorX, cursorY); // 마우스와 상호작용
            cells[i][j].update();                // 상태 계산 (온도, 타는 시간 등)
            cells[i][j].display();               // 화면에 그리기
        }
    }

    // 불꽃 가루(입자)들을 처리해요.
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].display();
        if (particles[i].isDead() || particles.length > 50) {
            particles.splice(i, 1);
        }
    }

    // 마우스 커서(원)를 그려요.
    drawOrganicCursor();
}

// --- [drawOrganicCursor] 쫀득한 반전 원 커서를 그려요. ---
function drawOrganicCursor() {
    // [수정] 모바일(터치 중)일 때는 손가락을 가리지 않도록 커서를 안 그려요.
    if (touches.length > 0) return;

    // 마우스가 화면 안에 있을 때만 그려요.
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        push();
        blendMode(DIFFERENCE); // 닿는 곳의 색을 반전시켜요.
        noStroke();
        fill(200, 200, 200); // 약간 회색빛 흰색
        circle(cursorX, cursorY, cursorSize);
        pop();
    }
}

// --- [spreadHeat] 불타는 글자가 주변 글자에 불을 옮기는 규칙이에요. ---
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
                                if (random(1) < 0.12) { // 12% 확률로 불이 번져요.
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

// --- [Cell 클래스] 글자 하나하나의 인공지능이에요. ---
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
        this.maxAshTime = random(120, 250); // 재 상태로 머무는 시간 (부활 대기시간)
        this.offset = random(1000);
    }

    // 마우스 열기와 반응해요.
    interact(mx, my) {
        if (this.state === 'ASH') return;
        let d = dist(mx, my, this.x, this.y);
        let interactionRadius = this.size * 3.0; // 글자 크기의 3배 범위까지 열기가 닿아요.

        if (d < interactionRadius) {
            let heatIncrease = map(d, 0, interactionRadius, 45, 0);
            this.temp += heatIncrease;
            this.temp = min(this.temp, 100);
        }
    }

    // 시간에 따른 변화를 계산해요.
    update() {
        if (this.state === 'ASH') {
            this.ashTime++;
            if (this.ashTime > this.maxAshTime) {
                // 부활! 다시 대기 상태로 돌아가요.
                this.state = 'IDLE';
                this.temp = 0;
                this.burnTime = 0;
                this.ashTime = 0;
            }
            return;
        }

        if (this.temp >= 100) {
            this.state = 'BURNING'; // 온도가 꽉 차면 불타요.
        } else if (this.temp > 0) {
            this.state = 'IGNITING'; // 조금이라도 뜨거우면 달궈져요.
            this.temp -= 0.8; // 가만히 있으면 식어요.
            if (this.temp <= 0) {
                this.temp = 0;
                this.state = 'IDLE';
            }
        }

        if (this.state === 'BURNING') {
            this.burnTime++;
            if (this.burnTime > this.maxBurnTime) {
                this.state = 'ASH'; // 다 타면 재로 변해요.
            }
            if (random(1) < 0.1) {
                particles.push(new Particle(this.x, this.y));
            }
        }
    }

    // 화면에 글자를 그려요.
    display() {
        if (this.x < -this.size || this.x > width + this.size || this.y < -this.size || this.y > height + this.size) return;

        push();
        translate(this.x, this.y);

        let col;
        let scaleAmount = 1;

        if (this.state === 'IDLE') {
            col = color('#444444'); // 기본 회색
        } else if (this.state === 'IGNITING') {
            col = lerpColor(color('#801500'), color('#ff3300'), this.temp / 100.0);
            scaleAmount = map(this.temp, 0, 100, 1, 1.15);
        } else if (this.state === 'BURNING') {
            let phase = this.burnTime / this.maxBurnTime;
            // 타는 단계에 따라 흰색 -> 노랑 -> 빨강으로 변해요.
            col = phase < 0.1 ? color('#f2f2f2') : lerpColor(color('#ffcc00'), color('#ff0000'), phase);
            scaleAmount = 1.15 + sin(frameCount * 0.2 + this.offset) * 0.1;
        } else if (this.state === 'ASH') {
            col = color('#1a1a1a'); // 타버린 재(어두운 색)
        }

        scale(scaleAmount);
        fill(col);
        noStroke();
        textSize(this.size * 0.85);
        text('火', 0, 0);
        pop();
    }
}

// --- [Particle 클래스] 공중으로 튀는 불꽃 가루예요. ---
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = random(-0.5, 0.5);
        this.vy = random(-0.5, -2); // 위로 솟구쳐요.
        this.life = 150;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 10;
    }
    display() {
        noStroke();
        fill(255, 100, 0, this.life); // 주황색이 점점 투명해져요.
        circle(this.x, this.y, 3);
    }
    isDead() { return this.life <= 0; }
}