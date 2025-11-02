import { GameState } from './GameState.js';
import { GameData } from '../data/GameData.js';
import { StoreState } from './StoreState.js';

export class SetupState extends GameState {
    constructor(game) {
        super(game);
        this.step = 'profession'; // profession, names, month, supplies
        this.profession = null;
        this.leaderName = '';
        this.partyMembers = ['', '', '', ''];
        this.month = null;
        this.startingMoney = 0;
        this.supplies = {
            oxen: 0,
            food: 0,
            clothing: 0,
            ammunition: 0,
            wheels: 0,
            axles: 0,
            tongues: 0
        };
        this.selectedOption = 0;
        this.inputBuffer = '';
    }
    
    enter() {
        this.step = 'profession';
        this.selectedOption = 0;
    }
    
    update(deltaTime, input) {
        if (this.step === 'profession') {
            this.handleProfessionInput(input);
        } else if (this.step === 'names') {
            this.handleNamesInput(input);
        } else if (this.step === 'month') {
            this.handleMonthInput(input);
        } else if (this.step === 'supplies') {
            this.handleSuppliesInput(input);
        }
    }
    
    handleProfessionInput(input) {
        const professions = GameData.professions;
        
        if (input.keyBuffer.includes('ArrowDown')) {
            this.selectedOption = (this.selectedOption + 1) % professions.length;
        }
        if (input.keyBuffer.includes('ArrowUp')) {
            this.selectedOption = (this.selectedOption - 1 + professions.length) % professions.length;
        }
        
        if (input.keyBuffer.includes('Enter')) {
            this.profession = professions[this.selectedOption];
            this.startingMoney = this.profession.money;
            this.step = 'names';
            this.selectedOption = 0;
        }
    }
    
    handleNamesInput(input) {
        // Handle text input for names
        input.keyBuffer.forEach(key => {
            if (key === 'Enter') {
                if (this.selectedOption === 0 && this.leaderName.trim()) {
                    this.selectedOption = 1;
                } else if (this.selectedOption > 0 && this.selectedOption < 5) {
                    if (this.partyMembers[this.selectedOption - 1].trim()) {
                        this.selectedOption++;
                    }
                }
                
                if (this.selectedOption === 5 && this.allNamesEntered()) {
                    this.step = 'month';
                    this.selectedOption = 0;
                }
            } else if (key === 'Backspace') {
                if (this.selectedOption === 0) {
                    this.leaderName = this.leaderName.slice(0, -1);
                } else if (this.selectedOption > 0 && this.selectedOption < 5) {
                    this.partyMembers[this.selectedOption - 1] = 
                        this.partyMembers[this.selectedOption - 1].slice(0, -1);
                }
            } else if (key.length === 1 && /[a-zA-Z ]/.test(key)) {
                if (this.selectedOption === 0 && this.leaderName.length < 15) {
                    this.leaderName += key;
                } else if (this.selectedOption > 0 && this.selectedOption < 5) {
                    if (this.partyMembers[this.selectedOption - 1].length < 15) {
                        this.partyMembers[this.selectedOption - 1] += key;
                    }
                }
            }
        });
    }
    
    handleMonthInput(input) {
        const months = GameData.startMonths;
        
        if (input.keyBuffer.includes('ArrowDown')) {
            this.selectedOption = (this.selectedOption + 1) % months.length;
        }
        if (input.keyBuffer.includes('ArrowUp')) {
            this.selectedOption = (this.selectedOption - 1 + months.length) % months.length;
        }
        
        if (input.keyBuffer.includes('Enter')) {
            this.month = months[this.selectedOption];
            this.step = 'supplies';
            this.selectedOption = 0;
        }
    }
    
    handleSuppliesInput(input) {
        // Go to store
        this.startGame();
    }
    
    allNamesEntered() {
        return this.leaderName.trim() && 
               this.partyMembers.every(name => name.trim());
    }
    
    startGame() {
        // Create game data and go to store
        const gameData = new GameData({
            profession: this.profession,
            leaderName: this.leaderName,
            partyMembers: this.partyMembers,
            startMonth: this.month,
            supplies: this.supplies,
            money: this.startingMoney
        });
        
        this.game.stateManager.setState(new StoreState(this.game, gameData, true));
    }
    
    render(renderer) {
        if (this.step === 'profession') {
            this.renderProfessionScreen(renderer);
        } else if (this.step === 'names') {
            this.renderNamesScreen(renderer);
        } else if (this.step === 'month') {
            this.renderMonthScreen(renderer);
        } else if (this.step === 'supplies') {
            this.renderSuppliesScreen(renderer);
        }
    }
    
    renderProfessionScreen(renderer) {
        const centerX = renderer.width / 2;
        
        renderer.drawText('Choose Your Profession', centerX, 50, renderer.colors.accent, 'center');
        
        const description = [
            'Many kinds of people made the trip to Oregon.',
            '',
            'Your choice of profession affects your starting money',
            'and final score.'
        ];
        renderer.drawTextBlock(description, centerX - 250, 100, renderer.colors.text);
        
        const professions = GameData.professions;
        const y = 200;
        
        professions.forEach((prof, index) => {
            const buttonY = y + (index * 60);
            const isSelected = index === this.selectedOption;
            const text = `${prof.name} - $${prof.money}`;
            
            renderer.drawButton(text, centerX - 200, buttonY, 400, 50, isSelected);
        });
    }
    
    renderNamesScreen(renderer) {
        const centerX = renderer.width / 2;
        
        renderer.drawText('Enter Names for Your Party', centerX, 50, renderer.colors.accent, 'center');
        
        const labels = [
            'Your name:',
            'First member:',
            'Second member:',
            'Third member:',
            'Fourth member:'
        ];
        
        const y = 150;
        
        labels.forEach((label, index) => {
            const labelY = y + (index * 60);
            renderer.drawText(label, 150, labelY, renderer.colors.text);
            
            const name = index === 0 ? this.leaderName : this.partyMembers[index - 1];
            const nameColor = this.selectedOption === index ? renderer.colors.accent : renderer.colors.primary;
            const cursor = this.selectedOption === index ? '_' : '';
            
            renderer.drawText(name + cursor, 350, labelY, nameColor);
        });
        
        if (this.allNamesEntered()) {
            renderer.drawText('Press Enter to continue', centerX, 500, renderer.colors.info, 'center');
        }
    }
    
    renderMonthScreen(renderer) {
        const centerX = renderer.width / 2;
        
        renderer.drawText('Choose Your Starting Month', centerX, 50, renderer.colors.accent, 'center');
        
        const info = [
            'It is 1848. The time has come to start your journey.',
            'You must decide what month to leave Independence, Missouri.',
            '',
            'Leaving too early or too late can be dangerous.'
        ];
        renderer.drawTextBlock(info, centerX - 280, 100, renderer.colors.text);
        
        const months = GameData.startMonths;
        const y = 250;
        
        months.forEach((month, index) => {
            const buttonY = y + (index * 60);
            const isSelected = index === this.selectedOption;
            
            renderer.drawButton(month.name, centerX - 150, buttonY, 300, 50, isSelected);
        });
    }
    
    renderSuppliesScreen(renderer) {
        const centerX = renderer.width / 2;
        
        renderer.drawText('Before Leaving Independence', centerX, 80, renderer.colors.accent, 'center');
        
        const info = [
            'You will need to visit the general store to buy supplies',
            'for your journey.',
            '',
            'You can buy:',
            '  • Oxen to pull your wagon',
            '  • Food for your party',
            '  • Clothing to keep warm',
            '  • Ammunition for hunting',
            '  • Spare parts for your wagon',
            '',
            `You have $${this.startingMoney} to spend.`
        ];
        
        renderer.drawTextBlock(info, centerX - 250, 150, renderer.colors.text);
        
        renderer.drawText('Press any key to continue to the store', centerX, 500, renderer.colors.info, 'center');
    }
}
