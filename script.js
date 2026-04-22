const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C, p2C, active = false, paused = false;

const chars = {
    'Gojo': { c: '#fff', d: 6, s: 6, rng: { m1: 65, sp: 800 } },
    'Sukuna': { c: '#f44', d: 7, s: 7, rng: { m1: 75, sp: 700 } },
    'Itadori': { c: '#fd0', d: 10, s: 8, rng: { m1: 55, sp: 120 } },
    'Nanami': { c: '#dca', d: 12, s: 5, rng: { m1: 70, sp: 100 } },
    'Maki': { c: '#4a4', d: 6, s: 9, rng: { m1: 130, sp: 400 } },
    'Megumi': { c: '#44f', d: 5, s: 6, rng: { m1: 80, sp: 400 } },
    'Toji': { c: '#666', d: 11, s: 10, rng: { m1: 65, sp: 600 } },
    'Nobara': { c: '#f6a', d: 8, s: 6, rng: { m1: 65, sp: 500 } },
    'Geto': { c: '#74a', d: 6, s: 7, rng: { m1: 80, sp: 400 } },
    'Yuta': { c: '#aaf', d: 8, s: 7, rng: { m1: 95, sp: 300 } },
    'Naoya': { c: '#dfd', d: 6, s: 12, rng: { m1: 60, sp: 500 } },
    'Todo': { c: '#853', d: 9, s: 7, rng: { m1: 70, sp: 800 } },
    'Ryu': { c: '#f80', d: 7, s: 5, rng: { m1: 80, sp: 1000 } },
    'Choso': { c: '#a44', d: 7, s: 7, rng: { m1: 100, sp: 900 } },
    'Hakari': { c: '#f0f', d: 8, s: 8, rng: { m1: 60, sp: 200 } }
};

class Sorcerer {
    constructor(x, y, k, pNum, cpu) {
        this.k = k; this.s = chars[k]; this.x = x; this.y = y; this.w = 40; this.h = 90;
        this.hp = 300; this.maxHp = 300; this.vx = 0; this.vy = 0; this.dir = pNum === 1 ? 1 : -1;
        this.cpu = cpu; this.m1T = 0; this.spT = 0; this.swing = 0; this.fx = 0; this.stun = 0;
        this.proj = { active: false, x: 0, y: 0 };
        this.jackpotT = 0; this.frameT = 0;
    }

    draw(opp) {
        if (this.k === 'Megumi' && this.jackpotT > 0) {
            ctx.fillStyle = '#44f'; ctx.beginPath(); ctx.moveTo(this.x+20, this.y+110);
            ctx.lineTo(this.x+10, this.y+130); ctx.lineTo(this.x+30, this.y+130); ctx.fill(); return;
        }
        ctx.save();
        if (this.stun > 0 || this.frameT > 0) ctx.translate(Math.random()*4, 0);
        ctx.strokeStyle = (this.jackpotT > 0 && this.k === 'Hakari') ? '#f0f' : (this.frameT > 0 ? '#fff' : this.s.c);
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(this.x+20, this.y-15, 12, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x+20, this.y); ctx.lineTo(this.x+20, this.y+50); ctx.stroke();
        let armX = this.x+20+((this.swing > 0 ? this.s.rng.m1 : 30)*this.dir);
        ctx.beginPath(); ctx.moveTo(this.x+20, this.y+15); ctx.lineTo(armX, this.y+20); ctx.stroke();
        if (this.proj.active) {
            ctx.save();
            if (this.k === 'Ryu') { ctx.fillStyle = '#00f'; ctx.shadowBlur = 20; ctx.shadowColor = '#0cf'; ctx.beginPath(); ctx.arc(this.proj.x, this.proj.y, 40, 0, 7); ctx.fill(); }
            else if (this.k === 'Nobara') { ctx.fillStyle = '#fff'; ctx.fillRect(this.proj.x, this.proj.y, 15, 4); }
            else if (this.k === 'Yuta' && this.fx > 30) { ctx.fillStyle = '#f0f'; ctx.shadowBlur = 15; ctx.shadowColor = '#f0f'; ctx.globalAlpha = 0.7; ctx.fillRect(this.x+(20*this.dir), this.y, 600*this.dir, 30); }
            ctx.restore();
        }
        if (this.frameT > 0) { ctx.strokeStyle = '#fff'; ctx.strokeRect(this.x-5, this.y-25, 50, 120); }
        ctx.beginPath(); ctx.moveTo(this.x+20, this.y+50); ctx.lineTo(this.x, this.y+90); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x+20, this.y+50); ctx.lineTo(this.x+40, this.y+90); ctx.stroke();
        ctx.restore();
    }

    update(opp) {
        if (paused) return;
        if (this.jackpotT > 0) this.jackpotT--; if (this.frameT > 0) this.frameT--;
        if (this.proj.active) {
            if (this.k === 'Yuta') {
                if (this.fx === 59) {
                    let d = Math.abs(this.x - opp.x);
                    if (d < 600 && ((this.dir === 1 && opp.x > this.x) || (this.dir === -1 && opp.x < this.x))) {
                        if (opp.jackpotT <= 0 || opp.k !== 'Hakari') { opp.hp -= 60; opp.stun = 30; }
                    }
                }
                if (this.fx < 30) this.proj.active = false;
            } else {
                this.proj.x += (this.k === 'Nobara' ? 20 : 14) * this.dir;
                let hit = Math.abs(this.proj.x-(opp.x+20)) < 50 && Math.abs(this.proj.y-opp.y) < 100;
                if (hit && (opp.k !== 'Megumi' || opp.jackpotT <= 0)) {
                    if (opp.jackpotT <= 0 || opp.k !== 'Hakari') { opp.hp -= (this.k === 'Ryu' ? 75 : 30); opp.stun = (this.k === 'Nobara' ? 60 : 20); }
                    this.proj.active = false;
                }
                if (this.proj.x < 0 || this.proj.x > canvas.width) this.proj.active = false;
            }
        }
        if ((this.stun > 0 || this.frameT > 0) && this.jackpotT <= 0) { this.vx = 0; if (this.stun > 0) this.stun--; }
        else {
            this.x += this.vx; this.y += this.vy;
            if (this.y+this.h < canvas.height-50) this.vy += 0.8; else { this.y = canvas.height-140; this.vy = 0; }
            if (Math.abs(this.vx) > 0.1) this.dir = this.vx > 0 ? 1 : -1;
            this.vx *= 0.7;
        }
        this.x = Math.max(0, Math.min(canvas.width - this.w, this.x));
        if (this.m1T > 0) this.m1T--; if (this.spT > 0) this.spT--; if (this.swing > 0) this.swing--; if (this.fx > 0) this.fx--; if (this.cpu) this.ai(opp);
    }

    spec(opp) {
        if (this.spT > 0 || this.stun > 0 || this.frameT > 0) return;
        this.spT = 800; this.fx = 60;
        let d = Math.abs(this.x - opp.x);
        switch(this.k) {
            case 'Nobara': case 'Ryu': this.proj = { active: true, x: this.x+20, y: this.y+20 }; break;
            case 'Yuta': this.proj = { active: true }; break;
            case 'Megumi': this.jackpotT = 180; break;
            case 'Naoya': this.vx = this.dir*70; if (d < 150) { opp.frameT = 120; opp.hp -= 20; } break;
            case 'Hakari': if (Math.random() < 0.33) { this.jackpotT = 180; this.hp += 50; this.spT = 400; } break;
            case 'Todo': if (d < 800) { let tx = this.x; this.x = opp.x; opp.x = tx; opp.stun = 40; } break;
            case 'Maki': if (d < 450) { this.x = opp.x - (60 * this.dir); opp.hp -= 40; opp.stun = 20; } break;
            default: if(d < 400) { opp.hp -= 40; opp.stun = 20; this.vx = this.dir * 30; }
        }
    }

    atk(opp) {
        if (this.m1T > 0 || this.stun > 0 || this.frameT > 0 || (opp.k === 'Megumi' && opp.jackpotT > 0)) return;
        this.m1T = 45; this.swing = 12;
        if (Math.abs((this.x+20)-(opp.x+20)) < this.s.rng.m1) {
            let dmg = (this.k === 'Hakari' && this.jackpotT > 0) ? this.s.d*2 : this.s.d;
            if (opp.jackpotT <= 0 || opp.k !== 'Hakari') { opp.hp -= dmg; opp.vx = this.dir*12; }
        }
    }

    ai(opp) {
        let d = Math.abs(this.x - opp.x);
        let ideal = (this.k === 'Ryu') ? 400 : 50;
        if (d > ideal + 20) this.vx = (opp.x < this.x ? -this.s.s : this.s.s);
        this.dir = (opp.x < this.x) ? -1 : 1;
        if (d < this.s.rng.m1 && Math.random() < 0.05) this.atk(opp);
        if (d < 600 && Math.random() < 0.02) this.spec(opp);
    }
}

const inputs = { p1: { l:0, r:0, u:0, a:0, s:0 }, p2: { l:0, r:0, u:0, a:0, s:0 } };
function handleTouch(e) { if (!active) return; e.preventDefault(); inputs.p1 = { l:0, r:0, u:0, a:0, s:0 }; inputs.p2 = { l:0, r:0, u:0, a:0, s:0 }; for (let t of e.touches) { for (let b of document.getElementsByClassName('btn')) { let r = b.getBoundingClientRect(); if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) { (b.dataset.p === "1" ? inputs.p1 : inputs.p2)[b.dataset.v] = 1; } } } }
window.addEventListener('touchstart', handleTouch, { passive: false }); window.addEventListener('touchend', handleTouch, { passive: false });
function togglePause() { if (!active) return; paused = !paused; document.getElementById('pause-screen').style.display = paused ? 'flex' : 'none'; }
function initMode(m) { mode = m; document.getElementById('m-start').style.display = 'none'; document.getElementById('m-char').style.display = 'block'; const g = document.getElementById('char-grid'); Object.keys(chars).forEach(c => { const b = document.createElement('button'); b.innerText = c; b.onclick = () => { if (!p1C) { p1C = c; if (mode === '1P') { p2C = 'Sukuna'; startGame(); } } else { p2C = c; startGame(); } }; g.appendChild(b); }); }
function startGame() { document.getElementById('menu').style.display = 'none'; document.getElementById('pause-btn').style.display = 'block'; document.getElementById('controls').style.display = 'block'; if (mode === '2P') document.getElementById('p2-pad').style.display = 'flex'; p1 = new Sorcerer(150, 100, p1C, 1, false); p2 = new Sorcerer(canvas.width-250, 100, p2C, 2, mode === '1P'); active = true; loop(); }
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = resize; resize();

function loop() {
    if (active && !paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#111'; ctx.fillRect(0, canvas.height-50, canvas.width, 50);
        
        // EXCLUSIVE YUTA & RYU CLASH
        let clashX = -1;
        if (p1.proj.active && p2.proj.active) {
            let r = (p1.k === 'Ryu' && p2.k === 'Yuta') ? {ryu:p1, yuta:p2} : (p2.k === 'Ryu' && p1.k === 'Yuta') ? {ryu:p2, yuta:p1} : null;
            if (r && r.yuta.fx > 30) {
                let dToBeam = Math.abs(r.ryu.proj.x - r.yuta.x);
                if (dToBeam < 600 && ((r.yuta.dir === 1 && r.ryu.proj.x > r.yuta.x) || (r.yuta.dir === -1 && r.ryu.proj.x < r.yuta.x))) {
                    clashX = r.ryu.proj.x; r.ryu.proj.active = false; r.yuta.proj.active = false;
                }
            }
        }
        if (clashX !== -1) {
            ctx.save(); ctx.translate((Math.random()-0.5)*20, (Math.random()-0.5)*20);
            let g = ctx.createRadialGradient(clashX, p1.y+20, 10, clashX, p1.y+20, 100);
            g.addColorStop(0, '#fff'); g.addColorStop(0.5, '#f0f'); g.addColorStop(1, 'transparent');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(clashX, p1.y+20, 150, 0, 7); ctx.fill(); ctx.restore();
        }

        [p1, p2].forEach((p, i) => {
            let opp = (i === 0) ? p2 : p1;
            if(!p.cpu) {
                let inp = (i === 0) ? inputs.p1 : inputs.p2;
                if (inp.l) { p.vx = -p.s.s; p.dir = -1; } else if (inp.r) { p.vx = p.s.s; p.dir = 1; } else { p.vx = 0; }
                if (inp.u && p.vy === 0) p.vy = -18;
                if (inp.a || inp.s) { p.dir = (opp.x < p.x) ? -1 : 1; if (inp.a) p.atk(opp); if (inp.s) p.spec(opp); }
            }
            p.update(opp); p.draw(opp);
        });
        document.getElementById('p1-hp').style.width = (p1.hp/3) + '%'; document.getElementById('p2-hp').style.width = (p2.hp/3) + '%';
        document.getElementById('p1-sp').style.width = ((800-p1.spT)/8) + '%'; document.getElementById('p2-sp').style.width = ((800-p2.spT)/8) + '%';
        if (p1.hp <= 0 || p2.hp <= 0) { active = false; document.getElementById('end-screen').style.display = 'flex'; document.getElementById('win-msg').innerText = p1.hp <= 0 ? p2.k + " WINS!" : p1.k + " WINS!"; }
    }
    requestAnimationFrame(loop);
}
