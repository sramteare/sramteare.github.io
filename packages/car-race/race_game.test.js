import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const rawHtmlContent = fs.readFileSync(path.resolve(__dirname, 'race_game.HTML'), 'utf8');
const htmlContent = rawHtmlContent.replace(/<script src="[^"]*leaderboard\.js"><\/script>/, '');

const leaderboardCode = fs.readFileSync(path.resolve(__dirname, '../leaderboard/leaderboard.js'), 'utf8');

function createDom(localStorageData = {}) {
    const dom = new JSDOM(htmlContent, {
        runScripts: "dangerously",
        resources: "usable",
        url: "http://localhost/",
        beforeParse(window) {
            window.setInterval = () => {};
            window.setTimeout = () => {};
            window.requestAnimationFrame = () => {};
            
            // Polyfill innerText mapping to textContent for JSDOM compatibility
            Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
                get() { return this.textContent; },
                set(value) { this.textContent = value; },
                configurable: true
            });
            
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

describe('2D Race Game Leaderboard Logic', () => {
    it('should initialize high score to 0 when leaderboard and old high score are empty', () => {
        const dom = createDom({});
        const hudHighScore = dom.window.document.getElementById('hud-high-score-2d').textContent.trim();
        expect(hudHighScore).toBe('0');
        dom.window.close();
    });

    it('should migrate old high score to leaderboard if leaderboard is empty', () => {
        const dom = createDom({
            'race_game_2d_high_score': '25'
        });
        
        const leaderboard = JSON.parse(dom.window.localStorage.getItem('race_game_2d_leaderboard'));
        expect(leaderboard).toBeDefined();
        expect(leaderboard.length).toBe(1);
        expect(leaderboard[0].score).toBe(25);
        expect(leaderboard[0].name).toBe('BEST');
        
        const hudHighScore = dom.window.document.getElementById('hud-high-score-2d').textContent.trim();
        expect(hudHighScore).toBe('25');
        dom.window.close();
    });

    it('should qualify for leaderboard when score is > 0 and leaderboard length < 10, even if score is less than top score', () => {
        const initialLeaderboard = [
            { name: 'AAA', score: 30 },
            { name: 'BBB', score: 25 },
            { name: 'CCC', score: 22 }
        ];
        
        const dom = createDom({
            'race_game_2d_leaderboard': JSON.stringify(initialLeaderboard)
        });
        
        // Set score variables to yield a score of 20 (20^2 / 20 = 20)
        dom.window.eval('distanceCovered = 20; gameTime = 20;');
        
        // Call displayLeaderboard (simulate game over)
        dom.window.displayLeaderboard('leaderboard-records-go', 'leaderboard-input-go', true, 'leaderboard-heading-go', 'overlay-best-2d');

        const inputDiv = dom.window.document.getElementById('leaderboard-input-go');
        const headingDiv = dom.window.document.getElementById('leaderboard-heading-go');
        const bestSpan = dom.window.document.getElementById('overlay-best-2d');

        // It should qualify because leaderboard length (3) < 10
        expect(inputDiv.style.display).toBe('block');
        // Heading should be "YOU MADE THE TOP 10!" since score (20) < top score (30)
        expect(headingDiv.textContent.trim()).toBe('🎉 YOU MADE THE TOP 10! 🎉');
        // Best score displayed should be 30
        expect(bestSpan.textContent.trim()).toBe('30');
        dom.window.close();
    });

    it('should NOT qualify for leaderboard when score is less than the 10th score and leaderboard length is 10', () => {
        const initialLeaderboard = Array.from({ length: 10 }, (_, i) => ({
            name: `P${i}`,
            score: 50 - i * 2 // 50 down to 32
        }));
        
        const dom = createDom({
            'race_game_2d_leaderboard': JSON.stringify(initialLeaderboard)
        });
        
        // Set score to 20
        dom.window.eval('score = 20;');
        
        // Call displayLeaderboard
        dom.window.displayLeaderboard('leaderboard-records-go', 'leaderboard-input-go', true, 'leaderboard-heading-go', 'overlay-best-2d');

        const inputDiv = dom.window.document.getElementById('leaderboard-input-go');
        // It should NOT qualify because 20 is less than the 10th place score (32)
        expect(inputDiv.style.display).toBe('none');
        dom.window.close();
    });

    it('should correctly submit score, sort descending, and slice to top 10', () => {
        const initialLeaderboard = [
            { name: 'AAA', score: 30 },
            { name: 'BBB', score: 25 },
            { name: 'CCC', score: 22 }
        ];
        
        const dom = createDom({
            'race_game_2d_leaderboard': JSON.stringify(initialLeaderboard)
        });
        
        // Set score variables to yield a score of 24 (24^2 / 24 = 24)
        dom.window.eval('distanceCovered = 24; gameTime = 24;');
        
        // Update existing name input value
        const nameInput = dom.window.document.getElementById('player-name-go');
        nameInput.value = 'TESTER';
        
        // Call submitScore2D
        dom.window.submitScore2D('player-name-go', 'leaderboard-input-go', 'leaderboard-records-go');
        
        const updatedLeaderboard = JSON.parse(dom.window.localStorage.getItem('race_game_2d_leaderboard'));
        expect(updatedLeaderboard.length).toBe(4);
        // Correct order: 30, 25, 24 (TESTER), 22
        expect(updatedLeaderboard[0].name).toBe('AAA');
        expect(updatedLeaderboard[1].name).toBe('BBB');
        expect(updatedLeaderboard[2].name).toBe('TESTER');
        expect(updatedLeaderboard[2].score).toBe(24);
        expect(updatedLeaderboard[3].name).toBe('CCC');
        dom.window.close();
    });

    it('should submit score when Enter key is pressed in the input field', () => {
        const initialLeaderboard = [
            { name: 'AAA', score: 30 }
        ];
        
        const dom = createDom({
            'race_game_2d_leaderboard': JSON.stringify(initialLeaderboard)
        });
        
        dom.window.eval('distanceCovered = 24; gameTime = 24;');
        
        const nameInput = dom.window.document.getElementById('player-name-go');
        nameInput.value = 'ENTER';
        
        // Dispatch 'Enter' keydown event
        const enterEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        nameInput.dispatchEvent(enterEvent);
        
        const updatedLeaderboard = JSON.parse(dom.window.localStorage.getItem('race_game_2d_leaderboard'));
        expect(updatedLeaderboard.length).toBe(2);
        expect(updatedLeaderboard[1].name).toBe('ENTER');
        expect(updatedLeaderboard[1].score).toBe(24);
        dom.window.close();
    });

    it('should restart the game when Enter key is pressed and game over screen is shown', () => {
        const dom = createDom({});
        
        // Simulate game over state
        dom.window.eval('isPlaying = false;');
        const gameOverScreen = dom.window.document.getElementById('game-over-screen');
        gameOverScreen.style.display = 'flex';
        
        // Spy on resetGame
        let resetCalled = false;
        dom.window.resetGame = () => { resetCalled = true; };
        
        // Dispatch 'Enter' keydown event on document body
        const enterEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        dom.window.document.body.dispatchEvent(enterEvent);
        
        expect(resetCalled).toBe(true);
        dom.window.close();
    });

    it('should freeze game updates and not spawn enemies when countdown is active', () => {
        const dom = createDom({});
        dom.window.eval('isPlaying = true; countdownActive = true; distanceCovered = 10; gameTime = 0;');
        
        // Execute updateGame tick
        dom.window.updateGame();
        
        // Assert distance and time remained unchanged
        expect(dom.window.eval('distanceCovered')).toBe(10);
        expect(dom.window.eval('gameTime')).toBe(0);
        dom.window.close();
    });
});
