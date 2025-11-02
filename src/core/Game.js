import { Renderer } from './Renderer.js';
import { InputHandler } from './InputHandler.js';
import { StateManager } from './StateManager.js';
import { GameState } from '../states/GameState.js';
import { TitleState } from '../states/TitleState.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.ctx = canvas.getContext('2d');
        this.renderer = new Renderer(this.ctx, this.canvas.width, this.canvas.height);
        this.inputHandler = new InputHandler(this.canvas);
        this.stateManager = new StateManager();
        
        this.lastTime = 0;
        this.running = false;
        
        // Initialize with title state
        this.stateManager.setState(new TitleState(this));
    }
    
    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    
    gameLoop(currentTime) {
        if (!this.running) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update
        const input = this.inputHandler.getInput();
        this.stateManager.update(deltaTime, input);
        
        // Render
        this.renderer.clear();
        this.stateManager.render(this.renderer);
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    stop() {
        this.running = false;
    }
}
