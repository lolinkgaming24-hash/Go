const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C, p2C, active = false, paused = false;

const chars = {
    'Gojo': { c: '#fff', d: 11, s: 6, w: 'none', rng: { m1: 60, sp: 500 } },
    'Sukuna': { c: '#f44', d: 12, s: 7, w: 'cleave', rng: { m1: 70, sp: 600 } },
    'Itadori': { c: '#fd0', d: 15, s: 8, w: 'fist', rng: { m1: 45, sp: 70 } },
    'Nanami': { c: '#dca', d: 20, s: 5, w: 'blade', rng: { m1: 65, sp: 85 } },
    'Maki': { c: '#4a4', d: 10, s: 9, w: 'spear', rng: { m1: 110, sp: 140 } },
    'Megumi': { c: '#44f', d: 9, s: 6, w: 'sword', rng: { m1: 75, sp: 180 } },
    'Toji': { c: '#666', d: 17, s: 10, w: 'dagger', rng: { m1: 60, sp: 300 } },
    'Nobara': { c: '#f6a', d: 14, s: 6, w: 'hammer', rng: { m1: 60, sp: 350 } },
    'Geto': { c: '#74a', d: 12, s: 7, w: 'curse', rng: { m1: 75, sp: 220 } },
    'Yuta': { c: '#aaf', d: 15, s: 7, w: 'katana', rng: { m1: 90, sp: 180 } }
};

class Sorcerer {
    constructor(x, y, k, pNum, cpu) {
        this.k = k; this.s = chars[k]; this.x = x; this.y = y; this.w = 40; this.h = 90;
        this.hp = 100; this.vx = 0; this.vy = 0; this.dir = pNum === 1 ? 1 : -1;
        this.cpu = cpu; this.m1T = 0; this.spT = 0; this.swing = 0; this.fx = 0;
    }
    draw() {
        ctx.strokeStyle = this.s.c; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(this.x + 20, this.y - 15, 12, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y); ctx.lineTo(this.x + 20, this.y + 50); ctx.stroke();
        let r = this.swing > 0 ? this.s.rng.m1 : 25;
        let armX = this.x + 20 + (r * this.dir);
        let armY = this.y + 20;
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 15); ctx.lineTo(armX, armY); ctx.stroke();
        if(this.fx > 0) {
            ctx.save(); ctx.globalAlpha = this.fx / 60; ctx.fillStyle = this.s.c;
            ctx.beginPath(); ctx.arc(this.x+20, this.y+20, 100-this.fx, 0, 7); ctx.fill(); ctx.restore();
        }
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 50); ctx.lineTo(this.x, this.y + 90); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 50); ctx.lineTo(this.x + 40, this.y + 90); ctx.stroke();
    }
    update(opp) {
        if (paused) return;
        this.x += this.vx; this.y += this.vy;
        if (this.y + this.h < canvas.height - 50) this.vy += 0.8; else { this.y = canvas.height - 140; this.vy = 0; }
        this.x = Math.max(0, Math.min(canvas.width - this.w, this.x));
        if (this.m1T > 0) this.m1T--; if (this.spT > 0) this.spT--; if (this.swing > 0) this.swing--;
        if (this.fx > 0) this.fx--;
        if (this.cpu) this.ai(opp);
    }
    atk(opp) {
        if (this.m1T > 0 || paused) return; 
        this.m1T = 20; this.swing = 10;
        if (Math.abs((this.x+20) - (opp.x+20)) < this.s.rng.m1) opp.hp -= this.s.d;
    }
    spec(opp) {
        if (this.spT > 0 || paused) return; 
        this.spT = 500; this.fx = 60;
        if (Math.abs((this.x+20) - (opp.x+20)) < this.s.rng.sp) {
            if (this.k === 'Toji') this.x = opp.x - (40*this.dir);
            opp.hp -= 20; this.vx = this.dir * 20;
        }
    }
    ai(opp) {
        this.vx = (opp.x < this.x) ? -3.5 : 3.5; this.dir = (opp.x < this.x) ? -1 : 1;
        if (Math.abs(this.x - opp.x) < this.s.rng.m1) this.atk(opp);
    }
}

// ACCURATE BUTTON DETECTION
const inputs = { p1: { l:0, r:0, u:0, a:0, s:0 }, p2: { l:0, r:0, u:0, a:0, s:0 } };
const btns = document.getElementsByClassName('btn');

function handleTouch(e) {
    if (!active) return;
    e.preventDefault();
    // Reset all
    inputs.p1 = { l:0, r:0, u:0, a:0, s:0 }; inputs.p2 = { l:0, r:0, u:0, a:0, s:0 };
    
    for (let t of e.touches) {
        for (let b of btns) {
            let rect = b.getBoundingClientRect();
            if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
                let p = b.dataset.p === "1" ? inputs.p1 : inputs.p2;
                p[b.dataset.v] = 1;
            }
        }
    }
}

window.addEventListener('touchstart', handleTouch, { passive: false });
window.addEventListener('touchend', handleTouch, { passive: false });
window.addEventListener('touchmove', handleTouch, { passive: false });

function togglePause() { paused = !paused; document.getElementById('pause-screen').style.display = paused ? 'flex' : 'none'; }

function initMode(m) {
    mode = m; document.getElementById('m-start').style.display = 'none';
    document.getElementById('m-char').style.display = 'block';
    const g = document.getElementById('char-grid');
    Object.keys(chars).forEach(c => {
        const b = document.createElement('button'); b.innerText = c;
        b.onclick = () => { 
            if (!p1C) { p1C = c; document.getElementById('sel-title').innerText = "PLAYER 2"; if (mode === '1P') { p2C = 'Sukuna'; startGame(); } } 
            else { p2C = c; startGame(); }
        };
        g.appendChild(b);
    });
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
    if (mode === '2P') document.getElementById('p2-pad').style.display = 'flex';
    p1 = new Sorcerer(150, 100, p1C, 1, false);
    p2 = new Sorcerer(canvas.width - 200, 100, p2C, 2, mode === '1P');
    active = true; resize(); loop();
}

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = resize; resize();

function loop() {
    if (active && !paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#222'; ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        
        p1.vx = inputs.p1.l ? -p1.s.s : inputs.p1.r ? p1.s.s : 0;
        if (p1.vx !== 0) p1.dir = p1.vx > 0 ? 1 : -1;
        if (inputs.p1.u && p1.vy === 0) p1.vy = -18;
        if (inputs.p1.a) p1.atk(p2);
        if (inputs.p1.s) p1.spec(p2);

        if (mode === '2P') {
            p2.vx = inputs.p2.l ? -p2.s.s : inputs.p2.r ? p2.s.s : 0;
            if (p2.vx !== 0) p2.dir = p2.vx > 0 ? 1 : -1;
            if (inputs.p2.u && p2.vy === 0) p2.vy = -18;
            if (inputs.p2.a) p2.atk(p1);
            if (inputs.p2.s) p2.spec(p1);
        }

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
