const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C, p2C, active = false, paused = false;

const chars = {
    'Gojo': { c: '#fff', d: 6, s: 6, w: 'none', rng: { m1: 65, sp: 800 } },
    'Sukuna': { c: '#f44', d: 7, s: 7, w: 'cleave', rng: { m1: 75, sp: 700 } },
    'Itadori': { c: '#fd0', d: 10, s: 8, w: 'fist', rng: { m1: 55, sp: 120 } },
    'Nanami': { c: '#dca', d: 12, s: 5, w: 'blade', rng: { m1: 70, sp: 100 } },
    'Maki': { c: '#4a4', d: 6, s: 9, w: 'spear', rng: { m1: 130, sp: 400 } },
    'Megumi': { c: '#44f', d: 5, s: 6, w: 'sword', rng: { m1: 80, sp: 400 } },
    'Toji': { c: '#666', d: 11, s: 10, w: 'dagger', rng: { m1: 65, sp: 600 } },
    'Nobara': { c: '#f6a', d: 8, s: 6, w: 'hammer', rng: { m1: 65, sp: 500 } },
    'Geto': { c: '#74a', d: 6, s: 7, w: 'curse', rng: { m1: 80, sp: 400 } },
    'Yuta': { c: '#aaf', d: 8, s: 7, w: 'katana', rng: { m1: 95, sp: 300 } },
    'Naoya': { c: '#dfd', d: 6, s: 12, w: 'fist', rng: { m1: 60, sp: 500 } },
    'Todo': { c: '#853', d: 9, s: 7, w: 'fist', rng: { m1: 70, sp: 800 } },
    'Ryu': { c: '#f80', d: 7, s: 5, w: 'none', rng: { m1: 80, sp: 1000 } },
    'Choso': { c: '#a44', d: 7, s: 7, w: 'blood', rng: { m1: 100, sp: 900 } },
    'Hakari': { c: '#f0f', d: 8, s: 8, w: 'fist', rng: { m1: 60, sp: 200 } }
};

class Sorcerer {
    constructor(x, y, k, pNum, cpu) {
        this.k = k; this.s = chars[k]; this.x = x; this.y = y; this.w = 40; this.h = 90;
        this.hp = 300; this.maxHp = 300; this.vx = 0; this.vy = 0; this.dir = pNum === 1 ? 1 : -1;
        this.cpu = cpu; this.m1T = 0; this.spT = 0; this.swing = 0; this.fx = 0; this.stun = 0;
        this.proj = { active: false, x: 0, y: 0 };
    }

    draw(opp) {
        ctx.save();
        if (this.stun > 0) ctx.translate(Math.random()*6, 0);
        
        ctx.strokeStyle = this.s.c; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(this.x + 20, this.y - 15, 12, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y); ctx.lineTo(this.x + 20, this.y + 50); ctx.stroke();
        
        let armX = this.x + 20 + ((this.swing > 0 ? this.s.rng.m1 : 30) * this.dir);
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 15); ctx.lineTo(armX, this.y + 20); ctx.stroke();

        // Projectiles
        if (this.proj.active) {
            ctx.save();
            ctx.fillStyle = (this.k === 'Ryu') ? '#00f' : (this.k === 'Gojo' ? '#a0f' : '#f00');
            if (this.k === 'Ryu') { ctx.shadowBlur = 20; ctx.shadowColor = '#0cf'; }
            ctx.beginPath(); ctx.arc(this.proj.x, this.proj.y, 35, 0, 7); ctx.fill();
            ctx.restore();
        }

        // Hakari Jackpot Visual
        if (this.k === 'Hakari' && this.spT > 0 && this.fx > 0) {
            ctx.strokeStyle = '#f0f'; ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 5, this.y - 5, 50, 100);
        }

        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 50); ctx.lineTo(this.x, this.y + 90); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 50); ctx.lineTo(this.x + 40, this.y + 90); ctx.stroke();
        ctx.restore();
    }

    update(opp) {
        if (paused) return;
        if (this.proj.active) {
            this.proj.x += 16 * this.dir;
            if (Math.abs(this.proj.x - (opp.x + 20)) < 50 && Math.abs(this.proj.y - opp.y) < 100) {
                opp.hp -= (this.k === 'Ryu' ? 70 : 45); opp.stun = 20; this.proj.active = false;
            }
            if (this.proj.x < 0 || this.proj.x > canvas.width) this.proj.active = false;
        }

        if (this.stun > 0) { this.stun--; this.vx = 0; }
        else {
            this.x += this.vx; this.y += this.vy;
            if (this.y + this.h < canvas.height - 50) this.vy += 0.8; 
            else { this.y = canvas.height - 140; this.vy = 0; }
            this.vx *= 0.92; // Friction
        }
        this.x = Math.max(0, Math.min(canvas.width - this.w, this.x));
        if (this.m1T > 0) this.m1T--; if (this.spT > 0) this.spT--; if (this.swing > 0) this.swing--;
        if (this.fx > 0) this.fx--;
        if (this.cpu) this.ai(opp);
    }

    spec(opp) {
        if (this.spT > 0 || this.stun > 0) return; 
        this.spT = 800; this.fx = 60;
        let d = Math.abs(this.x - opp.x);

        switch(this.k) {
            case 'Gojo': case 'Ryu': case 'Choso':
                this.proj.active = true; this.proj.x = this.x + 20; this.proj.y = this.y + 20;
                break;
            case 'Hakari': 
                this.hp = Math.min(this.maxHp, this.hp + 120); this.spT = 400; break;
            case 'Todo': 
                if (d < 800) { let tx = this.x; this.x = opp.x; opp.x = tx; opp.stun = 40; } break;
            case 'Naoya': 
                this.vx = this.dir * 65; if (d < 500) { opp.hp -= 45; opp.stun = 50; } break;
            case 'Maki': 
                if (d < 450) { this.x = opp.x - (60 * this.dir); opp.hp -= 40; opp.stun = 20; } break;
            default: 
                if(d < 400) { opp.hp -= 40; opp.stun = 20; this.vx = this.dir * 30; }
        }
    }

    atk(opp) {
        if (this.m1T > 0 || this.stun > 0) return; 
        this.m1T = 45; this.swing = 12;
        if (Math.abs((this.x+20) - (opp.x+20)) < this.s.rng.m1) { opp.hp -= this.s.d; opp.vx = this.dir * 12; }
    }

    ai(opp) {
        let d = Math.abs(this.x - opp.x);
        let ideal = (this.k === 'Ryu' || this.k === 'Choso') ? 400 : 50;
        if (d > ideal + 20) this.vx = (opp.x < this.x ? -this.s.s : this.s.s);
        this.dir = (opp.x < this.x) ? -1 : 1;
        if (d < this.s.rng.m1 && Math.random() < 0.05) this.atk(opp);
        if (d < 600 && Math.random() < 0.02) this.spec(opp);
    }
}

const inputs = { p1: { l:0, r:0, u:0, a:0, s:0 }, p2: { l:0, r:0, u:0, a:0, s:0 } };
function handleTouch(e) {
    if (!active) return; e.preventDefault();
    inputs.p1 = { l:0, r:0, u:0, a:0, s:0 }; inputs.p2 = { l:0, r:0, u:0, a:0, s:0 };
    for (let t of e.touches) {
        for (let b of document.getElementsByClassName('btn')) {
            let r = b.getBoundingClientRect();
            if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
                (b.dataset.p === "1" ? inputs.p1 : inputs.p2)[b.dataset.v] = 1;
            }
        }
    }
}
window.addEventListener('touchstart', handleTouch, { passive: false });
window.addEventListener('touchend', handleTouch, { passive: false });

function togglePause() { paused = !paused; document.getElementById('pause-screen').style.display = paused ? 'flex' : 'none'; }
function initMode(m) {
    mode = m; document.getElementById('m-start').style.display = 'none';
    document.getElementById('m-char').style.display = 'block';
    const g = document.getElementById('char-grid');
    Object.keys(chars).forEach(c => {
        const b = document.createElement('button'); b.innerText = c;
        b.onclick = () => { if (!p1C) { p1C = c; if (mode === '1P') { p2C = 'Sukuna'; startGame(); } } else { p2C = c; startGame(); } };
        g.appendChild(b);
    });
}
function startGame() {
    document.getElementById('menu').style.display = 'none'; document.getElementById('pause-btn').style.display = 'block';
    document.getElementById('controls').style.display = 'block'; if (mode === '2P') document.getElementById('p2-pad').style.display = 'flex';
    p1 = new Sorcerer(150, 100, p1C, 1, false); p2 = new Sorcerer(canvas.width - 250, 100, p2C, 2, mode === '1P');
    active = true; resize(); loop();
}
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = resize; resize();

function loop() {
    if (active && !paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#111'; ctx.fillRect(0, canvas.height-50, canvas.width, 50);
        [p1, p2].forEach((p, i) => {
            let opp = (i === 0) ? p2 : p1;
            if(!p.cpu) {
                let inp = (i === 0) ? inputs.p1 : inputs.p2;
                p.vx = inp.l ? -p.s.s : inp.r ? p.s.s : p.vx;
                if (inp.u && p.vy === 0) p.vy = -18;
                if (inp.a) p.atk(opp); if (inp.s) p.spec(opp);
            }
            p.update(opp); p.draw(opp);
        });
        document.getElementById('p1-hp').style.width = (p1.hp/3) + '%';
        document.getElementById('p2-hp').style.width = (p2.hp/3) + '%';
        document.getElementById('p1-sp').style.width = ((800-p1.spT)/8) + '%';
        document.getElementById('p2-sp').style.width = ((800-p2.spT)/8) + '%';
        if (p1.hp <= 0 || p2.hp <= 0) { active = false; document.getElementById('end-screen').style.display = 'flex'; }
    }
    requestAnimationFrame(loop);
}
