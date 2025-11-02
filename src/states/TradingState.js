import { GameState } from './GameState.js';

export class TradingState extends GameState {
    constructor(game, gameData, landmarkName) {
        super(game);
        this.gameData = gameData;
        this.landmarkName = landmarkName;
        
        // Items available for trading with price ranges
        this.items = [
            { name: 'oxen', min: 20, max: 40 },
            { name: 'food', min: 0.15, max: 0.35 },
            { name: 'clothing', min: 8, max: 15 },
            { name: 'ammunition', min: 1.5, max: 3.5 },
            { name: 'wheels', min: 8, max: 15 },
            { name: 'axles', min: 8, max: 15 },
            { name: 'tongues', min: 8, max: 15 }
        ];
        
        // Generate random prices for this fort
        this.prices = {};
        this.items.forEach(item => {
            const range = item.max - item.min;
            this.prices[item.name] = item.min + Math.random() * range;
        });
        
        this.selectedIndex = 0;
        this.view = 'main'; // 'main' or 'buy' or 'sell'
        this.tradeItem = null;
        this.tradeAmount = 0;
    }
    
    enter() {
        this.selectedIndex = 0;
        this.view = 'main';
        this.tradeItem = null;
        this.tradeAmount = 0;
    }
    
    update(deltaTime, input) {
        if (this.view === 'main') {
            this.updateMain(input);
        } else if (this.view === 'buy') {
            this.updateBuyScreen(input);
        } else if (this.view === 'sell') {
            this.updateSellScreen(input);
        }
    }
    
    updateMain(input) {
        const options = ['Buy Supplies', 'Sell Supplies', 'Leave'];
        
        if (input.keyBuffer.includes('ArrowUp')) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        }
        if (input.keyBuffer.includes('ArrowDown')) {
            this.selectedIndex = Math.min(options.length - 1, this.selectedIndex + 1);
        }
        
        if (input.keyBuffer.includes('Enter') || input.keyBuffer.includes(' ')) {
            if (this.selectedIndex === 0) {
                this.view = 'buy';
                this.selectedIndex = 0;
            } else if (this.selectedIndex === 1) {
                this.view = 'sell';
                this.selectedIndex = 0;
            } else {
                this.game.stateManager.popState();
            }
        }
        
        if (input.keyBuffer.includes('Escape')) {
            this.game.stateManager.popState();
        }
    }
    
    updateBuyScreen(input) {
        const buyableItems = this.items.filter(item => {
            // Can always buy these items
            return true;
        });
        
        if (input.keyBuffer.includes('ArrowUp')) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        }
        if (input.keyBuffer.includes('ArrowDown')) {
            this.selectedIndex = Math.min(buyableItems.length, this.selectedIndex + 1); // +1 for "Back" option
        }
        
        if (input.keyBuffer.includes('Enter') || input.keyBuffer.includes(' ')) {
            if (this.selectedIndex === buyableItems.length) {
                // Back
                this.view = 'main';
                this.selectedIndex = 0;
            } else {
                // Buy item
                const item = buyableItems[this.selectedIndex];
                this.buyItem(item.name);
            }
        }
        
        if (input.keyBuffer.includes('Escape')) {
            this.view = 'main';
            this.selectedIndex = 0;
        }
    }
    
    updateSellScreen(input) {
        const sellableItems = this.items.filter(item => {
            return this.gameData.supplies[item.name] > 0;
        });
        
        if (input.keyBuffer.includes('ArrowUp')) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        }
        if (input.keyBuffer.includes('ArrowDown')) {
            this.selectedIndex = Math.min(sellableItems.length, this.selectedIndex + 1); // +1 for "Back" option
        }
        
        if (input.keyBuffer.includes('Enter') || input.keyBuffer.includes(' ')) {
            if (this.selectedIndex === sellableItems.length) {
                // Back
                this.view = 'main';
                this.selectedIndex = 0;
            } else {
                // Sell item
                const item = sellableItems[this.selectedIndex];
                this.sellItem(item.name);
            }
        }
        
        if (input.keyBuffer.includes('Escape')) {
            this.view = 'main';
            this.selectedIndex = 0;
        }
    }
    
    buyItem(itemName) {
        const price = this.prices[itemName];
        let amount = 1;
        
        // Different amounts based on item type
        if (itemName === 'food') {
            amount = 50; // Buy in 50 lb increments
        } else if (itemName === 'ammunition') {
            amount = 1; // Buy in boxes
        } else if (itemName === 'clothing') {
            amount = 1; // Buy one set at a time
        } else {
            amount = 1; // Oxen, wheels, axles, tongues
        }
        
        const totalCost = price * amount;
        
        if (this.gameData.money >= totalCost) {
            this.gameData.money -= totalCost;
            this.gameData.supplies[itemName] += amount;
        }
    }
    
    sellItem(itemName) {
        const sellPrice = this.prices[itemName] * 0.5; // Sell for half price
        let amount = 1;
        
        // Different amounts based on item type
        if (itemName === 'food') {
            amount = Math.min(50, this.gameData.supplies[itemName]); // Sell in 50 lb increments
        } else if (itemName === 'ammunition') {
            amount = 1; // Sell boxes
        } else if (itemName === 'clothing') {
            amount = 1; // Sell one set
        } else {
            amount = 1; // Oxen, wheels, axles, tongues
        }
        
        if (this.gameData.supplies[itemName] >= amount) {
            this.gameData.supplies[itemName] -= amount;
            this.gameData.money += sellPrice * amount;
        }
    }
    
    render(renderer) {
        if (this.view === 'main') {
            this.renderMain(renderer);
        } else if (this.view === 'buy') {
            this.renderBuyScreen(renderer);
        } else if (this.view === 'sell') {
            this.renderSellScreen(renderer);
        }
    }
    
    renderMain(renderer) {
        const centerX = renderer.width / 2;
        
        renderer.drawText(`${this.landmarkName} - Trading Post`, centerX, 60, renderer.colors.accent, 'center', '24px');
        
        renderer.drawText(`Money: $${Math.floor(this.gameData.money)}`, centerX, 110, renderer.colors.primary, 'center');
        
        const options = ['Buy Supplies', 'Sell Supplies', 'Leave'];
        
        let y = 180;
        options.forEach((option, index) => {
            const color = index === this.selectedIndex ? renderer.colors.accent : renderer.colors.text;
            const prefix = index === this.selectedIndex ? '> ' : '  ';
            renderer.drawText(prefix + option, centerX, y, color, 'center');
            y += 40;
        });
        
        // Show current prices
        renderer.drawText('Current Prices:', 50, 320, renderer.colors.secondary);
        
        let priceY = 350;
        this.items.forEach(item => {
            const itemName = item.name.charAt(0).toUpperCase() + item.name.slice(1);
            const price = this.prices[item.name];
            
            let unit = '';
            if (item.name === 'food') unit = ' per 50 lbs';
            else if (item.name === 'ammunition') unit = ' per box';
            else if (item.name === 'clothing') unit = ' per set';
            else if (item.name === 'oxen') unit = ' each';
            else unit = ' each';
            
            const displayPrice = item.name === 'food' || item.name === 'ammunition' 
                ? (price * (item.name === 'food' ? 50 : 1)).toFixed(2) 
                : price.toFixed(2);
            
            renderer.drawText(`${itemName}: $${displayPrice}${unit}`, 70, priceY, renderer.colors.text, 'left', '16px');
            priceY += 25;
        });
        
        renderer.drawText('ARROW KEYS: Navigate  ENTER: Select  ESC: Back', centerX, 560, renderer.colors.secondary, 'center', '14px');
    }
    
    renderBuyScreen(renderer) {
        const centerX = renderer.width / 2;
        
        renderer.drawText('Buy Supplies', centerX, 60, renderer.colors.accent, 'center', '24px');
        renderer.drawText(`Money: $${Math.floor(this.gameData.money)}`, centerX, 100, renderer.colors.primary, 'center');
        
        const buyableItems = this.items;
        
        let y = 150;
        buyableItems.forEach((item, index) => {
            const color = index === this.selectedIndex ? renderer.colors.accent : renderer.colors.text;
            const prefix = index === this.selectedIndex ? '> ' : '  ';
            
            const itemName = item.name.charAt(0).toUpperCase() + item.name.slice(1);
            const price = this.prices[item.name];
            const current = this.gameData.supplies[item.name];
            
            let displayPrice, unit;
            if (item.name === 'food') {
                displayPrice = (price * 50).toFixed(2);
                unit = '50 lbs';
            } else if (item.name === 'ammunition') {
                displayPrice = price.toFixed(2);
                unit = 'box';
            } else if (item.name === 'clothing') {
                displayPrice = price.toFixed(2);
                unit = 'set';
            } else {
                displayPrice = price.toFixed(2);
                unit = 'each';
            }
            
            renderer.drawText(`${prefix}${itemName}`, 100, y, color);
            renderer.drawText(`$${displayPrice}/${unit}`, 300, y, color);
            renderer.drawText(`(have: ${current})`, 500, y, color);
            y += 30;
        });
        
        // Back option
        const backColor = this.selectedIndex === buyableItems.length ? renderer.colors.accent : renderer.colors.text;
        const backPrefix = this.selectedIndex === buyableItems.length ? '> ' : '  ';
        renderer.drawText(`${backPrefix}Back`, 100, y + 20, backColor);
        
        renderer.drawText('ARROW KEYS: Navigate  ENTER: Buy  ESC: Back', centerX, 560, renderer.colors.secondary, 'center', '14px');
    }
    
    renderSellScreen(renderer) {
        const centerX = renderer.width / 2;
        
        renderer.drawText('Sell Supplies', centerX, 60, renderer.colors.accent, 'center', '24px');
        renderer.drawText(`Money: $${Math.floor(this.gameData.money)}`, centerX, 100, renderer.colors.primary, 'center');
        renderer.drawText('(Selling price is 50% of buying price)', centerX, 130, renderer.colors.secondary, 'center', '14px');
        
        const sellableItems = this.items.filter(item => this.gameData.supplies[item.name] > 0);
        
        if (sellableItems.length === 0) {
            renderer.drawText('You have nothing to sell!', centerX, 250, renderer.colors.text, 'center');
        } else {
            let y = 170;
            sellableItems.forEach((item, index) => {
                const color = index === this.selectedIndex ? renderer.colors.accent : renderer.colors.text;
                const prefix = index === this.selectedIndex ? '> ' : '  ';
                
                const itemName = item.name.charAt(0).toUpperCase() + item.name.slice(1);
                const sellPrice = this.prices[item.name] * 0.5;
                const current = this.gameData.supplies[item.name];
                
                let displayPrice, unit;
                if (item.name === 'food') {
                    const amount = Math.min(50, current);
                    displayPrice = (sellPrice * amount).toFixed(2);
                    unit = `${amount} lbs`;
                } else if (item.name === 'ammunition') {
                    displayPrice = sellPrice.toFixed(2);
                    unit = 'box';
                } else if (item.name === 'clothing') {
                    displayPrice = sellPrice.toFixed(2);
                    unit = 'set';
                } else {
                    displayPrice = sellPrice.toFixed(2);
                    unit = 'each';
                }
                
                renderer.drawText(`${prefix}${itemName}`, 100, y, color);
                renderer.drawText(`$${displayPrice}/${unit}`, 300, y, color);
                renderer.drawText(`(have: ${current})`, 500, y, color);
                y += 30;
            });
        }
        
        // Back option
        const backY = sellableItems.length === 0 ? 300 : 170 + sellableItems.length * 30 + 20;
        const backColor = this.selectedIndex === sellableItems.length ? renderer.colors.accent : renderer.colors.text;
        const backPrefix = this.selectedIndex === sellableItems.length ? '> ' : '  ';
        renderer.drawText(`${backPrefix}Back`, 100, backY, backColor);
        
        renderer.drawText('ARROW KEYS: Navigate  ENTER: Sell  ESC: Back', centerX, 560, renderer.colors.secondary, 'center', '14px');
    }
}
