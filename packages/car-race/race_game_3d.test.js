import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const rawHtmlContent = fs.readFileSync(path.resolve(__dirname, 'race_game_3d.HTML'), 'utf8');
const htmlContent = rawHtmlContent
    .replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js"><\/script>/, '')
    .replace(/<script src="vehicle_models\.js"><\/script>/, '')
    .replace(/<script src="[^"]*leaderboard\.js"><\/script>/, '');

const leaderboardCode = fs.readFileSync(path.resolve(__dirname, '../leaderboard/leaderboard.js'), 'utf8');

function createDom(localStorageData = {}, touchEnabled = false) {
    const dom = new JSDOM(htmlContent, {
        runScripts: "dangerously",
        resources: "usable",
        url: "http://localhost/",
        beforeParse(window) {
            if (touchEnabled) {
                window.ontouchstart = () => {};
                Object.defineProperty(window.navigator, 'maxTouchPoints', { value: 5, configurable: true });
            }
            window.setInterval = () => {};
            window.setTimeout = () => {};
            window.requestAnimationFrame = () => {};
            
            // Polyfill innerText mapping to textContent for JSDOM compatibility
            Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
                get() { return this.textContent; },
                set(value) { this.textContent = value; },
                configurable: true
            });
            
            // Mock Canvas for JSDOM environment compatibility
            window.HTMLCanvasElement.prototype.getContext = () => {
                return {
                    fillRect: () => {},
                    clearRect: () => {},
                    getImageData: () => ({ data: [] }),
                    putImageData: () => {},
                    createImageData: () => [],
                    setTransform: () => {},
                    drawImage: () => {},
                    save: () => {},
                    restore: () => {},
                    beginPath: () => {},
                    arc: () => {},
                    fill: () => {}
                };
            };

            const makeCallableProxy = () => {
                const fn = function() { return makeCallableProxy(); };
                fn.set = () => {};
                fn.lerp = () => {};
                fn.copy = () => {};
                fn.add = () => {};
                fn.remove = () => {};
                fn.setSize = () => {};
                fn.render = () => {};
                fn.updateProjectionMatrix = () => {};
                fn.x = 0;
                fn.y = 0;
                fn.z = 0;
                fn.width = 0;
                fn.height = 0;
                fn.enabled = false;
                fn.domElement = window.document.createElement('div');
                return new Proxy(fn, {
                    get(t, p) {
                        if (p === 'MathUtils') {
                            return { lerp: (a, b, t) => a + (b - a) * t };
                        }
                        if (p === 'RepeatWrapping' || p === 'DoubleSide' || p === 'ClampToEdgeWrapping') {
                            return 1;
                        }
                        if (p in t) return t[p];
                        return makeCallableProxy();
                    }
                });
            };

            // Mock THREE globally using the recursive proxy
            window.THREE = makeCallableProxy();
            
            // Define vehicle models placeholders that are referenced inside the game's script
            window.createCar = () => new window.THREE.Group();
            window.createFuturisticCar = () => new window.THREE.Group();
            window.createTruck = () => new window.THREE.Group();
            window.initializeSharedAssets = () => {};
            
            // Load and run the shared Leaderboard class
            window.eval(leaderboardCode + "; window.Leaderboard = Leaderboard;");
            
            // Pre-populate localStorage before script runs
            for (const [key, value] of Object.entries(localStorageData)) {
                window.localStorage.setItem(key, value);
            }
        }
    });
    return dom;
}

describe('3D Race Game Leaderboard Logic', () => {
    it('should initialize high score to 0 when leaderboard and old high score are empty', () => {
        const dom = createDom({});
        const pbScore = dom.window.document.getElementById('pb-score-3d').textContent.trim();
        const hudHighScore = dom.window.document.getElementById('hud-high-score-3d').textContent.trim();
        expect(pbScore).toBe('0');
        expect(hudHighScore).toBe('0');
        dom.window.close();
    });

    it('should migrate old high score to leaderboard if leaderboard is empty', () => {
        const dom = createDom({
            'race_game_3d_high_score': '150'
        });
        
        const leaderboard = JSON.parse(dom.window.localStorage.getItem('race_game_3d_leaderboard'));
        expect(leaderboard).toBeDefined();
        expect(leaderboard.length).toBe(1);
        expect(leaderboard[0].score).toBe(150);
        expect(leaderboard[0].name).toBe('BEST');
        
        const pbScore = dom.window.document.getElementById('pb-score-3d').textContent.trim();
        const hudHighScore = dom.window.document.getElementById('hud-high-score-3d').textContent.trim();
        expect(pbScore).toBe('150');
        expect(hudHighScore).toBe('150');
        dom.window.close();
    });

    it('should qualify for leaderboard when distance > 0 and leaderboard length < 10, even if distance is less than top score', () => {
        const initialLeaderboard = [
            { name: 'AAA', score: 500 },
            { name: 'BBB', score: 450 },
            { name: 'CCC', score: 400 }
        ];
        
        const dom = createDom({
            'race_game_3d_leaderboard': JSON.stringify(initialLeaderboard)
        });
        
        // Call displayLeaderboard3D with a score of 350
        dom.window.displayLeaderboard3D('leaderboard-records-go-3d', 'leaderboard-input-go-3d', 350, true, 'leaderboard-heading-go-3d', 'overlay-best-3d');

        const inputDiv = dom.window.document.getElementById('leaderboard-input-go-3d');
        const headingDiv = dom.window.document.getElementById('leaderboard-heading-go-3d');
        const bestSpan = dom.window.document.getElementById('overlay-best-3d');

        // It should qualify because leaderboard length (3) < 10
        expect(inputDiv.style.display).toBe('block');
        // Heading should be "YOU MADE THE TOP 10!" since score (350) < top score (500)
        expect(headingDiv.textContent.trim()).toBe('🎉 YOU MADE THE TOP 10! 🎉');
        // Best score displayed should be 500
        expect(bestSpan.textContent.trim()).toBe('500');
        dom.window.close();
    });

    it('should NOT qualify for leaderboard when score is less than the 10th score and leaderboard length is 10', () => {
        const initialLeaderboard = Array.from({ length: 10 }, (_, i) => ({
            name: `P${i}`,
            score: 500 - i * 30 // 500 down to 230
        }));
        
        const dom = createDom({
            'race_game_3d_leaderboard': JSON.stringify(initialLeaderboard)
        });
        
        // Call displayLeaderboard3D with 150m (which is < lowest score 230m)
        dom.window.displayLeaderboard3D('leaderboard-records-go-3d', 'leaderboard-input-go-3d', 150, true, 'leaderboard-heading-go-3d', 'overlay-best-3d');

        const inputDiv = dom.window.document.getElementById('leaderboard-input-go-3d');
        // It should NOT qualify
        expect(inputDiv.style.display).toBe('none');
        dom.window.close();
    });

    it('should correctly submit 3D distance score, sort, and slice to top 10', () => {
        const initialLeaderboard = [
            { name: 'AAA', score: 500 },
            { name: 'BBB', score: 450 },
            { name: 'CCC', score: 400 }
        ];
        
        const dom = createDom({
            'race_game_3d_leaderboard': JSON.stringify(initialLeaderboard)
        });
        
        // Mock playerDist and gameTime in the global state of JSDOM (corresponds to score = 480)
        dom.window.eval('playerDist = 4800; gameTime = 480;'); // distance = 480m, time = 480s -> score = 480
        
        // Set existing name input value
        const nameInput = dom.window.document.getElementById('player-name-go-3d');
        nameInput.value = 'RACER1';
        
        // Call submitScore3D
        dom.window.submitScore3D('player-name-go-3d', 'leaderboard-input-go-3d', 'leaderboard-records-go-3d');
        
        const updatedLeaderboard = JSON.parse(dom.window.localStorage.getItem('race_game_3d_leaderboard'));
        expect(updatedLeaderboard.length).toBe(4);
        // Correct order: 500, 480 (RACER1), 450, 400
        expect(updatedLeaderboard[0].name).toBe('AAA');
        expect(updatedLeaderboard[1].name).toBe('RACER1');
        expect(updatedLeaderboard[1].score).toBe(480);
        dom.window.close();
    });

    it('should submit 3D score when Enter key is pressed in the input field', () => {
        const initialLeaderboard = [
            { name: 'AAA', score: 500 }
        ];
        
        const dom = createDom({
            'race_game_3d_leaderboard': JSON.stringify(initialLeaderboard)
        });
        
        dom.window.eval('playerDist = 4800; gameTime = 480;');
        
        const nameInput = dom.window.document.getElementById('player-name-go-3d');
        nameInput.value = 'ENTER';
        
        // Dispatch 'Enter' keydown event
        const enterEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        nameInput.dispatchEvent(enterEvent);
        
        const updatedLeaderboard = JSON.parse(dom.window.localStorage.getItem('race_game_3d_leaderboard'));
        expect(updatedLeaderboard.length).toBe(2);
        expect(updatedLeaderboard[1].name).toBe('ENTER');
        expect(updatedLeaderboard[1].score).toBe(480);
        dom.window.close();
    });

    it('should restart the game when Enter key is pressed and victory overlay is shown', () => {
        const dom = createDom({});
        
        // Simulate end game state
        dom.window.eval('isPlaying = false;');
        const launchScreen = dom.window.document.getElementById('launch-screen');
        launchScreen.style.display = 'none';
        
        const vicOverlay = dom.window.document.getElementById('victory-overlay');
        vicOverlay.style.display = 'flex';
        
        // Spy on resetGame
        let resetCalled = false;
        dom.window.resetGame = () => { resetCalled = true; };
        
        // Dispatch 'Enter' keydown event on document body
        const enterEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        dom.window.document.body.dispatchEvent(enterEvent);
        
        expect(resetCalled).toBe(true);
        dom.window.close();
    });

    it('should select next vehicle variant when ArrowRight is pressed on the launch screen', () => {
        const dom = createDom({});
        dom.window.eval('isPlaying = false;');
        const launchScreen = dom.window.document.getElementById('launch-screen');
        launchScreen.style.display = 'flex';
        
        // Assert initial selection
        expect(dom.window.eval('selectedVehicleType')).toBe('car');
        
        // Dispatch ArrowRight
        const rightEvent = new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
        dom.window.document.body.dispatchEvent(rightEvent);
        
        expect(dom.window.eval('selectedVehicleType')).toBe('futuristic');
        dom.window.close();
    });

    it('should select previous vehicle variant when ArrowLeft is pressed on the launch screen', () => {
        const dom = createDom({});
        dom.window.eval('isPlaying = false;');
        const launchScreen = dom.window.document.getElementById('launch-screen');
        launchScreen.style.display = 'flex';
        
        // Dispatch ArrowLeft
        const leftEvent = new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
        dom.window.document.body.dispatchEvent(leftEvent);
        
        expect(dom.window.eval('selectedVehicleType')).toBe('truck');
        dom.window.close();
    });

    it('should start the game when Enter is pressed on the launch screen', () => {
        const dom = createDom({});
        dom.window.eval('isPlaying = false;');
        const launchScreen = dom.window.document.getElementById('launch-screen');
        launchScreen.style.display = 'flex';
        
        let startCalled = false;
        dom.window.pressStart = () => { startCalled = true; };
        
        const enterEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        dom.window.document.body.dispatchEvent(enterEvent);
        
        expect(startCalled).toBe(true);
        dom.window.close();
    });

    it('should freeze player and game time updates when countdown is active', () => {
        const dom = createDom({});
        dom.window.eval('isPlaying = true; countdownActive = true; playerDist = 0; gameTime = 0;');
        
        // Tick gameLoop
        dom.window.gameLoop();
        
        // Assert playerDist and gameTime remained unchanged
        expect(dom.window.eval('playerDist')).toBe(0);
        expect(dom.window.eval('gameTime')).toBe(0);
        dom.window.close();
    });
});

describe('3D Race Game Mobile Friendly Features', () => {
    it('should contain mobile controls and orientation screen elements in the HTML', () => {
        const dom = createDom({});
        const doc = dom.window.document;
        expect(doc.getElementById('mobile-controls')).not.toBeNull();
        expect(doc.getElementById('btn-left')).not.toBeNull();
        expect(doc.getElementById('btn-right')).not.toBeNull();
        expect(doc.getElementById('btn-nitro')).not.toBeNull();
        expect(doc.getElementById('orientation-screen')).not.toBeNull();
        dom.window.close();
    });

    it('should pause game and show overlay when touch device is in portrait mode', () => {
        const dom = createDom({}, true);
        const win = dom.window;
        const doc = win.document;

        // Force JSDOM window dimensions to portrait mobile
        Object.defineProperty(win, 'innerWidth', { value: 375, writable: true });
        Object.defineProperty(win, 'innerHeight', { value: 667, writable: true });
        
        // Mock active game state
        win.eval('isPlaying = true; countdownActive = false;');

        // Trigger orientation check
        win.checkOrientation();

        expect(doc.getElementById('orientation-screen').style.display).toBe('flex');
        expect(win.eval('isPaused')).toBe(true);
        dom.window.close();
    });

    it('should NOT pause game or show overlay when touch device is in landscape mode', () => {
        const dom = createDom({}, true);
        const win = dom.window;
        const doc = win.document;

        // Landscape mobile dimensions
        Object.defineProperty(win, 'innerWidth', { value: 667, writable: true });
        Object.defineProperty(win, 'innerHeight', { value: 375, writable: true });
        
        win.eval('isPlaying = true; countdownActive = false; isPaused = true;');

        win.checkOrientation();

        expect(doc.getElementById('orientation-screen').style.display).toBe('none');
        expect(win.eval('isPaused')).toBe(false);
        dom.window.close();
    });

    it('should auto-accelerate (set ArrowUp to true) when active racing is running on a touch device', () => {
        const dom = createDom({}, true);
        const win = dom.window;
        
        win.eval('isPlaying = true; countdownActive = false; keys.ArrowUp = false;');
        
        // Execute game loop logic
        win.gameLoop();
        
        expect(win.eval('keys.ArrowUp')).toBe(true);
        dom.window.close();
    });

    it('should map touch button pointer events to arrow/space key states', () => {
        const dom = createDom({}, true);
        const win = dom.window;
        const doc = win.document;

        const leftBtn = doc.getElementById('btn-left');
        const rightBtn = doc.getElementById('btn-right');
        const nitroBtn = doc.getElementById('btn-nitro');

        // Dispatch pointerdown on left button
        leftBtn.dispatchEvent(new win.PointerEvent('pointerdown', { bubbles: true }));
        expect(win.eval('keys.ArrowLeft')).toBe(true);

        // Dispatch pointerup on left button
        leftBtn.dispatchEvent(new win.PointerEvent('pointerup', { bubbles: true }));
        expect(win.eval('keys.ArrowLeft')).toBe(false);

        // Dispatch pointerdown on right button
        rightBtn.dispatchEvent(new win.PointerEvent('pointerdown', { bubbles: true }));
        expect(win.eval('keys.ArrowRight')).toBe(true);

        // Dispatch pointerup on right button
        rightBtn.dispatchEvent(new win.PointerEvent('pointerup', { bubbles: true }));
        expect(win.eval('keys.ArrowRight')).toBe(false);

        // Dispatch pointerdown on nitro button
        nitroBtn.dispatchEvent(new win.PointerEvent('pointerdown', { bubbles: true }));
        expect(win.eval('keys.Space')).toBe(true);

        // Dispatch pointerup on nitro button
        nitroBtn.dispatchEvent(new win.PointerEvent('pointerup', { bubbles: true }));
        expect(win.eval('keys.Space')).toBe(false);

        dom.window.close();
    });
});
