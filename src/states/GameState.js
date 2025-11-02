export class GameState {
    constructor(game) {
        this.game = game;
    }
    
    enter() {
        // Override in subclasses
    }
    
    exit() {
        // Override in subclasses
    }
    
    update(deltaTime, input) {
        // Override in subclasses
    }
    
    render(renderer) {
        // Override in subclasses
    }
}
