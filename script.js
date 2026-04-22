const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C, p2C, active = false, paused = false;

const chars = {
    'Gojo': { c: '#fff', d: 7, s: 7, r: 70 }, 'Sukuna': { c: '#f33', d: 8, s: 7, r: 80 },
    'Itadori': { c: '#fd0', d: 11, s: 8, r: 70 }, 'Maki': { c: '#4a4', d: 12, s: 10, r: 120 },
    'Megumi': { c: '#44f', d: 6, s: 7, r: 70 }, 'Yuta': { c: '#f0f', d: 8, s: 7, r: 90 },
    'Ryu': { c: '#0cf', d: 9, s: 5, r: 80 }, 'Naoya': { c: '#dfd', d: 7, s: 12, r: 60 },
    'Nobara': { c: '#f6a', d: 8, s: 6, r: 65 }, 'Toji': { c: '#777', d: 14, s: 9, r: 95 },
    'Todo': { c: '#853', d: 10, s: 8, r: 85 }, 'Geto': { c: '#442', d: 8, s: 6, r: 80 },
    'Choso': { c: '#a44', d: 7, s: 7, r: 75 }, 'Hakari': { c: '#f0a', d: 9, s: 8, r: 80 },
    'Nanami': { c: '#ee0', d: 13, s: 7, r: 85 }
};

class Sorcerer {
    constructor(x, y, k, pNum, cpu) {
        this.k = k; this.s = chars[k]; this.x = x; this.y = y;
        this.hp = 300; this.vx = 0; this.vy = 0; this.dir = pNum === 1 ? 1 : -1;
        this.cpu = cpu; this.m1T = 0; this.spT = 0; this.fx = 0; this.stun = 0;
        this.proj = { active: false, x: 0, y: 0, vx: 0 };
        this.isShadow = 0; this.jackpot = 0;
    }

    draw() {
        ctx.save();
        if (this.stun > 0) ctx.translate(Math.random()*5, 0);

        // Megumi Shadow / Hakari Jackpot Aura
        if (this.k === 'Megumi' && this.isShadow > 0) {
            ctx.fillStyle = '#000'; ctx.beginPath();
            ctx.ellipse(this.x + 20, canvas.height - 55, 45, 12, 0, 0, 7); ctx.fill();
            ctx.fillStyle = '#f00'; ctx.beginPath();
            ctx.moveTo(this.x + 10, canvas.height - 95); ctx.lineTo(this.x + 30, canvas.height - 95);
            ctx.lineTo(this.x + 20, canvas.height - 80); ctx.fill();
        } else {
            if (this.jackpot > 0) { // Hakari Visual
                ctx.shadowBlur = 20; ctx.shadowColor = '#f0a';
                ctx.strokeStyle = '#fff';
            } else { ctx.strokeStyle = this.s.c; }
            
            ctx.lineWidth = 4;
            ctx.strokeRect(this.x, this.y, 40, 90);
            ctx.beginPath(); ctx.arc(this.x+20, this.y-15, 12, 0, 7); ctx.stroke();
        }

        // Projectiles (Purple, Blood, Curses, Nails)
        if (this.proj.active) {
            ctx.save();
            ctx.shadowBlur = 15; ctx.shadowColor = this.s.c;
            if (this.k === 'Gojo') {
                ctx.shadowBlur = 40; ctx.shadowColor = '#a0f';
                let g = ctx.createRadialGradient(this.proj.x, this.proj.y, 5, this.proj.x, this.proj.y, 55);
                g.addColorStop(0, '#fff'); g.addColorStop(0.4, '#a0f'); g.addColorStop(1, 'transparent');
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.proj.x, this.proj.y, 50, 0, 7); ctx.fill();
            } else if (this.k === 'Choso') {
                ctx.fillStyle = '#800'; ctx.beginPath(); ctx.arc(this.proj.x, this.proj.y, 12, 0, 7); ctx.fill();
            } else if (this.k === 'Geto') {
                ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(this.proj.x, this.proj.y);
                ctx.lineTo(this.proj.x+30, this.proj.y-10); ctx.lineTo(this.proj.x+30, this.proj.y+10); ctx.fill();
            } else {
                ctx.fillStyle = this.s.c; ctx.fillRect(this.proj.x, this.proj.y, 25, 10);
            }
            ctx.restore();
        }

        // Beams
        if (this.fx > 0 && (this.k === 'Ryu' || this.k === 'Yuta')) {
            let isClash = (p1.fx > 0 && p2.fx > 0 && p1.k === 'Ryu' && p2.k === 'Yuta'); // Simplified clash
            let beamLen = isClash ? Math.abs(this.x - canvas.width/2) : 2000;
            ctx.strokeStyle = this.s.c; ctx.lineWidth = 55;
            ctx.beginPath(); ctx.moveTo(this.x+20, this.y+20);
            ctx.lineTo(this.x+20 + (beamLen * this.dir), this.y+20); ctx.stroke();
        }
        ctx.restore();
    }

    update(opp) {
        if (paused) return;
        this.x += this.vx; this.y += this.vy;
        
        // Physics
        if (this.isShadow > 0) { this.isShadow--; this.y = canvas.height-140; this.vx *= 0.88; }
        else {
            this.vx *= 0.75;
            if (this.y < canvas.height-140) this.vy += 0.8; else { this.y = canvas.height-140; this.vy = 0; }
        }

        // Jackpot Heal
        if (this.jackpot > 0) { this.jackpot--; if (this.hp < 300) this.hp += 0.5; }

        // Toji Erasure
        if (this.k === 'Toji' && this.fx > 0) {
            if (opp.proj.active && Math.abs(this.x - opp.proj.x) < 80) opp.proj.active = false;
            if (Math.abs(this.x - opp.x) < 70) { opp.fx = 0; opp.stun = 5; }
        }

        // Projectile Hit
        if (this.proj.active) {
            this.proj.x += this.proj.vx;
            if (opp.isShadow <= 0 && Math.abs(this.proj.x - (opp.x+20)) < 50 && Math.abs(this.proj.y - (opp.y+45)) < 80) {
                opp.hp -= (this.k === 'Gojo' ? 90 : 40); 
                opp.stun = 30; if (this.k !== 'Gojo') this.proj.active = false;
            }
            if (this.proj.x < -500 || this.proj.x > canvas.width + 500) this.proj.active = false;
        }

        if (this.fx > 0) this.fx--; if (this.stun > 0) this.stun--;
        if (this.spT > 0) this.spT--; if (this.m1T > 0) this.m1T--;
        if (this.cpu) this.ai(opp);
    }

    spec(opp) {
        if (this.spT > 0 || this.stun > 0) return;
        this.spT = 240;
        
        if (this.k === 'Todo') { // Boogie Woogie
            let tempX = this.x; this.x = opp.x; opp.x = tempX;
            opp.stun = 30;
        } else if (this.k === 'Hakari') { // Jackpot
            if (Math.random() > 0.5) { this.jackpot = 400; this.spT = 600; }
        } else if (this.k === 'Megumi') {
            this.isShadow = 180;
        } else if (this.k === 'Nanami') { // 7:3 Ratio Dash
            this.vx = this.dir * 60; this.fx = 20;
            if (Math.abs(this.x - opp.x) < 100) { opp.hp -= 70; opp.stun = 40; }
        } else if (this.k === 'Gojo' || this.k === 'Choso' || this.k === 'Geto' || this.k === 'Nobara' || this.k === 'Sukuna') {
            this.proj = { active: true, x: this.x + 20, y: this.y + 30, vx: this.dir * (this.k === 'Gojo' ? 14 : 20) };
        } else if (this.k === 'Toji' || this.k === 'Naoya' || this.k === 'Maki') {
            this.fx = 40; this.vx = this.dir * 85;
        } else if (this.k === 'Ryu' || this.k === 'Yuta') {
            this.fx = 140;
        }
    }

    atk(opp) {
        if (this.stun > 0) return;
        if (this.isShadow > 0) { // Megumi Shadow Leap
            this.isShadow = 0; this.vy = -14; 
            if (Math.abs(this.x - opp.x) < 120) { opp.hp -= 50; opp.stun = 40; }
            return;
        }
        if (this.m1T > 0) return;
        this.m1T = 20;
        let dmg = this.s.d;
        // Nanami Critical Hit chance
        if (this.k === 'Nanami' && Math.random() < 0.3) dmg *= 2; 
        
        if (Math.abs(this.x - (opp.x+20)) < this.s.r) { 
            opp.hp -= dmg; opp.stun = 12; opp.vx = this.dir * 10; 
        }
    }

    ai(opp) {
        if (this.isShadow > 0) { if (Math.abs(this.x - opp.x) > 40) this.vx = (opp.x < this.x ? -10 : 10); else this.atk(opp); return; }
        if (Math.abs(this.x - opp.x) > 150) this.vx = (opp.x < this.x ? -this.s.s : this.s.s);
        if (Math.random() < 0.05) this.atk(opp); if (Math.random() < 0.01) this.spec(opp);
    }
}

// UI & Initialization (Remaining logic identical to previous code)
function togglePause() { 
    if (!active) return;
    paused = !paused; 
    document.getElementById('pause-screen').style.display = paused ? 'flex' : 'none'; 
}

function initMode(m) {
    mode = m; document.getElementById('m-start').style.display = 'none'; document.getElementById('m-char').style.display = 'block';
    const g = document.getElementById('char-grid');
    Object.keys(chars).forEach(c => {
        const b = document.createElement('button'); b.innerText = c;
        b.onclick = () => { if (!p1C) { p1C = c; if(mode === '1P') { p2C='Sukuna'; startGame(); } } else { p2C = c; startGame(); } };
        g.appendChild(b);
    });
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
    if(mode==='2P') document.getElementById('p2-pad').style.display='block';
    p1 = new Sorcerer(100, 100, p1C, 1, false);
    p2 = new Sorcerer(canvas.width-150, 100, p2C, 2, mode === '1P');
    active = true; loop();
}

function loop() {
    if (active && !paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        p1.update(p2); p2.update(p1); p1.draw(); p2.draw();
        document.getElementById('p1-hp').style.width = (p1.hp/3)+'%';
        document.getElementById('p2-hp').style.width = (p2.hp/3)+'%';
        if (p1.hp <= 0 || p2.hp <= 0) { active = false; alert(p1.hp <= 0 ? "P2 WINS" : "P1 WINS"); location.reload(); }
    }
    requestAnimationFrame(loop);
}

window.addEventListener('touchstart', e => {
    const t = e.touches[0];
    const pb = document.getElementById('pause-btn');
    const rect = pb.getBoundingClientRect();
    if (t.clientX >= rect.left - 20 && t.clientX <= rect.right + 20 && t.clientY >= rect.top - 20 && t.clientY <= rect.bottom + 20) {
        togglePause(); e.preventDefault(); return;
    }
    if (paused) return;
    [...e.touches].forEach(touch => {
        const b = document.elementFromPoint(touch.clientX, touch.clientY);
        if (b && b.dataset.v) {
            const p = b.dataset.p === '1' ? p1 : p2;
            const opp = b.dataset.p === '1' ? p2 : p1;
            if (b.dataset.v === 'u' && p.vy === 0) p.vy = -18;
            if (b.dataset.v === 'l') p.vx = -p.s.s;
            if (b.dataset.v === 'r') p.vx = p.s.s;
            if (b.dataset.v === 'a') p.atk(opp);
            if (b.dataset.v === 's') p.spec(opp);
            e.preventDefault();
        }
    });
}, {passive: false});

canvas.width = window.innerWidth; canvas.height = window.innerHeight;
