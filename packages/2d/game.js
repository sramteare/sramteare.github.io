// Void Drifter - Core Game Module

// --- Game Configurations & Constants ---
const WORLD_SIZE = 4000; // Arena is 4000x4000 px (-2000 to +2000)
const HALF_WORLD = WORLD_SIZE / 2;

// --- Key Management ---
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
    e: false, ' ': false, Shift: false, g: false
};

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (e.key === 'Escape' || e.key === 'Esc') {
        if (typeof game !== 'undefined' && game.isDocked) {
            game.closeShopUI();
            e.preventDefault();
        }
    }
    if (key === 'shift') keys.Shift = true;
    if (key === 'e') keys.e = true;
    if (key === 'g') keys.g = true;
    if (key === ' ') {
        keys[' '] = true;
        e.preventDefault(); // Prevent browser scrolling
    }
    if (e.key in keys) keys[e.key] = true;
    if (key in keys) keys[key] = true;
    
    // Resume audio if it was suspended
    if (typeof sounds !== 'undefined') sounds.resume();
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'shift') keys.Shift = false;
    if (key === 'e') keys.e = false;
    if (key === 'g') keys.g = false;
    if (key === ' ') keys[' '] = false;
    if (e.key in keys) keys[e.key] = false;
    if (key in keys) keys[key] = false;
});

window.addEventListener('blur', () => {
    for (let key in keys) {
        keys[key] = false;
    }
    if (typeof game !== 'undefined' && game) {
        game.joyActive = false;
        game.joyX = 0;
        game.joyY = 0;
        const knob = document.getElementById('joystick-knob');
        if (knob) knob.style.transform = 'translate(0px, 0px)';
    }
});

// --- Mouse Management ---
const mouse = {
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
    isDown: false
};

// --- Particles Class ---
class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.color = '';
        this.size = 0;
        this.maxLife = 0;
        this.life = 0;
        this.friction = 0.98;
    }

    reset(x, y, vx, vy, color, size, life, friction = 0.98) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.maxLife = life;
        this.life = life;
        this.friction = friction;
    }

    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;
        
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// --- Bullet Class ---
class Bullet {
    constructor(x, y, angle, speed, damage, isPlayer = true, color = '#00f2ff') {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 3.5;
        this.damage = damage;
        this.isPlayer = isPlayer; // false if fired by enemy, 'station' if station
        this.color = color;
        this.life = 120; // 2 seconds at 60 FPS
        this.angle = angle;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;

        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(drawX - Math.cos(this.angle) * 8, drawY - Math.sin(this.angle) * 8);
        ctx.lineTo(drawX, drawY);
        ctx.stroke();
        ctx.restore();
    }
}

// --- Scrap Crystal Class ---
class ScrapCrystal {
    constructor(x, y, value = 1) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = 5;
        this.value = value;
        this.color = '#ff9f00';
        this.angle = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.05;
    }

    update(player, magnetRange) {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.992; // Very low friction so scrap floats slowly through space
        this.vy *= 0.992;
        this.angle += this.rotSpeed;

        // Magnetic attraction to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;
        const magnetRangeSq = magnetRange * magnetRange;
        
        if (distSq < magnetRangeSq) {
            const dist = Math.sqrt(distSq);
            const force = (magnetRange - dist) / magnetRange * 0.45;
            this.vx += (dx / dist) * force;
            this.vy += (dy / dist) * force;
            // Cap magnet velocity
            const magVSq = this.vx * this.vx + this.vy * this.vy;
            if (magVSq > 100) {
                const magV = Math.sqrt(magVSq);
                this.vx = (this.vx / magV) * 10;
                this.vy = (this.vy / magV) * 10;
            }
        }
    }

    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(this.angle);
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        // Draw crystalline diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.7, 0);
        ctx.lineTo(0, this.radius);
        ctx.lineTo(-this.radius * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

// --- Player Ship Class ---
class PlayerShip {
    constructor() {
        this.x = 0;
        this.y = 350; // Spawn slightly below the central station
        this.vx = 0;
        this.vy = 0;
        this.radius = 16;
        this.angle = -Math.PI / 2; // Facing up
        this.scrap = 0; // Fix scrap counter starting at undefined (NaN bug)
        this.isDestroyed = false; // Flag for death animation
        
        // Base Stats (Modified by Upgrades)
        this.maxShield = 150;
        this.shield = 150;
        this.maxHull = 150;
        this.hull = 150;
        
        this.thrustPower = 0.12;
        this.maxSpeed = 6;
        this.rotationSpeed = 0.033; // Tuned down from 0.05 for smoother aiming
        this.shieldRechargeRate = 0.06; // Boosted recharge
        this.shieldRechargeDelay = 120; // 2 seconds
        this.shieldTimer = 0;

        // Weapons
        this.fireCooldown = 0;
        this.weaponLevel = 1;
        this.weaponDamage = 18; // Boosted from 12
        this.weaponCooldownMax = 12; // Lower is faster

        // Dash Ability
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.dashSpeed = 22;

        this.levelSpeed = 1;
        this.levelShield = 1;
        this.levelMagnet = 1;
        this.magnetRange = 120;
    }

    update() {
        const nowThrusting = keys.w || keys.ArrowUp;
        
        // Weapon recharge and shield timers
        if (this.fireCooldown > 0) this.fireCooldown--;
        if (this.dashCooldown > 0) this.dashCooldown--;
        
        if (this.shieldTimer > 0) {
            this.shieldTimer--;
        } else if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRechargeRate);
        }

        // Warp Dash State Check
        if (this.dashDuration > 0) {
            this.dashDuration--;
            // Keep speed constant during dash
            this.x += this.vx;
            this.y += this.vy;
            
            // Spawn dash phantom particles
            if (Math.random() < 0.6) {
                game.spawnParticle(
                    this.x + (Math.random() - 0.5) * 10,
                    this.y + (Math.random() - 0.5) * 10,
                    -this.vx * 0.2, -this.vy * 0.2,
                    '#00f2ff', 12, 15
                );
            }

            // World clamping during dash
            this.clampToBounds();
            return;
        }

        // Handle Ship Rotation
        if (keys.a || keys.ArrowLeft) {
            this.angle -= this.rotationSpeed;
        }
        if (keys.d || keys.ArrowRight) {
            this.angle += this.rotationSpeed;
        }

        // Warp Dash Trigger
        if (keys.Shift && this.dashCooldown === 0) {
            this.dashDuration = 12; // 12 frames of dash
            this.dashCooldown = 120; // 2 seconds cooldown
            
            // Calculate velocity vector based on current keypresses
            let dx = 0;
            let dy = 0;
            if (keys.w || keys.ArrowUp) { dx += Math.cos(this.angle); dy += Math.sin(this.angle); }
            if (keys.s || keys.ArrowDown) { dx -= Math.cos(this.angle); dy -= Math.sin(this.angle); }
            if (keys.a || keys.ArrowLeft) { dx -= Math.sin(this.angle); dy += Math.cos(this.angle); }
            if (keys.d || keys.ArrowRight) { dx += Math.sin(this.angle); dy -= Math.cos(this.angle); }

            // If no keys pressed, dash in facing direction
            if (dx === 0 && dy === 0) {
                dx = Math.cos(this.angle);
                dy = Math.sin(this.angle);
            }

            // Normalize
            const mag = Math.sqrt(dx * dx + dy * dy);
            this.vx = (dx / mag) * this.dashSpeed;
            this.vy = (dy / mag) * this.dashSpeed;
            
            if (typeof sounds !== 'undefined') sounds.warpDash();
            game.triggerScreenShake(8);
            
            // Warp flash blast
            for (let i = 0; i < 20; i++) {
                const pAngle = Math.random() * Math.PI * 2;
                const pSpeed = Math.random() * 6 + 2;
                game.spawnParticle(
                    this.x, this.y,
                    Math.cos(pAngle) * pSpeed, Math.sin(pAngle) * pSpeed,
                    '#00f2ff', Math.random() * 4 + 2, 25
                );
            }
            
            this.x += this.vx;
            this.y += this.vy;
            this.clampToBounds();
            return;
        }

        // Ship Movement (Newtonian Acceleration)
        if (nowThrusting) {
            this.vx += Math.cos(this.angle) * this.thrustPower;
            this.vy += Math.sin(this.angle) * this.thrustPower;
            
            // Spawn engine flames
            if (Math.random() < 0.7) {
                const exhaustAngle = this.angle + Math.PI + (Math.random() - 0.5) * 0.4;
                const exhaustSpeed = Math.random() * 3 + 2;
                const exhaustX = this.x - Math.cos(this.angle) * 15;
                const exhaustY = this.y - Math.sin(this.angle) * 15;
                game.spawnParticle(
                    exhaustX, exhaustY,
                    this.vx * 0.5 + Math.cos(exhaustAngle) * exhaustSpeed,
                    this.vy * 0.5 + Math.sin(exhaustAngle) * exhaustSpeed,
                    Math.random() < 0.3 ? '#ff8400' : '#00f2ff',
                    Math.random() * 3 + 1.5,
                    Math.random() * 15 + 10
                );
            }
        } else if (keys.s || keys.ArrowDown) {
            // Decelerate / Reverse thrust
            this.vx *= 0.93;
            this.vy *= 0.93;
        }

        // Apply friction drag
        this.vx *= 0.975;
        this.vy *= 0.975;

        // Cap speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        // Update Position
        this.x += this.vx;
        this.y += this.vy;

        this.clampToBounds();

        // Engine hum pitch/vol update
        if (typeof sounds !== 'undefined') {
            sounds.setEngineThrust(nowThrusting, speed / this.maxSpeed);
        }
    }

    clampToBounds() {
        if (this.x < -HALF_WORLD) { this.x = -HALF_WORLD; this.vx = 0; }
        if (this.x > HALF_WORLD) { this.x = HALF_WORLD; this.vx = 0; }
        if (this.y < -HALF_WORLD) { this.y = -HALF_WORLD; this.vy = 0; }
        if (this.y > HALF_WORLD) { this.y = HALF_WORLD; this.vy = 0; }
    }

    damage(amount) {
        if (this.dashDuration > 0) return; // Invulnerable in dash
        
        this.shieldTimer = this.shieldRechargeDelay;
        
        if (this.shield > 0) {
            this.shield -= amount;
            if (typeof sounds !== 'undefined') sounds.shieldHit();
            
            // Shield hit ripple particles
            for (let i = 0; i < 6; i++) {
                const angle = Math.random() * Math.PI * 2;
                game.spawnParticle(
                    this.x + Math.cos(angle) * this.radius,
                    this.y + Math.sin(angle) * this.radius,
                    this.vx + Math.cos(angle) * 2,
                    this.vy + Math.sin(angle) * 2,
                    '#00f2ff', 2.5, 12
                );
            }

            if (this.shield < 0) {
                this.hull += this.shield; // Overflow to armor
                this.shield = 0;
            }
        } else {
            this.hull -= amount;
            if (typeof sounds !== 'undefined') sounds.explosion('small');
            game.triggerScreenShake(5);
            
            // Spark armor particles
            for (let i = 0; i < 6; i++) {
                const angle = Math.random() * Math.PI * 2;
                game.spawnParticle(
                    this.x, this.y,
                    (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6,
                    '#ff3b3b', 2, 20
                );
            }
        }

        if (this.hull <= 0 && !this.isDestroyed) {
            this.hull = 0;
            this.isDestroyed = true;
            game.triggerPlayerExplosion();
        }
    }

    draw(ctx, camera) {
        if (this.isDestroyed) return;
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(this.angle);

        // Retain glowing canvas shadows
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00f2ff';

        // Draw Player Ship (Vanguard-7 layout)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = '#060f24';

        ctx.beginPath();
        // Nose
        ctx.moveTo(18, 0);
        // Right wingtip
        ctx.lineTo(-12, 14);
        // Back tail fins
        ctx.lineTo(-8, 5);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-8, -5);
        // Left wingtip
        ctx.lineTo(-12, -14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw glowing reactor thrusters
        ctx.fillStyle = '#ff6c00';
        ctx.beginPath();
        ctx.arc(-11, -3, 2.5, 0, Math.PI * 2);
        ctx.arc(-11, 3, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw active energy shields around ship if active
        if (this.shield > 0) {
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f2ff';
            ctx.strokeStyle = `rgba(0, 242, 255, ${0.1 + (this.shield / this.maxShield) * 0.4})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.radius + 6, 0, Math.PI * 2);
            ctx.stroke();
            
            // Faint glassy radial fill inside the circle to make it look solid and three-dimensional
            const shieldGrad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, this.radius + 6);
            shieldGrad.addColorStop(0, 'rgba(0, 242, 255, 0)');
            shieldGrad.addColorStop(0.75, `rgba(0, 242, 255, ${(this.shield / this.maxShield) * 0.04})`);
            shieldGrad.addColorStop(1, `rgba(0, 242, 255, ${(this.shield / this.maxShield) * 0.15})`);
            ctx.fillStyle = shieldGrad;
            ctx.fill();
            
            ctx.restore();
        }
    }
}

// --- Orbital Space Station Class ---
class SpaceStation {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.radius = 80;
        this.dockRadius = 180;
        this.isDestroyed = false; // Flag for death animation
        
        // Base Stats
        this.maxShield = 0;
        this.shield = 0;
        this.maxHull = 800; // Boosted from 500
        this.hull = 800;
        this.levelStationShield = 0; // Starts at 0 (unshielded)
        
        this.shieldRecharge = 0;
        this.shieldRechargeDelay = 180; // 3 seconds
        this.shieldTimer = 0;

        // Auto Defense Turrets
        this.turretLevel = 0; // Starts at 0 (defenseless)
        this.turretCooldown = 0;
        this.turretsCount = 0; // Starts with no turrets
        this.turretRange = 400;
        this.turretDamage = 16; // Boosted from 10
        this.turretCooldownMax = 45; // Fires every 0.75 seconds (Faster fire rate)

        this.angle = 0; // Rotate slowly for visual style
    }

    update(enemies) {
        this.angle += 0.0015; // Slow rotation

        // Shield Recharge
        if (this.shieldTimer > 0) {
            this.shieldTimer--;
        } else if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRecharge);
        }

        // Automated Defense Turrets firing sequence
        if (this.turretCooldown > 0) {
            this.turretCooldown--;
        } else if (enemies.length > 0) {
            // Find target closest to station
            let target = null;
            let minDistSq = this.turretRange * this.turretRange;
            
            for (let enemy of enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    target = enemy;
                }
            }

            if (target) {
                // Fire turrets based on turret counts
                for (let i = 0; i < this.turretsCount; i++) {
                    // Distribute turrets along the station's edge
                    const tAngle = this.angle + (i * (Math.PI * 2 / this.turretsCount));
                    const tx = this.x + Math.cos(tAngle) * (this.radius - 10);
                    const ty = this.y + Math.sin(tAngle) * (this.radius - 10);
                    
                    const angleToTarget = Math.atan2(target.y - ty, target.x - tx);
                    
                    // Add slight variance to firing angle
                    const finalAngle = angleToTarget + (Math.random() - 0.5) * 0.05;
                    game.bullets.push(new Bullet(tx, ty, finalAngle, 10, this.turretDamage, 'station', '#00f2ff'));
                }
                
                this.turretCooldown = this.turretCooldownMax;
                if (typeof sounds !== 'undefined') sounds.laser('station');
            }
        }
    }

    damage(amount) {
        this.shieldTimer = this.shieldRechargeDelay;
        if (this.shield > 0) {
            this.shield -= amount;
            if (typeof sounds !== 'undefined') sounds.shieldHit();
            
            // Shield spark particles
            for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                game.spawnParticle(
                    this.x + Math.cos(angle) * this.radius,
                    this.y + Math.sin(angle) * this.radius,
                    Math.cos(angle) * 3, Math.sin(angle) * 3,
                    '#00f2ff', 3, 15
                );
            }

            if (this.shield < 0) {
                this.hull += this.shield;
                this.shield = 0;
            }
        } else {
            this.hull -= amount;
            if (typeof sounds !== 'undefined') sounds.explosion('medium');
            game.triggerScreenShake(8);
            
            // Metal debris sparks
            for (let i = 0; i < 10; i++) {
                game.spawnParticle(
                    this.x + (Math.random() - 0.5) * 50,
                    this.y + (Math.random() - 0.5) * 50,
                    (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8,
                    '#ff8800', Math.random() * 3 + 2, 35
                );
            }
        }

        if (this.hull <= 0 && !this.isDestroyed) {
            this.hull = 0;
            this.isDestroyed = true;
            game.triggerStationExplosion();
        }
    }

    draw(ctx, camera) {
        if (this.isDestroyed) return;
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;

        // Draw Docking Zone ring (light dashed overlay)
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.arc(drawX, drawY, this.dockRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(this.angle);

        // Core Reactor Glow
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00f2ff';
        ctx.fillStyle = '#0a1a3a';
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 3.5;
        
        // Main core ring
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Concentric Outer Panels
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(this.radius - 20, -10);
            ctx.lineTo(this.radius + 15, -25);
            ctx.lineTo(this.radius + 15, 25);
            ctx.lineTo(this.radius - 20, 10);
            ctx.closePath();
            ctx.fillStyle = '#030815';
            ctx.fill();
            ctx.stroke();
            
            // Solar solar grid highlights
            ctx.strokeStyle = 'rgba(0, 242, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(this.radius - 5, -12);
            ctx.lineTo(this.radius + 10, -20);
            ctx.moveTo(this.radius - 5, 12);
            ctx.lineTo(this.radius + 10, 20);
            ctx.stroke();
            ctx.strokeStyle = '#fff';
        }

        // Center Reactor Core (super glow)
        ctx.shadowBlur = 35;
        ctx.shadowColor = '#00f2ff';
        ctx.fillStyle = '#e0faff';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw Turrets on the Station perimeter (stable relative to station rotation)
        if (this.turretsCount > 0) {
            ctx.save();
            ctx.translate(drawX, drawY);
            ctx.fillStyle = '#404050';
            ctx.strokeStyle = '#00f2ff';
            ctx.lineWidth = 1.5;
            
            for (let i = 0; i < this.turretsCount; i++) {
                // Distribute turrets evenly around station perimeter
                const tAngle = (i * (Math.PI * 2 / this.turretsCount));
                ctx.save();
                ctx.rotate(tAngle);
                
                // Gun mount pod
                ctx.beginPath();
                ctx.arc(this.radius - 15, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Gun barrels (pointing outwards)
                ctx.fillStyle = '#101015';
                ctx.beginPath();
                ctx.rect(this.radius - 15, -3, 20, 6);
                ctx.fill();
                ctx.stroke();
                
                ctx.restore();
            }
            ctx.restore();
        }

        // Station Energy Shield Ring
        if (this.shield > 0) {
            ctx.save();
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#00f2ff';
            ctx.strokeStyle = `rgba(0, 242, 255, ${0.08 + (this.shield / this.maxShield) * 0.3})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.radius + 25, 0, Math.PI * 2);
            ctx.stroke();
            
            // Faint glassy radial fill inside the station shield ring
            const shieldGrad = ctx.createRadialGradient(drawX, drawY, this.radius - 10, drawX, drawY, this.radius + 25);
            shieldGrad.addColorStop(0, 'rgba(0, 242, 255, 0)');
            shieldGrad.addColorStop(0.7, `rgba(0, 242, 255, ${(this.shield / this.maxShield) * 0.02})`);
            shieldGrad.addColorStop(1, `rgba(0, 242, 255, ${(this.shield / this.maxShield) * 0.1})`);
            ctx.fillStyle = shieldGrad;
            ctx.fill();
            
            ctx.restore();
        }
    }
}

// --- Enemy Classes ---
class Enemy {
    constructor(x, y, type = 'swarmer', wave = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = 0;
        this.vy = 0;
        
        // Difficulty scaling multipliers based on wave
        // Wave 1 is easy: enemies have ~70% base stats.
        // Wave 2 is baseline (100% stats).
        // Wave 3+ scales up by 8% HP, 5% speed, 6% damage per wave.
        const diffMultiplier = wave === 1 ? 0.7 : 1 + (wave - 2) * 0.08;
        const speedMultiplier = wave === 1 ? 0.85 : 1 + (wave - 2) * 0.05;
        const damageMultiplier = wave === 1 ? 0.75 : 1 + (wave - 2) * 0.06;
        
        // Distribute enemy statistics based on type
        if (type === 'swarmer') {
            this.radius = 12;
            this.maxHp = Math.round(14 * diffMultiplier);
            this.speed = 3.2 * speedMultiplier;
            this.color = '#ff3355';
            this.points = 150;
            this.collisionDmg = Math.round(12 * damageMultiplier);
            this.scrapDrops = 1;
        } else if (type === 'bomber') {
            this.radius = 18;
            this.maxHp = Math.round(45 * diffMultiplier);
            this.speed = 1.6 * speedMultiplier;
            this.color = '#00ff66';
            this.points = 400;
            this.collisionDmg = Math.round(20 * damageMultiplier);
            this.fireCooldown = Math.random() * 60; // Offset start
            this.fireCooldownMax = Math.max(50, Math.round(120 / speedMultiplier)); // fires faster in higher waves
            this.scrapDrops = 3;
        } else if (type === 'behemoth') {
            this.radius = 32;
            this.maxHp = Math.round(160 * diffMultiplier);
            this.speed = 0.8 * speedMultiplier;
            this.color = '#bf00ff';
            this.points = 1000;
            this.collisionDmg = Math.round(45 * damageMultiplier);
            this.scrapDrops = 8;
        }
        
        this.hp = this.maxHp;
        this.angle = 0;
    }

    update(player, station) {
        // AI Pathfinding: Target the player or space station (whichever is closer)
        const dxPlayer = player.x - this.x;
        const dyPlayer = player.y - this.y;
        const distPlayerSq = dxPlayer * dxPlayer + dyPlayer * dyPlayer;
 
        const dxStation = station.x - this.x;
        const dyStation = station.y - this.y;
        const distStationSq = dxStation * dxStation + dyStation * dyStation;
 
        // Default: Target the closest
        let targetX = player.x;
        let targetY = player.y;
        let targetDx = dxPlayer;
        let targetDy = dyPlayer;
        let isTargetingStation = false;
        
        // Behemoths ALWAYS target the station to breach it (unless station is disabled)
        if (!game.disableStation && (this.type === 'behemoth' || distStationSq < distPlayerSq * 0.49)) { // 0.7 squared is 0.49
            targetX = station.x;
            targetY = station.y;
            targetDx = dxStation;
            targetDy = dyStation;
            isTargetingStation = true;
        }
 
        // Steer direction
        this.angle = Math.atan2(targetDy, targetDx);
 
        if (this.type === 'bomber') {
            const targetDistSq = isTargetingStation ? distStationSq : distPlayerSq;
            // Bomber behavior: Maintain distance, orbit slightly, and shoot
            if (targetDistSq > 67600) { // 260 * 260
                // Move closer
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;
            } else if (targetDistSq < 40000) { // 200 * 200
                // Back away
                this.vx = -Math.cos(this.angle) * this.speed * 0.8;
                this.vy = -Math.sin(this.angle) * this.speed * 0.8;
            } else {
                // Orbit/strafe
                this.vx = -Math.sin(this.angle) * this.speed * 0.5;
                this.vy = Math.cos(this.angle) * this.speed * 0.5;
            }
 
            // Firing protocol
            if (this.fireCooldown > 0) {
                this.fireCooldown--;
            } else if (targetDistSq < 202500) { // 450 * 450
                // Fire plasma bullet
                game.bullets.push(new Bullet(this.x, this.y, this.angle, 6, 15, false, '#00ff66'));
                this.fireCooldown = this.fireCooldownMax;
                if (typeof sounds !== 'undefined') sounds.laser('enemy');
            }
        } else {
            // Swarmer and Behemoth rush targets
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }
 
        // Move
        this.x += this.vx;
        this.y += this.vy;
    }

    damage(amount) {
        this.hp -= amount;
        
        // Spawn damage spark particles
        for (let i = 0; i < 4; i++) {
            game.spawnParticle(
                this.x, this.y,
                (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5,
                this.color, Math.random() * 2 + 1.5, 12
            );
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
            return true;
        }
        return false;
    }

    die() {
        game.score += this.points;
        game.scrapCollected += this.scrapDrops;
        
        // Play explosion sound
        if (typeof sounds !== 'undefined') {
            sounds.explosion(this.type === 'behemoth' ? 'large' : this.type === 'bomber' ? 'medium' : 'small');
        }

        // Spawn dynamic particle burst
        const particleCount = this.type === 'behemoth' ? 40 : this.type === 'bomber' ? 25 : 12;
        for (let i = 0; i < particleCount; i++) {
            const pAngle = Math.random() * Math.PI * 2;
            const pSpeed = Math.random() * 8 + 2;
            game.spawnParticle(
                this.x, this.y,
                Math.cos(pAngle) * pSpeed, Math.sin(pAngle) * pSpeed,
                this.color, Math.random() * 4 + 1.5, Math.random() * 30 + 15
            );
        }

        // Spawn Scrap crystals
        for (let i = 0; i < this.scrapDrops; i++) {
            game.scrap.push(new ScrapCrystal(
                this.x + (Math.random() - 0.5) * 15,
                this.y + (Math.random() - 0.5) * 15,
                1
            ));
        }

        // Behemoth split effect
        if (this.type === 'behemoth') {
            game.triggerScreenShake(12);
            for (let i = 0; i < 3; i++) {
                const sAngle = (Math.PI * 2 / 3) * i + (Math.random() - 0.5) * 0.5;
                const distOffset = 30;
                const sx = this.x + Math.cos(sAngle) * distOffset;
                const sy = this.y + Math.sin(sAngle) * distOffset;
                const swarmer = new Enemy(sx, sy, 'swarmer', game.wave);
                swarmer.vx = Math.cos(sAngle) * 4;
                swarmer.vy = Math.sin(sAngle) * 4;
                game.enemies.push(swarmer);
            }
        }
    }

    draw(ctx, camera) {
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(this.angle);

        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;

        if (this.type === 'swarmer') {
            // Draw standard glowing delta blade shape
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(-8, 9);
            ctx.lineTo(-4, 0);
            ctx.lineTo(-8, -9);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'bomber') {
            // Draw hexagonal glowing defensive structure
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const bAngle = (Math.PI / 3) * i;
                ctx.lineTo(Math.cos(bAngle) * this.radius, Math.sin(bAngle) * this.radius);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Core weapon port
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(4, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'behemoth') {
            // Large spiked armored boss ship
            ctx.beginPath();
            ctx.moveTo(32, 0);
            ctx.lineTo(10, 20);
            ctx.lineTo(15, 32);
            ctx.lineTo(-12, 28);
            ctx.lineTo(-20, 15);
            ctx.lineTo(-14, 0);
            ctx.lineTo(-20, -15);
            ctx.lineTo(-12, -28);
            ctx.lineTo(15, -32);
            ctx.lineTo(10, -20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inner core
            ctx.fillStyle = 'rgba(191, 0, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(-2, 0, 15, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// --- Main Game Director Class ---
class GameEngine {
    getPixelRatio() {
        const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (isMobile) {
            return 1.25; // Standard definition for mobile/performance
        }
        return Math.min(window.devicePixelRatio || 1, 2.0); // Cap at 2x retina
    }

    spawnParticle(x, y, vx, vy, color, size, life, friction = 0.98) {
        const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (isMobile) {
            // Drop 50% of particles on mobile to improve performance
            if (Math.random() > 0.5) return;
        }

        let p;
        if (this.particlePool && this.particlePool.length > 0) {
            p = this.particlePool.pop();
            p.reset(x, y, vx, vy, color, size, life, friction);
        } else {
            p = new Particle();
            p.reset(x, y, vx, vy, color, size, life, friction);
        }
        this.particles.push(p);
    }

    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Entities Containers
        this.player = new PlayerShip();
        this.station = new SpaceStation();
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.particlePool = []; // Pool to recycle particles
        this.scrap = [];
        this.stars = [];

        // Dynamic Camera
        this.camera = { x: 0, y: 0 };
        this.screenShake = 0;

        // Wave & Directing Mechanics
        this.wave = 0;
        this.waveActive = false;
        this.waveTimer = 180; // Delay before first wave
        this.score = 0;
        this.scrapCollected = 0;
        
        // Game States
        this.isPlaying = false;
        this.isGameOver = false;
        this.isDocked = false;
        this.isPaused = false;
        this.deathTimer = 0;

        // Visual Parallax Elements
        this.initStars();
        this.initResize();

        // Mobile Controls
        this.joyX = 0;
        this.joyY = 0;
        this.joyActive = false;
        this.initTouchControls();
    }

    initStars() {
        // Populate static space star matrix within boundaries
        for (let i = 0; i < 350; i++) {
            this.stars.push({
                x: (Math.random() - 0.5) * WORLD_SIZE,
                y: (Math.random() - 0.5) * WORLD_SIZE,
                size: Math.random() * 2 + 0.5,
                // Assign to 1 of 3 depth layers
                parallax: Math.random() < 0.15 ? 0.6 : Math.random() < 0.4 ? 0.35 : 0.12,
                color: Math.random() < 0.2 ? '#00f2ff' : Math.random() < 0.1 ? '#ff9f00' : '#ffffff'
            });
        }
    }

    initResize() {
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }

    resizeCanvas() {
        // High-DPI responsive canvas sizing
        const dpr = this.getPixelRatio();
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
    }

    initTouchControls() {
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const container = document.getElementById('game-container');
        if (isTouchDevice && container) {
            container.classList.add('touch-device');
        }

        const joystickContainer = document.getElementById('joystick-container');
        const knob = document.getElementById('joystick-knob');
        if (!joystickContainer || !knob) return;

        let activeTouchId = null;
        let joyCenterX = 0;
        let joyCenterY = 0;
        const maxRadius = 50; // max px knob can move from base center

        joystickContainer.addEventListener('touchstart', (e) => {
            if (activeTouchId !== null) return;
            
            const touch = e.changedTouches[0];
            activeTouchId = touch.identifier;

            const rect = joystickContainer.getBoundingClientRect();
            joyCenterX = touch.clientX - rect.left;
            joyCenterY = touch.clientY - rect.top;

            this.joyActive = true;
            this.joyX = 0;
            this.joyY = 0;

            knob.style.transform = 'translate(0px, 0px)';
            e.preventDefault();
        }, { passive: false });

        joystickContainer.addEventListener('touchmove', (e) => {
            if (activeTouchId === null) return;

            let activeTouch = null;
            for (let touch of e.touches) {
                if (touch.identifier === activeTouchId) {
                    activeTouch = touch;
                    break;
                }
            }
            if (!activeTouch) return;

            const rect = joystickContainer.getBoundingClientRect();
            const touchX = activeTouch.clientX - rect.left;
            const touchY = activeTouch.clientY - rect.top;

            let dx = touchX - joyCenterX;
            let dy = touchY - joyCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > maxRadius) {
                dx = (dx / dist) * maxRadius;
                dy = (dy / dist) * maxRadius;
            }

            knob.style.transform = `translate(${dx}px, ${dy}px)`;

            this.joyX = dx;
            this.joyY = dy;

            e.preventDefault();
        }, { passive: false });

        const resetJoystick = (e) => {
            if (activeTouchId === null) return;
            
            let ended = false;
            if (e) {
                for (let touch of e.changedTouches) {
                    if (touch.identifier === activeTouchId) {
                        ended = true;
                        break;
                    }
                }
            } else {
                ended = true;
            }

            if (ended) {
                activeTouchId = null;
                this.joyActive = false;
                this.joyX = 0;
                this.joyY = 0;
                knob.style.transform = 'translate(0px, 0px)';
                
                // Clear controls immediately
                keys.a = false;
                keys.d = false;
                keys.w = false;
            }
        };

        joystickContainer.addEventListener('touchend', resetJoystick, { passive: true });
        joystickContainer.addEventListener('touchcancel', resetJoystick, { passive: true });

        // Bind Action Buttons
        const bindButton = (id, keyName) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            btn.addEventListener('touchstart', (e) => {
                keys[keyName] = true;
                e.preventDefault();
            }, { passive: false });

            const endHandler = (e) => {
                keys[keyName] = false;
                if (e) e.preventDefault();
            };

            btn.addEventListener('touchend', endHandler, { passive: false });
            btn.addEventListener('touchcancel', endHandler, { passive: false });
        };

        bindButton('btn-dash-mobile', 'Shift');
        bindButton('btn-brake-mobile', 's');
        bindButton('btn-dock-mobile', 'e');
        bindButton('btn-launch-wave-mobile', 'g');

        // Global fallback to clear keys when all screen touches end
        const clearAllTouchesFallback = (e) => {
            if (e.touches.length === 0) {
                keys.Shift = false;
                keys.s = false;
                keys.e = false;
                keys.g = false;
            }
        };
        window.addEventListener('touchend', clearAllTouchesFallback, { passive: true });
        window.addEventListener('touchcancel', clearAllTouchesFallback, { passive: true });
    }

    updateJoystickInput() {
        if (!this.joyActive) return;

        const dist = Math.sqrt(this.joyX * this.joyX + this.joyY * this.joyY);
        const maxRadius = 50;

        if (dist > 5) {
            const targetAngle = Math.atan2(this.joyY, this.joyX);
            
            if (this.player && !this.player.isDestroyed) {
                let diff = targetAngle - this.player.angle;
                diff = Math.atan2(Math.sin(diff), Math.cos(diff));

                // If diff is larger than tolerance, rotate
                const tolerance = 0.08;
                if (diff > tolerance) {
                    keys.d = true;
                    keys.a = false;
                } else if (diff < -tolerance) {
                    keys.a = true;
                    keys.d = false;
                } else {
                    keys.a = false;
                    keys.d = false;
                }

                // Thrust if dragged far enough
                if (dist > maxRadius * 0.3) {
                    keys.w = true;
                    keys.s = false;
                } else {
                    keys.w = false;
                    keys.s = false;
                }
            }
        } else {
            keys.a = false;
            keys.d = false;
            keys.w = false;
        }
    }

    updateMobileControlsHUD() {
        const mobileControls = document.getElementById('mobile-controls');
        if (!mobileControls) return;

        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (!isTouchDevice) {
            mobileControls.classList.add('hidden');
            return;
        }

        if (this.isPlaying && !this.isDocked && !this.isPaused && this.player && !this.player.isDestroyed) {
            mobileControls.classList.remove('hidden');

            // Update contextual buttons visibility
            const btnDock = document.getElementById('btn-dock-mobile');
            if (btnDock) {
                const dockPrompt = document.getElementById('docking-prompt');
                if (dockPrompt && dockPrompt.style.display === 'block') {
                    btnDock.classList.remove('hidden');
                } else {
                    btnDock.classList.add('hidden');
                    keys.e = false; // Clear input if button is hidden while pressed
                }
            }

            const btnLaunchWave = document.getElementById('btn-launch-wave-mobile');
            if (btnLaunchWave) {
                if (this.enemies.length === 0 && !this.waveActive && this.waveTimer > 90) {
                    btnLaunchWave.classList.remove('hidden');
                } else {
                    btnLaunchWave.classList.add('hidden');
                    keys.g = false; // Clear input if button is hidden while pressed
                }
            }
        } else {
            mobileControls.classList.add('hidden');
            // Reset all mobile keys when the panel is hidden to prevent stuck inputs
            keys.Shift = false;
            keys.s = false;
            keys.e = false;
            keys.g = false;
        }
    }

    start() {
        if (typeof sounds !== 'undefined') sounds.init();
        
        const toggleCheckbox = document.getElementById('toggle-station');
        this.disableStation = toggleCheckbox ? toggleCheckbox.checked : false;
        
        // Reset metrics
        this.player = new PlayerShip();
        this.station = new SpaceStation();
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.particlePool = []; // Empty pool on restart
        this.scrap = [];
        this.wave = 0;
        this.score = 0;
        this.scrapCollected = 0;
        this.waveActive = false;
        this.waveTimer = 150;
        this.isPlaying = true;
        this.isGameOver = false;
        this.isDocked = false;
        this.deathTimer = 0;
        this.defeatReason = '';

        if (this.disableStation) {
            document.getElementById('station-hud-header').style.display = 'none';
            document.getElementById('station-shield-container').style.display = 'none';
            document.getElementById('station-hull-container').style.display = 'none';
            document.getElementById('shop-station-section').style.display = 'none';
            document.querySelector('.shop-grid').style.gridTemplateColumns = '1fr';
            document.querySelector('.shop-card').style.maxWidth = '460px';
        } else {
            document.getElementById('station-hud-header').style.display = 'block';
            document.getElementById('station-shield-container').style.display = 'block';
            document.getElementById('station-hull-container').style.display = 'block';
            document.getElementById('shop-station-section').style.display = 'block';
            document.querySelector('.shop-grid').style.gridTemplateColumns = '1fr 1fr';
            document.querySelector('.shop-card').style.maxWidth = '850px';
        }

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        
        this.resizeCanvas();
        this.updateHUD();
        this.loop();
    }

    gameOver() {
        this.isPlaying = false;
        this.isGameOver = true;
        this.updateMobileControlsHUD();
        
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        
        const reasonText = this.defeatReason === 'station_destroyed' 
            ? "STATION CORE BREACHED - BASE OBLITERATED"
            : "VANGUARD-7 HULL INTEGRITY CRITICAL - SHIP DESTROYED";
        document.getElementById('game-over-reason').innerText = reasonText;
        
        document.getElementById('final-waves').innerText = this.wave;
        document.getElementById('final-score').innerText = this.score.toLocaleString();
        document.getElementById('final-scrap').innerText = this.scrapCollected;
        
        if (typeof sounds !== 'undefined') sounds.setEngineThrust(false);
    }

    triggerScreenShake(intensity) {
        this.screenShake = Math.max(this.screenShake, intensity);
    }

    triggerPlayerExplosion() {
        this.defeatReason = 'ship_destroyed';
        this.deathTimer = 120; // 2 seconds delay
        this.triggerScreenShake(20);
        
        if (typeof sounds !== 'undefined') {
            sounds.explosion('large');
            sounds.setEngineThrust(false);
        }

        // Spawn a massive burst of neon cyan & orange particles
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 3;
            const color = Math.random() < 0.6 ? '#00f2ff' : Math.random() < 0.3 ? '#ff9f00' : '#ffffff';
            this.spawnParticle(
                this.player.x, this.player.y,
                Math.cos(angle) * speed, Math.sin(angle) * speed,
                color, Math.random() * 5 + 2, Math.random() * 50 + 20
            );
        }

        // Spawn fireballs expanding outwards
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            this.spawnParticle(
                this.player.x, this.player.y,
                Math.cos(angle) * speed, Math.sin(angle) * speed,
                '#ff3b3b', Math.random() * 10 + 5, Math.random() * 35 + 15
            );
        }
    }

    triggerStationExplosion() {
        this.defeatReason = 'station_destroyed';
        this.deathTimer = 150; // 2.5 seconds delay
        this.triggerScreenShake(25);

        if (typeof sounds !== 'undefined') {
            sounds.explosion('large');
            sounds.setEngineThrust(false);
        }

        // Spawn staggered secondary explosions around the base
        for (let j = 0; j < 6; j++) {
            setTimeout(() => {
                if (!this.isGameOver) {
                    this.triggerScreenShake(12);
                    const ox = (Math.random() - 0.5) * 80;
                    const oy = (Math.random() - 0.5) * 80;
                    if (typeof sounds !== 'undefined') sounds.explosion('medium');
                    
                    for (let i = 0; i < 20; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = Math.random() * 5 + 1;
                        this.spawnParticle(
                            this.station.x + ox, this.station.y + oy,
                            Math.cos(angle) * speed, Math.sin(angle) * speed,
                            '#ff8800', Math.random() * 7 + 3, Math.random() * 40 + 15
                        );
                    }
                }
            }, j * 250);
        }
    }

    // Spawn Waves Logic
    directorUpdate() {
        if (this.isDocked) return;

        // Wave management ticker
        if (this.enemies.length === 0 && !this.waveActive) {
            // Player can press 'G' to skip planning countdown
            if (keys.g && this.waveTimer > 90) {
                this.waveTimer = 90;
                keys.g = false; // consume input
            }

            if (this.waveTimer > 0) {
                this.waveTimer--;
                
                const ticker = document.getElementById('warning-ticker');
                if (this.waveTimer > 90) {
                    const secs = Math.ceil((this.waveTimer - 90) / 60);
                    ticker.innerText = `NEXT SWARM IN: ${secs}S | PRESS [G] TO LAUNCH`;
                    ticker.classList.remove('alert-active');
                } else {
                    ticker.innerText = "WARNING: INCOMING SECTOR SWARM DETECTED";
                    ticker.classList.add('alert-active');
                    if (this.waveTimer === 89 && typeof sounds !== 'undefined') {
                        sounds.laser('enemy');
                    }
                }
            } else {
                this.wave++;
                this.spawnWave();
            }
        }
    }

    spawnWave() {
        this.waveActive = true;
        const ticker = document.getElementById('warning-ticker');
        ticker.innerText = `WAVE ${this.wave} INITIALIZED - SECURE SECTOR`;
        ticker.classList.remove('alert-active');
        
        // Scale spawns based on wave index (much easier on Wave 1-2)
        const swarmCount = 2 + this.wave * 2;
        const bomberCount = Math.max(0, -2 + this.wave);
        const behemothCount = Math.floor(this.wave / 4);

        // Swarm Spawning loop
        for (let i = 0; i < swarmCount; i++) {
            this.spawnEnemyOutsideCamera('swarmer');
        }
        for (let i = 0; i < bomberCount; i++) {
            this.spawnEnemyOutsideCamera('bomber');
        }
        for (let i = 0; i < behemothCount; i++) {
            this.spawnEnemyOutsideCamera('behemoth');
        }
    }

    spawnEnemyOutsideCamera(type) {
        // Choose random angle around center space station
        const angle = Math.random() * Math.PI * 2;
        // Spawn far away from station/camera
        const dist = 1200 + Math.random() * 400;
        const ex = this.station.x + Math.cos(angle) * dist;
        const ey = this.station.y + Math.sin(angle) * dist;
        
        // Clamping to world bounds
        const clampedX = Math.max(-HALF_WORLD + 100, Math.min(HALF_WORLD - 100, ex));
        const clampedY = Math.max(-HALF_WORLD + 100, Math.min(HALF_WORLD - 100, ey));

        this.enemies.push(new Enemy(clampedX, clampedY, type, this.wave));
    }

    // Central Update Logic
    update() {
        this.updateMobileControlsHUD();
        this.updateJoystickInput();
        if (!this.isPlaying || this.isPaused) return;

        // Check death animation timer
        if (this.deathTimer > 0) {
            this.deathTimer--;
            if (this.deathTimer === 0) {
                this.gameOver();
            }
        }

        // Handle upgrade/dock interaction prompt visibility
        const dockPrompt = document.getElementById('docking-prompt');
        if (this.disableStation) {
            // In survival mode, can open shop anywhere during planning break
            if (!this.waveActive && !this.player.isDestroyed) {
                dockPrompt.innerText = "PRESS [E] TO UPGRADE SYSTEMS";
                dockPrompt.style.display = 'block';
                if (keys.e && !this.isDocked) {
                    this.dockShip();
                }
            } else {
                dockPrompt.style.display = 'none';
            }
        } else {
            const dx = this.player.x - this.station.x;
            const dy = this.player.y - this.station.y;
            const distToStation = Math.sqrt(dx * dx + dy * dy);
            
            if (distToStation < this.station.dockRadius && !this.player.isDestroyed) {
                dockPrompt.innerText = "PRESS [E] TO DOCK & UPGRADE";
                dockPrompt.style.display = 'block';
                
                // Check Dock trigger
                if (keys.e && !this.isDocked) {
                    this.dockShip();
                }
            } else {
                dockPrompt.style.display = 'none';
            }
        }

        // Run director and entity update if not docked in menu
        if (!this.isDocked && !this.player.isDestroyed) {
            this.player.update();
            if (!this.disableStation && !this.station.isDestroyed) {
                this.station.update(this.enemies);
            }
            this.directorUpdate();

            // Fire Player Lasers (Manual or automatic when enemies are nearby)
            let shouldAutoFire = false;
            if (this.enemies.length > 0) {
                for (let enemy of this.enemies) {
                    const dx = enemy.x - this.player.x;
                    const dy = enemy.y - this.player.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < 360000) { // 600 * 600
                        shouldAutoFire = true;
                        break;
                    }
                }
            }

            if ((mouse.isDown || keys[' '] || shouldAutoFire) && this.player.fireCooldown === 0) {
                this.firePlayerWeapon();
            }
        }

        // Update Projectiles Pool
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update();
            if (b.life <= 0) {
                this.bullets.splice(i, 1);
            }
        }

        // Update Scrap Items
        for (let i = this.scrap.length - 1; i >= 0; i--) {
            const s = this.scrap[i];
            s.update(this.player, this.player.magnetRange);
            
            // Auto collection by Space Station in-between waves (Tractor Beam grid)
            if (!this.waveActive && !this.disableStation) {
                const dxStation = this.station.x - s.x;
                const dyStation = this.station.y - s.y;
                const distStationSq = dxStation * dxStation + dyStation * dyStation;
                const stationCollectRange = 600; // 600px collection radius
                const stationCollectRangeSq = stationCollectRange * stationCollectRange;

                if (distStationSq < stationCollectRangeSq) {
                    const distStation = Math.sqrt(distStationSq);
                    const force = (stationCollectRange - distStation) / stationCollectRange * 0.45;
                    s.vx += (dxStation / distStation) * force;
                    s.vy += (dyStation / distStation) * force;
                    
                    const svSq = s.vx * s.vx + s.vy * s.vy;
                    if (svSq > 144) { // 12 * 12
                        const sv = Math.sqrt(svSq);
                        s.vx = (s.vx / sv) * 12;
                        s.vy = (s.vy / sv) * 12;
                    }
                }

                // Station hit check
                const stationCollideRange = this.station.radius + s.radius;
                if (distStationSq < stationCollideRange * stationCollideRange) {
                    this.player.scrap += s.value;
                    this.score += 50;
                    if (typeof sounds !== 'undefined') sounds.upgrade();

                    // Blue tractor beam sparks
                    for (let j = 0; j < 6; j++) {
                        const pAngle = Math.random() * Math.PI * 2;
                        this.spawnParticle(
                            s.x, s.y,
                            Math.cos(pAngle) * 3, Math.sin(pAngle) * 3,
                            '#00f2ff', 2, 12
                        );
                    }

                    this.scrap.splice(i, 1);
                    this.updateHUD();
                    continue;
                }
            }
            
            // Magnet / Hit Player check
            const dx = s.x - this.player.x;
            const dy = s.y - this.player.y;
            const distSq = dx * dx + dy * dy;
            const collideRange = this.player.radius + s.radius;
            
            if (distSq < collideRange * collideRange) {
                // Collect scrap
                this.player.scrap += s.value;
                this.score += 50; // Bonus score
                if (typeof sounds !== 'undefined') sounds.upgrade();
                
                // Collection feedback particles
                for (let j = 0; j < 4; j++) {
                    this.spawnParticle(
                        s.x, s.y,
                        (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4,
                        '#ff9f00', 2.5, 10
                    );
                }
                
                this.scrap.splice(i, 1);
                this.updateHUD();
                continue;
            }
        }

        // Update Enemy AI pool
        if (!this.isDocked) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                enemy.update(this.player, this.station);
                
                // Ship-Enemy Collision Check
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const distSq = dx * dx + dy * dy;
                const collideRange = enemy.radius + this.player.radius;
                
                if (distSq < collideRange * collideRange) {
                    this.player.damage(enemy.collisionDmg);
                    enemy.damage(999); // Instantly vaporize Swarmer on impact
                    this.enemies.splice(i, 1);
                    this.checkWaveCleaned();
                    continue;
                }

                // Station-Enemy Collision Check
                if (!this.disableStation) {
                    const dxS = enemy.x - this.station.x;
                    const dyS = enemy.y - this.station.y;
                    const distSSq = dxS * dxS + dyS * dyS;
                    const collideRangeS = enemy.radius + this.station.radius;
                    
                    if (distSSq < collideRangeS * collideRangeS) {
                        this.station.damage(enemy.collisionDmg);
                        enemy.damage(999);
                        this.enemies.splice(i, 1);
                        this.checkWaveCleaned();
                    }
                }
            }
        }

        // Run collisions checking loop
        this.checkCollisions();

        // Update visual particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                this.particlePool.push(p); // Recycle dead particle to the pool
            }
        }

        // Update Camera interpolation
        this.camera.x += (this.player.x - window.innerWidth / 2 - this.camera.x) * 0.08;
        this.camera.y += (this.player.y - window.innerHeight / 2 - this.camera.y) * 0.08;

        // Apply screen shake
        if (this.screenShake > 0.1) {
            this.screenShake *= 0.88;
        } else {
            this.screenShake = 0;
        }

        // Smoothly update HUD values
        this.updateHUD();
    }

    firePlayerWeapon() {
        const fireAngle = this.player.angle;

        // Upgraded weapon spread mechanics
        if (this.player.weaponLevel === 1) {
            this.bullets.push(new Bullet(this.player.x, this.player.y, fireAngle, 12, this.player.weaponDamage, true));
        } else if (this.player.weaponLevel === 2) {
            // Twin shot
            const spread = 0.08;
            this.bullets.push(new Bullet(this.player.x, this.player.y, fireAngle - spread, 13, this.player.weaponDamage, true));
            this.bullets.push(new Bullet(this.player.x, this.player.y, fireAngle + spread, 13, this.player.weaponDamage, true));
        } else if (this.player.weaponLevel === 3) {
            // Triple spread
            const spread = 0.15;
            this.bullets.push(new Bullet(this.player.x, this.player.y, fireAngle, 14, this.player.weaponDamage, true));
            this.bullets.push(new Bullet(this.player.x, this.player.y, fireAngle - spread, 14, this.player.weaponDamage, true));
            this.bullets.push(new Bullet(this.player.x, this.player.y, fireAngle + spread, 14, this.player.weaponDamage, true));
        } else {
            // Quad spread & heavy damage
            const spread = 0.12;
            this.bullets.push(new Bullet(this.player.x, this.player.y, fireAngle - spread * 1.5, 15, this.player.weaponDamage, true));
            this.bullets.push(new Bullet(this.player.x, this.player.y, fireAngle - spread * 0.5, 15, this.player.weaponDamage, true));
            this.bullets.push(new Bullet(this.player.x, this.player.y, fireAngle + spread * 0.5, 15, this.player.weaponDamage, true));
            this.bullets.push(new Bullet(this.player.x, this.player.y, fireAngle + spread * 1.5, 15, this.player.weaponDamage, true));
        }

        this.player.fireCooldown = this.player.weaponCooldownMax;
        if (typeof sounds !== 'undefined') sounds.laser('player');
    }

    checkCollisions() {
        for (let bIndex = this.bullets.length - 1; bIndex >= 0; bIndex--) {
            const b = this.bullets[bIndex];
            
            if (b.isPlayer === true || b.isPlayer === 'station') {
                // Player / Station Bullet vs Enemy target
                for (let eIndex = this.enemies.length - 1; eIndex >= 0; eIndex--) {
                    const enemy = this.enemies[eIndex];
                    const dx = b.x - enemy.x;
                    const dy = b.y - enemy.y;
                    const distSq = dx * dx + dy * dy;
                    const collideRange = enemy.radius + b.radius;
                    
                    if (distSq < collideRange * collideRange) {
                        // Enemy Hit
                        const isDead = enemy.damage(b.damage);
                        this.bullets.splice(bIndex, 1);
                        
                        if (isDead) {
                            this.enemies.splice(eIndex, 1);
                            this.checkWaveCleaned();
                        }
                        break;
                    }
                }
            } else {
                // Enemy Bullet vs Player ship
                const dxP = b.x - this.player.x;
                const dyP = b.y - this.player.y;
                const distPSq = dxP * dxP + dyP * dyP;
                const collideRangeP = this.player.radius + b.radius;
                
                if (distPSq < collideRangeP * collideRangeP) {
                    this.player.damage(b.damage);
                    this.bullets.splice(bIndex, 1);
                    continue;
                }

                // Enemy Bullet vs Space Station
                if (!this.disableStation) {
                    const dxS = b.x - this.station.x;
                    const dyS = b.y - this.station.y;
                    const distSSq = dxS * dxS + dyS * dyS;
                    const collideRangeS = this.station.radius + b.radius;
                    
                    if (distSSq < collideRangeS * collideRangeS) {
                        this.station.damage(b.damage);
                        this.bullets.splice(bIndex, 1);
                    }
                }
            }
        }
    }

    checkWaveCleaned() {
        if (this.enemies.length === 0 && this.waveActive) {
            this.waveActive = false;
            this.waveTimer = 1200; // 20 seconds break between waves for strategy
            
            const ticker = document.getElementById('warning-ticker');
            ticker.innerText = "SECTOR SECURE - RETURN TO STATION FOR DOCKING";
            
            if (typeof sounds !== 'undefined') sounds.upgrade();
        }
    }

    dockShip() {
        this.isDocked = true;
        this.updateMobileControlsHUD();
        keys.w = keys.s = keys.a = keys.d = false; // Reset controls
        
        // Zero velocities
        this.player.vx = 0;
        this.player.vy = 0;

        if (typeof sounds !== 'undefined') {
            sounds.dock();
            sounds.setEngineThrust(false);
        }

        // Auto heal player & station on docking
        this.player.hull = this.player.maxHull;
        this.player.shield = this.player.maxShield;
        if (!this.disableStation) {
            this.station.hull = this.station.maxHull;
            this.station.shield = this.station.maxShield;
        }

        // Show Upgrade menu UI
        this.openShopUI();
    }

    openShopUI() {
        document.getElementById('shop-screen').classList.remove('hidden');
        this.updateShopStats();
    }

    closeShopUI() {
        this.isDocked = false;
        this.updateMobileControlsHUD();
        document.getElementById('shop-screen').classList.add('hidden');
        
        // Boost ship out of dock slightly to show launch
        const launchAngle = Math.atan2(this.player.y, this.player.x);
        this.player.vx = Math.cos(launchAngle) * 3;
        this.player.vy = Math.sin(launchAngle) * 3;
    }

    updateShopStats() {
        const pScrap = this.player.scrap || 0;
        document.getElementById('shop-scrap').innerText = pScrap;
        
        // Level badges update
        document.getElementById('lvl-weapon').innerText = this.player.weaponLevel;
        document.getElementById('lvl-speed').innerText = this.player.levelSpeed;
        document.getElementById('lvl-shield').innerText = this.player.levelShield;
        
        document.getElementById('lvl-station-turrets').innerText = this.station.turretLevel;
        document.getElementById('lvl-station-shield').innerText = this.station.levelStationShield;
        document.getElementById('lvl-magnet').innerText = this.player.levelMagnet;

        // Cost definitions
        const costs = {
            repair: 20,
            weapon: this.player.weaponLevel * 40,
            speed: this.player.levelSpeed * 30,
            shield: this.player.levelShield * 35,
            stationRepair: 30,
            stationTurret: this.station.turretLevel === 0 ? 30 : this.station.turretLevel * 45,
            stationShield: this.station.levelStationShield === 0 ? 25 : this.station.levelStationShield * 40,
            magnet: this.player.levelMagnet * 25
        };

        // Update Cost Button Labels
        this.updateButton('btn-repair', costs.repair, pScrap);
        this.updateButton('btn-upgrade-weapon', costs.weapon, pScrap, this.player.weaponLevel >= 4);
        this.updateButton('btn-upgrade-speed', costs.speed, pScrap, this.player.levelSpeed >= 5);
        this.updateButton('btn-upgrade-shield', costs.shield, pScrap, this.player.levelShield >= 5);
        
        this.updateButton('btn-repair-station', costs.stationRepair, pScrap);
        this.updateButton('btn-upgrade-station-turrets', costs.stationTurret, pScrap, this.station.turretLevel >= 5);
        this.updateButton('btn-upgrade-station-shield', costs.stationShield, pScrap, this.station.levelStationShield >= 5);
        this.updateButton('btn-upgrade-magnet', costs.magnet, pScrap, this.player.levelMagnet >= 5);
    }

    updateButton(id, cost, available, isMaxed = false) {
        const btn = document.getElementById(id);
        if (isMaxed) {
            btn.innerText = "MAX LEVEL";
            btn.disabled = true;
            return;
        }
        btn.innerText = `${cost} SCRAP`;
        btn.dataset.cost = cost;
        btn.disabled = available < cost;
    }

    purchaseUpgrade(type) {
        const pScrap = this.player.scrap || 0;
        let cost = 0;

        if (type === 'repair') {
            cost = 20;
            if (pScrap >= cost) {
                this.player.scrap -= cost;
                this.player.hull = this.player.maxHull;
            }
        } else if (type === 'weapon') {
            cost = this.player.weaponLevel * 40;
            if (pScrap >= cost && this.player.weaponLevel < 4) {
                this.player.scrap -= cost;
                this.player.weaponLevel++;
                this.player.weaponDamage += 6;
                this.player.weaponCooldownMax = Math.max(7, this.player.weaponCooldownMax - 1);
            }
        } else if (type === 'speed') {
            cost = this.player.levelSpeed * 30;
            if (pScrap >= cost && this.player.levelSpeed < 5) {
                this.player.scrap -= cost;
                this.player.levelSpeed++;
                this.player.maxSpeed += 1.25;
                this.player.thrustPower += 0.04;
                this.player.rotationSpeed += 0.004; // Tuned down upgrade increment
            }
        } else if (type === 'shield') {
            cost = this.player.levelShield * 35;
            if (pScrap >= cost && this.player.levelShield < 5) {
                this.player.scrap -= cost;
                this.player.levelShield++;
                this.player.maxShield += 40;
                this.player.shieldRechargeRate += 0.02;
                this.player.shield = this.player.maxShield;
            }
        } else if (type === 'repair-station') {
            cost = 30;
            if (pScrap >= cost) {
                this.player.scrap -= cost;
                this.station.hull = this.station.maxHull;
            }
        } else if (type === 'station-turrets') {
            cost = this.station.turretLevel === 0 ? 30 : this.station.turretLevel * 45;
            if (pScrap >= cost && this.station.turretLevel < 5) {
                this.player.scrap -= cost;
                this.station.turretLevel++;
                this.station.turretsCount += 1;
                this.station.turretCooldownMax = Math.max(20, 65 - this.station.turretLevel * 10);
                this.station.turretDamage += 3;
            }
        } else if (type === 'station-shield') {
            cost = this.station.levelStationShield === 0 ? 25 : this.station.levelStationShield * 40;
            if (pScrap >= cost && this.station.levelStationShield < 5) {
                this.player.scrap -= cost;
                this.station.levelStationShield++;
                if (this.station.levelStationShield === 1) {
                    this.station.maxShield = 200; // Boosted Lvl 1 Shield
                    this.station.shieldRecharge = 0.08;
                } else {
                    this.station.maxShield += 160; // Boosted scaling
                    this.station.shieldRecharge += 0.05;
                }
                this.station.shield = this.station.maxShield;
            }
        } else if (type === 'magnet') {
            cost = this.player.levelMagnet * 25;
            if (pScrap >= cost && this.player.levelMagnet < 5) {
                this.player.scrap -= cost;
                this.player.levelMagnet++;
                this.player.magnetRange += 75;
            }
        }

        if (typeof sounds !== 'undefined') sounds.upgrade();
        this.updateShopStats();
        this.updateHUD();
    }

    updateHUD() {
        // Hull/Shield bars update with division-by-zero checks (shield can be 0 at start)
        const playerShieldPercent = this.player.maxShield > 0 ? (this.player.shield / this.player.maxShield) * 100 : 0;
        document.getElementById('player-shield-bar').style.width = `${playerShieldPercent}%`;
        document.getElementById('player-hull-bar').style.width = `${(this.player.hull / this.player.maxHull) * 100}%`;
        
        const stationShieldPercent = this.station.maxShield > 0 ? (this.station.shield / this.station.maxShield) * 100 : 0;
        document.getElementById('station-shield-bar').style.width = `${stationShieldPercent}%`;
        document.getElementById('station-hull-bar').style.width = `${(this.station.hull / this.station.maxHull) * 100}%`;
        
        // Stats update
        document.getElementById('hud-wave').innerText = this.wave;
        document.getElementById('hud-score').innerText = String(this.score).padStart(6, '0');
        document.getElementById('hud-scrap').innerText = this.player.scrap || 0;

        // Weapon name description
        const weaponNames = ["PULSE BEAM", "TWIN BEAM", "TRIPLE CASCADE", "PLASMA OVERDRIVE"];
        document.getElementById('active-weapon').innerText = weaponNames[this.player.weaponLevel - 1];

        // Dash Bar update
        const dashCooldownPercent = this.player.dashCooldown > 0 
            ? ((120 - this.player.dashCooldown) / 120) * 100 
            : 100;
        document.getElementById('dash-cooldown-bar').style.width = `${dashCooldownPercent}%`;
    }

    // Render loop
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#020207';
        this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Apply dynamic screen shake translation matrices
        this.ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }

        // Draw parallax star backgrounds
        this.drawParallaxStars();

        // Draw Arena Grid Boundary highlights
        this.drawWorldBoundaries();

        // Draw scrap crystals
        for (let crystal of this.scrap) {
            crystal.draw(this.ctx, this.camera);
        }

        // Draw space bullets
        for (let bullet of this.bullets) {
            bullet.draw(this.ctx, this.camera);
        }

        // Draw central base station
        if (!this.disableStation) {
            this.station.draw(this.ctx, this.camera);
        }

        // Draw active enemy ships
        for (let enemy of this.enemies) {
            enemy.draw(this.ctx, this.camera);
        }

        // Draw player ship
        this.player.draw(this.ctx, this.camera);

        // Draw particles engine
        for (let particle of this.particles) {
            particle.draw(this.ctx, this.camera);
        }

        this.ctx.restore();

        // Draw radar HUD minimap
        this.drawRadar();
    }

    drawParallaxStars() {
        for (let star of this.stars) {
            // Parallax offset formula
            const drawX = star.x - this.camera.x * star.parallax;
            const drawY = star.y - this.camera.y * star.parallax;

            // Draw star only if visible within canvas bounds
            if (drawX >= 0 && drawX <= window.innerWidth && drawY >= 0 && drawY <= window.innerHeight) {
                this.ctx.fillStyle = star.color;
                this.ctx.fillRect(drawX, drawY, star.size, star.size);
            }
        }
    }

    drawWorldBoundaries() {
        // World outer border lines
        const xMin = -HALF_WORLD - this.camera.x;
        const yMin = -HALF_WORLD - this.camera.y;
        const size = WORLD_SIZE;

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
        this.ctx.lineWidth = 2.5;
        this.ctx.strokeRect(xMin, yMin, size, size);

        // Crosshairs in center world
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.03)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(xMin, 0 - this.camera.y);
        this.ctx.lineTo(xMin + size, 0 - this.camera.y);
        this.ctx.moveTo(0 - this.camera.x, yMin);
        this.ctx.lineTo(0 - this.camera.x, yMin + size);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawRadar() {
        const rCanvas = document.getElementById('minimap-canvas');
        const rCtx = rCanvas.getContext('2d');
        const cw = rCanvas.width;
        const ch = rCanvas.height;
        const cx = cw / 2;
        const cy = ch / 2;

        rCtx.clearRect(0, 0, cw, ch);

        // Grid lines inside radar
        rCtx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
        rCtx.lineWidth = 1;
        rCtx.beginPath();
        rCtx.arc(cx, cy, cw * 0.45, 0, Math.PI * 2);
        rCtx.stroke();
        rCtx.beginPath();
        rCtx.arc(cx, cy, cw * 0.25, 0, Math.PI * 2);
        rCtx.stroke();

        // Map World dimensions to radar dimensions
        const scale = (cw * 0.4) / HALF_WORLD; // Scale so half-world fits on radar bounds

        // Draw space station (Blue dot in the middle) if enabled
        if (!this.disableStation) {
            rCtx.fillStyle = '#00f2ff';
            rCtx.beginPath();
            rCtx.arc(cx, cy, 4, 0, Math.PI * 2);
            rCtx.fill();
        }

        // Draw Player (relative to station)
        const prx = cx + this.player.x * scale;
        const pry = cy + this.player.y * scale;
        
        if (prx >= 0 && prx <= cw && pry >= 0 && pry <= ch) {
            rCtx.fillStyle = '#00ff66';
            rCtx.beginPath();
            rCtx.arc(prx, pry, 3, 0, Math.PI * 2);
            rCtx.fill();
        }

        // Draw Enemies (Red dots)
        rCtx.fillStyle = '#ff3355';
        for (let enemy of this.enemies) {
            const erx = cx + enemy.x * scale;
            const ery = cy + enemy.y * scale;
            if (erx >= 0 && erx <= cw && ery >= 0 && ery <= ch) {
                rCtx.beginPath();
                rCtx.arc(erx, ery, 2, 0, Math.PI * 2);
                rCtx.fill();
            }
        }

        // Draw Crystals (Orange dots)
        rCtx.fillStyle = '#ff9f00';
        for (let crystal of this.scrap) {
            const crx = cx + crystal.x * scale;
            const cry = cy + crystal.y * scale;
            if (crx >= 0 && crx <= cw && cry >= 0 && cry <= ch) {
                rCtx.beginPath();
                rCtx.arc(crx, cry, 1.5, 0, Math.PI * 2);
                rCtx.fill();
            }
        }
    }

    loop() {
        this.update();
        this.draw();
        
        if (this.isPlaying) {
            requestAnimationFrame(() => this.loop());
        }
    }
}

async function enterImmersiveMode() {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const maxDimension = Math.max(window.innerWidth, window.innerHeight);
    const isMobileOrSmallTablet = isTouchDevice && maxDimension < 1024;
    if (!isMobileOrSmallTablet) return;

    const root = document.documentElement;
    const requestFullscreen = root.requestFullscreen || root.webkitRequestFullscreen;

    try {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && requestFullscreen) {
            await requestFullscreen.call(root);
        }
    } catch (err) {
        // Some mobile browsers only allow fullscreen from installed PWAs.
    }

    try {
        if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock('landscape');
        }
    } catch (err) {
        // Orientation lock is best-effort and varies by browser.
    }
}

// --- Setup Click listeners on Window ---
let game;
window.addEventListener('load', () => {
    game = new GameEngine();
    
    // UI Mouse bindings
    window.addEventListener('mousemove', (e) => {
        const canvasRect = game.canvas.getBoundingClientRect();
        mouse.x = e.clientX - canvasRect.left;
        mouse.y = e.clientY - canvasRect.top;
    });

    window.addEventListener('mousedown', (e) => {
        if (e.button === 0) mouse.isDown = true;
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) mouse.isDown = false;
    });

    // Start screen first interaction triggers immersive fullscreen mode
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        const triggerFullscreen = () => {
            enterImmersiveMode();
            startScreen.removeEventListener('click', triggerFullscreen);
            startScreen.removeEventListener('touchstart', triggerFullscreen);
        };
        startScreen.addEventListener('click', triggerFullscreen);
        startScreen.addEventListener('touchstart', triggerFullscreen);
    }

    // Start Button
    document.getElementById('start-btn').addEventListener('click', () => {
        game.start();
    });

    // Resume Button
    document.getElementById('resume-btn').addEventListener('click', () => {
        game.closeShopUI();
    });

    // Game Over Restart Button
    document.getElementById('restart-btn').addEventListener('click', () => {
        enterImmersiveMode();
        game.start();
    });

    // Shop Upgrade Buttons bindings
    document.getElementById('btn-repair').addEventListener('click', () => game.purchaseUpgrade('repair'));
    document.getElementById('btn-upgrade-weapon').addEventListener('click', () => game.purchaseUpgrade('weapon'));
    document.getElementById('btn-upgrade-speed').addEventListener('click', () => game.purchaseUpgrade('speed'));
    document.getElementById('btn-upgrade-shield').addEventListener('click', () => game.purchaseUpgrade('shield'));
    
    document.getElementById('btn-repair-station').addEventListener('click', () => game.purchaseUpgrade('repair-station'));
    document.getElementById('btn-upgrade-station-turrets').addEventListener('click', () => game.purchaseUpgrade('station-turrets'));
    document.getElementById('btn-upgrade-station-shield').addEventListener('click', () => game.purchaseUpgrade('station-shield'));
    document.getElementById('btn-upgrade-magnet').addEventListener('click', () => game.purchaseUpgrade('magnet'));

    // Landscape orientation locking protocol
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    function checkOrientation() {
        const isPortrait = window.innerHeight > window.innerWidth;
        const maxDimension = Math.max(window.innerWidth, window.innerHeight);
        const isMobileOrSmallTablet = isTouchDevice && maxDimension < 1024;

        const orientationScreen = document.getElementById('orientation-screen');
        if (isMobileOrSmallTablet && isPortrait) {
            if (game) {
                game.isPaused = true;
            }
            if (orientationScreen) orientationScreen.style.display = 'flex';
        } else {
            if (game) {
                game.isPaused = false;
            }
            if (orientationScreen) orientationScreen.style.display = 'none';
        }
    }

    window.addEventListener('resize', checkOrientation);
    checkOrientation();
});
