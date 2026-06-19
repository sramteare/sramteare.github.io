class Leaderboard {
    constructor(storageKey, oldHighScoreKey = null) {
        this.storageKey = storageKey;
        this.oldHighScoreKey = oldHighScoreKey;
        this.leaderboard = this.load();
        this.migrate();
    }

    load() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch (e) {
            return [];
        }
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.leaderboard));
    }

    migrate() {
        if (this.oldHighScoreKey && this.leaderboard.length === 0) {
            const oldScore = parseInt(localStorage.getItem(this.oldHighScoreKey) || '0', 10);
            if (oldScore > 0) {
                this.leaderboard = [{ name: 'BEST', score: oldScore }];
                this.save();
            }
        }
    }

    getBestScore() {
        return this.leaderboard[0] ? this.leaderboard[0].score : 0;
    }

    qualifies(score) {
        return score > 0 && (this.leaderboard.length < 10 || score > this.leaderboard[this.leaderboard.length - 1].score);
    }

    submit(name, score) {
        const slicedName = ((name || '').trim() || 'ANONYMOUS').toUpperCase().slice(0, 6);
        
        // Mark previous entries as not new
        this.leaderboard.forEach(entry => entry.isNew = false);
        
        // Add new entry
        this.leaderboard.push({ name: slicedName, score: score, isNew: true });
        
        // Sort descending
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep top 10
        this.leaderboard = this.leaderboard.slice(0, 10);
        this.save();
        
        // Sync old high score key too for backward compatibility
        if (this.oldHighScoreKey) {
            localStorage.setItem(this.oldHighScoreKey, String(this.getBestScore()));
        }
        
        return this.leaderboard;
    }

    render(recordsContainerId, inputContainerId, finalScore, checkScore, headingId, bestSpanId, is3D = false) {
        const listContainer = document.getElementById(recordsContainerId);
        const inputContainer = document.getElementById(inputContainerId);
        const headingContainer = document.getElementById(headingId);
        const bestSpan = document.getElementById(bestSpanId);
        
        const currentBest = this.getBestScore();
        
        if (bestSpan) {
            bestSpan.innerText = currentBest;
        }
        
        const qualifies = checkScore && this.qualifies(finalScore);
        
        if (qualifies && inputContainer) {
            inputContainer.style.display = 'block';
            if (headingContainer) {
                if (finalScore > currentBest || this.leaderboard.length === 0) {
                    headingContainer.innerText = "🎉 NEW HIGH SCORE! 🎉";
                } else {
                    headingContainer.innerText = "🎉 YOU MADE THE TOP 10! 🎉";
                }
            }
            const inputEl = inputContainer.querySelector('input');
            if (inputEl) {
                setTimeout(() => {
                    inputEl.focus();
                }, 150);
            }
        } else if (inputContainer) {
            inputContainer.style.display = 'none';
        }
        
        if (listContainer) {
            if (this.leaderboard.length === 0) {
                listContainer.innerHTML = '<div style="text-align: center; color: #7f8c8d;">No scores yet!</div>';
            } else {
                listContainer.innerHTML = this.leaderboard.map((entry, index) => {
                    const isCurrentUser = (entry.score === finalScore && entry.isNew);
                    const rankColor = index === 0 ? '#f1c40f' : (index === 1 ? '#bdc3c7' : (index === 2 ? '#cd7f32' : '#fff'));
                    const scoreDisplay = entry.score;
                    return `
                        <div style="display: flex; justify-content: space-between; color: ${rankColor}; font-weight: ${isCurrentUser ? 'bold' : 'normal'}">
                            <span>${index + 1}. ${entry.name}</span>
                            <span>${scoreDisplay}</span>
                        </div>
                    `;
                }).join('');
            }
        }
    }
}

// Export for Node/Vitest environment
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Leaderboard;
}
