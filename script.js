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
        this.jackpot = 0; this.frame = 0;
        this.poison = 0;
        this.inShadow = false;
    }

    draw() {
        ctx.save();
        this.frame++;
        let cx = this.x + 20, cy = this.y; 
        if (this.stun > 0) ctx.translate(Math.random() * 5 - 2.5, 0);

        // Megumi Visual: Shadow State
        if (this.inShadow) {
            ctx.globalAlpha = 0.4;
            // Yellow Arrow Marker
            let bounce = Math.sin(this.frame * 0.1) * 10;
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 130 + bounce);
            ctx.lineTo(cx - 10, cy - 150 + bounce);
            ctx.lineTo(cx + 10, cy - 150 + bounce);
            ctx.fill();
        }

        // Ground Line
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, canvas.height - 108); ctx.lineTo(canvas.width, canvas.height - 108); ctx.stroke();

        if (this.fx > 0) {
            ctx.shadowBlur = 15; ctx.shadowColor = this.s.c;
            if (this.k === 'Sukuna') {
                ctx.strokeStyle = '#f00';
                for(let i=0; i<3; i++){
                    ctx.beginPath(); let ox = Math.random()*150*this.dir;
                    ctx.moveTo(cx+ox, cy-100); ctx.lineTo(cx+ox+20, cy); ctx.stroke();
                }
            }
            if (this.k === 'Ryu' || this.k === 'Yuta') {
                ctx.fillStyle = this.s.c; ctx.globalAlpha = 0.5;
                let isClash = (p1.fx > 0 && p2.fx > 0 && (p1.k === 'Ryu' || p1.k === 'Yuta') && (p2.k === 'Ryu' || p2.k === 'Yuta'));
                let beamLen = isClash ? Math.abs(canvas.width/2 - cx) : 2000;
                ctx.fillRect(cx, cy-50, beamLen * this.dir, 30);
                if(isClash) {
                    ctx.globalAlpha = 1; ctx.fillStyle = "#fff"; ctx.shadowBlur = 30; ctx.shadowColor = "#fff";
                    ctx.beginPath(); ctx.arc(canvas.width/2, cy-35, 15 + Math.random()*20, 0, 7); ctx.fill();
                }
            }
        }

        if (this.proj.active) {
            ctx.fillStyle = this.s.c; ctx.shadowBlur = 10; ctx.shadowColor = this.s.c;
            if (this.proj.type === 'NAIL') ctx.fillRect(this.proj.x, this.proj.y - 40, 18 * this.dir, 4);
            else { ctx.beginPath(); let size = (this.proj.type==='PURPLE'||this.proj.type==='UZUMAKI')?45:15; ctx.arc(this.proj.x, this.proj.y-40, size,0,7); ctx.fill(); }
            ctx.shadowBlur = 0;
        }

        // Stickman Drawing
        ctx.strokeStyle = this.jackpot > 0 ? '#0f0' : this.s.c; 
        ctx.lineWidth = 3;
        
        // Better visibility for Megumi
        if(this.k === 'Megumi') {
            ctx.shadowBlur = 5;
            ctx.shadowColor = "#fff";
        }

        if (this.poison > 0) { ctx.strokeStyle = '#80f'; ctx.shadowBlur = 10; ctx.shadowColor = '#80f'; }

        ctx.beginPath(); ctx.arc(cx, cy - 85, 12, 0, 7); ctx.stroke(); 
        ctx.beginPath(); ctx.moveTo(cx, cy - 73); ctx.lineTo(cx, cy - 30); ctx.stroke(); 
        let armY = (this.m1T > 0 || this.fx > 0) ? cy - 45 : cy - 60;
        ctx.beginPath(); ctx.moveTo(cx, cy - 70); ctx.lineTo(cx + (this.dir * 25), armY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - 70); ctx.lineTo(cx - (this.dir * 15), cy - 50); ctx.stroke();
        let walk = (Math.abs(this.vx) > 0.1) ? Math.sin(this.frame * 0.2) * 12 : 5;
        ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx + walk, cy); ctx.stroke(); 
        ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx - walk, cy); ctx.stroke();
        ctx.restore();
    }

    spec(opp) {
        if (this.spT > 0 || this.stun > 0) return;
        switch(this.k) {
            case 'Nobara': this.proj = { active: true, x: this.x, y: this.y, vx: this.dir * 24, type: 'NAIL' }; this.spT = 450; break;
            case 'Hakari': if (Math.random() < 0.4) { this.jackpot = 600; this.spT = 225; } else { this.spT = 450; } break;
            case 'Gojo': this.proj = { active: true, x: this.x, y: this.y, vx: this.dir * 7, type: 'PURPLE' }; this.spT = 450; break;
            case 'Sukuna': this.fx = 40; this.spT = 450; break;
            case 'Itadori': this.vx = this.dir * 40; this.fx = 20; this.spT = 450; break;
            case 'Todo': let tx = this.x; this.x = opp.x; opp.x = tx; opp.stun = 30; this.spT = 250; break;
            case 'Choso': this.proj = { active: true, x: this.x, y: this.y, vx: this.dir * 30, type: 'BLOOD' }; this.spT = 450; break;
            case 'Nanami': this.vx = this.dir * 32; this.fx = 15; this.spT = 450; break;
            case 'Megumi': this.inShadow = !this.inShadow; this.spT = 300; break; // Toggles shadow on skill
            case 'Naoya': this.vx = this.dir * 55; this.fx = 35; this.spT = 450; break;
            case 'Geto': this.proj = { active: true, x: this.x, y: this.y, vx: this.dir * 5, type: 'UZUMAKI' }; this.spT = 450; break;
            case 'Ryu': case 'Yuta': this.fx = 130; this.spT = 450; break;
            case 'Toji': case 'Maki': this.vx = this.dir * 48; this.fx = 25; this.spT = 450; break;
        }
    }

    update(opp) {
        if (!active || paused) return;

        if (this.poison > 0) {
            this.poison--;
            if (this.poison % 60 === 0) this.hp -= 2;
        }

        let isBeaming = (this.fx > 0 && (this.k === 'Ryu' || this.k === 'Yuta'));
        if (this.fx > 0) {
            this.fx--; let dist = Math.abs(this.x - opp.x);
            if (this.k === 'Sukuna' && dist < 180) { opp.hp -= 2.5; opp.stun = 5; }
            if (this.k === 'Itadori' && dist < 70) { opp.hp -= 60; opp.stun = 40; this.fx = 0; }
            if (this.k === 'Naoya' && dist < 80) { opp.stun = 80; this.fx = 0; }
            if (this.k === 'Nanami' && dist < 75) { opp.hp -= 50; opp.stun = 20; this.fx = 0; }
            if ((this.k === 'Toji' || this.k === 'Maki') && dist < 85) { opp.hp -= 4; opp.stun = 10; }
            let clashing = (p1.fx > 0 && p2.fx > 0 && (p1.k === 'Ryu' || p1.k === 'Yuta') && (p2.k === 'Ryu' || p2.k === 'Yuta'));
            if (isBeaming && !clashing && dist < 2000 && Math.abs(this.y - opp.y) < 100) { opp.hp -= 2.2; opp.stun = 3; }
        }
        if (this.proj.active) {
            this.proj.x += this.proj.vx;
            if (Math.abs(this.proj.x - (opp.x + 20)) < 60 && Math.abs(this.proj.y - 40 - (opp.y - 40)) < 90) {
                if (this.proj.type === 'NAIL') { opp.hp -= 35; opp.stun = 25; }
                else if (this.proj.type === 'PURPLE') { opp.hp -= 80; opp.stun = 60; }
                else if (this.proj.type === 'BLOOD') { opp.hp -= 35; opp.stun = 15; opp.poison = 180; }
                else if (this.proj.type === 'UZUMAKI') { opp.hp -= 90; opp.stun = 70; }
                this.proj.active = false;
            }
            if (this.proj.x < -300 || this.proj.x > canvas.width + 300) this.proj.active = false;
        }
        if (isBeaming) { this.vx = 0; this.vy = 0; } 
        else if (this.stun <= 0) {
            let speed = this.inShadow ? this.s.s * 1.6 : this.s.s; 
            if (this.pNum === 1) { if (held.p1L) { this.vx = -speed; this.dir = -1; } if (held.p1R) { this.vx = speed; this.dir = 1; } }
            else if (!this.cpu) { if (held.p2L) { this.vx = -speed; this.dir = -1; } if (held.p2R) { this.vx = speed; this.dir = 1; } }
        }
        this.x += this.vx; this.y += this.vy; this.vx *= 0.82;
        let ground = canvas.height - 110;
        if (!isBeaming) { if (this.y < ground) this.vy += 0.85; else { this.y = ground; this.vy = 0; } }
        if (this.jackpot > 0) { this.jackpot--; if (this.hp < 300) this.hp += 0.6; }
        if (this.stun > 0) this.stun--; if (this.spT > 0) this.spT--; if (this.m1T > 0) this.m1T--;
        if (this.cpu) this.ai(opp);
    }

    atk(opp) {
        if (this.stun > 0 || this.m1T > 0 || (this.fx > 0 && (this.k === 'Ryu' || this.k === 'Yuta'))) return;
        this.m1T = 18; 
        
        if (Math.abs(this.x - opp.x) < 90 && Math.abs(this.y - opp.y) < 100) {
            if (this.inShadow) {
                opp.hp -= (this.s.d + 15); // Shadow damage
                opp.stun = 70; // Stays in shadow, but stuns them heavy
            } else {
                opp.hp -= this.s.d; 
                opp.stun = 12; 
            }
            opp.vx = this.dir * 6;
        }
    }

    ai(opp) {
        let dist = Math.abs(this.x - opp.x);
        if (dist > 160) this.vx = opp.x < this.x ? -this.s.s : this.s.s;
        else if (Math.random() < 0.07) this.atk(opp);
        if (Math.random() < 0.015) this.spec(opp);
    }
}
// ... Rest of the helper functions (initMode, startGame, loop, etc.) stay the same
