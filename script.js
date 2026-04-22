const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C, p2C, active = false, paused = false;

const chars = {
    'Gojo': { c: '#fff', d: 8, r: 50, s: 6 },
    'Sukuna': { c: '#f44', d: 10, r: 60, s: 7 },
    'Itadori': { c: '#fd0', d: 12, r: 45, s: 8 },
    'Nanami': { c: '#dca', d: 18, r: 55, s: 5 },
    'Maki': { c: '#4a4', d: 9, r: 85, s: 9 }
};

class Sorcerer {
    constructor(x, y, k, pNum, cpu) {
        this.k = k; this.s = chars[k]; this.x = x; this.y = y; this.w = 40; this.h = 90;
        this.hp = 100; this.vx = 0; this.vy = 0; this.dir = pNum === 1 ? 1 : -1;
        this.cpu = cpu; this.m1T = 0; this.spT = 0; this.swing = 0;
    }
    draw() {
        ctx.strokeStyle = this.s.c; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(this.x + 20, this.y - 15, 12, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y); ctx.lineTo(this.x + 20, this.y + 50); ctx.stroke();
        let r = this.swing > 0 ? this.s.r : 20;
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 15); ctx.lineTo(this.x + 20 + (r * this.dir), this.y + 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 50); ctx.lineTo(this.x, this.y + 90); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 50); ctx.lineTo(this.x + 40, this.y + 90); ctx.stroke();
    }
    update(opp) {
        if (paused) return;
        this.x += this.vx; this.y += this.vy;
        if (this.y + this.h < canvas.height - 50) this.vy += 0.8; 
        else { this.y = canvas.height - 140; this.vy = 0; }
        this.x = Math.max(0, Math.min(canvas.width - this.w, this.x));
        if (this.m1T > 0) this.m1T--; if (this.spT > 0) this.spT--; if (this.swing > 0) this.swing--;
        if (this.cpu) this.ai(opp);
    }
    atk(opp) {
        if (this.m1T > 0) return; this.m1T = 30; this.swing = 10;
        if (Math.abs(this.x - opp.x) < this.s.r + 20 && Math.abs(this.y - opp.y) < 60) opp.hp -= this.s.d;
    }
    spec(opp) {
        if (this.spT > 0) return; this.spT = 300;
        if (this.k === 'Gojo') { opp.hp -= 20; ctx.fillStyle = 'purple'; ctx.fillRect(0, this.y, canvas.width, 30); }
        else { this.vx = this.dir * 40; opp.hp -= 15; }
    }
    ai(opp) {
        this.vx = (opp.x < this.x) ? -3 : 3; this.dir = (opp.x < this.x) ? -1 : 1;
        if (Math.abs(this.x - opp.x) < 60) this.atk(opp);
    }
}

const t1 = { l: 0, r: 0, u: 0, a: 0, s: 0 }, t2 = { l: 0, r: 0, u: 0, a: 0, s: 0 };

function touch(e) {
    if (!active) return; e.preventDefault();
    [t1, t2].forEach(p => { p.l = p.r = p.u = p.a = p.s = 0; });
    for (let t of e.touches) {
        const x = t.clientX, y = t.clientY, w = window.innerWidth, h = window.innerHeight;
        const p = x < w / 2 ? t1 : t2;
        const off = x < w / 2 ? 0 : w - 220;
        const relX = x - off;
        if (y > h - 200) {
            if (relX < 70) p.l = 1; else if (relX > 150) p.r = 1; 
            else { if (y < h - 100) p.u = 1; else p.a = 1; }
            if (relX > 110 && y > h - 70) p.s = 1;
        }
    }
}

window.addEventListener('touchstart', touch, { passive: false });
window.addEventListener('touchend', touch, { passive: false });

function initMode(m) {
    mode = m; document.getElementById('m-start').style.display = 'none';
    document.getElementById('m-char').style.display = 'block';
    const g = document.getElementById('char-grid');
    Object.keys(chars).forEach(c => {
        const b = document.createElement('button'); b.innerText = c;
        b.onclick = () => { 
            if (!p1C) { p1C = c; document.getElementById('sel-title').innerText = "P2 SELECT"; if (mode === '1P') { p2C = 'Sukuna'; startGame(); } }
            else { p2C = c; startGame(); }
        };
        g.appendChild(b);
    });
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
    if (mode === '1P') document.getElementById('p2-pad').style.opacity = '0';
    p1 = new Sorcerer(100, 100, p1C, 1, false);
    p2 = new Sorcerer(canvas.width - 150, 100, p2C, 2, mode === '1P');
    active = true; resize(); loop();
}

function togglePause() { 
    paused = !paused; 
    document.getElementById('pause-screen').style.display = paused ? 'flex' : 'none';
}

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = resize; resize();

const keys = {}; window.onkeydown = e => keys[e.code] = true; window.onkeyup = e => keys[e.code] = false;

function loop() {
    if (!active) return;
    if (!paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#222'; ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

        p1.vx = (keys.KeyA || t1.l) ? -p1.s.s : (keys.KeyD || t1.r) ? p1.s.s : 0;
        if (p1.vx !== 0) p1.dir = p1.vx > 0 ? 1 : -1;
        if ((keys.KeyW || t1.u) && p1.vy === 0) p1.vy = -16;
        if (keys.Space || t1.a) p1.atk(p2);
        if (keys.KeyE || t1.s) p1.spec(p2);

        if (mode === '2P') {
            p2.vx = (keys.ArrowLeft || t2.l) ? -p2.s.s : (keys.ArrowRight || t2.r) ? p2.s.s : 0;
            if (p2.vx !== 0) p2.dir = p2.vx > 0 ? 1 : -1;
            if ((keys.ArrowUp || t2.u) && p2.vy === 0) p2.vy = -16;
            if (keys.Enter || t2.a) p2.atk(p1);
            if (keys.ShiftRight || t2.s) p2.spec(p1);
        }

        p1.update(p2); p2.update(p1);
        p1.draw(); p2.draw();

        document.getElementById('p1-hp').style.width = p1.hp + '%';
        document.getElementById('p2-hp').style.width = p2.hp + '%';
        document.getElementById('p1-sp').style.width = (300 - p1.spT) / 3 + '%';
        document.getElementById('p2-sp').style.width = (300 - p2.spT) / 3 + '%';

        if (p1.hp <= 0 || p2.hp <= 0) {
            active = false; document.getElementById('end-screen').style.display = 'flex';
            document.getElementById('win-msg').innerText = p1.hp <= 0 ? p2.k + " WINS!" : p1.k + " WINS!";
        }
    }
    requestAnimationFrame(loop);
}
