* {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    box-sizing: border-box;
}

body { 
    margin: 0; background: #000; color: #fff; font-family: sans-serif; 
    overflow: hidden; touch-action: none; 
}

canvas { display: block; width: 100vw; height: 100vh; background: #0a0a0a; position: fixed; top:0; left:0; z-index: 1; }

/* HUD Styles */
.hud { position: absolute; top: 15px; width: 38%; pointer-events: none; z-index: 10; }
#p1-hud { left: 10px; } #p2-hud { right: 10px; }
.bar { width: 100%; height: 12px; background: #222; border: 1px solid #444; border-radius: 6px; overflow: hidden; }
.hp-f { width: 100%; height: 100%; background: #0f0; transition: width 0.2s; }
.bar-cd { width: 100%; height: 6px; background: #111; border: 1px solid #333; border-radius: 3px; margin-top: 4px; overflow: hidden; }
.cd-f { width: 0%; height: 100%; background: #0af; }
.stun-txt { color: #f00; font-size: 10px; font-weight: bold; margin-top: 2px; height: 12px; text-transform: uppercase; }

#pause-btn { 
    position: fixed; top: 15px; left: 50%; transform: translateX(-50%); 
    width: 50px; height: 50px; background: #1a1a1a; color: #fff; 
    border: 2px solid #fff; border-radius: 50%; z-index: 1000; 
    display: none; font-weight: bold; cursor: pointer; touch-action: manipulation;
}

/* Menu & Selection */
.overlay { 
    position: fixed; inset: 0; background: rgba(0,0,0,0.95); 
    display: none; flex-direction: column; align-items: center; justify-content: center; 
    z-index: 2000; pointer-events: none; 
}
.active-menu { display: flex !important; pointer-events: auto !important; }
.title { font-size: 2.5rem; text-shadow: 0 0 10px #f00; margin-bottom: 20px; text-align: center; }
.menu-btn { padding: 15px 30px; background: #222; color: #fff; border: 2px solid #fff; margin: 10px; font-weight: bold; touch-action: manipulation; }
.grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; width: 95%; max-width: 600px; }
.grid button { padding: 12px 2px; font-size: 10px; background: #111; color: #fff; border: 1px solid #555; text-transform: uppercase; touch-action: manipulation; }

/* CONTROL ENGINE */
.ctrl-container { position: fixed; inset: 0; pointer-events: none; z-index: 100; display: none; }

/* Base Layout for Player Pads */
.corner-pad { 
    position: absolute; 
    bottom: 35px; /* Lifted slightly for better thumb ergonomics */
    display: flex; 
    flex-direction: column; 
    gap: 15px; 
}
.left { left: 20px; } 
.right { right: 20px; }

/* Default Split Row (Movement left, Attack right) */
.split-row { display: flex; gap: 20px; align-items: flex-end; }
.btn-col { display: flex; flex-direction: column; gap: 15px; }

/* DYNAMIC SOLO LAYOUT (1P vs CPU) */
/* This spreads the controls to opposite sides of the screen */
.solo-layout #p1-pad { 
    width: calc(100vw - 40px); 
}
.solo-layout .split-row { 
    justify-content: space-between; 
    width: 100%; 
}

/* Button Styling */
.btn { 
    width: 75px; 
    height: 75px; 
    background: rgba(255,255,255,0.08); 
    border: 2px solid rgba(255,255,255,0.8); 
    border-radius: 18px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    pointer-events: auto !important; 
    font-weight: bold; 
    color: white; 
    touch-action: none;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    font-size: 14px;
}

/* Special Case for Jump */
.btn-jump { 
    width: 170px; 
    height: 45px; 
    background: rgba(255,255,255,0.15);
    border-radius: 10px;
    margin-bottom: 5px;
}

/* Feedback when pressing */
.btn:active {
    background: rgba(255,255,255,0.3);
    transform: scale(0.95);
}

.btn-group { display: flex; gap: 15px; }
