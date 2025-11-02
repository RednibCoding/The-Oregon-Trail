import { GameState } from './GameState.js';

export class HuntingState extends GameState {
    constructor(game, gameData) {
        super(game);
        this.gameData = gameData;
        this.timeLimit = 45; // seconds
        this.timeRemaining = this.timeLimit;
        this.ammunition = Math.min(10, this.gameData.supplies.ammunition * 20); // bullets available
        this.meatCollected = 0;
        this.shotsFired = 0;
        
        // Grid-based system (20x15 cells, each 40px)
        this.gridWidth = 20;
        this.gridHeight = 15;
        this.cellSize = 40;
        
        this.animals = [];
        this.bullets = [];
        this.obstacles = []; // rocks and stumps
        this.maxAnimals = 5;
        this.animalSpawnTimer = 0;
        this.animalSpawnDelay = 2; // seconds between spawns
        
        // Player position (grid-based)
        this.playerX = 10; // grid X
        this.playerY = 7;  // grid Y
        this.playerDir = 0; // 0=up, 1=right, 2=down, 3=left
        
        // Tick-based movement (not smooth)
        this.playerMovementTick = 0;
        this.playerMovementDelay = 0.1; // Player always responsive
        this.animalMovementTick = 0;
        this.animalMovementDelay = 1.0; // Animals move slower
        
        this.huntingComplete = false;
        this.canCarry = 100; // max lbs can carry back
    }
    
    enter() {
        this.timeRemaining = this.timeLimit;
        this.ammunition = Math.min(100, this.gameData.supplies.ammunition * 20);
        this.meatCollected = 0;
        this.shotsFired = 0;
        this.animals = [];
        this.bullets = [];
        this.obstacles = [];
        this.huntingComplete = false;
        this.playerX = 10;
        this.playerY = 7;
        this.playerDir = 0;
        this.playerMovementTick = 0;
        this.animalMovementTick = 0;
        
        // Generate random obstacles (rocks and stumps)
        for (let i = 0; i < 15; i++) {
            this.obstacles.push({
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight),
                type: Math.random() > 0.5 ? 'rock' : 'stump'
            });
        }
        
        this.spawnAnimal();
    }
    
    update(deltaTime, input) {
        if (this.huntingComplete) {
            if (input.keyBuffer.includes('Enter') || input.keyBuffer.includes(' ')) {
                this.finishHunting();
            }
            return;
        }
        
        // Update time
        this.timeRemaining -= deltaTime;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.huntingComplete = true;
        }
        
        // Player movement (always responsive)
        this.playerMovementTick += deltaTime;
        if (this.playerMovementTick >= this.playerMovementDelay) {
            this.playerMovementTick = 0;
            
            // Player movement (grid-based, one cell at a time)
            let newX = this.playerX;
            let newY = this.playerY;
            
            if (input.keys['ArrowUp'] || input.keys['w']) {
                newY--;
                this.playerDir = 0;
            } else if (input.keys['ArrowDown'] || input.keys['s']) {
                newY++;
                this.playerDir = 2;
            } else if (input.keys['ArrowLeft'] || input.keys['a']) {
                newX--;
                this.playerDir = 3;
            } else if (input.keys['ArrowRight'] || input.keys['d']) {
                newX++;
                this.playerDir = 1;
            }
            
            // Check bounds
            if (newX >= 0 && newX < this.gridWidth && newY >= 0 && newY < this.gridHeight) {
                // Check if obstacle blocks movement
                const blocked = this.obstacles.some(obs => obs.x === newX && obs.y === newY);
                if (!blocked) {
                    this.playerX = newX;
                    this.playerY = newY;
                }
            }
        }
        
        // Animal movement (slower, separate tick)
        this.animalMovementTick += deltaTime;
        if (this.animalMovementTick >= this.animalMovementDelay) {
            this.animalMovementTick = 0;
            
            // Move animals (tick-based)
            this.animals.forEach(animal => {
                // Random movement
                const dir = Math.floor(Math.random() * 4);
                let newX = animal.x;
                let newY = animal.y;
                
                if (dir === 0) newY--;
                else if (dir === 1) newX++;
                else if (dir === 2) newY++;
                else newX--;
                
                // Check bounds and obstacles
                if (newX >= 0 && newX < this.gridWidth && newY >= 0 && newY < this.gridHeight) {
                    const blocked = this.obstacles.some(obs => obs.x === newX && obs.y === newY);
                    if (!blocked) {
                        animal.x = newX;
                        animal.y = newY;
                    }
                }
            });
        }
        
        // Shoot with space
        if (input.keyBuffer.includes(' ') && this.ammunition > 0) {
            this.shoot();
        }
        
        // Spawn animals
        this.animalSpawnTimer += deltaTime;
        if (this.animalSpawnTimer >= this.animalSpawnDelay && this.animals.length < this.maxAnimals) {
            this.spawnAnimal();
            this.animalSpawnTimer = 0;
        }
        
        // Update bullets (move in direction)
        this.bullets = this.bullets.filter(bullet => {
            bullet.ticks--;
            if (bullet.ticks <= 0) return false;
            
            // Move bullet
            if (bullet.dir === 0) bullet.y--;
            else if (bullet.dir === 1) bullet.x++;
            else if (bullet.dir === 2) bullet.y++;
            else bullet.x--;
            
            // Check bounds
            return bullet.x >= 0 && bullet.x < this.gridWidth && bullet.y >= 0 && bullet.y < this.gridHeight;
        });
        
        // Check bullet hits
        this.checkHits();
    }
    
    spawnAnimal() {
        const types = [
            { name: 'RABBIT', meat: 5, char: 'r' },
            { name: 'SQUIRREL', meat: 3, char: 's' },
            { name: 'DEER', meat: 50, char: 'd' },
            { name: 'BUFFALO', meat: 100, char: 'B' }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Spawn at random edge
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        
        if (edge === 0) { // top
            x = Math.floor(Math.random() * this.gridWidth);
            y = 0;
        } else if (edge === 1) { // right
            x = this.gridWidth - 1;
            y = Math.floor(Math.random() * this.gridHeight);
        } else if (edge === 2) { // bottom
            x = Math.floor(Math.random() * this.gridWidth);
            y = this.gridHeight - 1;
        } else { // left
            x = 0;
            y = Math.floor(Math.random() * this.gridHeight);
        }
        
        this.animals.push({
            ...type,
            x, y,
            id: Math.random()
        });
    }
    
    shoot() {
        this.ammunition--;
        this.shotsFired++;
        
        // Shoot in direction player is facing
        this.bullets.push({
            x: this.playerX,
            y: this.playerY,
            dir: this.playerDir,
            ticks: 10 // bullet travels 10 cells max
        });
    }
    
    checkHits() {
        this.bullets.forEach(bullet => {
            this.animals = this.animals.filter(animal => {
                // Grid-based collision (same cell)
                if (animal.x === bullet.x && animal.y === bullet.y) {
                    // Hit!
                    this.meatCollected += animal.meat;
                    return false; // remove animal
                }
                return true;
            });
        });
    }
    
    finishHunting() {
        // Deduct ammunition used
        const boxesUsed = Math.ceil(this.shotsFired / 20);
        this.gameData.supplies.ammunition = Math.max(0, this.gameData.supplies.ammunition - boxesUsed);
        
        // Add meat (limited by carry capacity)
        const meatToAdd = Math.min(this.meatCollected, this.canCarry);
        this.gameData.supplies.food += meatToAdd;
        
        // Return to menu
        this.game.stateManager.popState();
    }
    
    render(renderer) {
        if (this.huntingComplete) {
            this.renderResults(renderer);
        } else {
            this.renderHunting(renderer);
        }
    }
    
    renderHunting(renderer) {
        // Black background (like old terminal)
        renderer.ctx.fillStyle = '#000000';
        renderer.ctx.fillRect(0, 0, 800, 600);
        
        // Draw grid-based world (top-down view)
        const offsetX = 0;
        const offsetY = 0;
        
        // Draw obstacles (rocks and tree stumps)
        this.obstacles.forEach(obs => {
            const x = offsetX + obs.x * this.cellSize;
            const y = offsetY + obs.y * this.cellSize;
            
            renderer.ctx.fillStyle = '#666666';
            
            if (obs.type === 'rock') {
                // Rock - irregular shape
                renderer.ctx.fillRect(x + 5, y + 5, this.cellSize - 10, this.cellSize - 10);
                renderer.ctx.fillRect(x + 10, y, this.cellSize - 20, this.cellSize);
            } else {
                // Tree stump - brown
                renderer.ctx.fillStyle = '#8B4513';
                renderer.ctx.fillRect(x + 8, y + 8, this.cellSize - 16, this.cellSize - 16);
            }
        });
        
        // Draw animals (ASCII characters in cells)
        this.animals.forEach(animal => {
            const x = offsetX + animal.x * this.cellSize;
            const y = offsetY + animal.y * this.cellSize;
            
            renderer.ctx.fillStyle = renderer.colors.primary;
            renderer.ctx.font = '24px "Courier New"';
            renderer.ctx.textAlign = 'center';
            renderer.ctx.textBaseline = 'middle';
            renderer.ctx.fillText(animal.char, x + this.cellSize / 2, y + this.cellSize / 2);
        });
        
        // Draw bullets
        this.bullets.forEach(bullet => {
            const x = offsetX + bullet.x * this.cellSize;
            const y = offsetY + bullet.y * this.cellSize;
            
            renderer.ctx.fillStyle = renderer.colors.accent;
            renderer.ctx.fillRect(x + this.cellSize / 2 - 3, y + this.cellSize / 2 - 3, 6, 6);
        });
        
        // Draw player (simple character with direction indicator)
        const px = offsetX + this.playerX * this.cellSize;
        const py = offsetY + this.playerY * this.cellSize;
        
        renderer.ctx.fillStyle = renderer.colors.info;
        renderer.ctx.font = '28px "Courier New"';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.textBaseline = 'middle';
        renderer.ctx.fillText('@', px + this.cellSize / 2, py + this.cellSize / 2);
        
        // Direction indicator (small arrow)
        renderer.ctx.fillStyle = renderer.colors.accent;
        renderer.ctx.font = '16px "Courier New"';
        const dirChars = ['^', '>', 'v', '<'];
        renderer.ctx.fillText(dirChars[this.playerDir], px + this.cellSize / 2, py + this.cellSize / 2 - 15);
        
        // HUD at bottom (over the game area)
        renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        renderer.ctx.fillRect(0, 560, 800, 40);
        
        const hudY = 578;
        renderer.drawText(`TIME: ${Math.ceil(this.timeRemaining)}`, 20, hudY, renderer.colors.primary);
        renderer.drawText(`AMMO: ${this.ammunition}`, 200, hudY, renderer.colors.primary);
        renderer.drawText(`MEAT: ${this.meatCollected} LBS`, 420, hudY, renderer.colors.accent);
        renderer.drawText(`ARROWS: MOVE  SPACE: SHOOT`, 580, hudY, renderer.colors.text, 'left', '14px');
    }
    
    renderResults(renderer) {
        const centerX = renderer.width / 2;
        
        renderer.drawText('Hunting Complete!', centerX, 100, renderer.colors.accent, 'center');
        
        const stats = [
            '',
            `Time hunted: ${this.timeLimit} seconds`,
            `Shots fired: ${this.shotsFired}`,
            `Ammunition used: ${Math.ceil(this.shotsFired / 20)} boxes`,
            '',
            `Meat collected: ${this.meatCollected} lbs`,
            `Carry capacity: ${this.canCarry} lbs`,
            `Meat brought back: ${Math.min(this.meatCollected, this.canCarry)} lbs`,
            ''
        ];
        
        renderer.drawTextBlock(stats, centerX - 150, 150, renderer.colors.text);
        
        // Message about efficiency
        let message = '';
        const efficiency = this.shotsFired > 0 ? (this.meatCollected / this.shotsFired) : 0;
        
        if (this.meatCollected === 0) {
            message = 'Better luck next time!';
        } else if (efficiency > 20) {
            message = 'Excellent shooting!';
        } else if (efficiency > 10) {
            message = 'Good hunting!';
        } else if (efficiency > 5) {
            message = 'Fair hunting.';
        } else {
            message = 'You wasted ammunition.';
        }
        
        renderer.drawText(message, centerX, 350, renderer.colors.primary, 'center');
        
        // Waste warning
        if (this.meatCollected > this.canCarry) {
            const wasted = this.meatCollected - this.canCarry;
            renderer.drawText(`Warning: ${wasted} lbs of meat left behind (over carry limit)`, 
                centerX, 400, renderer.colors.danger, 'center');
        }
        
        renderer.drawText('Press SPACE or ENTER to continue', centerX, 500, renderer.colors.secondary, 'center');
    }
}
