export class StateManager {
    constructor() {
        this.currentState = null;
        this.stateStack = [];
    }
    
    setState(state) {
        if (this.currentState && this.currentState.exit) {
            this.currentState.exit();
        }
        
        this.currentState = state;
        
        if (this.currentState && this.currentState.enter) {
            this.currentState.enter();
        }
    }
    
    pushState(state) {
        if (this.currentState) {
            this.stateStack.push(this.currentState);
        }
        this.setState(state);
    }
    
    popState() {
        if (this.stateStack.length > 0) {
            this.setState(this.stateStack.pop());
        }
    }
    
    update(deltaTime, input) {
        if (this.currentState && this.currentState.update) {
            this.currentState.update(deltaTime, input);
        }
    }
    
    render(renderer) {
        if (this.currentState && this.currentState.render) {
            this.currentState.render(renderer);
        }
    }
}
