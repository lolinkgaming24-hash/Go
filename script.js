const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let mode = '1P', p1, p2, p1C = null, p2C = null, active = false, paused = false;

const held = { p1L: false, p1R: false, p2L: false, p2R: false };

// --- Character Database ---
const chars = {
    'Gojo': { c: '#fff', d: 7, s: 7 },    // Purple Orb
    'Sukuna': { c: '#f33', d: 8, s: 7 },  // Cleave Field
    'Itadori': { c: '#fd0', d: 11, s: 8 }, // Black Flash Dash
    'Maki': { c: '#4a4', d: 12, s: 10 },  // Tool Combo Dash
    'Megumi': { c: '#222', d: 6, s: 7 },   // Shadow Toad
    'Yuta': { c: '#f0f', d: 8, s: 7 },    // Love Beam
    'Ryu': { c: '#0cf', d: 9, s: 5 },     // Granite Blast
    'Naoya': { c: '#dfd', d: 7, s: 12 },  // 24FPS Freeze Dash
    'Nobara': { c: '#f6a', d: 8, s: 6 },  // Resonance (Full Screen)
    'Toji': { c: '#777', d: 14, s: 9 },   // Izo Dash
    'Todo': { c: '#853', d: 10, s: 8 },   // Boogie Woogie (Swap)
    'Geto': { c: '#442', d: 8, s: 6 },    // Uzumaki Orb
    'Choso': { c: '#a44', d: 7, s: 7 },   // Piercing Blood (Fast)
    'Hakari': { c: '#eee', d: 9, s: 8 },  // Jackpot (Regen)
    'Nanami': { c: '#ee0', d: 13, s: 7 }  // 7:3 Ratio Dash
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
        ctx.save();
        this.frame++;
        let cx = this.x + 20, cy = this.y + 30;
        if (this.stun > 0) ctx.translate(Math.random() * 5 - 2.5, 0);

        // --- Skill Visuals ---
        if (this.fx > 0) {
            ctx.shadowBlur = 15; ctx.shadowColor = this.s.c;
            if (this.k === 'Sukuna') { // Cleave Slashes
                ctx.strokeStyle = '#f00';
                for(let i=0; i<3; i++) {
                    ctx.beginPath();
                    let ox = Math.random()*150 * this.dir;
                    ctx.moveTo(cx+ox, cy-50); ctx.lineTo(cx+ox+20, cy+50); ctx.stroke();
                }
            }
            if (this.k === 'Ryu' || this.k === 'Yuta') { // Beams
                ctx.fillStyle = this.s.c; ctx.globalAlpha = 0.5;
                ctx.fillRect(cx, cy-10, 2000*this.dir, 30);
            }
            if (this.k === 'Nobara') { // Nail Flash
                ctx.fillStyle = "#fff"; ctx.globalAlpha = 0.3;
                ctx.fillRect(0,0, canvas.width, canvas.height);
            }
        }

        // --- Projectile Drawing ---
        if (this.proj.active) {
            ctx.fillStyle = this.s.c;
            ctx.shadowBlur = 20; ctx.shadowColor = this.s.c;
            ctx.beginPath();
            let size = (this.proj.type === 'PURPLE' || this.proj.type === 'UZUMAKI') ? 45 : 15;
            ctx.arc(this.proj.x, this.proj.y + 10, size, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // --- Stickman Base ---
        ctx.strokeStyle = this.jackpot > 0 ? '#0f0' : this.s.c;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy - 45, 12, 0, 7); ctx.stroke(); // Head
        ctx.beginPath(); ctx.moveTo(cx, cy - 33); ctx.lineTo(cx, cy + 10); ctx.stroke(); // Body
        let armY = (this.m1T > 0 || this.fx > 0) ? cy - 5 : cy - 20;
        ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx + (this.dir * 25), armY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx - (this.dir * 15), cy - 10); ctx.stroke();
        let walk = (Math.abs(this.vx) > 0.1) ? Math.sin(this.frame * 0.2) * 12 : 5;
        ctx.beginPath(); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx + walk, cy + 45); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx - walk, cy + 45); ctx.stroke();
        ctx.restore();
    }

    spec(opp) {
        if (this.spT > 0 || this.stun > 0) return;
        this.spT = 450; 

        switch(this.k) {
            case 'Gojo': this.proj = { active: true, x: this.x, y: this.y, vx: this.dir * 7, type: 'PURPLE' }; break;
            case 'Sukuna': this.fx = 40; break;
            case 'Itadori': this.vx = this.dir * 40; this.fx = 20; break;
            case 'Todo': 
                let tx = this.x; this.x = opp.x; opp.x = tx; 
                opp.stun = 30; this.spT = 250; break;
            case 'Choso': this.proj = { active: true, x: this.x, y: this.y + 15, vx: this.dir * 28, type: 'BLOOD' }; break;
            case 'Nanami': this.vx = this.dir * 32; this.fx = 15; break;
            case 'Megumi': this.proj = { active: true, x: this.x, y: this.y + 40, vx: this.dir * 10, type: 'SHADOW' }; break;
            case 'Nobara': opp.hp -= 45; opp.stun = 50; this.fx = 30; break;
            case 'Hakari': if (Math.random() < 0.4) this.jackpot = 600; else this.spT = 100; break;
            case 'Naoya': this.vx = this.dir * 55; this.fx = 35; break;
            case 'Geto': this.proj = { active: true, x: this.x, y: this.y, vx: this.dir * 5, type: 'UZUMAKI' }; break;
            case 'Ryu': case 'Yuta': this.fx = 130; break;
            case 'Toji': case 'Maki': this.vx = this.dir * 48; this.fx = 25; break;
        }
    }

    update(opp) {
        if (!active || paused) return;

        // --- Logic for Active FX Skills ---
        if (this.fx > 0) {
            this.fx--;
            let dist = Math.abs(this.x - opp.x);
            if (this.k === 'Sukuna' && dist < 180) { opp.hp -= 2.5; opp.stun = 5; }
            if (this.k === 'Itadori' && dist < 70) { opp.hp -= 60; opp.stun = 40; this.fx = 0; }
            if (this.k === 'Naoya' && dist < 80) { opp.stun = 80; this.fx = 0; }
            if (this.k === 'Nanami' && dist < 75) { opp.hp -= 50; opp.stun = 20; this.fx = 0; }
            if ((this.k === 'Toji' || this.k === 'Maki') && dist < 85) { opp.hp -= 4; opp.stun = 10; }
            
            let clashing = (p1.fx > 0 && p2.fx > 0 && (p1.k === 'Ryu' || p1.k === 'Yuta') && (p2.k === 'Ryu' || p2.k === 'Yuta'));
            if ((this.k === 'Ryu' || this.k === 'Yuta') && !clashing && dist < 2000 && Math.abs(this.y - opp.y) < 100) {
                opp.hp -= 2.2; opp.stun = 3;
            }
        }

        // --- Projectile Collision ---
        if (this.proj.active) {
            this.proj.x += this.proj.vx;
            if (Math.abs(this.proj.x - (opp.x + 20)) < 60 && Math.abs(this.proj.y - (opp.y + 20)) < 90) {
                if (this.proj.type === 'PURPLE') { opp.hp -= 80; opp.stun = 60; }
                if (this.proj.type === 'BLOOD') { opp.hp -= 35; opp.stun = 15; }
                if (this.proj.type === 'SHADOW') { opp.hp -= 30; opp.stun = 40; }
                if (this.proj.type === 'UZUMAKI') { opp.hp -= 90; opp.stun = 70; }
                this.proj.active = false;
            }
            if (this.proj.x < -300 || this.proj.x > canvas.width + 300) this.proj.active = false;
        }

        // --- Movement & Physics ---
        if (this.fx > 0 && (this.k === 'Ryu' || this.k === 'Yuta')) this.vx = 0; 
        else if (this.stun <= 0) {
            if (this.pNum === 1) {
                if (held.p1L) { this.vx = -this.s.s; this.dir = -1; }
                if (held.p1R) { this.vx = this.s.s; this.dir = 1; }
            } else if (!this.cpu) {
                if (held.p2L) { this.vx = -this.s.s; this.dir = -1; }
                if (held.p2R) { this.vx = this.s.s; this.dir = 1; }
            }
        }

        this.x += this.vx; this.y += this.vy;
        this.vx *= 0.82;
        let ground = canvas.height - 140;
        if (this.y < ground) this.vy += 0.85; else { this.y = ground; this.vy = 0; }

        if (this.jackpot > 0) { this.jackpot--; if (this.hp < 300) this.hp += 0.6; }
        if (this.stun > 0) this.stun--; if (this.spT > 0) this.spT--; if (this.m1T > 0) this.m1T--;
        if (this.cpu) this.ai(opp);
    }

    atk(opp) {
        if (this.stun > 0 || this.m1T > 0) return;
        this.m1T = 18;
        if (Math.abs(this.x - opp.x) < 90 && Math.abs(this.y - opp.y) < 100) { 
            opp.hp -= this.s.d; opp.stun = 12; opp.vx = this.dir * 6; 
        }
    }

    ai(opp) {
        let dist = Math.abs(this.x - opp.x);
        if (dist > 160) this.vx = opp.x < this.x ? -this.s.s : this.s.s;
        else if (Math.random() < 0.07) this.atk(opp);
        if (Math.random() < 0.015) this.spec(opp);
    }
}

// --- Menu & Global Logic ---
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
            if (!p1C) { 
                p1C = c; 
                if (mode === '1P') { p2C = 'Sukuna'; startGame(); } 
                else updateSelectionTitle(); 
            }
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
    document.getElementById('menu').classList.remove('active-menu');
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
        
        // HUD Updates
        document.getElementById('p1-hp').style.width = (p1.hp / 3) + '%';
        document.getElementById('p1-cd').style.width = ((450 - p1.spT) / 4.5) + '%';
        document.getElementById('p1-stun').innerText = p1.stun > 0 ? "FROZEN" : "";
        document.getElementById('p2-hp').style.width = (p2.hp / 3) + '%';
        document.getElementById('p2-cd').style.width = ((450 - p2.spT) / 4.5) + '%';
        document.getElementById('p2-stun').innerText = p2.stun > 0 ? "FROZEN" : "";

        if (p1.hp <= 0 || p2.hp <= 0) { 
            active = false; 
            showWinScreen(p1.hp <= 0 ? "PLAYER 2" : "PLAYER 1"); 
        }
    }
    requestAnimationFrame(loop);
}

function showWinScreen(w) {
    const screen = document.getElementById('win-screen');
    document.getElementById('win-text').innerText = w + " WINS";
    document.getElementById('win-text').style.color = w === "PLAYER 1" ? "#0af" : "#f33";
    screen.classList.add('active-menu');
}

function togglePause() {
    if(!active) return;
    paused = !paused;
    const screen = document.getElementById('pause-screen');
    if (paused) screen.classList.add('active-menu');
    else screen.classList.remove('active-menu');
}

// --- Input Handling ---
window.addEventListener('touchstart', e => {
    [...e.touches].forEach(touch => {
        const b = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!b || !b.dataset.v) return;
        const pNum = b.dataset.p, p = (pNum === '1') ? p1 : p2, opp = (pNum === '1') ? p2 : p1;
        if (b.dataset.v === 'l') held['p'+pNum+'L'] = true;
        if (b.dataset.v === 'r') held['p'+pNum+'R'] = true;
        if (b.dataset.v === 'u' && p.vy === 0) p.vy = -19;
        if (b.dataset.v === 'a') p.atk(opp);
        if (b.dataset.v === 's') p.spec(opp);
    });
}, {passive: false});

window.addEventListener('touchend', e => {
    // Basic reset
    held.p1L = held.p1R = held.p2L = held.p2R = false;
    // Re-check remaining touches to allow multi-finger movement
    [...e.touches].forEach(touch => {
        const b = document.elementFromPoint(touch.clientX, touch.clientY);
        if (b && b.dataset.v === 'l') held['p'+b.dataset.p+'L'] = true;
        if (b && b.dataset.v === 'r') held['p'+b.dataset.p+'R'] = true;
    });
});

window.onresize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
window.onload = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
