import { GameState } from './GameState.js';
import { TravelState } from './TravelState.js';

export class StoreState extends GameState {
    constructor(game, gameData, isInitialPurchase = false) {
        super(game);
        this.gameData = gameData;
        this.isInitialPurchase = isInitialPurchase;
        
        this.items = [
            { name: 'Oxen', price: 40, unit: 'yoke', min: 0, max: 20 },
            { name: 'Food', price: 0.20, unit: 'pounds', min: 0, max: 9999 },
            { name: 'Clothing', price: 10, unit: 'sets', min: 0, max: 99 },
            { name: 'Ammunition', price: 2, unit: 'boxes', min: 0, max: 99 },
            { name: 'Spare Wheels', price: 10, unit: 'wheels', min: 0, max: 9 },
            { name: 'Spare Axles', price: 10, unit: 'axles', min: 0, max: 9 },
            { name: 'Spare Tongues', price: 10, unit: 'tongues', min: 0, max: 9 }
        ];
        
        this.selectedItem = 0;
        this.cart = {
            oxen: 0,
            food: 0,
            clothing: 0,
            ammunition: 0,
            wheels: 0,
            axles: 0,
            tongues: 0
        };
        
        this.inputBuffer = '';
        this.mode = 'menu'; // menu or input
        this.showConfirm = false;
    }
    
    enter() {
        this.selectedItem = 0;
        this.mode = 'menu';
    }
    
    update(deltaTime, input) {
        if (this.showConfirm) {
            this.handleConfirmInput(input);
        } else if (this.mode === 'menu') {
            this.handleMenuInput(input);
        } else if (this.mode === 'input') {
            this.handleQuantityInput(input);
        }
    }
    
    handleMenuInput(input) {
        if (input.keyBuffer.includes('ArrowDown')) {
            this.selectedItem = (this.selectedItem + 1) % (this.items.length + 1);
        }
        if (input.keyBuffer.includes('ArrowUp')) {
            this.selectedItem = (this.selectedItem - 1 + this.items.length + 1) % (this.items.length + 1);
        }
        
        if (input.keyBuffer.includes('Enter')) {
            if (this.selectedItem < this.items.length) {
                // Start entering quantity
                this.mode = 'input';
                this.inputBuffer = '';
            } else {
                // Done shopping - show confirmation
                this.showConfirm = true;
            }
        }
    }
    
    handleQuantityInput(input) {
        input.keyBuffer.forEach(key => {
            if (key === 'Enter') {
                const quantity = parseInt(this.inputBuffer) || 0;
                const item = this.items[this.selectedItem];
                const cartKey = this.getCartKey(this.selectedItem);
                
                // Validate quantity
                if (quantity >= item.min && quantity <= item.max) {
                    const cost = quantity * item.price;
                    if (cost <= this.gameData.money) {
                        this.cart[cartKey] = quantity;
                    }
                }
                
                this.mode = 'menu';
                this.inputBuffer = '';
            } else if (key === 'Escape') {
                this.mode = 'menu';
                this.inputBuffer = '';
            } else if (key === 'Backspace') {
                this.inputBuffer = this.inputBuffer.slice(0, -1);
            } else if (/^\d$/.test(key)) {
                this.inputBuffer += key;
            }
        });
    }
    
    handleConfirmInput(input) {
        if (input.keyBuffer.includes('y') || input.keyBuffer.includes('Y')) {
            // Complete purchase
            this.completePurchase();
        } else if (input.keyBuffer.includes('n') || input.keyBuffer.includes('N')) {
            // Return to shopping
            this.showConfirm = false;
        }
    }
    
    completePurchase() {
        // Deduct money and add supplies
        const totalCost = this.getTotalCost();
        this.gameData.money -= totalCost;
        
        Object.keys(this.cart).forEach(key => {
            this.gameData.supplies[key] += this.cart[key];
        });
        
        // Start the journey
        if (this.isInitialPurchase) {
            this.game.stateManager.setState(new TravelState(this.game, this.gameData));
        } else {
            // Return to previous state (town/fort)
            this.game.stateManager.popState();
        }
    }
    
    getCartKey(index) {
        const keys = ['oxen', 'food', 'clothing', 'ammunition', 'wheels', 'axles', 'tongues'];
        return keys[index];
    }
    
    getTotalCost() {
        let total = 0;
        this.items.forEach((item, index) => {
            const cartKey = this.getCartKey(index);
            total += this.cart[cartKey] * item.price;
        });
        return total;
    }
    
    render(renderer) {
        const centerX = renderer.width / 2;
        
        // Title
        renderer.drawText('Matt\'s General Store', centerX, 30, renderer.colors.accent, 'center');
        renderer.drawText('Independence, Missouri', centerX, 55, renderer.colors.secondary, 'center');
        
        // Money display
        const moneyText = `Money: $${this.gameData.money.toFixed(2)}`;
        renderer.drawText(moneyText, centerX, 85, renderer.colors.primary, 'center');
        
        if (this.showConfirm) {
            this.renderConfirmation(renderer);
        } else {
            this.renderStore(renderer);
        }
    }
    
    renderStore(renderer) {
        const startY = 130;
        const lineHeight = 40;
        
        // Column headers
        renderer.drawText('Item', 100, startY, renderer.colors.info);
        renderer.drawText('Price', 300, startY, renderer.colors.info);
        renderer.drawText('Amount', 520, startY, renderer.colors.info);
        renderer.drawText('Cost', 650, startY, renderer.colors.info);
        
        // Items
        this.items.forEach((item, index) => {
            const y = startY + 30 + (index * lineHeight);
            const isSelected = index === this.selectedItem && this.mode === 'menu';
            const color = isSelected ? renderer.colors.accent : renderer.colors.text;
            const cartKey = this.getCartKey(index);
            const amount = this.cart[cartKey];
            const cost = amount * item.price;
            
            const prefix = isSelected ? '> ' : '  ';
            renderer.drawText(prefix + item.name, 100, y, color);
            renderer.drawText(`$${item.price.toFixed(2)} per ${item.unit}`, 300, y, color);
            
            if (this.mode === 'input' && index === this.selectedItem) {
                renderer.drawText(this.inputBuffer + '_', 520, y, renderer.colors.accent);
            } else {
                renderer.drawText(amount.toString(), 520, y, color);
            }
            
            renderer.drawText(`$${cost.toFixed(2)}`, 650, y, color);
        });
        
        // Done button
        const doneY = startY + 30 + (this.items.length * lineHeight);
        const isDoneSelected = this.selectedItem === this.items.length;
        const doneColor = isDoneSelected ? renderer.colors.accent : renderer.colors.primary;
        renderer.drawText(isDoneSelected ? '> Done Shopping' : '  Done Shopping', 100, doneY, doneColor);
        
        // Total
        const totalCost = this.getTotalCost();
        const totalY = doneY + 50;
        renderer.drawText('Total:', 550, totalY, renderer.colors.info);
        renderer.drawText(`$${totalCost.toFixed(2)}`, 650, totalY, renderer.colors.primary);
        
        // Instructions
        const instructions = this.mode === 'input' 
            ? 'Enter quantity and press Enter (Esc to cancel)'
            : 'Arrow keys to select, Enter to set amount';
        renderer.drawText(instructions, renderer.width / 2, 550, renderer.colors.secondary, 'center');
        
        // Warnings
        if (this.isInitialPurchase && this.cart.oxen === 0) {
            renderer.drawText('Warning: You need oxen to pull your wagon!', 
                renderer.width / 2, 520, renderer.colors.danger, 'center');
        }
    }
    
    renderConfirmation(renderer) {
        const centerX = renderer.width / 2;
        const startY = 150;
        
        renderer.drawText('Purchase Summary', centerX, startY, renderer.colors.accent, 'center');
        
        let y = startY + 50;
        
        this.items.forEach((item, index) => {
            const cartKey = this.getCartKey(index);
            const amount = this.cart[cartKey];
            if (amount > 0) {
                const text = `${item.name}: ${amount} ${item.unit} - $${(amount * item.price).toFixed(2)}`;
                renderer.drawText(text, 150, y, renderer.colors.text);
                y += 30;
            }
        });
        
        y += 20;
        const totalCost = this.getTotalCost();
        renderer.drawText(`Total Cost: $${totalCost.toFixed(2)}`, 150, y, renderer.colors.primary);
        y += 30;
        renderer.drawText(`Remaining Money: $${(this.gameData.money - totalCost).toFixed(2)}`, 
            150, y, renderer.colors.primary);
        
        y += 60;
        renderer.drawText('Are you satisfied with these purchases? (Y/N)', 
            centerX, y, renderer.colors.accent, 'center');
    }
}
