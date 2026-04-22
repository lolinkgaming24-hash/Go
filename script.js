const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C, p2C, active = false, paused = false;

const chars = {
    'Gojo': { c: '#fff', d: 6, s: 6, rng: { m1: 65 } },
    'Sukuna': { c: '#f44', d: 7, s: 7, rng: { m1: 75 } },
    'Itadori': { c: '#fd0', d: 10, s: 8, rng: { m1: 75 } },
    'Nanami': { c: '#dca', d: 12, s: 5, rng: { m1: 70 } },
    'Maki': { c: '#4a4', d: 6, s: 9, rng: { m1: 130 } },
    'Megumi': { c: '#44f', d: 5, s: 6, rng: { m1: 80 } },
    'Toji': { c: '#666', d: 11, s: 10, rng: { m1: 65 } },
    'Nobara': { c: '#f6a', d: 8, s: 6, rng: { m1: 65 } },
    'Geto': { c: '#74a', d: 6, s: 7, rng: { m1: 80 } },
    'Yuta': { c: '#aaf', d: 8, s: 7, rng: { m1: 95 } },
    'Naoya': { c: '#dfd', d: 6, s: 12, rng: { m1: 60 } },
    'Todo': { c: '#853', d: 9, s: 7, rng: { m1: 70 } },
    'Ryu': { c: '#f80', d: 7, s: 5, rng: { m1: 80 } },
    'Choso': { c: '#a44', d: 7, s: 7, rng: { m1: 100 } },
    'Hakari': { c: '#f0f', d: 8, s: 8, rng: { m1: 60 } }
};

class Sorcerer {
    constructor(x, y, k, pNum, cpu) {
        this.k = k; this.s = chars[k]; this.x = x; this.y = y; this.w = 40; this.h = 90;
        this.hp = 300; this.vx = 0; this.vy = 0; this.dir = pNum === 1 ? 1 : -1;
        this.cpu = cpu; this.m1T = 0; this.spT = 0; this.swing = 0; this.fx = 0; this.stun = 0;
        this.proj = { active: false, x: 0, y: 0 };
        this.jackpotT = 0; this.frameT = 0; this.bleedT = 0;
    }

    draw() {
        ctx.save();
        if (this.stun > 0 || this.bleedT > 0) ctx.translate(Math.random()*4, 0);

        if (this.k === 'Hakari' && this.jackpotT > 0) {
            ctx.shadowBlur = 15; ctx.shadowColor = '#fd0'; ctx.strokeStyle = '#fd0';
        } else {
            ctx.strokeStyle = this.bleedT > 0 ? '#f00' : (this.frameT > 0 ? '#fff' : this.s.c);
        }

        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(this.x+20, this.y-15, 12, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x+20, this.y); ctx.lineTo(this.x+20, this.y+50); ctx.stroke();
        let armX = this.x+20+((this.swing > 0 ? this.s.rng.m1 : 30)*this.dir);
        ctx.beginPath(); ctx.moveTo(this.x+20, this.y+15); ctx.lineTo(armX, this.y+20); ctx.stroke();

        if (this.proj.active) {
            ctx.save();
            if (this.k === 'Sukuna') {
                ctx.strokeStyle = '#ff3333'; ctx.lineWidth = 3;
                for(let i=0; i<3; i++) {
                    ctx.beginPath(); ctx.moveTo(this.proj.x, this.proj.y + (i*25));
                    ctx.lineTo(this.proj.x + 40, this.proj.y + (i*25) - 15); ctx.stroke();
                }
            } else if (this.k === 'Choso') {
                ctx.fillStyle = '#800'; ctx.fillRect(this.proj.x, this.proj.y, 45, 4);
            } else if (this.k === 'Yuta' && this.fx > 0) {
                let g = ctx.createLinearGradient(this.x, 0, this.x+(800*this.dir), 0);
                g.addColorStop(0, '#f0f'); g.addColorStop(1, 'transparent');
                ctx.fillStyle = g; ctx.globalAlpha = 0.6; ctx.fillRect(this.x+(20*this.dir), this.y-10, 800*this.dir, 40);
            }
            ctx.restore();
        }

        if (this.k === 'Itadori' && this.fx > 100) {
            ctx.fillStyle = Math.random() > 0.5 ? '#f00' : '#000';
            for(let i=0; i<8; i++) ctx.fillRect(this.x+20+(Math.random()*60*this.dir), this.y+Math.random()*80, 8, 8);
        }

        ctx.beginPath(); ctx.moveTo(this.x+20, this.y+50); ctx.lineTo(this.x, this.y+90); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x+20, this.y+50); ctx.lineTo(this.x+40, this.y+90); ctx.stroke();
        ctx.restore();
    }

    update(opp) {
        if (paused) return;
        if (this.jackpotT > 0) this.jackpotT--; if (this.frameT > 0) this.frameT--;
        if (this.bleedT > 0) { if (this.bleedT % 60 === 0) this.hp -= 2; this.bleedT--; }
        
        if (this.proj.active) {
            if (this.k === 'Yuta') {
                if (this.fx === 119) {
                    let d = Math.abs(this.x - opp.x);
                    if (d < 800 && ((this.dir === 1 && opp.x > this.x) || (this.dir === -1 && opp.x < this.x))) {
                        if (!(opp.k === 'Megumi' && opp.jackpotT > 0)) { opp.hp -= 50; opp.stun = 40; }
                    }
                }
                if (this.fx <= 0) this.proj.active = false;
            } else {
                this.proj.x += (this.k === 'Sukuna' ? 22 : 16) * this.dir;
                let hit = Math.abs(this.proj.x-(opp.x+20)) < 50 && Math.abs(this.proj.y-opp.y) < 100;
                if (hit && (opp.k !== 'Megumi' || opp.jackpotT <= 0)) {
                    if (this.k === 'Choso') { opp.hp -= 25; opp.bleedT = 180; opp.stun = 15; }
                    else { opp.hp -= (this.k === 'Sukuna' ? 35 : 75); opp.stun = 20; }
                    this.proj.active = false;
                }
                if (this.proj.x < 0 || this.proj.x > canvas.width) this.proj.active = false;
            }
        }

        let casting = ((this.k === 'Ryu' || this.k === 'Yuta') && this.fx > 0);
        if ((this.stun > 0 || this.frameT > 0 || casting) && this.jackpotT <= 0) { 
            this.vx = 0; if (this.stun > 0) this.stun--; 
        } else {
            this.x += this.vx; this.y += this.vy;
            if (this.y+this.h < canvas.height-50) this.vy += 0.8; else { this.y = canvas.height-140; this.vy = 0; }
            if (Math.abs(this.vx) > 1) this.dir = this.vx > 0 ? 1 : -1;
            this.vx *= (this.k === 'Naoya' && this.fx > 0) ? 0.98 : 0.7;
        }
        this.x = Math.max(0, Math.min(canvas.width - this.w, this.x));
        if (this.m1T > 0) this.m1T--; if (this.spT > 0) this.spT--; if (this.swing > 0) this.swing--; if (this.fx > 0) this.fx--; if (this.cpu) this.ai(opp);
    }

    spec(opp) {
        if (this.spT > 0 || this.stun > 0) return;
        this.spT = 800;
        let d = Math.abs(this.x - opp.x);
        switch(this.k) {
            case 'Naoya': this.fx = 40; this.vx = this.dir * 65; if (d < 200) { opp.frameT = 120; opp.hp -= 20; } break;
            case 'Maki': this.fx = 30; this.vx = this.dir * 45; if (d < 150) { opp.hp -= 40; opp.stun = 30; this.vx = 0; } break;
            case 'Itadori': 
                this.fx = 120; this.vx = this.dir * 40; 
                setTimeout(() => { if (Math.abs(this.x - opp.x) < 120) { opp.hp -= 80; opp.stun = 60; } }, 100); break;
            case 'Sukuna': this.proj = { active: true, x: this.x+20, y: this.y+20 }; break;
            case 'Ryu': this.fx = 120; this.proj = { active: true, x: this.x+20, y: this.y+20 }; break;
            case 'Yuta': this.fx = 120; this.proj = { active: true }; break;
            case 'Choso': this.fx = 110; this.proj = { active: true, x: this.x+20, y: this.y+20 }; break;
            case 'Hakari': if (Math.random() < 0.4) { this.jackpotT = 240; this.hp += 60; this.spT = 300; } break;
            default: if(d < 400) { opp.hp -= 40; opp.stun = 20; this.vx = this.dir*30; }
        }
    }

    atk(opp) {
        if (this.m1T > 0 || this.stun > 0 || (opp.k === 'Megumi' && opp.jackpotT > 0)) return;
        this.m1T = 45; this.swing = 12;
        if (Math.abs((this.x+20)-(opp.x+20)) < this.s.rng.m1 && opp.jackpotT <= 0) { 
            opp.hp -= (this.k === 'Hakari' && this.jackpotT > 0) ? this.s.d * 2 : this.s.d;
            opp.vx = this.dir*12; 
        }
    }

    ai(opp) {
        let d = Math.abs(this.x-opp.x);
        if (d > 80) this.vx = (opp.x < this.x ? -this.s.s : this.s.s);
        if (d < 80 && Math.random() < 0.05) this.atk(opp);
        if (d < 500 && Math.random() < 0.02) this.spec(opp);
    }
}

const inputs = { p1: { l:0, r:0, u:0, a:0, s:0 }, p2: { l:0, r:0, u:0, a:0, s:0 } };
function handleTouch(e) { if (!active) return; e.preventDefault(); inputs.p1 = { l:0, r:0, u:0, a:0, s:0 }; inputs.p2 = { l:0, r:0, u:0, a:0, s:0 }; for (let t of e.touches) { for (let b of document.getElementsByClassName('btn')) { let r = b.getBoundingClientRect(); if (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom) { (b.dataset.p === "1" ? inputs.p1 : inputs.p2)[b.dataset.v] = 1; } } } }
window.addEventListener('touchstart', handleTouch, { passive: false }); window.addEventListener('touchend', handleTouch, { passive: false });

function togglePause() { if (!active) return; paused = !paused; document.getElementById('pause-screen').style.display = paused ? 'flex' : 'none'; }
function goToMenu() { location.reload(); }
function rematch() { p1 = new Sorcerer(150, 100, p1C, 1, false); p2 = new Sorcerer(canvas.width-250, 100, p2C, 2, mode === '1P'); document.getElementById('end-screen').style.display = 'none'; active = true; paused = false; }

function initMode(m) {
    mode = m; document.getElementById('m-start').style.display = 'none'; document.getElementById('m-char').style.display = 'block';
    const g = document.getElementById('char-grid'); const title = document.getElementById('sel-title');
    Object.keys(chars).forEach(c => {
        const b = document.createElement('button'); b.innerText = c;
        b.onclick = () => { if (!p1C) { p1C = c; if (mode === '1P') { p2C = Object.keys(chars)[Math.floor(Math.random()*Object.keys(chars).length)]; startGame(); } else { title.innerText = "PLAYER 2 SELECT"; title.style.color = "#ff3333"; } } else { p2C = c; startGame(); } };
        g.appendChild(b);
    });
}

function startGame() { document.getElementById('menu').style.display = 'none'; document.getElementById('pause-btn').style.display = 'block'; document.getElementById('controls').style.display = 'block'; if (mode === '2P') document.getElementById('p2-pad').style.display = 'flex'; p1 = new Sorcerer(150, 100, p1C, 1, false); p2 = new Sorcerer(canvas.width-250, 100, p2C, 2, mode === '1P'); active = true; loop(); }
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.onresize = resize; resize();

function loop() {
    if (active && !paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#111'; ctx.fillRect(0, canvas.height-50, canvas.width, 50);
        if (p1.proj.active && p2.proj.active) {
            let clash = (p1.k === 'Ryu' || p1.k === 'Yuta') && (p2.k === 'Ryu' || p2.k === 'Yuta');
            if (clash) {
                let midX = canvas.width / 2; p1.fx = Math.max(p1.fx, 2); p2.fx = Math.max(p2.fx, 2);
                ctx.save(); let g = ctx.createRadialGradient(midX, p1.y+20, 10, midX, p1.y+20, 150);
                g.addColorStop(0, '#fff'); g.addColorStop(0.5, '#f0f'); g.addColorStop(1, 'transparent');
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(midX, p1.y+20, 200, 0, 7); ctx.fill();
                ctx.lineWidth = 40; ctx.globalAlpha = 0.5; ctx.strokeStyle = '#f0f'; ctx.beginPath(); ctx.moveTo(p1.x+20, p1.y+20); ctx.lineTo(midX, p1.y+20); ctx.stroke();
                ctx.strokeStyle = '#0cf'; ctx.beginPath(); ctx.moveTo(p2.x+20, p2.y+20); ctx.lineTo(midX, p1.y+20); ctx.stroke(); ctx.restore();
                if (p1.k === 'Ryu') p1.proj.x = midX; if (p2.k === 'Ryu') p2.proj.x = midX;
            }
        }
        [p1, p2].forEach((p, i) => {
            let opp = (i === 0) ? p2 : p1;
            if(!p.cpu) {
                let inp = (i === 0) ? inputs.p1 : inputs.p2;
                let casting = ((p.k === 'Ryu' || p.k === 'Yuta') && p.fx > 0);
                if (!casting) { if (inp.l) { p.vx = -p.s.s; p.dir = -1; } else if (inp.r) { p.vx = p.s.s; p.dir = 1; } else { p.vx = 0; } if (inp.u && p.vy === 0) p.vy = -18; }
                if (inp.a || inp.s) { p.dir = (opp.x < p.x) ? -1 : 1; if (inp.a) p.atk(opp); if (inp.s) p.spec(opp); }
            }
            p.update(opp); p.draw();
        });
        document.getElementById('p1-hp').style.width = (p1.hp/3) + '%'; document.getElementById('p2-hp').style.width = (p2.hp/3) + '%';
        document.getElementById('p1-sp').style.width = ((800-p1.spT)/8) + '%'; document.getElementById('p2-sp').style.width = ((800-p2.spT)/8) + '%';
        if (p1.hp <= 0 || p2.hp <= 0) { active = false; const msg = document.getElementById('win-msg'); document.getElementById('end-screen').style.display = 'flex'; msg.innerText = p1.hp <= 0 ? "P2 WINS" : "P1 WINS"; msg.style.color = p1.hp <= 0 ? p2.s.c : p1.s.c; }
    }
    requestAnimationFrame(loop);
}
