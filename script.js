const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C = null, p2C = null, active = false, paused = false;
const held = { p1L: false, p1R: false, p2L: false, p2R: false };

const chars = {
    'Gojo': { c: '#fff', d: 7, s: 7 }, 'Sukuna': { c: '#f33', d: 8, s: 7 },
    'Itadori': { c: '#fd0', d: 11, s: 8 }, 'Maki': { c: '#4a4', d: 12, s: 10 },
    'Megumi': { c: '#777', d: 6, s: 7 },
    'Yuta': { c: '#f0f', d: 8, s: 7 },
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
        this.swarm = []; this.jackpot = 0; this.frame = 0;
        this.poison = 0; this.inShadow = false;
    }

    draw() {
        ctx.save();
        this.frame++;
        let cx = this.x + 20, cy = this.y; 
        if (this.stun > 0) ctx.translate(Math.random() * 4 - 2, 0);

        if (this.inShadow) {
            ctx.globalAlpha = 0.4;
            let bounce = Math.sin(this.frame * 0.15) * 10;
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 110 + bounce);
            ctx.lineTo(cx - 12, cy - 135 + bounce);
            ctx.lineTo(cx + 12, cy - 135 + bounce);
            ctx.fill();
        }

        // Draw Geto's Swarm
        this.swarm.forEach(p => {
            ctx.fillStyle = '#111'; ctx.strokeStyle = '#442'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, 7); ctx.fill(); ctx.stroke();
        });

        if (this.proj.active) {
            ctx.fillStyle = this.s.c; ctx.beginPath(); 
            let sz = this.proj.type === 'PURPLE' ? 40 : 15;
            ctx.arc(this.proj.x, this.proj.y-40, sz, 0, 7); ctx.fill();
        }

        ctx.strokeStyle = this.jackpot > 0 ? '#0f0' : this.s.c; ctx.lineWidth = 3;
        if (this.k === 'Megumi') { ctx.shadowBlur = 5; ctx.shadowColor = '#fff'; }
        if (this.poison > 0) ctx.strokeStyle = '#80f';

        ctx.beginPath(); ctx.arc(cx, cy - 85, 12, 0, 7); ctx.stroke(); 
        ctx.beginPath(); ctx.moveTo(cx, cy - 73); ctx.lineTo(cx, cy - 30); ctx.stroke(); 
        let armY = (this.m1T > 0) ? cy - 45 : cy - 60;
        ctx.beginPath(); ctx.moveTo(cx, cy - 70); ctx.lineTo(cx + (this.dir * 25), armY); ctx.stroke();
        let walk = (Math.abs(this.vx) > 0.2) ? Math.sin(this.frame * 0.2) * 12 : 5;
        ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx + walk, cy); ctx.stroke(); 
        ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx - walk, cy); ctx.stroke();
        ctx.restore();
    }

    update(opp) {
        if (!active || paused) return;
        if (this.poison > 0) { this.poison--; if (this.poison % 60 === 0) this.hp -= 2; }

        this.swarm = this.swarm.filter(p => {
            p.x += p.vx;
            let d = Math.sqrt((p.x - (opp.x+20))**2 + (p.y - (opp.y-40))**2);
            if (d < 40) { opp.hp -= 15; opp.stun = 15; return false; }
            return p.x > -50 && p.x < canvas.width + 50;
        });

        if (this.proj.active) {
            this.proj.x += this.proj.vx;
            if (Math.abs(this.proj.x - (opp.x+20)) < 50) {
                opp.hp -= (this.proj.type==='PURPLE'?80:30); opp.stun = 30;
                if(this.proj.type==='BLOOD') opp.poison = 180;
                this.proj.active = false;
            }
        }

        if (this.stun <= 0) {
            let spd = this.inShadow ? this.s.s * 1.6 : this.s.s;
            if (this.pNum === 1) { if (held.p1L) { this.vx = -spd; this.dir = -1; } if (held.p1R) { this.vx = spd; this.dir = 1; } }
            else if (!this.cpu) { if (held.p2L) { this.vx = -spd; this.dir = -1; } if (held.p2R) { this.vx = spd; this.dir = 1; } }
        }

        this.x += this.vx; this.y += this.vy; this.vx *= 0.85;
        // Screen Borders
        if (this.x < 0) this.x = 0; if (this.x > canvas.width - 40) this.x = canvas.width - 40;
        if (this.y < canvas.height - 110) this.vy += 0.8; else { this.y = canvas.height - 110; this.vy = 0; }
        if (this.stun > 0) this.stun--; if (this.spT > 0) this.spT--; if (this.m1T > 0) this.m1T--;
        if (this.cpu) this.ai(opp);
    }

    atk(opp) {
        if (this.stun > 0 || this.m1T > 0) return;
        this.m1T = 15;
        if (Math.abs(this.x - opp.x) < 80) {
            opp.hp -= (this.inShadow ? this.s.d + 15 : this.s.d);
            opp.stun = this.inShadow ? 60 : 12; opp.vx = this.dir * 8;
        }
    }

    spec(opp) {
        if (this.spT > 0 || this.stun > 0) return;
        if (this.k === 'Geto') {
            for(let i=0; i<3; i++) this.swarm.push({x:this.x, y:this.y-20-(i*25), vx:this.dir*15});
            this.spT = 350;
        } else if (this.k === 'Megumi') {
            this.inShadow = !this.inShadow; this.spT = 300;
        } else {
            this.proj = { active: true, x: this.x, y: this.y, vx: this.dir * 12, type: this.k === 'Gojo' ? 'PURPLE' : 'BLOOD' };
            this.spT = 400;
        }
    }

    ai(opp) {
        let d = Math.abs(this.x - opp.x);
        if (d > 120) this.vx = opp.x < this.x ? -this.s.s : this.s.s;
        else if (Math.random() < 0.05) this.atk(opp);
        if (Math.random() < 0.01) this.spec(opp);
    }
}

function initMode(m) {
    mode = m; p1C = null; p2C = null;
    document.getElementById('m-start').style.display = 'none';
    document.getElementById('m-char').style.display = 'flex';
    updateSelectionTitle();
    const g = document.getElementById('char-grid'); g.innerHTML = '';
    Object.keys(chars).forEach(c => {
        const b = document.createElement('button'); b.innerText = c;
        b.onclick = () => {
            if (!p1C) { p1C = c; if (mode === '1P') { p2C = 'Sukuna'; startGame(); } else updateSelectionTitle(); }
            else if (!p2C) { p2C = c; startGame(); }
        };
        g.appendChild(b);
    });
}

function updateSelectionTitle() {
    document.getElementById('sel-title').innerText = !p1C ? "SELECT PLAYER 1" : "SELECT PLAYER 2";
}

function startGame() {
    p1 = new Sorcerer(100, 400, p1C, 1, false);
    p2 = new Sorcerer(600, 400, p2C, 2, mode === '1P');
    document.getElementById('menu').classList.remove('active-menu');
    document.getElementById('pause-btn').style.display = 'block';
    const ctrl = document.getElementById('controls');
    ctrl.style.display = 'block';
    if (mode === '1P') { ctrl.classList.add('solo-layout'); document.getElementById('p2-pad').style.display = 'none'; }
    else { ctrl.classList.remove('solo-layout'); document.getElementById('p2-pad').style.display = 'flex'; }
    active = true; loop();
}

function resetToMenu() {
    active = false; paused = false;
    document.getElementById('menu').classList.add('active-menu');
    document.getElementById('m-start').style.display = 'flex';
    document.getElementById('m-char').style.display = 'none';
    document.getElementById('win-screen').classList.remove('active-menu');
    document.getElementById('pause-screen').classList.remove('active-menu');
    document.getElementById('pause-btn').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
}

function togglePause() {
    paused = !paused;
    document.getElementById('pause-screen').classList.toggle('active-menu', paused);
}

function loop() {
    if (!active || paused) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    p1.update(p2); p2.update(p1);
    p1.draw(); p2.draw();
    updateHUD();
    if (p1.hp <= 0 || p2.hp <= 0) {
        active = false;
        document.getElementById('win-screen').classList.add('active-menu');
        document.getElementById('win-txt').innerText = p1.hp <= 0 ? "PLAYER 2 WINS" : "PLAYER 1 WINS";
    }
    requestAnimationFrame(loop);
}

function updateHUD() {
    document.getElementById('p1-hp').style.width = (p1.hp/3) + "%";
    document.getElementById('p2-hp').style.width = (p2.hp/3) + "%";
    document.getElementById('p1-cd').style.width = (100 - (p1.spT/4)) + "%";
    document.getElementById('p2-cd').style.width = (100 - (p2.spT/4)) + "%";
    document.getElementById('p1-stun').innerText = p1.stun > 0 ? "STUNNED" : "";
    document.getElementById('p2-stun').innerText = p2.stun > 0 ? "STUNNED" : "";
}

window.onresize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
window.onresize();
