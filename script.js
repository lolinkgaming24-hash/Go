const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C = null, p2C = null, active = false, paused = false;
const held = { p1L: false, p1R: false, p2L: false, p2R: false };

const chars = {
    'Gojo': { c: '#fff', d: 7, s: 7 }, 'Sukuna': { c: '#f33', d: 8, s: 7 },
    'Itadori': { c: '#fd0', d: 11, s: 8 }, 'Maki': { c: '#4a4', d: 12, s: 10 },
    'Megumi': { c: '#777', d: 6, s: 7 }, // Brightened Megumi
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
        this.swarm = []; // Specialized for Geto's new skill
        this.jackpot = 0; this.frame = 0;
        this.poison = 0; this.inShadow = false;
    }

    draw() {
        ctx.save();
        this.frame++;
        let cx = this.x + 20, cy = this.y; 
        if (this.stun > 0) ctx.translate(Math.random() * 5 - 2.5, 0);

        // Megumi Visual: Shadow State + Yellow Arrow Marker
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

        // Floor Line
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, canvas.height - 108); ctx.lineTo(canvas.width, canvas.height - 108); ctx.stroke();

        // Drawing Geto's Swarm
        this.swarm.forEach(p => {
            ctx.fillStyle = '#111'; ctx.strokeStyle = '#442'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, 7); ctx.fill(); ctx.stroke();
        });

        // Proj (Single ones)
        if (this.proj.active) {
            ctx.fillStyle = this.s.c; ctx.shadowBlur = 10; ctx.shadowColor = this.s.c;
            ctx.beginPath(); let size = (this.proj.type==='PURPLE')?45:15; ctx.arc(this.proj.x, this.proj.y-40, size,0,7); ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Stickman
        ctx.strokeStyle = this.jackpot > 0 ? '#0f0' : this.s.c; 
        ctx.lineWidth = 3;

        // Visual Aid for Megumi (White outline so he doesn't blend in)
        if (this.k === 'Megumi') { ctx.shadowBlur = 4; ctx.shadowColor = '#fff'; }
        if (this.poison > 0) { ctx.strokeStyle = '#80f'; ctx.shadowBlur = 10; ctx.shadowColor = '#80f'; }

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
        switch(this.k) {
            case 'Geto': // Curse Swarm: Fires 3 fast projectiles
                for(let i=0; i<3; i++) {
                    this.swarm.push({ x: this.x, y: this.y - 20 - (i*30), vx: this.dir * 18 });
                }
                this.spT = 400; break;
            case 'Megumi': this.inShadow = !this.inShadow; this.spT = 300; break;
            case 'Choso': this.proj = { active: true, x: this.x, y: this.y, vx: this.dir * 30, type: 'BLOOD' }; this.spT = 450; break;
            case 'Nobara': this.proj = { active: true, x: this.x, y: this.y, vx: this.dir * 24, type: 'NAIL' }; this.spT = 450; break;
            case 'Gojo': this.proj = { active: true, x: this.x, y: this.y, vx: this.dir * 7, type: 'PURPLE' }; this.spT = 500; break;
            case 'Sukuna': this.fx = 40; this.spT = 450; break;
            case 'Todo': let tx = this.x; this.x = opp.x; opp.x = tx; opp.stun = 30; this.spT = 250; break;
            default: this.vx = this.dir * 45; this.fx = 25; this.spT = 450; break;
        }
    }

    update(opp) {
        if (!active || paused) return;

        // Choso Poisoning
        if (this.poison > 0) {
            this.poison--;
            if (this.poison % 60 === 0) this.hp -= 2;
        }

        // Geto Swarm Logic
        this.swarm = this.swarm.filter(p => {
            p.x += p.vx;
            let dist = Math.sqrt((p.x - (opp.x+20))**2 + (p.y - (opp.y-40))**2);
            if (dist < 40) {
                opp.hp -= 15; opp.stun = 15; opp.vx = this.dir * 4;
                return false;
            }
            return p.x > -100 && p.x < canvas.width + 100;
        });

        // Projection Logic
        if (this.proj.active) {
            this.proj.x += this.proj.vx;
            if (Math.abs(this.proj.x - (opp.x + 20)) < 60 && Math.abs(this.proj.y - 40 - (opp.y - 40)) < 90) {
                if (this.proj.type === 'BLOOD') { opp.hp -= 30; opp.stun = 15; opp.poison = 180; }
                else if (this.proj.type === 'PURPLE') { opp.hp -= 85; opp.stun = 60; }
                else if (this.proj.type === 'NAIL') { opp.hp -= 35; opp.stun = 25; }
                this.proj.active = false;
            }
            if (this.proj.x < -300 || this.proj.x > canvas.width + 300) this.proj.active = false;
        }

        // Movement
        if (this.stun <= 0) {
            let speed = this.inShadow ? this.s.s * 1.65 : this.s.s;
            if (this.pNum === 1) { if (held.p1L) { this.vx = -speed; this.dir = -1; } if (held.p1R) { this.vx = speed; this.dir = 1; } }
            else if (!this.cpu) { if (held.p2L) { this.vx = -speed; this.dir = -1; } if (held.p2R) { this.vx = speed; this.dir = 1; } }
        }

        this.x += this.vx; this.y += this.vy; this.vx *= 0.82;

        // --- WALLS (SCREEN LIMIT) ---
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width - 40) this.x = canvas.width - 40;

        let ground = canvas.height - 110;
        if (this.y < ground) this.vy += 0.85; else { this.y = ground; this.vy = 0; }
        
        if (this.stun > 0) this.stun--; if (this.spT > 0) this.spT--; if (this.m1T > 0) this.m1T--;
        if (this.jackpot > 0) { this.jackpot--; if (this.hp < 300) this.hp += 0.6; }
        if (this.cpu) this.ai(opp);
    }

    atk(opp) {
        if (this.stun > 0 || this.m1T > 0) return;
        this.m1T = 18; 
        if (Math.abs(this.x - opp.x) < 95 && Math.abs(this.y - opp.y) < 100) {
            if (this.inShadow) {
                opp.hp -= (this.s.d + 15); opp.stun = 70;
            } else {
                opp.hp -= this.s.d; opp.stun = 12;
            }
            opp.vx = this.dir * 7;
        }
    }

    ai(opp) {
        let dist = Math.abs(this.x - opp.x);
        if (dist > 150) this.vx = opp.x < this.x ? -this.s.s : this.s.s;
        else if (Math.random() < 0.08) this.atk(opp);
        if (Math.random() < 0.02) this.spec(opp);
    }
}

// --- INITIALIZATION AND LOOP ---
function initMode(m) {
    mode = m; p1C = null; p2C = null;
    document.getElementById('m-start').style.display = 'none';
    document.getElementById('m-char').style.display = 'flex';
    const g = document.getElementById('char-grid'); g.innerHTML = '';
    Object.keys(chars).forEach(c => {
        const b = document.createElement('button'); b.innerText = c;
        b.onclick = () => {
            if (!p1C) { p1C = c; if (mode === '1P') { p2C = 'Sukuna'; startGame(); } }
            else if (!p2C) { p2C = c; startGame(); }
        };
        g.appendChild(b);
    });
}

function startGame() {
    p1 = new Sorcerer(100, 400, p1C, 1, false);
    p2 = new Sorcerer(600, 400, p2C, 2, mode === '1P');
    document.getElementById('menu').classList.remove('active-menu');
    document.getElementById('controls').style.display = 'block';
    document.getElementById('pause-btn').style.display = 'block';
    active = true; loop();
}

function loop() {
    if (!active || paused) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    p1.update(p2); p2.update(p1);
    p1.draw(); p2.draw();
    requestAnimationFrame(loop);
}

window.onresize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
window.onresize();
