export class GameData {
    static professions = [
        { name: 'Banker', money: 1600, scoreMultiplier: 1.0 },
        { name: 'Carpenter', money: 800, scoreMultiplier: 2.0 },
        { name: 'Farmer', money: 400, scoreMultiplier: 3.0 }
    ];
    
    static startMonths = [
        { name: 'March', month: 3, description: 'Good time to start' },
        { name: 'April', month: 4, description: 'Good time to start' },
        { name: 'May', month: 5, description: 'Reasonable time to start' },
        { name: 'June', month: 6, description: 'Late start, risky' },
        { name: 'July', month: 7, description: 'Very late, dangerous' }
    ];
    
    static diseases = [
        'Dysentery',
        'Cholera',
        'Typhoid',
        'Measles',
        'Fever',
        'Broken Leg',
        'Snake Bite',
        'Exhaustion'
    ];
    
    constructor(config) {
        this.profession = config.profession;
        this.leaderName = config.leaderName;
        this.partyMembers = config.partyMembers.map(name => ({
            name,
            health: 100,
            alive: true,
            illness: null
        }));
        
        this.currentMonth = config.startMonth.month;
        this.currentDay = 1;
        this.year = 1848;
        
        this.money = config.money;
        this.supplies = {
            oxen: 0,
            food: 0,
            clothing: 0,
            ammunition: 0,
            wheels: 0,
            axles: 0,
            tongues: 0,
            ...config.supplies
        };
        
        this.milesTraveled = 0;
        this.totalMiles = 2040; // Total miles to Oregon
        
        this.pace = 'steady'; // slow, steady, grueling
        this.rations = 'filling'; // bare bones, meager, filling
        
        this.weather = 'fair'; // fair, warm, cool, cold, very cold, stormy
        this.health = 'good'; // good, fair, poor, very poor
        
        this.currentLocation = 'Independence';
        this.nextLandmark = null;
        this.nextLandmarkDistance = 0;
        this.visitedLandmarks = [];
    }
    
    getTotalHealth() {
        const aliveMembers = this.partyMembers.filter(m => m.alive);
        if (aliveMembers.length === 0) return 0;
        
        const totalHealth = aliveMembers.reduce((sum, member) => {
            return sum + member.health;
        }, 0);
        return totalHealth / aliveMembers.length;
    }
    
    getAliveMembers() {
        return this.partyMembers.filter(m => m.alive);
    }
    
    getDateString() {
        const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[this.currentMonth]} ${this.currentDay}, ${this.year}`;
    }
}
