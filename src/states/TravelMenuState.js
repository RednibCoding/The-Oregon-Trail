import { GameState } from './GameState.js';
import { RestState } from './RestState.js';
import { HuntingState } from './HuntingState.js';

export class TravelMenuState extends GameState {
    constructor(game, gameData) {
        super(game);
        this.gameData = gameData;
        this.selectedOption = 0;
        this.menuType = 'main'; // main, pace, rations
        
        this.mainOptions = [
            'Continue on trail',
            'Check supplies',
            'Change pace',
            'Change food rations',
            'Stop to rest',
            'Attempt to trade',
            'Hunt for food'
        ];
        
        this.restDays = 1;
        
        this.paceOptions = [
            { name: 'Slow', description: 'Slow and steady - best for health' },
            { name: 'Steady', description: 'Reasonable pace - balanced' },
            { name: 'Grueling', description: 'Fast pace - wears down health' }
        ];
        
        this.rationOptions = [
            { name: 'Bare bones', description: 'Minimum food - health declines' },
            { name: 'Meager', description: 'Small portions - health suffers' },
            { name: 'Filling', description: 'Full portions - good health' }
        ];
    }
    
    enter() {
        this.selectedOption = 0;
        this.menuType = 'main';
    }
    
    update(deltaTime, input) {
        if (this.menuType === 'main') {
            this.handleMainMenu(input);
        } else if (this.menuType === 'pace') {
            this.handlePaceMenu(input);
        } else if (this.menuType === 'rations') {
            this.handleRationsMenu(input);
        } else if (this.menuType === 'supplies') {
            this.handleSuppliesView(input);
        } else if (this.menuType === 'rest') {
            this.handleRestMenu(input);
        }
    }
    
    handleMainMenu(input) {
        const optionsLength = this.mainOptions.length;
        
        if (input.keyBuffer.includes('ArrowDown')) {
            this.selectedOption = (this.selectedOption + 1) % optionsLength;
        }
        if (input.keyBuffer.includes('ArrowUp')) {
            this.selectedOption = (this.selectedOption - 1 + optionsLength) % optionsLength;
        }
        
        if (input.keyBuffer.includes('Enter')) {
            this.selectMainOption();
        }
        
        if (input.keyBuffer.includes('Escape')) {
            this.game.stateManager.popState();
        }
    }
    
    handlePaceMenu(input) {
        if (input.keyBuffer.includes('ArrowDown')) {
            this.selectedOption = (this.selectedOption + 1) % this.paceOptions.length;
        }
        if (input.keyBuffer.includes('ArrowUp')) {
            this.selectedOption = (this.selectedOption - 1 + this.paceOptions.length) % this.paceOptions.length;
        }
        
        if (input.keyBuffer.includes('Enter')) {
            this.gameData.pace = this.paceOptions[this.selectedOption].name.toLowerCase();
            this.menuType = 'main';
            this.selectedOption = 0;
        }
        
        if (input.keyBuffer.includes('Escape')) {
            this.menuType = 'main';
            this.selectedOption = 0;
        }
    }
    
    handleRationsMenu(input) {
        if (input.keyBuffer.includes('ArrowDown')) {
            this.selectedOption = (this.selectedOption + 1) % this.rationOptions.length;
        }
        if (input.keyBuffer.includes('ArrowUp')) {
            this.selectedOption = (this.selectedOption - 1 + this.rationOptions.length) % this.rationOptions.length;
        }
        
        if (input.keyBuffer.includes('Enter')) {
            this.gameData.rations = this.rationOptions[this.selectedOption].name.toLowerCase();
            this.menuType = 'main';
            this.selectedOption = 0;
        }
        
        if (input.keyBuffer.includes('Escape')) {
            this.menuType = 'main';
            this.selectedOption = 0;
        }
    }
    
    handleSuppliesView(input) {
        if (input.keyBuffer.includes('Enter') || input.keyBuffer.includes('Escape')) {
            this.menuType = 'main';
            this.selectedOption = 0;
        }
    }
    
    handleRestMenu(input) {
        if (input.keyBuffer.includes('ArrowLeft') && this.restDays > 1) {
            this.restDays--;
        }
        if (input.keyBuffer.includes('ArrowRight') && this.restDays < 9) {
            this.restDays++;
        }
        
        if (input.keyBuffer.includes('Enter')) {
            this.rest();
        }
        
        if (input.keyBuffer.includes('Escape')) {
            this.menuType = 'main';
            this.selectedOption = 0;
        }
    }
    
    rest() {
        // Start rest state instead of doing it all at once
        this.game.stateManager.pushState(new RestState(this.game, this.gameData, this.restDays));
    }
    
    getDaysInMonth(month) {
        const days = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return days[month];
    }
    
    selectMainOption() {
        switch (this.selectedOption) {
            case 0: // Continue
                this.game.stateManager.popState();
                break;
            case 1: // Check supplies
                this.menuType = 'supplies';
                break;
            case 2: // Change pace
                this.menuType = 'pace';
                this.selectedOption = this.paceOptions.findIndex(
                    p => p.name.toLowerCase() === this.gameData.pace
                );
                break;
            case 3: // Change rations
                this.menuType = 'rations';
                this.selectedOption = this.rationOptions.findIndex(
                    r => r.name.toLowerCase() === this.gameData.rations
                );
                break;
            case 4: // Rest
                this.menuType = 'rest';
                this.selectedOption = 0;
                break;
            case 5: // Trade
                // TODO: Implement trading
                break;
            case 6: // Hunt
                if (this.gameData.supplies.ammunition > 0) {
                    this.game.stateManager.pushState(new HuntingState(this.game, this.gameData));
                }
                break;
        }
    }
    
    render(renderer) {
        // Semi-transparent background
        renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        renderer.ctx.fillRect(0, 0, renderer.width, renderer.height);
        
        if (this.menuType === 'main') {
            this.renderMainMenu(renderer);
        } else if (this.menuType === 'pace') {
            this.renderPaceMenu(renderer);
        } else if (this.menuType === 'rations') {
            this.renderRationsMenu(renderer);
        } else if (this.menuType === 'supplies') {
            this.renderSuppliesView(renderer);
        } else if (this.menuType === 'rest') {
            this.renderRestMenu(renderer);
        }
    }
    
    renderMainMenu(renderer) {
        const centerX = renderer.width / 2;
        
        renderer.drawText('Trail Menu', centerX, 50, renderer.colors.accent, 'center');
        renderer.drawText(this.gameData.getDateString(), centerX, 80, renderer.colors.info, 'center');
        
        const startY = 150;
        const buttonHeight = 45;
        const buttonWidth = 400;
        
        this.mainOptions.forEach((option, index) => {
            const y = startY + (index * buttonHeight);
            const isSelected = index === this.selectedOption;
            
            renderer.drawButton(option, centerX - buttonWidth / 2, y, buttonWidth, 40, isSelected);
        });
        
        renderer.drawText('Use Arrow Keys and Enter (Esc to close)', centerX, 520, renderer.colors.secondary, 'center');
    }
    
    renderPaceMenu(renderer) {
        const centerX = renderer.width / 2;
        
        renderer.drawText('Change Pace', centerX, 50, renderer.colors.accent, 'center');
        
        const info = [
            'Changing the pace alters the speed and health of your party.',
            '',
            `Current pace: ${this.gameData.pace}`
        ];
        renderer.drawTextBlock(info, centerX - 250, 100, renderer.colors.text);
        
        const startY = 200;
        const spacing = 80;
        
        this.paceOptions.forEach((option, index) => {
            const y = startY + (index * spacing);
            const isSelected = index === this.selectedOption;
            
            renderer.drawButton(option.name, centerX - 200, y, 400, 40, isSelected);
            renderer.drawText(option.description, centerX, y + 50, renderer.colors.secondary, 'center');
        });
        
        renderer.drawText('Press Enter to select (Esc to cancel)', centerX, 520, renderer.colors.info, 'center');
    }
    
    renderRationsMenu(renderer) {
        const centerX = renderer.width / 2;
        
        renderer.drawText('Change Food Rations', centerX, 50, renderer.colors.accent, 'center');
        
        const info = [
            'Food rations affect your party\'s health and food consumption.',
            '',
            `Current rations: ${this.gameData.rations}`
        ];
        renderer.drawTextBlock(info, centerX - 280, 100, renderer.colors.text);
        
        const startY = 200;
        const spacing = 80;
        
        this.rationOptions.forEach((option, index) => {
            const y = startY + (index * spacing);
            const isSelected = index === this.selectedOption;
            
            renderer.drawButton(option.name, centerX - 200, y, 400, 40, isSelected);
            renderer.drawText(option.description, centerX, y + 50, renderer.colors.secondary, 'center');
        });
        
        renderer.drawText('Press Enter to select (Esc to cancel)', centerX, 520, renderer.colors.info, 'center');
    }
    
    renderSuppliesView(renderer) {
        const centerX = renderer.width / 2;
        
        renderer.drawText('Current Supplies', centerX, 50, renderer.colors.accent, 'center');
        
        const supplies = [
            `Oxen: ${this.gameData.supplies.oxen} yoke`,
            `Food: ${Math.floor(this.gameData.supplies.food)} pounds`,
            `Clothing: ${this.gameData.supplies.clothing} sets`,
            `Ammunition: ${this.gameData.supplies.ammunition} boxes`,
            `Spare Wheels: ${this.gameData.supplies.wheels}`,
            `Spare Axles: ${this.gameData.supplies.axles}`,
            `Spare Tongues: ${this.gameData.supplies.tongues}`,
            '',
            `Money: $${this.gameData.money.toFixed(2)}`
        ];
        
        renderer.drawTextBlock(supplies, centerX - 150, 120, renderer.colors.text);
        
        // Party health
        renderer.drawText('Party Health', centerX, 320, renderer.colors.info, 'center');
        
        let y = 360;
        this.gameData.partyMembers.forEach(member => {
            let status = member.alive ? `${Math.floor(member.health)}%` : 'Dead';
            if (member.alive && member.illness) {
                status += ` (${member.illness})`;
            }
            
            const color = member.alive ? 
                (member.health > 70 ? renderer.colors.primary :
                 member.health > 40 ? renderer.colors.accent :
                 renderer.colors.danger) :
                renderer.colors.danger;
            
            renderer.drawText(`${member.name}: ${status}`, centerX - 100, y, color);
            y += 30;
        });
        
        renderer.drawText('Press Enter to continue', centerX, 540, renderer.colors.secondary, 'center');
    }
    
    renderRestMenu(renderer) {
        const centerX = renderer.width / 2;
        
        renderer.drawText('Stop to Rest', centerX, 50, renderer.colors.accent, 'center');
        
        const info = [
            'Resting allows your party to recover health and heal from illnesses.',
            '',
            'While resting you will:',
            '  • Recover health significantly',
            '  • Have a high chance to recover from illnesses',
            '  • Consume food as usual',
            '  • Not make progress on the trail',
            '',
            'How many days would you like to rest?'
        ];
        
        renderer.drawTextBlock(info, centerX - 280, 100, renderer.colors.text);
        
        // Days selector
        const selectorY = 320;
        renderer.drawText('< ', centerX - 60, selectorY, renderer.colors.primary);
        renderer.drawText(`${this.restDays} ${this.restDays === 1 ? 'day' : 'days'}`, 
            centerX - 40, selectorY, renderer.colors.accent);
        renderer.drawText(' >', centerX + 40, selectorY, renderer.colors.primary);
        
        // Calculate what resting will do
        const rationMap = { 'bare bones': 2, 'meager': 3, 'filling': 4 };
        const foodPerPerson = rationMap[this.gameData.rations] || 3;
        const foodNeeded = this.restDays * foodPerPerson * this.gameData.getAliveMembers().length;
        const healthGain = this.restDays * 5;
        
        const effects = [
            '',
            `Food consumed: ${foodNeeded} lbs`,
            `Health recovery: +${healthGain}% per person`,
            `Illness recovery chance: ${20 + (this.restDays * 10)}%`
        ];
        
        renderer.drawTextBlock(effects, centerX - 180, 370, renderer.colors.info);
        
        // Warnings
        if (this.gameData.supplies.food < foodNeeded) {
            renderer.drawText('Warning: Not enough food!', centerX, 480, renderer.colors.danger, 'center');
        }
        
        // Check who is sick
        const sickMembers = this.gameData.partyMembers.filter(m => m.alive && m.illness);
        if (sickMembers.length > 0) {
            const sickNames = sickMembers.map(m => `${m.name} (${m.illness})`).join(', ');
            renderer.drawText(`Sick: ${sickNames}`, centerX, 510, renderer.colors.accent, 'center');
        }
        
        renderer.drawText('Use Arrow Keys to adjust, Enter to rest, Esc to cancel', 
            centerX, 550, renderer.colors.secondary, 'center');
    }
}
