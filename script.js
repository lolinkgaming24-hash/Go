const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C, p2C, active = false, paused = false;

// 10 UNIQUE CHARACTERS WITH CUSTOM RANGES
const chars = {
    'Gojo': { c: '#fff', d: 11, s: 6, w: 'none', rng: { m1: 55, sp: 500 } },
    'Sukuna': { c: '#f44', d: 12, s: 7, w: 'cleave', rng: { m1: 65, sp: 600 } },
    'Itadori': { c: '#fd0', d: 15, s: 8, w: 'fist', rng: { m1: 45, sp: 65 } },
    'Nanami': { c: '#dca', d: 20, s: 5, w: 'blade', rng: { m1: 65, sp: 80 } },
    'Maki': { c: '#4a4', d: 10, s: 9, w: 'spear', rng: { m1: 110, sp: 130 } },
    'Megumi': { c: '#44f', d: 9, s: 6, w: 'sword', rng: { m1: 75, sp: 160 } },
    'Toji': { c: '#666', d: 17, s: 10, w: 'dagger', rng: { m1: 55, sp: 250 } },
    'Nobara': { c: '#f6a', d: 14, s: 6, w: 'hammer', rng: { m1: 60, sp: 350 } },
    'Geto': { c: '#74a', d: 12, s: 7, w: 'curse', rng: { m1: 70, sp: 200 } },
    'Yuta': { c: '#aaf', d: 15, s: 7, w: 'katana', rng: { m1: 85, sp: 180 } }
};

class Sorcerer {
    constructor(x, y, k, pNum, cpu) {
        this.k = k; this.s = chars[k]; this.x = x; this.y = y; this.w = 40; this.h = 90;
        this.hp = 100; this.vx = 0; this.vy = 0; this.dir = pNum === 1 ? 1 : -1;
        this.cpu = cpu; this.m1T = 0; this.spT = 0; this.swing = 0; this.fx = 0;
    }

    draw() {
        ctx.strokeStyle = this.s.c; ctx.lineWidth = 4; ctx.lineCap = 'round';
        // Stickman Body
        ctx.beginPath(); ctx.arc(this.x + 20, this.y - 15, 12, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y); ctx.lineTo(this.x + 20, this.y + 50); ctx.stroke();
        
        let r = this.swing > 0 ? this.s.rng.m1 : 25;
        let armX = this.x + 20 + (r * this.dir);
        let armY = this.y + 20;
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 15); ctx.lineTo(armX, armY); ctx.stroke();
        
        // Weapon Drawing
        ctx.lineWidth = 3;
        if(this.s.w === 'spear') { ctx.strokeStyle = '#888'; ctx.beginPath(); ctx.moveTo(armX, armY); ctx.lineTo(armX+(50*this.dir), armY); ctx.stroke(); }
        if(this.s.w === 'katana') { ctx.strokeStyle = '#eee'; ctx.beginPath(); ctx.moveTo(armX, armY); ctx.lineTo(armX+(40*this.dir), armY-30); ctx.stroke(); }
        if(this.s.w === 'cleave' && this.swing > 0) { ctx.strokeStyle = '#f00'; ctx.strokeRect(armX, armY-30, 5, 60); }

        // FX Visuals
        if(this.fx > 0) {
            ctx.save(); ctx.globalAlpha = this.fx / 60;
            if(this.k === 'Gojo') { ctx.fillStyle = '#a0f'; ctx.beginPath(); ctx.arc(this.x+20, this.y+20, 100-this.fx, 0, 7); ctx.fill(); }
            else if(this.k === 'Yuta') { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(this.x-(60*this.dir), this.y, 40, 0, 7); ctx.fill(); ctx.strokeStyle='#fff'; ctx.stroke(); }
            else { ctx.fillStyle = this.s.c; ctx.beginPath(); ctx.arc(this.x+20, this.y+20, 80-this.fx, 0, 7); ctx.fill(); }
            ctx.restore();
        }

        ctx.strokeStyle = this.s.c; ctx.lineWidth = 4;
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
        if (this.fx > 0) this.fx--;
        if (this.cpu) this.ai(opp);
    }

    atk(opp) {
        if (this.m1T > 0 || paused) return; 
        this.m1T = 20; this.swing = 10;
        let dist = Math.abs((this.x+20) - (opp.x+20));
        if (dist < this.s.rng.m1 && Math.abs(this.y - opp.y) < 80) opp.hp -= this.s.d;
    }

    spec(opp) {
        if (this.spT > 0 || paused) return; 
        this.spT = 500; this.fx = 60;
        let dist = Math.abs((this.x+20) - (opp.x+20));
        if (dist < this.s.rng.sp) {
            if (this.k === 'Toji') { this.x = opp.x - (40*this.dir); opp.hp -= 20; }
            else { opp.hp -= 25; this.vx = this.dir * 30; }
        }
    }

    ai(opp) {
        let dist = Math.abs(this.x - opp.x);
        this.vx = (opp.x < this.x) ? -3.5 : 3.5; this.dir = (opp.x < this.x) ? -1 : 1;
        if (dist < this.s.rng.m1) this.atk(opp);
        if (dist < 200 && Math.random() < 0.01) this.spec(opp);
    }
}

// TOUCH SYSTEM (LEFT: Move, RIGHT: Attack)
const t1 = { l: 0, r: 0, u: 0, a: 0, s: 0 };
function handleTouch(e) {
    if (!active) return;
    e.preventDefault();
    t1.l = t1.r = t1.u = t1.a = t1.s = 0;
    for (let t of e.touches) {
        const x = t.clientX, y = t.clientY, w = window.innerWidth, h = window.innerHeight;
        // Left Side: Movement
        if (x < w / 2) {
            if (y < h - 160) t1.u = 1; // Top of left side is Jump
            else if (x < w / 4) t1.l = 1; // Far left
            else t1.r = 1; // Middle left
        } 
        // Right Side: Actions
        else {
            if (x > w * 0.8) t1.s = 1; // Far right is Skill
            else t1.a = 1; // Middle right is M1
        }
    }
}

window.addEventListener('touchstart', handleTouch, { passive: false });
window.addEventListener('touchend', handleTouch, { passive: false });

function togglePause() { 
    paused = !paused; 
    document.getElementById('pause-screen').style.display = paused ? 'flex' : 'none'; 
}

function initMode(m) {
    mode = m; document.getElementById('m-start').style.display = 'none';
    document.getElementById('m-char').style.display = 'block';
    const g = document.getElementById('char-grid');
    Object.keys(chars).forEach(c => {
        const b = document.createElement('button'); b.innerText = c;
        b.onclick = () => { if (!p1C) { p1C = c; document.getElementById('sel-title').innerText = "PLAYER 2"; if (mode === '1P') { p2C = 'Sukuna'; startGame(); } } else { p2C = c; startGame(); } };
        g.appendChild(b);
    });
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
    p1 = new Sorcerer(150, 100, p1C, 1, false);
    p2 = new Sorcerer(canvas.width - 200, 100, p2C, 2, mode === '1P');
    active = true; resize(); loop();
}

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = resize; resize();

const keys = {}; window.onkeydown = e => keys[e.code] = true; window.onkeyup = e => keys[e.code] = false;

function loop() {
    if (!active) return;
    if (!paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#111'; ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        
        p1.vx = (keys.KeyA || t1.l) ? -p1.s.s : (keys.KeyD || t1.r) ? p1.s.s : 0;
        if (p1.vx !== 0) p1.dir = p1.vx > 0 ? 1 : -1;
        if ((keys.KeyW || t1.u) && p1.vy === 0) p1.vy = -18;
        if (keys.Space || t1.a) p1.atk(p2);
        if (keys.KeyE || t1.s) p1.spec(p2);

        p1.update(p2); p2.update(p1);
        p1.draw(); p2.draw();

        document.getElementById('p1-hp').style.width = p1.hp + '%';
        document.getElementById('p2-hp').style.width = p2.hp + '%';
        document.getElementById('p1-sp').style.width = ((500 - p1.spT) / 5) + '%';
        document.getElementById('p2-sp').style.width = ((500 - p2.spT) / 5) + '%';

        if (p1.hp <= 0 || p2.hp <= 0) {
            active = false; document.getElementById('end-screen').style.display = 'flex';
            document.getElementById('win-msg').innerText = p1.hp <= 0 ? p2.k + " WINS!" : p1.k + " WINS!";
        }
    }
    requestAnimationFrame(loop);
}
