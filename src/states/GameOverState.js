import { GameState } from './GameState.js';
import { TitleState } from './TitleState.js';

export class GameOverState extends GameState {
    constructor(game, gameData, reason = 'death') {
        super(game);
        this.gameData = gameData;
        this.reason = reason; // death, reached, quit
        this.selectedOption = 0;
        this.options = ['Return to Main Menu', 'Quit'];
        this.score = this.calculateScore();
    }
    
    enter() {
        this.selectedOption = 0;
    }
    
    update(deltaTime, input) {
        if (input.keyBuffer.includes('ArrowDown')) {
            this.selectedOption = (this.selectedOption + 1) % this.options.length;
        }
        if (input.keyBuffer.includes('ArrowUp')) {
            this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
        }
        
        if (input.keyBuffer.includes('Enter')) {
            if (this.selectedOption === 0) {
                // Return to title
                this.game.stateManager.setState(new TitleState(this.game));
            } else {
                // Quit
                alert('Thanks for playing The Oregon Trail!');
            }
        }
    }
    
    render(renderer) {
        const centerX = renderer.width / 2;
        
        // Title based on reason
        if (this.reason === 'death') {
            renderer.drawText('GAME OVER', centerX, 50, renderer.colors.danger, 'center');
            renderer.drawText('Your entire party has perished on the trail.', centerX, 90, renderer.colors.text, 'center');
        } else if (this.reason === 'reached') {
            renderer.drawText('CONGRATULATIONS!', centerX, 50, renderer.colors.primary, 'center');
            renderer.drawText('You have reached Oregon!', centerX, 90, renderer.colors.text, 'center');
        }
        
        // Journey stats
        const statsY = 140;
        renderer.drawText('Journey Statistics', centerX, statsY, renderer.colors.accent, 'center');
        
        const stats = [
            '',
            `Leader: ${this.gameData.leaderName}`,
            `Profession: ${this.gameData.profession.name}`,
            ``,
            `Distance Traveled: ${this.gameData.milesTraveled} miles`,
            `Days on Trail: ${this.getDaysOnTrail()}`,
            `Final Date: ${this.gameData.getDateString()}`,
            ``,
            `Money Remaining: $${this.gameData.money.toFixed(2)}`,
            `Food Remaining: ${Math.floor(this.gameData.supplies.food)} lbs`
        ];
        
        renderer.drawTextBlock(stats, centerX - 150, statsY + 40, renderer.colors.text);
        
        // Score section
        const scoreY = statsY + 280;
        renderer.drawText('═══════════════════════════', centerX, scoreY, renderer.colors.secondary, 'center');
        renderer.drawText('FINAL SCORE', centerX, scoreY + 25, renderer.colors.accent, 'center', '20px');
        
        const scoreBreakdown = [
            `Distance: ${this.score.breakdown.distancePoints} pts`,
            `Survivors: ${this.score.breakdown.survivorPoints} pts`,
            `Health: ${this.score.breakdown.healthPoints} pts`,
            `Supplies: ${this.score.breakdown.suppliesPoints} pts`,
            `Cash: ${this.score.breakdown.cashPoints} pts`,
        ];
        
        if (this.score.breakdown.completionBonus > 0) {
            scoreBreakdown.push(`Completion Bonus: ${this.score.breakdown.completionBonus} pts`);
        }
        
        scoreBreakdown.push('');
        scoreBreakdown.push(`Base Score: ${this.score.breakdown.baseScore}`);
        scoreBreakdown.push(`Profession (x${this.score.breakdown.multiplier}): ${this.gameData.profession.name}`);
        scoreBreakdown.push('');
        
        renderer.drawTextBlock(scoreBreakdown, centerX - 150, scoreY + 55, renderer.colors.text, '16px');
        
        // Total score and rating
        const totalY = scoreY + 55 + (scoreBreakdown.length * 22);
        renderer.drawText(`TOTAL: ${this.score.total}`, centerX, totalY, renderer.colors.primary, 'center', '24px');
        renderer.drawText(this.getScoreRating(this.score.total), centerX, totalY + 35, renderer.colors.accent, 'center', '18px');
        renderer.drawText('═══════════════════════════', centerX, totalY + 65, renderer.colors.secondary, 'center');
        
        // Party status
        const partyY = statsY + 300;
        // renderer.drawText('Party Members', centerX, partyY, renderer.colors.info, 'center');
        
        // let memberY = partyY + 30;
        // this.gameData.partyMembers.forEach(member => {
        //     const status = member.alive ? `Alive (${Math.floor(member.health)}% health)` : 'Dead';
        //     const color = member.alive ? renderer.colors.primary : renderer.colors.danger;
        //     renderer.drawText(`${member.name}: ${status}`, centerX - 100, memberY, color);
        //     memberY += 25;
        // });
        
        // Menu options
        const menuY = 550;
        const buttonWidth = 300;
        const buttonHeight = 40;
        
        this.options.forEach((option, index) => {
            const x = centerX - buttonWidth / 2;
            const y = menuY + (index * 50);
            const isSelected = index === this.selectedOption;
            
            renderer.drawButton(option, x, y, buttonWidth, buttonHeight, isSelected);
        });
    }
    
    getDaysOnTrail() {
        // Calculate days from March 1, 1848 to current date
        const startMonth = 3;
        const startDay = 1;
        
        let days = 0;
        
        // Add days from months
        for (let m = startMonth; m < this.gameData.currentMonth; m++) {
            days += this.getDaysInMonth(m);
        }
        
        // Add days in current month
        days += this.gameData.currentDay - startDay;
        
        return days;
    }
    
    getDaysInMonth(month) {
        const daysPerMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return daysPerMonth[month];
    }
    
    calculateScore() {
        let score = 0;
        const breakdown = {};
        
        // Base score: distance traveled (1 point per mile)
        breakdown.distancePoints = this.gameData.milesTraveled;
        score += breakdown.distancePoints;
        
        // Surviving party members (50 points each)
        const survivors = this.gameData.partyMembers.filter(m => m.alive).length;
        breakdown.survivorPoints = survivors * 50;
        score += breakdown.survivorPoints;
        
        // Health of survivors (1 point per health point)
        const totalHealth = this.gameData.partyMembers
            .filter(m => m.alive)
            .reduce((sum, m) => sum + m.health, 0);
        breakdown.healthPoints = Math.floor(totalHealth);
        score += breakdown.healthPoints;
        
        // Remaining supplies value
        const suppliesValue = 
            (this.gameData.supplies.oxen * 25) +
            (this.gameData.supplies.food * 0.2) +
            (this.gameData.supplies.clothing * 10) +
            (this.gameData.supplies.ammunition * 2) +
            (this.gameData.supplies.wheels * 10) +
            (this.gameData.supplies.axles * 10) +
            (this.gameData.supplies.tongues * 10);
        breakdown.suppliesPoints = Math.floor(suppliesValue);
        score += breakdown.suppliesPoints;
        
        // Remaining cash (0.5 points per dollar)
        breakdown.cashPoints = Math.floor(this.gameData.money * 0.5);
        score += breakdown.cashPoints;
        
        // Bonus for reaching Oregon
        if (this.reason === 'reached') {
            breakdown.completionBonus = 500;
            score += breakdown.completionBonus;
        } else {
            breakdown.completionBonus = 0;
        }
        
        // Multiply by profession multiplier
        const baseScore = score;
        score = Math.floor(score * this.gameData.profession.scoreMultiplier);
        breakdown.baseScore = baseScore;
        breakdown.multiplier = this.gameData.profession.scoreMultiplier;
        
        return { total: score, breakdown };
    }
    
    getScoreRating(score) {
        if (score >= 10000) return 'Legendary Trail Blazer';
        if (score >= 7500) return 'Outstanding Pioneer';
        if (score >= 5000) return 'Successful Settler';
        if (score >= 3000) return 'Experienced Traveler';
        if (score >= 1500) return 'Competent Adventurer';
        if (score >= 500) return 'Novice Explorer';
        return 'Struggling Wanderer';
    }
}
