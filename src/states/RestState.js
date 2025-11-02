import { GameState } from './GameState.js';

export class RestState extends GameState {
    constructor(game, gameData, daysToRest) {
        super(game);
        this.gameData = gameData;
        this.totalDays = daysToRest;
        this.daysRemaining = daysToRest;
        this.dayTimer = 0;
        this.dayLength = 2.0; // 1 second per day
        this.dailyLog = [];
        this.rationMap = {
            'bare bones': 2,
            'meager': 3,
            'filling': 4
        };
    }
    
    enter() {
        this.daysRemaining = this.totalDays;
        this.dayTimer = 0;
        this.dailyLog = [];
        this.addLogMessage(`Resting for ${this.totalDays} ${this.totalDays === 1 ? 'day' : 'days'}...`);
    }
    
    update(deltaTime, input) {
        if (this.daysRemaining > 0) {
            this.dayTimer += deltaTime;
            
            if (this.dayTimer >= this.dayLength) {
                this.dayTimer = 0;
                this.advanceRestDay();
            }
        } else {
            // Rest complete - return to menu after a short delay
            if (input.keyBuffer.includes('Enter') || input.keyBuffer.includes(' ')) {
                this.game.stateManager.popState();
            }
        }
    }
    
    advanceRestDay() {
        // Advance date
        this.gameData.currentDay++;
        const daysInMonth = this.getDaysInMonth(this.gameData.currentMonth);
        if (this.gameData.currentDay > daysInMonth) {
            this.gameData.currentDay = 1;
            this.gameData.currentMonth++;
            if (this.gameData.currentMonth > 12) {
                this.gameData.currentMonth = 1;
                this.gameData.year++;
            }
        }
        
        // Consume food
        const foodPerPerson = this.rationMap[this.gameData.rations] || 3;
        const foodNeeded = foodPerPerson * this.gameData.getAliveMembers().length;
        
        if (this.gameData.supplies.food >= foodNeeded) {
            this.gameData.supplies.food -= foodNeeded;
        } else {
            this.gameData.supplies.food = 0;
            this.addLogMessage('Out of food during rest!');
        }
        
        // Recovery and healing
        const recoveries = [];
        const healthGains = [];
        
        this.gameData.partyMembers.forEach(member => {
            if (!member.alive) return;
            
            // Health recovery
            const healthBefore = member.health;
            member.health = Math.min(100, member.health + 5);
            const gained = member.health - healthBefore;
            
            if (gained > 0) {
                healthGains.push(`${member.name} +${gained.toFixed(0)}%`);
            }
            
            // Illness recovery
            if (member.illness) {
                member.illnessDays = (member.illnessDays || 0) + 1;
                
                // High chance of recovery when resting
                const recoveryChance = 20 + 10 + (member.illnessDays * 3);
                if (Math.random() * 100 < recoveryChance) {
                    recoveries.push(`${member.name} recovered from ${member.illness}!`);
                    member.illness = null;
                    member.illnessDays = 0;
                }
            }
        });
        
        // Log recoveries
        if (recoveries.length > 0) {
            recoveries.forEach(msg => this.addLogMessage(msg));
        }
        
        // Log health gains
        if (healthGains.length > 0) {
            this.addLogMessage(`Health recovered: ${healthGains.join(', ')}`);
        }
        
        this.daysRemaining--;
        
        if (this.daysRemaining === 0) {
            this.addLogMessage('Rest complete!');
        }
    }
    
    addLogMessage(message) {
        this.dailyLog.push({
            day: this.totalDays - this.daysRemaining + 1,
            message: message
        });
        
        // Keep only last 10 messages
        if (this.dailyLog.length > 10) {
            this.dailyLog.shift();
        }
    }
    
    getDaysInMonth(month) {
        const days = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return days[month];
    }
    
    render(renderer) {
        const centerX = renderer.width / 2;
        
        // Status bar
        this.renderStatusBar(renderer);
        
        // Rest scene
        this.renderRestScene(renderer, centerX);
        
        // Info panel
        this.renderInfoPanel(renderer);
    }
    
    renderStatusBar(renderer) {
        const y = 20;
        
        renderer.drawText(this.gameData.getDateString(), 20, y, renderer.colors.info);
        
        const restStatus = this.daysRemaining > 0 
            ? `Resting: ${this.daysRemaining} ${this.daysRemaining === 1 ? 'day' : 'days'} remaining`
            : 'Rest Complete';
        const statusColor = this.daysRemaining > 0 ? renderer.colors.accent : renderer.colors.primary;
        renderer.drawText(restStatus, 250, y, statusColor);
        
        const health = `Health: ${this.gameData.health}`;
        const healthColor = this.gameData.health === 'good' ? renderer.colors.primary :
                           this.gameData.health === 'fair' ? renderer.colors.accent :
                           renderer.colors.danger;
        renderer.drawText(health, 600, y, healthColor);
    }
    
    renderRestScene(renderer, centerX) {
        const centerY = 140;
        
        // Rest camp visual
        renderer.drawText('=============================================', centerX, centerY - 40, renderer.colors.secondary, 'center');
        renderer.drawText('        *  *  *  CAMP  *  *  *        ', centerX, centerY - 15, renderer.colors.accent, 'center');
        
        // Campfire ASCII art
        const campfire = [
            '        .   *   .    ',
            '    *  .  \\ | /  .  *',
            '  .  *  - {|||} -  * .',
            '      *   /|\\   *    ',
            '    ______|______    '
        ];
        
        let fireY = centerY + 5;
        campfire.forEach(line => {
            renderer.drawText(line, centerX, fireY, renderer.colors.accent, 'center');
            fireY += 16;
        });
        
        renderer.drawText('Your party is resting by the campfire...', centerX, fireY + 10, renderer.colors.text, 'center');
        renderer.drawText('=============================================', centerX, fireY + 35, renderer.colors.secondary, 'center');
        
        // Progress indicator
        const progressY = fireY + 60;
        const totalBars = 10;
        const completedBars = Math.floor(((this.totalDays - this.daysRemaining) / this.totalDays) * totalBars);
        const progressBar = '█'.repeat(completedBars) + '░'.repeat(totalBars - completedBars);
        renderer.drawText(`Rest Progress: [${progressBar}]`, centerX, progressY, renderer.colors.info, 'center');
    }
    
    renderInfoPanel(renderer) {
        const y = 310;
        const centerX = renderer.width / 2;
        
        // Activity log (compact)
        renderer.drawText('Activity Log:', 50, y, renderer.colors.info);
        let logLineY = y + 20;
        const maxLogs = 5; // Show only last 5 logs
        const logsToShow = this.dailyLog.slice(-maxLogs);
        
        logsToShow.forEach(log => {
            const logText = `Day ${log.day}: ${log.message}`;
            const color = log.message.includes('recovered') ? renderer.colors.primary :
                         log.message.includes('Out of food') ? renderer.colors.danger :
                         renderer.colors.text;
            renderer.drawText(logText, 50, logLineY, color);
            logLineY += 18;
        });
        
        // Party with health bars
        const partyY = y;
        renderer.drawText('Party Health:', 420, partyY, renderer.colors.info);
        let memberY = partyY + 20;
        this.gameData.partyMembers.forEach(member => {
            if (member.alive) {
                const healthColor = member.health > 70 ? renderer.colors.primary :
                                  member.health > 40 ? renderer.colors.accent :
                                  renderer.colors.danger;
                
                let statusText = `${member.name}: ${Math.floor(member.health)}%`;
                if (member.illness) {
                    statusText += ` (${member.illness})`;
                }
                
                renderer.drawText(statusText, 420, memberY, healthColor);
                
                // Mini health bar
                const barWidth = 80;
                const barHeight = 8;
                const barX = 630;
                renderer.drawProgressBar(barX, memberY - 1, barWidth, barHeight, member.health, healthColor);
                
                memberY += 18;
            }
        });
        
        // Food supplies at bottom
        renderer.drawText(`Food: ${Math.floor(this.gameData.supplies.food)} lbs`, 50, 530, renderer.colors.text);
        
        // Instructions
        if (this.daysRemaining === 0) {
            renderer.drawText('Press SPACE or ENTER to continue', centerX, 555, renderer.colors.primary, 'center');
        }
    }
}
