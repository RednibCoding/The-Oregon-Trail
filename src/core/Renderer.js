export class Renderer {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        
        // Retro color palette
        this.colors = {
            background: '#0a0a0a',
            primary: '#00ff00',
            secondary: '#00cc00',
            accent: '#ffcc00',
            danger: '#ff4444',
            info: '#44ccff',
            text: '#e0e0e0',
            border: '#2a5a2a',
            highlight: '#ffffff'
        };
        
        // Font settings for retro look
        this.fontSize = 16;
        this.lineHeight = 20;
        this.font = `${this.fontSize}px "Courier New", monospace`;
    }
    
    clear() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawText(text, x, y, color = this.colors.text, align = 'left') {
        this.ctx.font = this.font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(text, x, y);
    }
    
    drawTextBlock(lines, x, y, color = this.colors.text, align = 'left') {
        lines.forEach((line, index) => {
            this.drawText(line, x, y + (index * this.lineHeight), color, align);
        });
    }
    
    drawBox(x, y, width, height, borderColor = this.colors.border, fillColor = null) {
        if (fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fillRect(x, y, width, height);
        }
        
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
    }
    
    drawProgressBar(x, y, width, height, percentage, color = this.colors.primary) {
        // Border
        this.drawBox(x, y, width, height, this.colors.border);
        
        // Fill
        const fillWidth = (width - 4) * (percentage / 100);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + 2, y + 2, fillWidth, height - 4);
    }
    
    drawButton(text, x, y, width, height, isSelected = false) {
        const bgColor = isSelected ? this.colors.primary : this.colors.background;
        const textColor = isSelected ? this.colors.background : this.colors.primary;
        const borderColor = this.colors.primary;
        
        this.drawBox(x, y, width, height, borderColor, bgColor);
        
        // Center text in button
        const textX = x + width / 2;
        const textY = y + (height - this.fontSize) / 2;
        this.drawText(text, textX, textY, textColor, 'center');
    }
    
    drawASCIIArt(lines, x, y, color = this.colors.primary) {
        this.drawTextBlock(lines, x, y, color);
    }
    
    measureText(text) {
        this.ctx.font = this.font;
        return this.ctx.measureText(text).width;
    }
}
