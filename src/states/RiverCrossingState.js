import { GameState } from './GameState.js';
import { TravelState } from './TravelState.js';

export class RiverCrossingState extends GameState {
    constructor(game, gameData, landmark) {
        super(game);
        this.gameData = gameData;
        this.landmark = landmark;
        this.selectedOption = 0;
        this.mode = 'choice'; // choice, crossing, result
        this.crossingMethod = null;
        this.crossingProgress = 0;
        this.crossingSpeed = 1;
        this.outcome = null;
        
        // River difficulty based on various factors
        this.riverDepth = this.calculateRiverDepth();
        this.riverWidth = this.calculateRiverWidth();
        
        this.options = [
            { name: 'Ford the river', cost: 0 },
            { name: 'Caulk the wagon and float', cost: 0 },
            { name: `Take a ferry ($${landmark.ferryPrice})`, cost: landmark.ferryPrice },
            { name: 'Wait to see if conditions improve', cost: 0 }
        ];
    }
    
    enter() {
        this.selectedOption = 0;
        this.mode = 'choice';
    }
    
    calculateRiverDepth() {
        // Base depth, modified by month (spring runoff)
        let depth = 2.5;
        
        // Spring months have higher water
        if (this.gameData.currentMonth >= 4 && this.gameData.currentMonth <= 6) {
            depth += 1.5;
        }
        
        // Weather affects depth
        if (this.gameData.weather === 'stormy') {
            depth += 1.0;
        }
        
        // Random variation
        depth += (Math.random() - 0.5) * 1.5;
        
        return Math.max(1.5, Math.min(6, depth)); // 1.5 to 6 feet
    }
    
    calculateRiverWidth() {
        // Width in feet, varies by river
        const baseWidths = {
            'Kansas River Crossing': 200,
            'Big Blue River Crossing': 180,
            'Snake River Crossing': 300
        };
        
        return baseWidths[this.landmark.name] || 200;
    }
    
    update(deltaTime, input) {
        if (this.mode === 'choice') {
            this.handleChoiceInput(input);
        } else if (this.mode === 'crossing') {
            this.handleCrossing(deltaTime);
        } else if (this.mode === 'result') {
            this.handleResultInput(input);
        }
    }
    
    handleChoiceInput(input) {
        if (input.keyBuffer.includes('ArrowDown')) {
            this.selectedOption = (this.selectedOption + 1) % this.options.length;
        }
        if (input.keyBuffer.includes('ArrowUp')) {
            this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
        }
        
        if (input.keyBuffer.includes('Enter')) {
            this.selectOption();
        }
    }
    
    selectOption() {
        const option = this.options[this.selectedOption];
        
        switch (this.selectedOption) {
            case 0: // Ford
                this.crossingMethod = 'ford';
                this.startCrossing();
                break;
            case 1: // Caulk and float
                this.crossingMethod = 'caulk';
                this.startCrossing();
                break;
            case 2: // Ferry
                if (this.gameData.money >= option.cost) {
                    this.crossingMethod = 'ferry';
                    this.gameData.money -= option.cost;
                    this.startCrossing();
                } else {
                    this.outcome = {
                        success: false,
                        message: 'Not enough money for the ferry!',
                        losses: []
                    };
                    this.mode = 'result';
                }
                break;
            case 3: // Wait
                this.waitForBetterConditions();
                break;
        }
    }
    
    startCrossing() {
        this.mode = 'crossing';
        this.crossingProgress = 0;
        this.crossingSpeed = 1;
    }
    
    handleCrossing(deltaTime) {
        this.crossingProgress += deltaTime * this.crossingSpeed * 20;
        
        if (this.crossingProgress >= 100) {
            this.completeCrossing();
        }
    }
    
    completeCrossing() {
        this.mode = 'result';
        this.outcome = this.calculateOutcome();
        
        // Apply outcome
        if (!this.outcome.success) {
            this.outcome.losses.forEach(loss => {
                if (loss.type === 'food') {
                    this.gameData.supplies.food = Math.max(0, this.gameData.supplies.food - loss.amount);
                } else if (loss.type === 'clothing') {
                    this.gameData.supplies.clothing = Math.max(0, this.gameData.supplies.clothing - loss.amount);
                } else if (loss.type === 'ammunition') {
                    this.gameData.supplies.ammunition = Math.max(0, this.gameData.supplies.ammunition - loss.amount);
                } else if (loss.type === 'oxen') {
                    this.gameData.supplies.oxen = Math.max(0, this.gameData.supplies.oxen - loss.amount);
                } else if (loss.type === 'wheels') {
                    this.gameData.supplies.wheels = Math.max(0, this.gameData.supplies.wheels - loss.amount);
                } else if (loss.type === 'health') {
                    this.gameData.partyMembers.forEach(member => {
                        if (member.alive) {
                            member.health = Math.max(0, member.health - loss.amount);
                            if (member.health <= 0) {
                                member.alive = false;
                            }
                        }
                    });
                } else if (loss.type === 'death') {
                    // Random party member drowns
                    const aliveMembers = this.gameData.getAliveMembers();
                    if (aliveMembers.length > 0) {
                        const victim = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
                        victim.alive = false;
                        victim.health = 0;
                    }
                }
            });
        }
    }
    
    calculateOutcome() {
        let successChance = 100;
        const losses = [];
        
        if (this.crossingMethod === 'ferry') {
            // Ferry is almost always safe
            return {
                success: true,
                message: 'Made it safely across on the ferry.',
                losses: []
            };
        }
        
        if (this.crossingMethod === 'ford') {
            // Depth affects ford success
            if (this.riverDepth < 2.5) {
                successChance = 90;
            } else if (this.riverDepth < 4) {
                successChance = 60;
            } else {
                successChance = 30;
            }
            
            // Oxen help
            if (this.gameData.supplies.oxen >= 3) {
                successChance += 10;
            }
            
            // Check success
            if (Math.random() * 100 < successChance) {
                return {
                    success: true,
                    message: 'Forded the river successfully!',
                    losses: []
                };
            } else {
                // Failed ford - calculate losses
                const severity = Math.random();
                
                if (severity < 0.3) {
                    // Minor loss
                    losses.push({ type: 'food', amount: Math.floor(20 + Math.random() * 30) });
                    losses.push({ type: 'clothing', amount: 1 });
                    return {
                        success: false,
                        message: 'Lost some supplies in the river.',
                        losses
                    };
                } else if (severity < 0.7) {
                    // Major loss
                    losses.push({ type: 'food', amount: Math.floor(50 + Math.random() * 50) });
                    losses.push({ type: 'clothing', amount: 2 });
                    losses.push({ type: 'ammunition', amount: Math.floor(1 + Math.random() * 3) });
                    losses.push({ type: 'health', amount: 15 });
                    return {
                        success: false,
                        message: 'The river was too deep! Lost supplies and everyone is exhausted.',
                        losses
                    };
                } else {
                    // Catastrophic
                    losses.push({ type: 'death', amount: 1 });
                    losses.push({ type: 'food', amount: Math.floor(80 + Math.random() * 100) });
                    losses.push({ type: 'oxen', amount: 1 });
                    return {
                        success: false,
                        message: 'Disaster! The current was too strong!',
                        losses
                    };
                }
            }
        }
        
        if (this.crossingMethod === 'caulk') {
            // Caulking is safer than fording but can still fail
            successChance = 75;
            
            if (this.gameData.weather === 'stormy') {
                successChance -= 20;
            }
            
            if (Math.random() * 100 < successChance) {
                return {
                    success: true,
                    message: 'Caulked the wagon and floated across safely!',
                    losses: []
                };
            } else {
                // Failed caulking
                const severity = Math.random();
                
                if (severity < 0.5) {
                    losses.push({ type: 'food', amount: Math.floor(30 + Math.random() * 40) });
                    losses.push({ type: 'clothing', amount: Math.floor(1 + Math.random() * 2) });
                    return {
                        success: false,
                        message: 'Wagon tipped! Lost supplies in the water.',
                        losses
                    };
                } else {
                    losses.push({ type: 'food', amount: Math.floor(60 + Math.random() * 80) });
                    losses.push({ type: 'wheels', amount: 1 });
                    losses.push({ type: 'health', amount: 20 });
                    return {
                        success: false,
                        message: 'Wagon sank! Lost supplies and damaged wagon.',
                        losses
                    };
                }
            }
        }
        
        return { success: true, message: '', losses: [] };
    }
    
    waitForBetterConditions() {
        // Advance time by a few days
        const daysWaited = Math.floor(2 + Math.random() * 3);
        
        for (let i = 0; i < daysWaited; i++) {
            this.gameData.currentDay++;
            const daysInMonth = this.getDaysInMonth(this.gameData.currentMonth);
            if (this.gameData.currentDay > daysInMonth) {
                this.gameData.currentDay = 1;
                this.gameData.currentMonth++;
            }
        }
        
        // Consume food for waiting
        const foodConsumed = daysWaited * 3 * this.gameData.getAliveMembers().length;
        this.gameData.supplies.food = Math.max(0, this.gameData.supplies.food - foodConsumed);
        
        // Recalculate river conditions
        this.riverDepth = this.calculateRiverDepth();
        
        this.outcome = {
            success: true,
            message: `Waited ${daysWaited} days. Consumed ${foodConsumed} lbs of food.`,
            losses: []
        };
        this.mode = 'result';
    }
    
    handleResultInput(input) {
        if (input.keyBuffer.includes('Enter') || input.keyBuffer.includes(' ')) {
            // Check if anyone died
            if (this.gameData.getAliveMembers().length === 0) {
                const GameOverState = require('./GameOverState.js').GameOverState;
                this.game.stateManager.setState(new GameOverState(this.game, this.gameData, 'death'));
            } else {
                // Continue traveling
                this.game.stateManager.popState();
            }
        }
    }
    
    getDaysInMonth(month) {
        const days = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return days[month];
    }
    
    render(renderer) {
        const centerX = renderer.width / 2;
        
        if (this.mode === 'choice') {
            this.renderChoice(renderer, centerX);
        } else if (this.mode === 'crossing') {
            this.renderCrossing(renderer, centerX);
        } else if (this.mode === 'result') {
            this.renderResult(renderer, centerX);
        }
    }
    
    renderChoice(renderer, centerX) {
        renderer.drawText(this.landmark.name, centerX, 30, renderer.colors.accent, 'center');
        renderer.drawText(this.landmark.description, centerX, 60, renderer.colors.text, 'center');
        
        // River conditions
        const conditionsY = 100;
        const depthText = `River depth: ${this.riverDepth.toFixed(1)} feet`;
        const widthText = `River width: ${this.riverWidth} feet`;
        
        renderer.drawText(depthText, centerX, conditionsY, renderer.colors.info, 'center');
        renderer.drawText(widthText, centerX, conditionsY + 25, renderer.colors.info, 'center');
        
        // Weather warning
        if (this.gameData.weather === 'stormy') {
            renderer.drawText('Warning: Stormy weather makes crossing dangerous!', 
                centerX, conditionsY + 60, renderer.colors.danger, 'center');
        }
        
        // Depth warning
        if (this.riverDepth > 4) {
            renderer.drawText('Warning: River is very deep and dangerous!', 
                centerX, conditionsY + 85, renderer.colors.danger, 'center');
        }
        
        // Options
        const optionsY = 220;
        const buttonHeight = 50;
        const buttonWidth = 400;
        
        renderer.drawText('What do you want to do?', centerX, optionsY, renderer.colors.primary, 'center');
        
        this.options.forEach((option, index) => {
            const y = optionsY + 40 + (index * buttonHeight);
            const isSelected = index === this.selectedOption;
            
            // Disable ferry if not enough money
            const canAfford = option.cost <= this.gameData.money;
            const disabled = option.cost > 0 && !canAfford;
            
            let displayText = option.name;
            if (disabled) displayText += ' (Cannot afford)';
            
            renderer.drawButton(displayText, centerX - buttonWidth / 2, y, buttonWidth, 45, isSelected && !disabled);
        });
        
        // Money display
        renderer.drawText(`Money: $${this.gameData.money.toFixed(2)}`, centerX, 500, renderer.colors.primary, 'center');
    }
    
    renderCrossing(renderer, centerX) {
        renderer.drawText('Crossing the river...', centerX, 100, renderer.colors.accent, 'center');
        
        // ASCII art river
        const riverY = 200;
        const waves = ['~', '~', '~', '~', '~', '~', '~', '~', '~', '~'];
        const waveText = waves.join(' ').repeat(3);
        
        renderer.drawText(waveText, centerX, riverY, renderer.colors.info, 'center');
        renderer.drawText(waveText, centerX, riverY + 30, renderer.colors.info, 'center');
        renderer.drawText(waveText, centerX, riverY + 60, renderer.colors.info, 'center');
        
        // Wagon position
        const wagonX = 100 + (600 * (this.crossingProgress / 100));
        renderer.drawText('[WAGON]', wagonX, riverY + 30, renderer.colors.primary);
        
        // Progress bar
        renderer.drawProgressBar(100, 350, 600, 30, this.crossingProgress, renderer.colors.primary);
        
        const methodText = this.crossingMethod === 'ford' ? 'Fording' :
                          this.crossingMethod === 'caulk' ? 'Floating' : 'On Ferry';
        renderer.drawText(methodText, centerX, 400, renderer.colors.text, 'center');
    }
    
    renderResult(renderer, centerX) {
        const titleY = 80;
        
        if (this.outcome.success) {
            renderer.drawText('Success!', centerX, titleY, renderer.colors.primary, 'center');
        } else {
            renderer.drawText('Crossing Failed!', centerX, titleY, renderer.colors.danger, 'center');
        }
        
        renderer.drawText(this.outcome.message, centerX, titleY + 50, renderer.colors.text, 'center');
        
        // Show losses
        if (this.outcome.losses.length > 0) {
            const lossY = titleY + 120;
            renderer.drawText('Losses:', centerX, lossY, renderer.colors.info, 'center');
            
            let y = lossY + 35;
            this.outcome.losses.forEach(loss => {
                let lossText = '';
                if (loss.type === 'death') {
                    lossText = 'A party member drowned';
                } else if (loss.type === 'health') {
                    lossText = `Party health reduced by ${loss.amount}%`;
                } else {
                    lossText = `${loss.amount} ${loss.type}`;
                }
                renderer.drawText(`- ${lossText}`, centerX, y, renderer.colors.danger, 'center');
                y += 30;
            });
        }
        
        // Current party status
        const statusY = 400;
        renderer.drawText('Party Status:', centerX, statusY, renderer.colors.info, 'center');
        
        let memberY = statusY + 30;
        this.gameData.partyMembers.forEach(member => {
            const status = member.alive ? `${Math.floor(member.health)}%` : 'Dead';
            const color = member.alive ? renderer.colors.primary : renderer.colors.danger;
            renderer.drawText(`${member.name}: ${status}`, centerX, memberY, color, 'center');
            memberY += 25;
        });
        
        renderer.drawText('Press Enter to continue', centerX, 540, renderer.colors.secondary, 'center');
    }
}
