const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C = null, p2C = null, active = false, paused = false;
const held = { p1L: false, p1R: false, p2L: false, p2R: false };

const chars = {
    'Gojo': { c: '#fff', d: 7, s: 7 }, 'Sukuna': { c: '#f33', d: 8, s: 7 },
    'Itadori': { c: '#fd0', d: 11, s: 8 }, 'Maki': { c: '#4a4', d: 12, s: 10 },
    'Megumi': { c: '#222', d: 6, s: 7 }, 'Yuta': { c: '#f0f', d: 8, s: 7 },
    'Ryu': { c: '#0cf', d: 9, s: 5 }, 'Naoya': { c: '#dfd', d: 7, s: 12 },
    'Nobara': { c: '#f6a', d: 8, s: 6 }, 'Toji': { c: '#777', d: 14, s: 9 },
    'Todo': { c: '#853', d: 10, s: 8 }, 'Geto': { c: '#442', d: 8, s: 6 },
    'Choso': { c: '#a44', d: 7, s: 7 }, 'Hakari': { c: '#eee', d: 9, s: 8 },
    'Nanami': { c: '#ee0', d: 13, s: 7 }
};

class Sorcerer {
    constructor(x, y, k, pNum, cpu) {
        this.k = k; this.s = chars[k]; this.x = x; this.y = y; this.pNum = pNum;
        this.hp = 300; this.vx = 0; this.vy = 0; this.dir = pNum === 1 ? 1 : -1;
        this.cpu = cpu; this.m1T = 0; this.spT = 0; this.fx = 0; this.stun = 0;
        this.proj = { active: false, x: 0, y: 0, vx: 0, type: '' };
        this.jackpot = 0; this.frame = 0;
    }

    draw() {
        ctx.save(); this.frame++;
        let cx = this.x + 20, cy = this.y;
        if (this.stun > 0) ctx.translate(Math.random()*4-2, 0);
        
        // Floor line
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, canvas.height-108); ctx.lineTo(canvas.width, canvas.height-108); ctx.stroke();

        // Skill Visuals (Simplified for brevity, but same as your functional version)
        if (this.fx > 0 && (this.k === 'Ryu' || this.k === 'Yuta')) {
            ctx.fillStyle = this.s.c; ctx.globalAlpha = 0.4;
            ctx.fillRect(cx, cy-50, 2000*this.dir, 30);
            ctx.globalAlpha = 1;
        }

        if (this.proj.active) {
            ctx.fillStyle = this.s.c;
            ctx.beginPath(); ctx.arc(this.proj.x, this.proj.y-40, 15, 0, 7); ctx.fill();
        }

        // Stickman
        ctx.strokeStyle = this.jackpot > 0 ? '#0f0' : this.s.c; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy - 85, 12, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - 73); ctx.lineTo(cx, cy - 30); ctx.stroke();
        let armY = (this.m1T > 0 || this.fx > 0) ? cy - 45 : cy - 60;
        ctx.beginPath(); ctx.moveTo(cx, cy - 70); ctx.lineTo(cx + (this.dir * 25), armY); ctx.stroke();
        let walk = (Math.abs(this.vx) > 0.1) ? Math.sin(this.frame * 0.2) * 12 : 5;
        ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx + walk, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx - walk, cy); ctx.stroke();
        ctx.restore();
    }

    spec(opp) {
        if (this.spT > 0 || this.stun > 0) return;
        this.spT = 450;
        if (this.k === 'Nobara') this.proj = { active: true, x: this.x, y: this.y, vx: this.dir * 20, type: 'NAIL' };
        else if (this.k === 'Hakari') { if (Math.random() < 0.4) { this.jackpot = 600; this.spT = 225; } }
        else if (this.k === 'Ryu' || this.k === 'Yuta') this.fx = 120;
        else this.fx = 30; // Default dash/attack fx
    }

    atk(opp) {
        if (this.stun > 0 || this.m1T > 0) return;
        this.m1T = 15;
        if (Math.abs(this.x - opp.x) < 80) { opp.hp -= this.s.d; opp.stun = 10; opp.vx = this.dir * 5; }
    }

    update(opp) {
        if (!active || paused) return;
        let isBeaming = (this.fx > 0 && (this.k === 'Ryu' || this.k === 'Yuta'));
        
        if (this.fx > 0) this.fx--;
        if (this.proj.active) {
            this.proj.x += this.proj.vx;
            if (Math.abs(this.proj.x - opp.x) < 50) { opp.hp -= 40; opp.stun = 20; this.proj.active = false; }
        }

        if (isBeaming) { this.vx = 0; if (Math.abs(this.x - opp.x) < 1000) opp.hp -= 2; }
        else if (this.stun <= 0) {
            if (this.pNum === 1) {
                if (held.p1L) { this.vx = -this.s.s; this.dir = -1; }
                if (held.p1R) { this.vx = this.s.s; this.dir = 1; }
            } else if (!this.cpu) {
                if (held.p2L) { this.vx = -this.s.s; this.dir = -1; }
                if (held.p2R) { this.vx = this.s.s; this.dir = 1; }
            }
        }

        this.x += this.vx; this.y += this.vy; this.vx *= 0.8;
        let ground = canvas.height - 110;
        if (this.y < ground) this.vy += 0.8; else { this.y = ground; this.vy = 0; }
        
        if (this.spT > 0) this.spT--; if (this.stun > 0) this.stun--; if (this.m1T > 0) this.m1T--;
        if (this.jackpot > 0) { this.jackpot--; if (this.hp < 300) this.hp += 0.5; }
        if (this.cpu) this.ai(opp);
    }

    ai(opp) {
        if (Math.abs(this.x - opp.x) > 120) this.vx = (opp.x < this.x) ? -this.s.s : this.s.s;
        else if (Math.random() < 0.05) this.atk(opp);
        if (Math.random() < 0.01) this.spec(opp);
    }
}

function initMode(m) {
    mode = m; p1C = null; p2C = null;
    document.getElementById('m-start').style.display = 'none';
    document.getElementById('m-char').style.display = 'block';
    const g = document.getElementById('char-grid'); g.innerHTML = '';
    Object.keys(chars).forEach(c => {
        const b = document.createElement('button'); b.innerText = c;
        b.onpointerdown = () => {
            if (!p1C) { p1C = c; if(mode === '1P') { p2C = 'Sukuna'; startGame(); } }
            else if (!p2C) { p2C = c; startGame(); }
        };
        g.appendChild(b);
    });
}

function startGame() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const ctrl = document.getElementById('controls');
    
    // THE SWITCH: Apply solo-layout if 1P mode
    if (mode === '1P') ctrl.classList.add('solo-layout');
    else ctrl.classList.remove('solo-layout');

    p1 = new Sorcerer(100, canvas.height-110, p1C, 1, false);
    p2 = new Sorcerer(canvas.width-150, canvas.height-110, p2C, 2, mode === '1P');
    
    document.getElementById('menu').classList.remove('active-menu');
    document.getElementById('p2-pad').style.display = (mode === '2P') ? 'block' : 'none';
    document.getElementById('pause-btn').style.display = 'block';
    ctrl.style.display = 'block';
    active = true; loop();
}

function loop() {
    if (!active || paused) return;
    ctx.clearRect(0,0,canvas.width, canvas.height);
    p1.update(p2); p2.update(p1); p1.draw(); p2.draw();
    document.getElementById('p1-hp').style.width = (p1.hp/3)+'%';
    document.getElementById('p2-hp').style.width = (p2.hp/3)+'%';
    document.getElementById('p1-cd').style.width = ((450-p1.spT)/4.5)+'%';
    document.getElementById('p2-cd').style.width = ((450-p2.spT)/4.5)+'%';
    if (p1.hp <= 0 || p2.hp <= 0) { active = false; document.getElementById('win-screen').classList.add('active-menu'); }
    requestAnimationFrame(loop);
}

function togglePause() { paused = !paused; }

window.addEventListener('touchstart', e => {
    if (e.target.tagName !== 'BUTTON') e.preventDefault();
    [...e.touches].forEach(t => {
        const b = document.elementFromPoint(t.clientX, t.clientY);
        if (!b || !b.dataset.v) return;
        const pNum = b.dataset.p, p = (pNum === '1') ? p1 : p2, opp = (pNum === '1') ? p2 : p1;
        if (b.dataset.v === 'l') held['p'+pNum+'L'] = true;
        if (b.dataset.v === 'r') held['p'+pNum+'R'] = true;
        if (b.dataset.v === 'u' && p.vy === 0) p.vy = -19;
        if (b.dataset.v === 'a') p.atk(opp);
        if (b.dataset.v === 's') p.spec(opp);
    });
}, {passive: false});

window.addEventListener('touchend', () => { held.p1L = held.p1R = held.p2L = held.p2R = false; });
