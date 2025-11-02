export class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        this.mouseClick = false;
        this.lastKey = null;
        this.keyBuffer = [];
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.lastKey = e.key;
            this.keyBuffer.push(e.key);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.mouseClick = true;
        });
    }
    
    getInput() {
        const input = {
            keys: { ...this.keys },
            mousePos: { ...this.mousePos },
            mouseClick: this.mouseClick,
            lastKey: this.lastKey,
            keyBuffer: [...this.keyBuffer]
        };
        
        // Reset single-frame inputs
        this.mouseClick = false;
        this.lastKey = null;
        this.keyBuffer = [];
        
        return input;
    }
    
    isKeyPressed(key) {
        return this.keys[key] === true;
    }
}
