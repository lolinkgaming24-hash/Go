const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C, p2C, active = false, paused = false;

// Track held buttons
const held = { p1L: false, p1R: false, p2L: false, p2R: false };

const chars = {
    'Gojo': { c: '#fff', d: 7, s: 7, r: 70 }, 'Sukuna': { c: '#f33', d: 8, s: 7, r: 80 },
    'Itadori': { c: '#fd0', d: 11, s: 8, r: 70 }, 'Maki': { c: '#4a4', d: 12, s: 10, r: 120 },
    'Megumi': { c: '#44f', d: 6, s: 7, r: 70 }, 'Yuta': { c: '#f0f', d: 8, s: 7, r: 90 },
    'Ryu': { c: '#0cf', d: 9, s: 5, r: 80 }, 'Naoya': { c: '#dfd', d: 7, s: 12, r: 60 },
    'Nobara': { c: '#f6a', d: 8, s: 6, r: 65 }, 'Toji': { c: '#777', d: 14, s: 9, r: 95 },
    'Todo': { c: '#853', d: 10, s: 8, r: 85 }, 'Geto': { c: '#442', d: 8, s: 6, r: 80 },
    'Choso': { c: '#a44', d: 7, s: 7, r: 75 }, 'Hakari': { c: '#eee', d: 9, s: 8, r: 80 },
    'Nanami': { c: '#ee0', d: 13, s: 7, r: 85 }
};

class Sorcerer {
    constructor(x, y, k, pNum, cpu) {
        this.k = k; this.s = chars[k]; this.x = x; this.y = y; this.pNum = pNum;
        this.hp = 300; this.vx = 0; this.vy = 0; this.dir = pNum === 1 ? 1 : -1;
        this.cpu = cpu; this.m1T = 0; this.spT = 0; this.fx = 0; this.stun = 0;
        this.proj = { active: false, x: 0, y: 0, vx: 0 };
        this.isShadow = 0; this.jackpot = 0; this.frame = 0;
    }

    draw() {
        ctx.save();
        this.frame++;
        if (this.stun > 0) ctx.translate(Math.random() * 4 - 2, 0);

        if (this.k === 'Megumi' && this.isShadow > 0) {
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(this.x + 20, canvas.height - 55, 45, 12, 0, 0, 7); ctx.fill();
            ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.moveTo(this.x + 10, canvas.height - 90); ctx.lineTo(this.x + 30, canvas.height - 90); ctx.lineTo(this.x + 20, canvas.height - 75); ctx.fill();
        } else {
            let col = this.jackpot > 0 ? '#0f0' : this.s.c;
            ctx.strokeStyle = col; ctx.lineWidth = 3;
            if(this.jackpot > 0) { ctx.shadowBlur = 15; ctx.shadowColor = '#0f0'; }
            let cx = this.x + 20, cy = this.y + 30;
            ctx.beginPath(); ctx.arc(cx, cy - 45, 12, 0, 7); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy - 33); ctx.lineTo(cx, cy + 10); ctx.stroke();
            let armY = (this.m1T > 0) ? cy - 10 : cy - 20;
            ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx + (this.dir * 25), armY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx - (this.dir * 15), cy - 10); ctx.stroke();
            let walk = (Math.abs(this.vx) > 0.1) ? Math.sin(this.frame * 0.2) * 12 : 5;
            ctx.beginPath(); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx + walk, cy + 45); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx - walk, cy + 45); ctx.stroke();
        }

        if (this.proj.active) {
            ctx.fillStyle = this.k === 'Gojo' ? '#a0f' : (this.k === 'Choso' ? '#800' : this.s.c);
            ctx.beginPath(); ctx.arc(this.proj.x, this.proj.y, this.k === 'Gojo' ? 45 : 12, 0, 7); ctx.fill();
        }

        if (this.fx > 0 && (this.k === 'Ryu' || this.k === 'Yuta')) {
            ctx.fillStyle = this.s.c; ctx.globalAlpha = 0.7;
            let isClash = (p1.fx > 0 && p2.fx > 0 && (p1.k === 'Ryu' || p1.k === 'Yuta') && (p2.k === 'Ryu' || p2.k === 'Yuta'));
            let beamLen = isClash ? Math.abs(canvas.width / 2 - (this.x + 20)) : 2000;
            ctx.fillRect(this.x + 20, this.y + 10, beamLen * this.dir, 30);
            if(isClash) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(canvas.width/2, this.y + 25, 40, 0, 7); ctx.fill(); }
            ctx.globalAlpha = 1.0;
        }
        ctx.restore();
    }

    update(opp) {
        if (!active || paused) return;

        // Continuous Movement Logic
        if (this.stun <= 0 && this.fx <= 0) {
            if (this.pNum === 1) {
                if (held.p1L) { this.vx = -this.s.s; this.dir = -1; }
                if (held.p1R) { this.vx = this.s.s; this.dir = 1; }
            } else if (!this.cpu) {
                if (held.p2L) { this.vx = -this.s.s; this.dir = -1; }
                if (held.p2R) { this.vx = this.s.s; this.dir = 1; }
            }
        }

        if (this.fx > 0 && (this.k === 'Ryu' || this.k === 'Yuta')) this.vx = 0;

        this.x += this.vx; this.y += this.vy;
        let ground = canvas.height - 140;

        if (this.isShadow > 0) { this.isShadow--; this.y = ground; this.vx *= 0.88; }
        else {
            this.vx *= 0.75;
            if (this.y < ground) this.vy += 0.8; else { this.y = ground; this.vy = 0; }
        }

        if (this.jackpot > 0) { this.jackpot--; if (this.hp < 300) this.hp += 0.6; }

        if (this.fx > 0) {
            this.fx--;
            // Naoya Freeze Logic
            if (this.k === 'Naoya' || this.k === 'Maki' || this.k === 'Toji') {
                if (Math.abs(this.x - opp.x) < 50 && Math.abs(this.y - opp.y) < 100) {
                    opp.stun = this.k === 'Naoya' ? 40 : 15; // Naoya freezes target for 40 frames
                    opp.hp -= this.k === 'Toji' ? 3 : 1;
                    if(this.k === 'Toji') opp.fx = 0; 
                }
            }
            // Beam Logic
            if ((this.k === 'Ryu' || this.k === 'Yuta') && Math.abs(this.y - opp.y) < 100 && opp.isShadow <= 0) {
                let isClash = (p1.fx > 0 && p2.fx > 0 && (p1.k === 'Ryu' || p1.k === 'Yuta') && (p2.k === 'Ryu' || p2.k === 'Yuta'));
                if(!isClash) { opp.hp -= 1.8; opp.stun = 2; }
            }
        }
        
        if (this.proj.active) {
            this.proj.x += this.proj.vx;
            if (opp.isShadow <= 0 && Math.abs(this.proj.x - (opp.x + 20)) < 50 && Math.abs(this.proj.y - (opp.y + 45)) < 60) {
                opp.hp -= (this.k === 'Gojo' ? 85 : 35); opp.stun = 20; this.proj.active = (this.k === 'Gojo');
            }
            if (this.proj.x < -400 || this.proj.x > canvas.width + 400) this.proj.active = false;
        }

        if (this.stun > 0) this.stun--; if (this.spT > 0) this.spT--; if (this.m1T > 0) this.m1T--;
        if (this.cpu) this.ai(opp);
    }

    spec(opp) {
        if (this.spT > 0 || this.stun > 0) return;
        this.spT = 400;
        if (this.k === 'Todo') { let tx = this.x; this.x = opp.x; opp.x = tx; opp.stun = 35; }
        else if (this.k === 'Hakari') { if (Math.random() < 0.4) this.jackpot = 500; else this.spT = 100; }
        else if (this.k === 'Megumi') this.isShadow = 180;
        else if (['Gojo', 'Choso', 'Geto', 'Nobara', 'Sukuna'].includes(this.k)) 
            this.proj = { active: true, x: this.x + 20, y: this.y + 40, vx: this.dir * 18 };
        else if (['Toji', 'Naoya', 'Maki'].includes(this.k)) { this.fx = 45; this.vx = this.dir * 60; }
        else if (['Ryu', 'Yuta'].includes(this.k)) this.fx = 180;
    }

    atk(opp) {
        if (this.stun > 0 || this.m1T > 0) return;
        if (this.isShadow > 0) { this.isShadow = 0; this.vy = -16; if (Math.abs(this.x - opp.x) < 120) { opp.hp -= 55; opp.stun = 45; } return; }
        this.m1T = 22;
        let d = this.s.d; if (this.k === 'Nanami' && Math.random() < 0.3) d *= 3;
        if (Math.abs(this.x - (opp.x + 20)) < this.s.r) { opp.hp -= d; opp.stun = 12; opp.vx = this.dir * 12; }
    }

    ai(opp) {
        if (this.isShadow > 0) { if (Math.abs(this.x - opp.x) > 40) this.vx = (opp.x < this.x ? -10 : 10); else this.atk(opp); return; }
        if (this.fx > 0 && (this.k === 'Ryu' || this.k === 'Yuta')) return;
        if (Math.abs(this.x - opp.x) > 200) this.vx = (opp.x < this.x ? -this.s.s : this.s.s);
        else if (Math.random() < 0.05) this.atk(opp);
        if (Math.random() < 0.01) this.spec(opp);
    }
}

function togglePause() { if (!active) return; paused = !paused; document.getElementById('pause-screen').style.display = paused ? 'flex' : 'none'; }

function initMode(m) {
    mode = m; document.getElementById('m-start').style.display = 'none'; document.getElementById('m-char').style.display = 'block';
    const g = document.getElementById('char-grid'); g.innerHTML = '';
    Object.keys(chars).forEach(c => {
        const b = document.createElement('button'); b.innerText = c;
        b.onclick = () => { if (!p1C) { p1C = c; if (mode === '1P') { p2C = 'Sukuna'; startGame(); } } else { p2C = c; startGame(); } };
        g.appendChild(b);
    });
}

function startGame() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    p1 = new Sorcerer(100, canvas.height - 140, p1C, 1, false);
    p2 = new Sorcerer(canvas.width - 150, canvas.height - 140, p2C, 2, mode === '1P');
    document.getElementById('menu').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
    if (mode === '2P') document.getElementById('p2-pad').style.display = 'block';
    active = true; requestAnimationFrame(loop);
}

function loop() {
    if (!active) return;
    if (!paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        p1.update(p2); p2.update(p1); p1.draw(); p2.draw();
        document.getElementById('p1-hp').style.width = (p1.hp / 3) + '%';
        document.getElementById('p2-hp').style.width = (p2.hp / 3) + '%';
        if (p1.hp <= 0 || p2.hp <= 0) { active = false; alert(p1.hp <= 0 ? "P2 WINS" : "P1 WINS"); location.reload(); }
    }
    requestAnimationFrame(loop);
}

// Input Handlers for holding buttons
window.addEventListener('touchstart', e => {
    const t = e.touches[0];
    const pb = document.getElementById('pause-btn').getBoundingClientRect();
    if (t.clientX >= pb.left - 20 && t.clientX <= pb.right + 20 && t.clientY >= pb.top - 20 && t.clientY <= pb.bottom + 20) { togglePause(); return; }
    
    [...e.touches].forEach(touch => {
        const b = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!b || !b.dataset.v) return;
        const p = b.dataset.p === '1' ? p1 : p2;
        const opp = b.dataset.p === '1' ? p2 : p1;
        
        if (b.dataset.v === 'l') held[b.dataset.p === '1' ? 'p1L' : 'p2L'] = true;
        if (b.dataset.v === 'r') held[b.dataset.p === '1' ? 'p1R' : 'p2R'] = true;
        if (b.dataset.v === 'u' && p.vy === 0) p.vy = -18;
        if (b.dataset.v === 'a') p.atk(opp);
        if (b.dataset.v === 's') p.spec(opp);
    });
}, { passive: false });

window.addEventListener('touchend', e => {
    // When a finger lifts, we need to check which buttons are no longer being pressed
    held.p1L = held.p1R = held.p2L = held.p2R = false;
    [...e.touches].forEach(touch => {
        const b = document.elementFromPoint(touch.clientX, touch.clientY);
        if (b && b.dataset.v) {
            if (b.dataset.v === 'l') held[b.dataset.p === '1' ? 'p1L' : 'p2L'] = true;
            if (b.dataset.v === 'r') held[b.dataset.p === '1' ? 'p1R' : 'p2R'] = true;
        }
    });
});

window.onload = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
