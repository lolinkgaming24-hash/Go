const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C, p2C, active = false, paused = false;

const chars = {
    'Gojo': { c: '#fff', d: 6, s: 6, w: 'none', rng: { m1: 65, sp: 800 } },
    'Sukuna': { c: '#f44', d: 7, s: 7, w: 'cleave', rng: { m1: 75, sp: 700 } },
    'Itadori': { c: '#fd0', d: 10, s: 8, w: 'fist', rng: { m1: 55, sp: 120 } },
    'Nanami': { c: '#dca', d: 12, s: 5, w: 'blade', rng: { m1: 70, sp: 100 } },
    'Maki': { c: '#4a4', d: 6, s: 9, w: 'spear', rng: { m1: 130, sp: 300 } },
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
        
        // Character Core
        ctx.strokeStyle = this.s.c; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(this.x + 20, this.y - 15, 12, 0, 7); ctx.stroke(); // Head
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y); ctx.lineTo(this.x + 20, this.y + 50); ctx.stroke(); // Torso
        
        let armLen = this.swing > 0 ? this.s.rng.m1 : 30;
        let armX = this.x + 20 + (armLen * this.dir);
        let armY = this.y + 20;
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 15); ctx.lineTo(armX, armY); ctx.stroke();

        // Weapon Renderers
        ctx.lineWidth = 3;
        if(this.s.w === 'spear') { 
            ctx.strokeStyle = '#944'; ctx.beginPath(); ctx.moveTo(armX, armY); ctx.lineTo(armX+(60*this.dir), armY); ctx.stroke();
            ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.moveTo(armX+(60*this.dir), armY-5); ctx.lineTo(armX+(80*this.dir), armY); ctx.lineTo(armX+(60*this.dir), armY+5); ctx.fill();
        }
        if(this.s.w === 'katana' || this.s.w === 'blade') {
            ctx.strokeStyle = '#eee'; ctx.beginPath(); ctx.moveTo(armX, armY); ctx.quadraticCurveTo(armX+(20*this.dir), armY-25, armX+(40*this.dir), armY-45); ctx.stroke();
        }

        // Skill Visuals
        if (this.proj.active) {
            ctx.save();
            if (this.k === 'Gojo') {
                let g = ctx.createRadialGradient(this.proj.x, this.proj.y, 5, this.proj.x, this.proj.y, 45);
                g.addColorStop(0, '#fff'); g.addColorStop(0.5, '#a0f'); g.addColorStop(1, 'transparent');
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.proj.x, this.proj.y, 50, 0, 7); ctx.fill();
            } else if (this.k === 'Ryu') {
                ctx.fillStyle = '#f80'; ctx.shadowBlur = 15; ctx.shadowColor = '#f80';
                ctx.beginPath(); ctx.arc(this.proj.x, this.proj.y, 35, 0, 7); ctx.fill();
            } else if (this.k === 'Choso') {
                ctx.fillStyle = '#f00'; ctx.fillRect(this.proj.x, this.proj.y-2, 80 * this.dir, 5);
            }
            ctx.restore();
        }

        if (this.fx > 0) {
            if (this.k === 'Itadori') { // Black Flash Sparks
                ctx.strokeStyle = '#f00'; ctx.lineWidth = 3;
                for(let i=0; i<6; i++) { ctx.beginPath(); ctx.moveTo(opp.x+20, opp.y+20); ctx.lineTo(opp.x+20+(Math.random()-0.5)*120, opp.y+20+(Math.random()-0.5)*120); ctx.stroke(); }
                ctx.fillStyle = '#0cf'; ctx.beginPath(); ctx.arc(armX, armY, 15, 0, 7); ctx.fill();
            }
            if (this.k === 'Sukuna') {
                ctx.strokeStyle = '#f44'; ctx.lineWidth = 1;
                for(let i=0; i<10; i++) { ctx.beginPath(); ctx.moveTo(opp.x-30, opp.y+(i*12)); ctx.lineTo(opp.x+70, opp.y+(i*12)-20); ctx.stroke(); }
            }
        }

        // Legs
        ctx.strokeStyle = this.s.c; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 50); ctx.lineTo(this.x, this.y + 90); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x + 20, this.y + 50); ctx.lineTo(this.x + 40, this.y + 90); ctx.stroke();
        ctx.restore();
    }

    update(opp) {
        if (paused) return;
        
        if (this.proj.active) {
            this.proj.x += (this.k === 'Choso' ? 26 : 14) * this.dir;
            let d = Math.abs(this.proj.x - (opp.x + 20));
            if (d < 50 && Math.abs(this.proj.y - opp.y) < 100) {
                opp.hp -= (this.k === 'Ryu' ? 65 : 45);
                opp.stun = 20; this.proj.active = false;
            }
            if (this.proj.x < 0 || this.proj.x > canvas.width) this.proj.active = false;
        }

        if (this.stun > 0) { this.stun--; this.vx = 0; }
        else {
            this.x += this.vx; this.y += this.vy;
            if (this.y + this.h < canvas.height - 50) this.vy += 0.8; 
            else { this.y = canvas.height - 140; this.vy = 0; }
            this.vx *= 0.85; 
        }
        
        this.x = Math.max(0, Math.min(canvas.width - this.w, this.x));
        if (this.m1T > 0) this.m1T--; if (this.spT > 0) this.spT--; if (this.swing > 0) this.swing--;
        if (this.fx > 0) this.fx--;
        if (this.cpu) this.ai(opp);
    }

    spec(opp) {
        if (this.spT > 0 || this.stun > 0) return; 
        this.spT = 800; this.fx = 60;
        let d = Math.abs((this.x+20) - (opp.x+20));

        switch(this.k) {
            case 'Gojo': case 'Ryu': case 'Choso':
                this.proj.active = true; this.proj.x = this.x + 20; this.proj.y = this.y + 20;
                break;
            case 'Todo': 
                if (d < 800) { let tx = this.x; this.x = opp.x; opp.x = tx; opp.stun = 35; }
                break;
            case 'Naoya': 
                this.vx = this.dir * 55; if (d < 500) { opp.hp -= 45; opp.stun = 45; }
                break;
            case 'Hakari': 
                this.hp = Math.min(this.maxHp, this.hp + 120); this.spT = 450;
                break;
            case 'Itadori': if(d < 120) { opp.hp -= 90; opp.stun = 40; opp.vx = this.dir * 45; } break;
            case 'Sukuna': if(d < 700) { opp.hp -= 60; opp.stun = 15; } break;
            case 'Toji': this.x = opp.x - (50 * this.dir); opp.hp -= 50; break;
            default: if(d < this.s.rng.sp) { opp.hp -= 40; opp.stun = 20; this.vx = this.dir * 25; }
        }
    }

    atk(opp) {
        if (this.m1T > 0 || this.stun > 0) return; 
        this.m1T = 45; this.swing = 12;
        if (Math.abs((this.x+20) - (opp.x+20)) < this.s.rng.m1) {
            opp.hp -= this.s.d;
            opp.vx = this.dir * 12;
        }
    }

    ai(opp) {
        if (this.stun > 0) return;
        let d = Math.abs(this.x - opp.x);
        let ideal = (this.k === 'Ryu' || this.k === 'Choso' || this.k === 'Gojo') ? 400 : 60;
        
        if (d > ideal + 30) this.vx = (opp.x < this.x ? -this.s.s : this.s.s);
        else if (d < ideal - 30) this.vx = (opp.x < this.x ? this.s.s : -this.s.s);
        
        this.dir = (opp.x < this.x) ? -1 : 1;
        if (d < this.s.rng.m1 && Math.random() < 0.04) this.atk(opp);
        if (d < this.s.rng.sp && Math.random() < 0.015) this.spec(opp);
    }
}

const inputs = { p1: { l:0, r:0, u:0, a:0, s:0 }, p2: { l:0, r:0, u:0, a:0, s:0 } };
const btns = document.getElementsByClassName('btn');

function handleTouch(e) {
    if (!active) return;
    e.preventDefault();
    inputs.p1 = { l:0, r:0, u:0, a:0, s:0 }; inputs.p2 = { l:0, r:0, u:0, a:0, s:0 };
    for (let t of e.touches) {
        for (let b of btns) {
            let r = b.getBoundingClientRect();
            if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) {
                let p = b.dataset.p === "1" ? inputs.p1 : inputs.p2;
                p[b.dataset.v] = 1;
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
        b.onclick = () => { 
            if (!p1C) { p1C = c; document.getElementById('sel-title').innerText = "PLAYER 2 SELECTION"; if (mode === '1P') { p2C = 'Sukuna'; startGame(); } } 
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
    p2 = new Sorcerer(canvas.width - 250, 100, p2C, 2, mode === '1P');
    active = true; resize(); loop();
}

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = resize; resize();

function loop() {
    if (active && !paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#151515'; ctx.fillRect(0, canvas.height - 50, canvas.width, 50); // Ground
        
        [p1, p2].forEach((p, i) => {
            let opp = i === 0 ? p2 : p1;
            let inp = i === 0 ? inputs.p1 : inputs.p2;
            if(!p.cpu) {
                p.vx = inp.l ? -p.s.s : inp.r ? p.s.s : 0;
                if (p.vx !== 0) p.dir = p.vx > 0 ? 1 : -1;
                if (inp.u && p.vy === 0) p.vy = -18;
                if (inp.a) p.atk(opp);
                if (inp.s) p.spec(opp);
            }
            p.update(opp); p.draw(opp);
        });

        document.getElementById('p1-hp').style.width = (p1.hp / p1.maxHp * 100) + '%';
        document.getElementById('p2-hp').style.width = (p2.hp / p2.maxHp * 100) + '%';
        document.getElementById('p1-sp').style.width = ((800 - p1.spT) / 8) + '%';
        document.getElementById('p2-sp').style.width = ((800 - p2.spT) / 8) + '%';

        if (p1.hp <= 0 || p2.hp <= 0) {
            active = false; document.getElementById('end-screen').style.display = 'flex';
            document.getElementById('win-msg').innerText = p1.hp <= 0 ? p2.k + " WINS!" : p1.k + " WINS!";
        }
    }
    requestAnimationFrame(loop);
}
