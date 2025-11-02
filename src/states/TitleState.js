import { GameState } from './GameState.js';
import { SetupState } from './SetupState.js';

export class TitleState extends GameState {
    constructor(game) {
        super(game);
        this.selectedOption = 0;
        this.options = ['Start New Journey', 'Learn About the Trail', 'Quit'];
        this.showingHistory = false;
        this.historyContent = [
            'The Oregon Trail is a legendary computer game that was',
            'originally developed in 1971 by three student teachers:',
            'Don Rawitsch, Bill Heinemann, and Paul Dillenberger.',
            '',
            'The game was designed to teach schoolchildren about the',
            'realities of 19th-century pioneer life on the Oregon Trail.',
            'Players took on the role of a wagon leader guiding their',
            'party from Independence, Missouri, to Oregon\'s Willamette',
            'Valley via a covered wagon in 1847.',
            '',
            'The 1985 version, developed by MECC, became one of the',
            'most widely distributed educational games, introducing',
            'millions of students to historical simulation gaming.',
            '',
            'The journey was fraught with danger: disease, starvation,',
            'wildlife encounters, and treacherous river crossings.',
            'Many died of dysentery along the way.',
            '',
            'This modern remake pays homage to that classic experience',
            'while bringing it to the browser.'
        ];
        this.title = [
            '  _____ _            ___                             ',
            ' |_   _| |__   ___  / _ \\ _ __ ___  __ _  ___  _ __  ',
            '   | | | \'_ \\ / _ \\| | | | \'__/ _ \\/ _` |/ _ \\| \'_ \\ ',
            '   | | | | | |  __/| |_| | | |  __/ (_| | (_) | | | |',
            '   |_| |_| |_|\\___| \\___/|_|  \\___|\\__, |\\___/|_| |_|',
            '                                   |___/             ',
            '  _____          _ _                                 ',
            ' |_   _| __ __ _(_) |                                ',
            '   | || \'__/ _` | | |                                ',
            '   | || | | (_| | | |                                ',
            '   |_||_|  \\__,_|_|_|                                '
        ];
    }
    
    enter() {
        this.selectedOption = 0;
        this.showingHistory = false;
    }
    
    update(deltaTime, input) {
        // Handle closing the history popup
        if (this.showingHistory) {
            if (input.keyBuffer.includes('Escape') || input.keyBuffer.includes('Enter')) {
                this.showingHistory = false;
            }
            return;
        }
        
        // Handle navigation
        if (input.keyBuffer.includes('ArrowDown') || input.keyBuffer.includes('s')) {
            this.selectedOption = (this.selectedOption + 1) % this.options.length;
        }
        
        if (input.keyBuffer.includes('ArrowUp') || input.keyBuffer.includes('w')) {
            this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
        }
        
        // Handle selection
        if (input.keyBuffer.includes('Enter') || input.keyBuffer.includes(' ')) {
            this.selectOption();
        }
    }
    
    selectOption() {
        switch (this.selectedOption) {
            case 0: // Start New Journey
                this.game.stateManager.setState(new SetupState(this.game));
                break;
            case 1: // Learn About the Trail
                this.showingHistory = true;
                break;
            case 2: // Quit
                alert('No! Quit is not an option. Play the game instead!');
                break;
        }
    }
    
    render(renderer) {
        const centerX = renderer.width / 2;
        
        // Draw title ASCII art
        const titleY = 50;
        renderer.drawASCIIArt(this.title, 100, titleY, renderer.colors.accent);
        
        // Draw subtitle
        const subtitle = 'A Modern Remake of the Classic 1985 Game';
        renderer.drawText(subtitle, centerX, 285, renderer.colors.secondary, 'center');
        
        // Draw menu options
        const menuY = 320;
        const buttonWidth = 300;
        const buttonHeight = 40;
        const spacing = 50;
        
        this.options.forEach((option, index) => {
            const x = centerX - buttonWidth / 2;
            const y = menuY + (index * spacing);
            const isSelected = index === this.selectedOption;
            
            renderer.drawButton(option, x, y, buttonWidth, buttonHeight, isSelected);
        });
        
        // Draw instructions
        const instructions = 'Use Arrow Keys or W/S to navigate, Enter to select';
        renderer.drawText(instructions, centerX, 550, renderer.colors.info, 'center');
        
        // Draw history popup if showing
        if (this.showingHistory) {
            const popupWidth = 600;
            const popupX = centerX - popupWidth / 2;
            const popupY = 50;
            renderer.drawPopup('The History of The Oregon Trail', this.historyContent, popupX, popupY, popupWidth);
        }
    }
}
