let objs = [];
let colors = ['#f71735', '#f7d002', '#1A53C0', '#232323'];
let cnv; // 畫布參考，用於置中
let menuDiv; // 側邊選單 DOM 參考
let iframeOverlay; // iframe 覆蓋層參考（保留給講義）
let iframeEl; // iframe 元素參考


// MODE 控制：'dynamic' 或 'bubble' 或 'quiz'
let mode = 'dynamic';


// --- Bubble game 相關變數 ---
const NUM_CIRCLES = 30;
const COLORS = ['#d8e2dc', '#ffe5d9', '#ffcad4', '#f4acb7'];
let bubbles = [];
let bubbleScore = 0; // 改名避免與測驗 score 衝突
const STUDENT_ID = "412731068";
const STUDENT_NAME = "賴信宇";
let scoreFeedbacks = [];


// 泡泡類別
class Bubble {
    constructor() { this.reset(); }
    reset() {
        this.r = random(50, 200);
        this.x = random(width);
        this.y = height + this.r / 2;
        this.speed = random(0.5, 3);
        this.color = random(COLORS);
        this.alpha = random(50, 200);
        this.isPopped = false;
        this.popFade = 255;
    }
    move() {
        if (this.isPopped) {
            this.popFade -= 10;
            if (this.popFade <= 0) this.reset();
            return;
        }
        this.y -= this.speed;
        if (this.y < -this.r / 2) this.reset();
    }
    display() {
        if (this.isPopped && this.popFade <= 0) return;
        let c = color(this.color);
        let a = this.isPopped ? this.popFade : this.alpha;
        c.setAlpha(a);
        fill(c);
        noStroke();
        ellipse(this.x, this.y, this.r, this.r);


        if (!this.isPopped) {
            let squareSize = this.r / 5;
            fill(255, 150);
            noStroke();
            let angle = PI / 4;
            let distance = (this.r / 2) - (squareSize / 2) - 5;
            let squareX = this.x + cos(angle) * distance;
            let squareY = this.y - sin(angle) * distance;
            rectMode(CENTER);
            rect(squareX, squareY, squareSize, squareSize);
            rectMode(CORNER);
        }
    }
    contains(px, py) {
        if (this.isPopped) return false;
        let d = dist(px, py, this.x, this.y);
        if (d < this.r / 2) return true;
        let squareSize = this.r / 5;
        let angle = PI / 4;
        let distance = (this.r / 2) - (squareSize / 2) - 5;
        let squareX = this.x + cos(angle) * distance;
        let squareY = this.y - sin(angle) * distance;
        if (abs(px - squareX) <= squareSize / 2 && abs(py - squareY) <= squareSize / 2) return true;
        return false;
    }
}


// 分數回饋
class ScoreFeedback {
    constructor(x, y, txt) { this.x = x; this.y = y; this.txt = txt; this.alpha = 255; this.life = 60; }
    update() { this.y -= 0.6; this.alpha -= 4; this.life--; return this.life <= 0; }
    display() { push(); textAlign(LEFT, CENTER); textSize(20); fill(0, this.alpha); noStroke(); text(this.txt, this.x + 8, this.y); pop(); }
}


// --- 原有 DynamicShape 類別與相關函式（保留） ---
function easeInOutExpo(x) {
    return x === 0 ? 0 :
        x === 1 ? 1 :
        x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 :
        (2 - Math.pow(2, -20 * x + 10)) / 2;
}


class DynamicShape {
    constructor() {
        this.x = random(0.3, 0.7) * width;
        this.y = random(0.3, 0.7) * height;
        this.reductionRatio = 1;
        this.shapeType = int(random(4));
        this.animationType = 0;
        this.maxActionPoints = int(random(2, 5));
        this.actionPoints = this.maxActionPoints;
        this.elapsedT = 0;
        this.size = 0;
        this.sizeMax = width * random(0.01, 0.05);
        this.fromSize = 0;
        this.fromX = this.x;
        this.fromY = this.y;
        this.init();
        this.isDead = false;
        this.clr = random(colors);
        this.changeShape = true;
        this.ang = int(random(2)) * PI * 0.25;
        this.lineSW = 0;
    }


    show() {
        push();
        translate(this.x, this.y);
        if (this.animationType == 1) scale(1, this.reductionRatio);
        if (this.animationType == 2) scale(this.reductionRatio, 1);
        fill(this.clr);
        stroke(this.clr);
        strokeWeight(this.size * 0.05);
        if (this.shapeType == 0) {
            noStroke();
            circle(0, 0, this.size);
        } else if (this.shapeType == 1) {
            noFill();
            circle(0, 0, this.size);
        } else if (this.shapeType == 2) {
            noStroke();
            rect(0, 0, this.size, this.size);
        } else if (this.shapeType == 3) {
            noFill();
            rect(0, 0, this.size * 0.9, this.size * 0.9);
        } else if (this.shapeType == 4) {
            line(0, -this.size * 0.45, 0, this.size * 0.45);
            line(-this.size * 0.45, 0, this.size * 0.45, 0);
        }
        pop();
        strokeWeight(this.lineSW);
        stroke(this.clr);
        line(this.x, this.y, this.fromX, this.fromY);
    }


    move() {
        let n = easeInOutExpo(norm(this.elapsedT, 0, this.duration));
        if (0 < this.elapsedT && this.elapsedT < this.duration) {
            if (this.actionPoints == this.maxActionPoints) {
                this.size = lerp(0, this.sizeMax, n);
            } else if (this.actionPoints > 0) {
                if (this.animationType == 0) {
                    this.size = lerp(this.fromSize, this.toSize, n);
                } else if (this.animationType == 1) {
                    this.x = lerp(this.fromX, this.toX, n);
                    this.lineSW = lerp(0, this.size / 5, sin(n * PI));
                } else if (this.animationType == 2) {
                    this.y = lerp(this.fromY, this.toY, n);
                    this.lineSW = lerp(0, this.size / 5, sin(n * PI));
                } else if (this.animationType == 3) {
                    if (this.changeShape == true) {
                        this.shapeType = int(random(5));
                        this.changeShape = false;
                    }
                }
                this.reductionRatio = lerp(1, 0.3, sin(n * PI));
            } else {
                this.size = lerp(this.fromSize, 0, n);
            }
        }


        this.elapsedT++;
        if (this.elapsedT > this.duration) {
            this.actionPoints--;
            this.init();
        }
        if (this.actionPoints < 0) {
            this.isDead = true;
        }
    }


    run() { this.show(); this.move(); }


    init() {
        this.elapsedT = 0;
        this.fromSize = this.size;
        this.toSize = this.sizeMax * random(0.5, 1.5);
        this.duration = int(random(20, 50));
        this.animationType = int(random(3));
        this.fromX = this.x;
        this.fromY = this.y;
        this.toX = this.fromX + (width / 10) * random([-1, 1]) * int(random(1, 4));
        this.toY = this.fromY + (height / 10) * random([-1, 1]) * int(random(1, 4));
        this.changeShape = true;
    }
}


// ----------------- 測驗系統變數（整合到同一檔） -----------------
let table; // p5.Table 題庫
let allQuestions = []; // 由 table 轉成的題目陣列
let quizQuestions = [];
let currentQuestionIndex = 0;
let quizScore = 0; // 改名避免衝突
let quizState = 'IDLE'; // IDLE, QUIZ, RESULT


const NUM_QUESTIONS = 9;
const FONT_SIZE = 20;
const OPTION_HEIGHT = 52;
const OPTION_WIDTH = 640;
const OPTION_START_Y = 170;


// 新增：動畫背景相關變數（測驗專用）
let particles = [];
const NUM_PARTICLES = 80;
let bgOffset = 0;


// 新增：答題回饋狀態
let showFeedback = false;
let feedbackCorrect = false;
let feedbackStart = 0;
const FEEDBACK_DURATION = 900; // 毫秒
let feedbackText = '';


// ----------------- setup / draw / 互動整合 -----------------
function setup() {
    // 初始採視窗化，之後切換 quiz 時會 full-window
    cnv = createCanvas(800, 600);
    cnv.position((windowWidth - width) / 2, (windowHeight - height) / 2);
    if (cnv && cnv.elt) cnv.elt.style.zIndex = '1000';


    rectMode(CENTER);
    objs.push(new DynamicShape());


    // 建側邊選單
    menuDiv = createDiv(`
        <div class="side-menu">
            <div class="menu-item">第一單元作品</div>
            <div class="menu-item">第一單元講義</div>
            <div class="menu-item">測驗系統</div>
            <div class="menu-item">回到首頁</div>
        </div>
    `);
    menuDiv.elt.style.position = 'fixed';
    menuDiv.elt.style.top = '0';
    menuDiv.elt.style.left = '-260px';
    menuDiv.elt.style.width = '260px';
    menuDiv.elt.style.height = '100vh';
    menuDiv.elt.style.background = 'rgba(30,30,30,0.95)';
    menuDiv.elt.style.color = '#fff';
    menuDiv.elt.style.padding = '24px';
    menuDiv.elt.style.boxSizing = 'border-box';
    menuDiv.elt.style.zIndex = '1001';
    menuDiv.elt.style.pointerEvents = 'auto';
    menuDiv.elt.style.transition = 'left 0.35s ease';
    menuDiv.elt.style.fontFamily = 'sans-serif';


    Array.from(menuDiv.elt.querySelectorAll('.menu-item')).forEach(it => {
        it.style.fontSize = '32px';
        it.style.padding = '12px 0';
        it.style.cursor = 'pointer';
    });


    // 建 iframe overlay（第二項講義會使用）
    iframeOverlay = createDiv(`
        <div class="iframe-wrap" style="position:relative;width:100%;height:100%;">
            <button class="iframe-close" aria-label="關閉">✕</button>
            <iframe class="content-iframe" src="" frameborder="0" allowfullscreen style="width:100%;height:100%;border:0;"></iframe>
        </div>
    `);
    iframeOverlay.elt.style.position = 'fixed';
    iframeOverlay.elt.style.top = '50%';
    iframeOverlay.elt.style.left = '50%';
    iframeOverlay.elt.style.transform = 'translate(-50%,-50%)';
    iframeOverlay.elt.style.width = '80vw';
    iframeOverlay.elt.style.height = '80vh';
    iframeOverlay.elt.style.maxWidth = '1200px';
    iframeOverlay.elt.style.maxHeight = '900px';
    iframeOverlay.elt.style.background = '#fff';
    iframeOverlay.elt.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)';
    iframeOverlay.elt.style.borderRadius = '8px';
    iframeOverlay.elt.style.padding = '8px';
    iframeOverlay.elt.style.boxSizing = 'border-box';
    iframeOverlay.elt.style.zIndex = '10002';
    iframeOverlay.elt.style.display = 'none';
    iframeOverlay.elt.style.overflow = 'hidden';


    iframeEl = iframeOverlay.elt.querySelector('.content-iframe');
    const closeBtn = iframeOverlay.elt.querySelector('.iframe-close');
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '8px';
    closeBtn.style.right = '8px';
    closeBtn.style.zIndex = '10003';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.color = '#333';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', hideIframe);


    // 選單項目可點擊與鍵盤支援
    (function enableMenuActions() {
        const items = Array.from(menuDiv.elt.querySelectorAll('.menu-item'));
        items.forEach((it, idx) => {
            it.tabIndex = 0;
            it.setAttribute('role', 'button');
            it.style.transition = 'background 0.15s';
            it.addEventListener('mouseenter', () => it.style.background = 'rgba(255,255,255,0.06)');
            it.addEventListener('mouseleave', () => it.style.background = 'transparent');
            it.addEventListener('focus', () => it.style.background = 'rgba(255,255,255,0.08)');
            it.addEventListener('blur', () => it.style.background = 'transparent');


            it.addEventListener('click', () => {
                switch (idx) {
                    case 0:
                        // 切換到泡泡遊戲模式（不開新檔）
                        startBubbleGame();
                        break;
                    case 1:
                        showIframe('https://hackmd.io/@xin28888888/S1xL8QAixe');
                        break;
                    case 2:
                        // 直接在同一畫布啟動測驗系統（全螢幕）
                        startQuiz();
                        break;
                    case 3:
                        window.location.href = 'index.html';
                        break;
                }
            });


            it.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    it.click();
                }
            });
        });
    })();


    // 偵測滑鼠位置以控制選單顯示
    window.addEventListener('mousemove', (e) => {
        let rect = cnv && cnv.elt ? cnv.elt.getBoundingClientRect() : null;
        let inCanvasLeft100 = false;
        if (rect) {
            inCanvasLeft100 = (e.clientX >= rect.left && e.clientX <= rect.left + 100 && e.clientY >= rect.top && e.clientY <= rect.bottom);
        } else {
            inCanvasLeft100 = e.clientX <= 100;
        }
        let menuRect = menuDiv.elt.getBoundingClientRect();
        let inMenu = (e.clientX >= menuRect.left && e.clientX <= menuRect.right && e.clientY >= menuRect.top && e.clientY <= menuRect.bottom);


        if (inCanvasLeft100 || inMenu) {
            menuDiv.elt.style.left = '0px';
        } else {
            menuDiv.elt.style.left = '-260px';
        }
    });


    menuDiv.elt.addEventListener('mouseenter', () => menuDiv.elt.style.left = '0px');
    menuDiv.elt.addEventListener('mouseleave', () => menuDiv.elt.style.left = '-260px');
}


// 主繪製函式：依 mode 切換顯示
function draw() {
    background(255);


    if (mode === 'bubble') {
        // bubble 遊戲更新與顯示
        for (let i = bubbles.length - 1; i >= 0; i--) {
            let b = bubbles[i];
            b.move();
            b.display();
        }


        // 分數與學號
        fill(0);
        textSize(24);
        textAlign(LEFT, TOP);
        text('分數: ' + bubbleScore, 10, 10);
        textSize(20);
        textAlign(RIGHT, TOP);
        text('姓名: ' + STUDENT_NAME, width - 10, 10);
        text('學號: ' + STUDENT_ID, width - 10, 35);


        // 分數回饋
        for (let i = scoreFeedbacks.length - 1; i >= 0; i--) {
            let f = scoreFeedbacks[i];
            f.display();
            if (f.update()) scoreFeedbacks.splice(i, 1);
        }
        return;
    }


    if (mode === 'quiz') {
        // 使用測驗系統的畫面（全螢幕）
        drawAnimatedBackground();
        cursor(ARROW);
        drawDownloadButton();
        if (quizState === 'IDLE') drawIdle();
        else if (quizState === 'QUIZ') displayQuiz();
        else if (quizState === 'RESULT') displayResult();
        return;
    }


    // 在主頁面（dynamic mode）顯示姓名和學號
    let nameColor = 128 + sin(frameCount * 0.05) * 128;
    fill(nameColor);
    textSize(20);
    textAlign(RIGHT, TOP);
    text('姓名: ' + STUDENT_NAME, width - 10, 10);    
    text('學號: ' + STUDENT_ID, width - 10, 35);


    // 原有 dynamic shapes 顯示邏輯
    for (let i of objs) i.run();


    if (frameCount % int(random([15, 30])) == 0) {
        let addNum = int(random(1, 30));
        for (let i = 0; i < addNum; i++) objs.push(new DynamicShape());
    }
    for (let i = objs.length - 1; i >= 0; i--) {
        if (objs[i].isDead) objs.splice(i, 1);
    }
}


// 開始/初始化泡泡遊戲（在同一畫布中）
function startBubbleGame() {
    // 若正在 quiz，先退出全螢幕回到視窗化大小
    exitQuizFullscreenIfNeeded();
    mode = 'bubble';
    bubbles = [];
    bubbleScore = 0;
    scoreFeedbacks = [];
    for (let i = 0; i < NUM_CIRCLES; i++) bubbles.push(new Bubble());
    // 將選單收回
    menuDiv.elt.style.left = '-260px';
}


// 回到原本的動態模式
function stopBubbleGame() {
    mode = 'dynamic';
    objs = [];
    objs.push(new DynamicShape());
}


// ---------- 測驗系統：函式實作（整合、不另存檔） ----------
function enterFullscreenCanvas() {
    // 將 canvas 調整為視窗尺寸並用 css 佔滿整個視窗
    resizeCanvas(windowWidth, windowHeight);
    if (cnv && cnv.elt) {
        cnv.elt.style.position = 'fixed';
        cnv.elt.style.left = '0px';
        cnv.elt.style.top = '0px';
        cnv.elt.style.width = '100vw';
        cnv.elt.style.height = '100vh';
        cnv.elt.style.zIndex = '999';
    }
}


function exitFullscreenCanvas() {
    // 還原為視窗化 800x600 並置中
    resizeCanvas(800, 600);
    if (cnv && cnv.elt) {
        cnv.elt.style.position = '';
        cnv.elt.style.left = '';
        cnv.elt.style.top = '';
        cnv.elt.style.width = '';
        cnv.elt.style.height = '';
        cnv.elt.style.zIndex = '1000';
        cnv.position((windowWidth - width) / 2, (windowHeight - height) / 2);
    }
}


function startQuiz() {
    // 切換到 quiz 模式並把畫布放到全螢幕（覆蓋視窗）
    mode = 'quiz';
    enterFullscreenCanvas();
    // 建立題庫並轉為 allQuestions
    generateTable();
    loadQuestionsFromTable();
    // 初始化粒子（用目前畫布大小）
    initParticles();
    // 預設先抽一次題目但停在 IDLE 顯示說明
    resetQuiz();
    quizState = 'IDLE';
    // 收起選單
    menuDiv.elt.style.left = '-260px';
}


function exitQuizFullscreenIfNeeded() {
    // 只在 quiz 模式時還原
    if (mode === 'quiz') {
        exitFullscreenCanvas();
    } else {
        // 若 canvas 被其他操作改變，保證置中
        if (cnv && cnv.elt) cnv.position((windowWidth - width) / 2, (windowHeight - height) / 2);
    }
}


function generateTable() {
  table = new p5.Table();
  table.addColumn('Question');
  table.addColumn('OptionA');
  table.addColumn('OptionB');
  table.addColumn('OptionC');
  table.addColumn('OptionD');
  table.addColumn('CorrectAnswer');


  addRow(table, "當程式開始時，哪一個函式會自動執行一次？", "draw()", "setup()", "mousePressed()", "loop()", "B");
  addRow(table, "若要建立畫布大小為 400x400，應該使用哪一行程式？", "makeCanvas(400,400);", "canvas(400,400);", "createCanvas(400,400);", "newCanvas(400,400);", "C");
  addRow(table, "在 p5.js 中，background(0,255,0); 代表背景是什麼顏色？", "紅色", "綠色", "藍色", "黑色", "B");
  addRow(table, "哪一個指令可以畫出一個圓？", "rect(x, y, w, h);", "circle(x, y, d);", "oval(x, y, d);", "ellipse(x, y, w);", "B");
  addRow(table, "若要讓畫面每秒更新60次，應使用：", "frameRate(60);", "speed(60);", "update(60);", "drawRate(60);", "A");
  addRow(table, "p5.js 是什麼？", "一個繪圖函式庫", "一種咖啡品牌", "一種車型", "一種水果", "A");
  addRow(table, "哪個顏色代碼代表純紅色？", "#FF0000", "#00FF00", "#0000FF", "#FFFFFF", "A");
  addRow(table, "在 p5.js 中，width 代表什麼？", "畫布的高度", "畫布的寬度", "視窗的亮度", "線條的粗細", "B");
  addRow(table, "noStroke() 的作用是？", "沒有填色", "沒有邊線", "沒有背景", "沒有動畫", "B");
}


function addRow(tbl, q, a, b, c, d, correct) {
  let r = tbl.addRow();
  r.setString('Question', q);
  r.setString('OptionA', a);
  r.setString('OptionB', b);
  r.setString('OptionC', c);
  r.setString('OptionD', d);
  r.setString('CorrectAnswer', correct);
}


function loadQuestionsFromTable() {
  allQuestions = [];
  for (let i = 0; i < table.getRowCount(); i++) {
    let row = table.getRow(i);
    allQuestions.push({
      question: row.getString('Question'),
      options: {
        A: row.getString('OptionA'),
        B: row.getString('OptionB'),
        C: row.getString('OptionC'),
        D: row.getString('OptionD')
      },
      correct: row.getString('CorrectAnswer')
    });
  }
}


function resetQuiz() {
  let available = [...allQuestions];
  quizQuestions = [];
  let take = min(NUM_QUESTIONS, available.length);
  for (let i = 0; i < take; i++) {
    let idx = floor(random(available.length));
    quizQuestions.push(available[idx]);
    available.splice(idx, 1);
  }
  quizScore = 0;
  currentQuestionIndex = 0;
  quizState = 'QUIZ';
  showFeedback = false;
}


function drawDownloadButton() {
  let bx = width - 120;
  let by = 30;
  let bw = 200;
  let bh = 40;
  let x1 = bx - bw/2;
  let y1 = by - bh/2;
  if (mouseX > x1 && mouseX < x1 + bw && mouseY > y1 && mouseY < y1 + bh) {
    fill(70,130,180);
    cursor(HAND);
  } else {
    fill(100);
  }
  noStroke();
  rect(x1, y1, bw, bh, 8);


  textSize(14);
  textAlign(CENTER, CENTER);
  fill(220,40,40);
  text('下載題庫 (generated_quiz.csv)', bx, by);
  textSize(FONT_SIZE);
  textAlign(CENTER, CENTER);
}


function drawIdle() {
  let titleY = height * 0.16;
  push();
  noStroke();
  fill(255, 255, 255, 180);
  rectMode(CENTER);
  rect(width/2, titleY, width * 0.7, 120, 12);
  pop();


  textSize(48);
  fill(220,40,40);
  textAlign(CENTER, CENTER);
  text('互動測驗示範', width/2, titleY);


  textSize(20);
  fill(220,40,40);
  textAlign(CENTER, TOP);
  text('按任意空白區或點擊下方「開始測驗」以開始\n（題庫也可下載）', width/2, titleY + 40, width * 0.7);
  textAlign(CENTER, CENTER);


  let bx = width/2;
  let by = height * 0.55;
  let bw = min(360, width * 0.4);
  let bh = 72;
  let x1 = bx - bw/2;
  let y1 = by - bh/2;
  if (mouseX > x1 && mouseX < x1 + bw && mouseY > y1 && mouseY < y1 + bh) {
    fill(80,160,100);
    cursor(HAND);
  } else {
    fill(60,130,80);
  }
  rect(x1, y1, bw, bh, 12);
  fill(255);
  textSize(26);
  fill(220,40,40);
  textAlign(CENTER, CENTER);
  text('開始測驗', bx, by);
}


function displayQuiz() {
  if (currentQuestionIndex >= quizQuestions.length) {
    quizState = 'RESULT';
    return;
  }
  let q = quizQuestions[currentQuestionIndex];
  let shiftUp = min(height * 0.18, 140);
  let keys = ['A','B','C','D'];
  let optW = min(900, width * 0.78);
  let optH = max(88, OPTION_HEIGHT + 36);
  let spacing = 18;
  let totalOptionsH = keys.length * optH + (keys.length - 1) * spacing;
  let questionY = height / 2 - shiftUp;


  // 題號與題目（完全置中）
  textSize(22);
  fill(220,40,40);
  textAlign(CENTER, CENTER);
  text('第 ' + (currentQuestionIndex + 1) + ' 題 / 共 ' + NUM_QUESTIONS + ' 題', width/2, questionY - 70);


  textSize(28);
  fill(220,40,40);
  textAlign(CENTER, CENTER);
  text(q.question, width/2, questionY, optW - 40);


  // 首個選項中心 y
  let firstOptionCenterY = questionY + 60 + optH / 2;


  // 繪製選項（文字完全置中）
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let optionText = key + '. ' + q.options[key];
    let x = width/2;
    let y = firstOptionCenterY + i * (optH + spacing);
    let x1 = x - optW/2;
    let y1 = y - optH/2;


    if (!showFeedback && mouseX > x1 && mouseX < x1 + optW && mouseY > y1 && mouseY < y1 + optH) {
      fill(255, 255, 255, 240);
      cursor(HAND);
      stroke(100, 160, 220);
      strokeWeight(2);
    } else {
      fill(255, 255, 255, 230);
      noStroke();
    }
    rect(x1, y1, optW, optH, 10);


    // 選項文字置中顯示，允許換行但水平垂直置中
    noStroke();
    fill(220,40,40);
    textAlign(CENTER, CENTER);
    textSize(20);
    text(optionText, x, y, optW - 32, optH - 12);


    q.options[key + 'Rect'] = { x1: x1, y1: y1, x2: x1 + optW, y2: y1 + optH, key: key };
  }


  // 回饋顯示（維持原本邏輯，置中）
  if (showFeedback) {
    push();
    rectMode(CENTER);
    noStroke();
    if (feedbackCorrect) fill(200, 255, 220, 230);
    else fill(255, 220, 220, 230);
    let feedbackY = questionY + 60 + totalOptionsH / 2 - totalOptionsH/4;
    rect(width/2, feedbackY, optW * 0.6, 100, 8);


    textAlign(CENTER, CENTER);
    textSize(28);
    if (feedbackCorrect) {
      fill(20,120,40);
      text('答對！', width/2, feedbackY);
    } else {
      fill(160,20,20);
      text(feedbackText, width/2, feedbackY);
    }
    pop();


    if (millis() - feedbackStart >= FEEDBACK_DURATION) {
      showFeedback = false;
      currentQuestionIndex++;
      if (currentQuestionIndex >= NUM_QUESTIONS || currentQuestionIndex >= quizQuestions.length) {
        quizState = 'RESULT';
      }
    }
  }


  // 右上分數方塊：文字置中於方塊
  let scoreBx = width - 120;
  let scoreBy = 30;
  let scoreBw = 140;
  let scoreBh = 36;
  noStroke();
  fill(255,255,255,200);
  rect(scoreBx, scoreBy, scoreBw, scoreBh, 8);
  textAlign(CENTER, CENTER);
  textSize(16);
  fill(220,40,40);
  text('目前答對： ' + quizScore, scoreBx, scoreBy);
  textAlign(CENTER, CENTER);
}


function checkAnswer() {
  let q = quizQuestions[currentQuestionIndex];
  let keys = ['A','B','C','D'];
  for (let k of keys) {
    let r = q.options[k + 'Rect'];
    if (r) {
      if (mouseX > r.x1 && mouseX < r.x2 && mouseY > r.y1 && mouseY < r.y2) {
        if (k === q.correct) {
          quizScore++;
          feedbackCorrect = true;
          feedbackText = '答對！';
        } else {
          feedbackCorrect = false;
          feedbackText = '答錯。正確答案：' + q.correct;
        }
        showFeedback = true;
        feedbackStart = millis();
        break;
      }
    }
  }
}


function displayResult() {
  push();
  fill(255,255,255,140);
  rect(0,0,width,height);
  pop();


  drawDownloadButton();


  let percentage = (quizScore / NUM_QUESTIONS) * 100;
  let feedback = '';
  let col = color(220,40,40);


  if (percentage === 100) {
    feedback = '太棒了！滿分通過！';
  } else if (percentage >= 75) {
    feedback = '表現優異！做得非常好！';
  } else if (percentage >= 50) {
    feedback = '還不錯！繼續努力！';
  } else {
    feedback = '需要多加溫習囉！加油！';
  }


  fill(220,40,40);
  textSize(32);
  textAlign(CENTER, CENTER);
  text('測驗結果', width/2, height * 0.12);


  textSize(72);
  fill(col);
  textAlign(CENTER, CENTER);
  text(quizScore + ' / ' + NUM_QUESTIONS, width/2, height * 0.28);


  textSize(30);
  fill(220,40,40);
  textAlign(CENTER, TOP);
  text(feedback, width/2, height * 0.36, width * 0.7);
  textAlign(CENTER, CENTER);


  let bx = width/2;
  let by = height * 0.75;
  let bw = min(380, width * 0.4);
  let bh = 84;
  let x1 = bx - bw/2;
  let y1 = by - bh/2;
  if (mouseX > x1 && mouseX < x1 + bw && mouseY > y1 && mouseY < y1 + bh) {
    fill(90,160,110);
    cursor(HAND);
  } else {
    fill(70,130,100);
  }
  rect(x1, y1, bw, bh, 12);
  fill(255);
  textSize(26);
  fill(220,40,40);
  textAlign(CENTER, CENTER);
  text('再測一次', bx, by);


  // 顯示題目概覽：文字置中
  fill(220,40,40);
  textSize(14);
  textAlign(CENTER, TOP);
  text('題目清單（僅供參考）', width/2, height * 0.48);
  textSize(12);
  let startY = height * 0.52;
  let lineH = 36;
  for (let i = 0; i < quizQuestions.length; i++) {
    let tq = quizQuestions[i];
    let txt = (i+1) + '. ' + tq.question + ' 正確答案：' + tq.correct;
    textAlign(CENTER, TOP);
    text(txt, width/2, startY + i * lineH, width - 120);
  }
  textAlign(CENTER, CENTER);
}


// ---------- 互動：統一 mousePressed 管理 ----------
function mousePressed() {
  // 下載按鈕（只在 quiz 模式顯示時啟用）
  if (mode === 'quiz') {
    let bx = width - 120;
    let by = 30;
    let bw = 200;
    let bh = 40;
    let dx1 = bx - bw/2;
    let dy1 = by - bh/2;
    if (mouseX > dx1 && mouseX < dx1 + bw && mouseY > dy1 && mouseY < dy1 + bh) {
      if (table) saveTable(table, 'generated_quiz.csv', 'csv');
      return;
    }
  }


  if (mode === 'bubble') {
    for (let i = bubbles.length - 1; i >= 0; i--) {
        if (bubbles[i].contains(mouseX, mouseY)) {
            bubbles[i].isPopped = true;
            bubbles[i].popFade = 255;
            bubbleScore += 1;
            scoreFeedbacks.push(new ScoreFeedback(mouseX, mouseY, '+' + 1));
            break;
        }
    }
    return;
  }


  if (mode === 'quiz') {
    if (quizState === 'IDLE') {
      resetQuiz();
      quizState = 'QUIZ';
      return;
    }
    if (quizState === 'QUIZ') {
      if (showFeedback) return;
      checkAnswer();
      return;
    }
    if (quizState === 'RESULT') {
      let bx2 = width / 2;
      let by2 = height * 0.75;
      let bw2 = min(380, width * 0.4);
      let bh2 = 84;
      let x1 = bx2 - bw2 / 2;
      let y1 = by2 - bh2 / 2;
      if (mouseX > x1 && mouseX < x1 + bw2 && mouseY > y1 && mouseY < y1 + bh2) {
        resetQuiz();
        quizState = 'QUIZ';
        return;
      }
    }
    return;
  }


  // 非 quiz / bubble 狀態時，點擊不特別處理
}


// ---------- 測驗背景粒子與動畫 ----------
function initParticles() {
  particles = [];
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      size: random(6, 28),
      speed: random(0.2, 1.2),
      drift: random(-0.3, 0.3),
      alpha: random(40, 140)
    });
  }
}


function drawAnimatedBackground() {
  bgOffset += 0.002;
  let topColor = color(120, 180, 230);
  let bottomColor = color(225, 240, 255);
  noStroke();
  for (let y = 0; y < height; y += 4) {
    let t = map(y, 0, height, 0, 1);
    let shift = 0.04 * sin(t * PI * 6 + millis() * 0.0015 + bgOffset * 20);
    let col = lerpColor(topColor, bottomColor, constrain(t + shift, 0, 1));
    fill(red(col), green(col), blue(col), 200);
    rect(0, y, width, 4);
  }
  fill(255, 255, 255, 12);
  rect(0, 0, width, height);


  for (let p of particles) {
    p.y -= p.speed;
    p.x += p.drift + 0.3 * sin((p.y + millis() * 0.05) * 0.01);
    if (p.y < -30) {
      p.y = height + random(10, 80);
      p.x = random(width);
    }
    if (p.x < -50) p.x = width + 50;
    if (p.x > width + 50) p.x = -50;


    push();
    noStroke();
    for (let k = 0; k < 3; k++) {
      let s = p.size * (1 + k * 0.6);
      let a = p.alpha * (0.6 / (k + 1));
      fill(255, 250, 230, a * 0.9);
      ellipse(p.x, p.y, s, s);
    }
    pop();
  }


  blendMode(ADD);
  for (let i = 0; i < 10; i++) {
    let gx = (noise(i * 0.1, millis() * 0.0002) * width);
    let gy = (noise(i * 0.2, millis() * 0.0003) * height);
    fill(255, 255, 255, 6);
    ellipse(gx, gy, 200, 200);
  }
  blendMode(BLEND);
}


// 顯示 / 隱藏 iframe（保留）
function showIframe(url) {
    if (!iframeOverlay || !iframeEl) return;
    iframeEl.src = url;
    iframeOverlay.elt.style.display = 'block';
    iframeOverlay.elt.style.zIndex = '10002';
}


function hideIframe() {
    if (!iframeOverlay || !iframeEl) return;
    iframeEl.src = '';
    iframeOverlay.elt.style.display = 'none';
}


// 視窗大小變動時重新置中畫布或重設粒子
function windowResized() {
    if (mode === 'quiz') {
      // quiz 模式下畫布同步視窗大小（全螢幕）
      resizeCanvas(windowWidth, windowHeight);
      if (cnv && cnv.elt) {
        cnv.elt.style.position = 'fixed';
        cnv.elt.style.left = '0px';
        cnv.elt.style.top = '0px';
        cnv.elt.style.width = '100vw';
        cnv.elt.style.height = '100vh';
      }
      initParticles();
    } else {
      if (cnv && cnv.elt) {
        // 若不是 quiz，保持視窗化大小並置中
        cnv.position((windowWidth - width) / 2, (windowHeight - height) / 2);
      }
    }
}
