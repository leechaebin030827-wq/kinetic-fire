// --- [변수 설정] 프로그램에서 사용할 재료들을 미리 준비하는 칸이에요. ---
let cells = [];        // 화면을 가득 채울 '火' 글자들을 담아둘 큰 바구니예요.
let cols, rows;        // 화면 가로, 세로에 글자가 몇 줄씩 들어갈지 저장할 칸이에요.
let resolution = 25;   // 글자 하나하나의 방 크기(격자)예요. 작을수록 더 빽빽해져요.
let particles = [];    // 불꽃이 탈 때 위로 날아가는 작은 가루들을 담는 바구니예요.

// [커서 관련] 쫀득하게 따라오는 마우스를 위한 변수예요.
let cursorX = 0;       // 마우스 원의 현재 가로 위치
let cursorY = 0;       // 마우스 원의 현재 세로 위치
let cursorSize = 20;   // 마우스 원의 크기예요.

// --- [setup] 프로그램이 시작될 때 딱 한 번 실행되는 설정창이에요. ---
function setup() {
    let canvas = createCanvas(windowWidth, windowHeight); // 브라우저 크기만큼 도화지를 펼쳐요.
    canvas.style('display', 'block'); // 도화지가 화면에 꽉 차게 고정해요.

    textFont('Liu Jian Mao Cao'); // 붓글씨 느낌의 멋진 서체를 불러와요.
    textAlign(CENTER, CENTER);    // 글자를 정중앙에 맞춰서 그려요.
    initGrid();                   // 바둑판 모양으로 글자들을 배치해요.

    noCursor(); // 화살표 모양의 기본 마우스 커서를 안 보이게 숨겨요.
    cursorX = width / 2;  // 처음에 커서 위치를 화면 정중앙으로 잡아둬요.
    cursorY = height / 2;
}

// --- [windowResized] 브라우저 창 크기를 조절하면 실행돼요. ---
function windowResized() {
    resizeCanvas(windowWidth, windowHeight); // 도화지 크기를 다시 맞추고
    initGrid(); // 글자들도 새 크기에 맞춰 다시 깔아줘요.
}

// --- [initGrid] 글자들을 바둑판 모양으로 촘촘하게 배치하는 함수예요. ---
function initGrid() {
    cells = []; // 일단 바구니를 비워요.
    cols = floor(width / resolution) + 1;  // 가로 너비를 칸 크기로 나눠서 몇 줄 필요한지 계산해요.
    rows = floor(height / resolution) + 1; // 세로 높이를 칸 크기로 나눠서 몇 줄 필요한지 계산해요.

    for (let i = 0; i < cols; i++) {
        cells[i] = []; // 가로 바구니 안에 세로 줄을 만들어요.
        for (let j = 0; j < rows; j++) {
            // 모든 칸에 'Cell'이라는 똑똑한 글자 객체를 하나씩 생성해서 넣어요.
            cells[i][j] = new Cell(i, j, resolution);
        }
    }
}

// --- [draw] 1초에 60번씩 계속 실행되면서 화면을 새로 그려주는 핵심 함수예요. ---
function draw() {
    background('#000000'); // 매 순간 화면을 검은색으로 싹 지워서 잔상을 없애요.

    // 4프레임(약 0.06초)마다 옆 칸으로 불길이 번지게 명령해요.
    if (frameCount % 4 === 0) {
        spreadHeat();
    }

    // 마우스 혹은 터치 위치가 어디인지 확인해요.
    let targetX = touches.length > 0 ? touches[0].x : mouseX;
    let targetY = touches.length > 0 ? touches[0].y : mouseY;

    // [중요] lerp(현재, 목표, 속도) 함수로 마우스 원이 쫀득하게 따라오게 만들어요.
    // 0.1은 10%씩 따라오라는 뜻이라서 약간 느릿하고 끈적하게 움직여요.
    cursorX = lerp(cursorX, targetX, 0.1);
    cursorY = lerp(cursorY, targetY, 0.1);

    // 모든 글자들에게 할 일을 시켜요.
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            cells[i][j].interact(cursorX, cursorY); // "마우스가 가까우면 뜨거워져라!"
            cells[i][j].update();                // "시간이 지났으니 온도를 계산해라!"
            cells[i][j].display();               // "화면에 네 모습을 그려라!"
        }
    }

    // 타닥타닥 튀는 불꽃 가루들을 그려줘요.
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();  // 위로 올라가고 작아지게 해요.
        particles[i].display(); // 화면에 그려요.
        if (particles[i].isDead() || particles.length > 50) {
            particles.splice(i, 1); // 수명이 다하거나 너무 많아지면 지워줘요.
        }
    }

    // --- 마우스 커서 그리기 (반전 효과) ---
    drawOrganicCursor();
}

// 마우스 원을 그려주는 함수예요.
function drawOrganicCursor() {
    push();
    blendMode(DIFFERENCE); // [핵심] 이 모드를 켜면 닿는 곳의 색깔이 마법처럼 반전돼요!
    noStroke();

    // 약간 투명한 회색을 칠하면 글자와 겹칠 때 반전 효과가 가장 뚜렷하게 보여요.
    fill(200, 200, 200);
    circle(cursorX, cursorY, cursorSize); // 부드럽게 따라오는 위치에 원을 그려요.
    pop();
}

// 불이 붙은 글자가 주변 이웃 글자들에게 열기를 나눠주는 함수예요.
function spreadHeat() {
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let c = cells[i][j];
            if (c.state === 'BURNING') { // 내가 불타는 중이라면?
                for (let xOff = -1; xOff <= 1; xOff++) {
                    for (let yOff = -1; yOff <= 1; yOff++) {
                        if (xOff === 0 && yOff === 0) continue; // 나 자신은 제외하고
                        let ni = i + xOff;
                        let nj = j + yOff;
                        // 주변 8칸의 이웃이 화면 안에 있고, 아직 안 탔다면?
                        if (ni >= 0 && ni < cols && nj >= 0 && nj < rows) {
                            let neighbor = cells[ni][nj];
                            if (neighbor.state !== 'BURNING' && neighbor.state !== 'ASH') {
                                if (random(1) < 0.12) { // 12%의 확률로 이웃의 온도를 높여요.
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

// --- [Cell 클래스] 글자 하나하나의 인공지능 설계도예요. ---
class Cell {
    constructor(i, j, size) {
        this.i = i;
        this.j = j;
        this.x = i * size + size / 2; // 내 가로 위치
        this.y = j * size + size / 2; // 내 세로 위치
        this.size = size;             // 내 크기
        this.temp = 0;                // 현재 온도 (0~100)
        this.state = 'IDLE';          // 상태 (대기, 달궈짐, 타는중, 재)
        this.burnTime = 0;            // 불타기 시작하고 지난 시간
        this.maxBurnTime = random(60, 150); // 얼마나 오래 탈지 랜덤으로 정해요.
        this.ashTime = 0;             // 재가 되고 지난 시간
        this.maxAshTime = random(120, 250); // 재 상태로 얼마나 있을지 정해요.
        this.offset = random(1000);   // 불타올라 흔들릴 때 각자 다르게 흔들리게 하는 값이에요.
    }

    // 마우스(열기 원)와 상호작용하는 규칙
    interact(mx, my) {
        if (this.state === 'ASH') return; // 이미 타버린 재는 무시해요.
        let d = dist(mx, my, this.x, this.y); // 마우스와 나 사이의 거리 계산
        let interactionRadius = this.size * 3.0; // 마우스의 열기 도달 범위

        if (d < interactionRadius) {
            // 마우스가 가까울수록 온도를 확 높여요!
            let heatIncrease = map(d, 0, interactionRadius, 45, 0);
            this.temp += heatIncrease;
            this.temp = min(this.temp, 100); // 최대 온도는 100까지만!
        }
    }

    // 매 순간 나의 상태를 업데이트해요.
    update() {
        if (this.state === 'ASH') {
            this.ashTime++;
            if (this.ashTime > this.maxAshTime) {
                // [부활!] 재로 있는 시간이 다 지나면 다시 깨끗한 대기 상태로 돌아가요.
                this.state = 'IDLE';
                this.temp = 0;
                this.burnTime = 0;
                this.ashTime = 0;
            }
            return;
        }

        if (this.temp >= 100) {
            this.state = 'BURNING'; // 온도가 100이면 불꽃 발화!
        } else if (this.temp > 0) {
            this.state = 'IGNITING'; // 온도가 있으면 조금씩 달궈지는 중
            this.temp -= 0.8; // 아무 자극이 없으면 서서히 식어요.
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
                // 불타는 동안 10% 확률로 불꽃 가루를 뿜어요.
                particles.push(new Particle(this.x, this.y));
            }
        }
    }

    // 화면에 나의 모습을 그리는 규칙이에요.
    display() {
        // 화면 밖에 있는 글자는 계산하지 않아서 컴퓨터를 안 느려지게 해요.
        if (this.x < -this.size || this.x > width + this.size || this.y < -this.size || this.y > height + this.size) return;

        push();
        translate(this.x, this.y); // 내 위치로 이동해서

        let col;
        let scaleAmount = 1;

        // 상태별로 색깔과 크기를 정해요.
        if (this.state === 'IDLE') {
            col = color('#444444'); // 대기중: 평범한 회색
        } else if (this.state === 'IGNITING') {
            // 달궈지는중: 진한 빨강에서 밝은 주황으로 온도가 높을수록 변해요.
            col = lerpColor(color('#801500'), color('#ff3300'), this.temp / 100.0);
            scaleAmount = map(this.temp, 0, 100, 1, 1.15); // 커져요.
        } else if (this.state === 'BURNING') {
            // 불타는중: 흰색 -> 노랑 -> 빨강 순으로 타는 시간에 따라 변해요.
            let phase = this.burnTime / this.maxBurnTime;
            col = phase < 0.1 ? color('#f2f2f2') : lerpColor(color('#ffcc00'), color('#ff0000'), phase);
            // 불꽃처럼 파르르 흔들리는 효과를 줘요.
            scaleAmount = 1.15 + sin(frameCount * 0.2 + this.offset) * 0.1;
        } else if (this.state === 'ASH') {
            col = color('#1a1a1a'); // 재: 아주 어두운 회색
        }

        scale(scaleAmount); // 크기 적용
        fill(col);          // 색깔 입히기
        noStroke();
        textSize(this.size * 0.85);
        text('火', 0, 0); // 드디어 '火' 글자를 그려요!
        pop();
    }
}

// --- [Particle 클래스] 공중에 날아가는 작은 불꽃 알갱이 설계도예요. ---
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = random(-0.5, 0.5); // 좌우로 퍼지는 속도
        this.vy = random(-0.5, -2);  // 위로 솟구치는 속도
        this.life = 150;             // 수명 (점점 투명해져요)
    }
    update() {
        this.x += this.vx;
        this.y += this.vy; // 매 프레임 위치 이동
        this.life -= 10;   // 수명 깎임
    }
    display() {
        noStroke();
        fill(255, 100, 0, this.life); // 주황색인데 수명에 따라 투명해져요.
        circle(this.x, this.y, 3);    // 아주 작은 원으로 그려요.
    }
    isDead() { return this.life <= 0; } // 수명이 다했는지 확인해요.
}