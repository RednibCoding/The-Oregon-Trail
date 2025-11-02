import { GameState } from './GameState.js';
import { SetupState } from './SetupState.js';

export class TitleState extends GameState {
    constructor(game) {
        super(game);
        this.selectedOption = 0;
        this.options = ['Start New Journey', 'Learn About the Trail', 'Top Ten', 'Quit'];
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
    }
    
    update(deltaTime, input) {
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
                // TODO: Create InfoState
                break;
            case 2: // Top Ten
                // TODO: Create HighScoreState
                break;
            case 3: // Quit
                alert('Thanks for playing!');
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
    }
}
