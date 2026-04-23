const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C = null, p2C = null, active = false, paused = false;

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
        this.jackpot = 0; this.frame = 0;
    }

    draw() {
        ctx.save();
        this.frame++;
        if (this.stun > 0) ctx.translate(Math.random() * 4 - 2, 0);

        let col = this.jackpot > 0 ? '#0f0' : this.s.c;
        ctx.strokeStyle = col; ctx.lineWidth = 3;
        if(this.jackpot > 0) { ctx.shadowBlur = 15; ctx.shadowColor = '#0f0'; }
        
        let cx = this.x + 20, cy = this.y + 30;
        ctx.beginPath(); ctx.arc(cx, cy - 45, 12, 0, 7); ctx.stroke(); // Head
        ctx.beginPath(); ctx.moveTo(cx, cy - 33); ctx.lineTo(cx, cy + 10); ctx.stroke(); // Torso
        let armY = (this.m1T > 0) ? cy - 10 : cy - 20;
        ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx + (this.dir * 25), armY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx - (this.dir * 15), cy - 10); ctx.stroke();
        let walk = (Math.abs(this.vx) > 0.1) ? Math.sin(this.frame * 0.2) * 12 : 5;
        ctx.beginPath(); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx + walk, cy + 45); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx - walk, cy + 45); ctx.stroke();

        if (this.fx > 0 && (this.k === 'Ryu' || this.k === 'Yuta')) {
            ctx.fillStyle = this.s.c; ctx.globalAlpha = 0.6;
            let isClash = (p1.fx > 0 && p2.fx > 0 && (p1.k === 'Ryu' || p1.k === 'Yuta') && (p2.k === 'Ryu' || p2.k === 'Yuta'));
            let beamLen = isClash ? Math.abs(canvas.width/2 - cx) : 2000;
            ctx.fillRect(cx, cy - 10, beamLen * this.dir, 30);
            if(isClash) { ctx.globalAlpha = 1; ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(canvas.width/2, cy+5, 25, 0, 7); ctx.fill(); }
            ctx.globalAlpha = 1.0;
        }

        if (this.proj.active) {
            ctx.fillStyle = this.k === 'Gojo' ? '#a0f' : this.s.c;
            ctx.beginPath(); ctx.arc(this.proj.x, this.proj.y, this.k === 'Gojo' ? 40 : 12, 0, 7); ctx.fill();
        }
        ctx.restore();
    }

    update(opp) {
        if (!active || paused) return;

        if (this.fx > 0 && (this.k === 'Ryu' || this.k === 'Yuta')) {
            this.vx = 0;
        } else if (this.stun <= 0) {
            if (this.pNum === 1) {
                if (held.p1L) { this.vx = -this.s.s; this.dir = -1; }
                if (held.p1R) { this.vx = this.s.s; this.dir = 1; }
            } else if (!this.cpu) {
                if (held.p2L) { this.vx = -this.s.s; this.dir = -1; }
                if (held.p2R) { this.vx = this.s.s; this.dir = 1; }
            }
        }

        this.x += this.vx; this.y += this.vy;
        let ground = canvas.height - 140;
        this.vx *= 0.75;
        if (this.y < ground) this.vy += 0.8; else { this.y = ground; this.vy = 0; }

        if (this.jackpot > 0) { this.jackpot--; if (this.hp < 300) this.hp += 0.5; }

        if (this.fx > 0) {
            this.fx--;
            if ((this.k === 'Naoya' || this.k === 'Toji') && Math.abs(this.x - opp.x) < 65) {
                opp.stun = (this.k === 'Naoya') ? 50 : 10;
                opp.hp -= 0.5;
            }
            let clash = (p1.fx > 0 && p2.fx > 0 && (p1.k === 'Ryu' || p1.k === 'Yuta') && (p2.k === 'Ryu' || p2.k === 'Yuta'));
            if ((this.k === 'Ryu' || this.k === 'Yuta') && !clash && Math.abs(this.y - opp.y) < 100) {
                let d = opp.x - this.x;
                if ((this.dir === 1 && d > 0) || (this.dir === -1 && d < 0)) { opp.hp -= 1.5; opp.stun = 2; }
            }
        }
        
        if (this.proj.active) {
            this.proj.x += this.proj.vx;
            if (Math.abs(this.proj.x - (opp.x + 20)) < 50) { opp.hp -= 35; opp.stun = 20; this.proj.active = false; }
            if (this.proj.x < 0 || this.proj.x > canvas.width) this.proj.active = false;
        }

        if (this.stun > 0) this.stun--; if (this.spT > 0) this.spT--; if (this.m1T > 0) this.m1T--;
        if (this.cpu) this.ai(opp);
    }

    spec() {
        if (this.spT > 0 || this.stun > 0) return;
        this.spT = 400;
        if (this.k === 'Hakari') { if (Math.random() < 0.4) this.jackpot = 500; else this.spT = 100; }
        else if (this.k === 'Naoya' || this.k === 'Toji') { this.fx = 40; this.vx = this.dir * 55; }
        else if (this.k === 'Ryu' || this.k === 'Yuta') this.fx = 150;
        else this.proj = { active: true, x: this.x + 20, y: this.y + 20, vx: this.dir * 18 };
    }

    atk(opp) {
        if (this.stun > 0 || this.m1T > 0) return;
        this.m1T = 20;
        if (Math.abs(this.x - opp.x) < 85) { opp.hp -= this.s.d; opp.stun = 10; opp.vx = this.dir * 5; }
    }

    ai(opp) {
        if (Math.abs(this.x - opp.x) > 180) this.vx = opp.x < this.x ? -this.s.s : this.s.s;
        else if (Math.random() < 0.06) this.atk(opp);
        if (Math.random() < 0.01) this.spec();
    }
}

function initMode(m) {
    mode = m; p1C = null; p2C = null;
    document.getElementById('m-start').style.display = 'none';
    document.getElementById('m-char').style.display = 'block';
    updateSelectionTitle();
    const g = document.getElementById('char-grid'); g.innerHTML = '';
    Object.keys(chars).forEach(c => {
        const b = document.createElement('button'); b.innerText = c;
        b.onpointerdown = (e) => {
            e.stopPropagation();
            if (!p1C) { p1C = c; if (mode === '1P') { p2C = 'Sukuna'; startGame(); } else updateSelectionTitle(); }
            else if (mode === '2P' && !p2C) { p2C = c; startGame(); }
        };
        g.appendChild(b);
    });
}

function updateSelectionTitle() {
    const t = document.getElementById('selection-title');
    if (!p1C) { t.innerText = "PLAYER 1: SELECT CHARACTER"; t.style.color = "#0af"; }
    else { t.innerText = "PLAYER 2: SELECT CHARACTER"; t.style.color = "#f33"; }
}

function startGame() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    p1 = new Sorcerer(100, canvas.height - 140, p1C, 1, false);
    p2 = new Sorcerer(canvas.width - 150, canvas.height - 140, p2C, 2, mode === '1P');
    document.getElementById('menu').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
    if (mode === '2P') document.getElementById('p2-pad').style.display = 'block';
    active = true; loop();
}

function loop() {
    if (!active) return;
    if (!paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        p1.update(p2); p2.update(p1); p1.draw(); p2.draw();
        document.getElementById('p1-hp').style.width = (p1.hp / 3) + '%';
        document.getElementById('p1-cd').style.width = ((400 - p1.spT) / 4) + '%';
        document.getElementById('p1-stun').innerText = p1.stun > 0 ? "FROZEN" : "";
        document.getElementById('p2-hp').style.width = (p2.hp / 3) + '%';
        document.getElementById('p2-cd').style.width = ((400 - p2.spT) / 4) + '%';
        document.getElementById('p2-stun').innerText = p2.stun > 0 ? "FROZEN" : "";
        if (p1.hp <= 0 || p2.hp <= 0) { active = false; showWinScreen(p1.hp <= 0 ? "PLAYER 2" : "PLAYER 1"); }
    }
    requestAnimationFrame(loop);
}

function showWinScreen(w) {
    document.getElementById('win-text').innerText = w + " WINS";
    document.getElementById('win-text').style.color = w === "PLAYER 1" ? "#0af" : "#f33";
    document.getElementById('win-screen').style.display = 'flex';
}

function togglePause() { if(!active) return; paused = !paused; document.getElementById('pause-screen').style.display = paused ? 'flex' : 'none'; }

window.addEventListener('touchstart', e => {
    [...e.touches].forEach(touch => {
        const b = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!b || !b.dataset.v) return;
        const pNum = b.dataset.p;
        const p = (pNum === '1') ? p1 : p2;
        const opp = (pNum === '1') ? p2 : p1;
        if (b.dataset.v === 'l') held['p'+pNum+'L'] = true;
        if (b.dataset.v === 'r') held['p'+pNum+'R'] = true;
        if (b.dataset.v === 'u' && p.vy === 0) p.vy = -18;
        if (b.dataset.v === 'a') p.atk(opp);
        if (b.dataset.v === 's') p.spec();
    });
}, {passive: false});

window.addEventListener('touchend', e => {
    held.p1L = held.p1R = held.p2L = held.p2R = false;
    [...e.touches].forEach(touch => {
        const b = document.elementFromPoint(touch.clientX, touch.clientY);
        if (b && b.dataset.v === 'l') held['p'+b.dataset.p+'L'] = true;
        if (b && b.dataset.v === 'r') held['p'+b.dataset.p+'R'] = true;
    });
});

window.onload = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
