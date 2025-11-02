import { GameState } from './GameState.js';
import { TravelMenuState } from './TravelMenuState.js';
import { GameOverState } from './GameOverState.js';
import { RiverCrossingState } from './RiverCrossingState.js';
import { TradingState } from './TradingState.js';
import { Landmarks } from '../data/Landmarks.js';
import { getRandomEvent } from '../data/RandomEvents.js';

export class TravelState extends GameState {
    constructor(game, gameData) {
        super(game);
        this.gameData = gameData;
        this.dayTimer = 0;
        this.dayLength = 2.0; // Seconds per day at normal speed
        this.traveling = true;
        this.showMessage = false;
        this.message = '';
        this.messageTimer = 0;
    }
    
    enter() {
        console.log('Starting journey with:', this.gameData);
        this.traveling = true;
        
        // Set initial next landmark
        this.updateNextLandmark();
    }
    
    update(deltaTime, input) {
        // Open menu
        if (input.keyBuffer.includes(' ') || input.keyBuffer.includes('Enter')) {
            this.game.stateManager.pushState(new TravelMenuState(this.game, this.gameData));
            return;
        }
        
        // Handle message timer
        if (this.showMessage) {
            this.messageTimer -= deltaTime;
            if (this.messageTimer <= 0) {
                this.showMessage = false;
            }
        }
        
        // Travel logic
        if (this.traveling) {
            this.dayTimer += deltaTime;
            
            if (this.dayTimer >= this.dayLength) {
                this.dayTimer = 0;
                this.advanceDay();
            }
        }
    }
    
    advanceDay() {
        // Advance date
        this.gameData.currentDay++;
        const daysInMonth = this.getDaysInMonth(this.gameData.currentMonth);
        
        if (this.gameData.currentDay > daysInMonth) {
            this.gameData.currentDay = 1;
            this.gameData.currentMonth++;
            
            if (this.gameData.currentMonth > 12) {
                this.gameData.currentMonth = 1;
                this.gameData.year++;
            }
        }
        
        // Calculate miles traveled based on pace
        const milesPerDay = this.getMilesPerDay();
        this.gameData.milesTraveled += milesPerDay;
        
        // Consume food
        this.consumeFood();
        
        // Random events and health updates
        this.updateHealth();
        this.checkRandomEvents();
        this.checkLandmarks();
        
        // Check if everyone is dead (after health update)
        const aliveCount = this.gameData.getAliveMembers().length;
        console.log('After health update - alive count:', aliveCount);
        
        if (aliveCount === 0) {
            console.log('Everyone is dead! Transitioning to game over...');
            this.traveling = false;
            this.game.stateManager.setState(new GameOverState(this.game, this.gameData, 'death'));
            return;
        }
        
        // Check if reached destination
        if (this.gameData.milesTraveled >= this.gameData.totalMiles) {
            this.reachedOregon();
        }
    }
    
    getMilesPerDay() {
        const paceMap = {
            'slow': 8,
            'steady': 12,
            'grueling': 17
        };
        
        // Reduce miles if health is poor or oxen are weak
        let miles = paceMap[this.gameData.pace] || 12;
        
        if (this.gameData.supplies.oxen < 2) {
            miles *= 0.5; // Half speed with insufficient oxen
        }
        
        // Weather effects
        if (this.gameData.weather === 'stormy' || this.gameData.weather === 'very cold') {
            miles *= 0.5;
        }
        
        return Math.round(miles);
    }
    
    consumeFood() {
        const rationMap = {
            'bare bones': 2,
            'meager': 3,
            'filling': 4
        };
        
        const foodPerPerson = rationMap[this.gameData.rations] || 3;
        const totalFood = foodPerPerson * this.gameData.getAliveMembers().length;
        
        if (this.gameData.supplies.food >= totalFood) {
            this.gameData.supplies.food -= totalFood;
        } else {
            // Not enough food - damage health
            this.gameData.supplies.food = 0;
            let deadFromStarvation = [];
            
            this.gameData.partyMembers.forEach(member => {
                if (member.alive) {
                    member.health = Math.max(0, member.health - 5);
                    
                    // Check for death from starvation
                    if (member.health <= 0) {
                        member.alive = false;
                        member.health = 0;
                        deadFromStarvation.push(member.name);
                    }
                }
            });
            
            if (deadFromStarvation.length > 0) {
                this.showTemporaryMessage(`Out of food! ${deadFromStarvation.join(', ')} starved to death!`, 4);
            } else {
                this.showTemporaryMessage('Out of food! Party health declining!', 3);
            }
        }
    }
    
    updateHealth() {
        let someoneDied = false;
        let deadNames = [];
        let recoveredNames = [];
        
        this.gameData.partyMembers.forEach(member => {
            if (!member.alive) return;
            
            // Update illness duration and recovery
            if (member.illness) {
                member.illnessDays = (member.illnessDays || 0) + 1;
                
                // Illness continues to damage health
                const illnessDamage = this.getIllnessDamage(member.illness);
                member.health = Math.max(0, member.health - illnessDamage);
                
                // Check for recovery (increases with rest and good rations)
                const recoveryChance = this.calculateRecoveryChance(member);
                if (Math.random() * 100 < recoveryChance) {
                    recoveredNames.push(member.name);
                    member.illness = null;
                    member.illnessDays = 0;
                }
            }
            
            // Ration effects on health (only if not sick)
            if (!member.illness) {
                if (this.gameData.rations === 'bare bones') {
                    member.health = Math.max(0, member.health - 2);
                } else if (this.gameData.rations === 'meager') {
                    member.health = Math.max(0, member.health - 0.5);
                } else if (this.gameData.rations === 'filling') {
                    member.health = Math.min(100, member.health + 0.5);
                }
            }
            
            // Pace effects
            if (this.gameData.pace === 'grueling') {
                member.health = Math.max(0, member.health - 1);
            }
            
            // Clothing effects in cold weather
            if ((this.gameData.weather === 'cold' || this.gameData.weather === 'very cold') 
                && this.gameData.supplies.clothing < 2) {
                member.health = Math.max(0, member.health - 1.5);
            }
            
            // Death check
            if (member.health <= 0) {
                member.alive = false;
                member.health = 0;
                someoneDied = true;
                deadNames.push(member.name);
                console.log(`${member.name} died. Alive status:`, member.alive);
            }
        });
        
        console.log('Alive members count:', this.gameData.getAliveMembers().length);
        console.log('Party members:', this.gameData.partyMembers.map(m => ({ name: m.name, health: m.health, alive: m.alive })));
        
        // Show recovery message
        if (recoveredNames.length > 0) {
            const recoveryMsg = recoveredNames.length === 1 
                ? `${recoveredNames[0]} has recovered!`
                : `${recoveredNames.join(', ')} have recovered!`;
            this.showTemporaryMessage(recoveryMsg, 4);
        }
        
        // Show death message
        if (someoneDied) {
            if (deadNames.length === 1) {
                this.showTemporaryMessage(`${deadNames[0]} has died.`, 4);
            } else {
                this.showTemporaryMessage(`${deadNames.join(', ')} have died.`, 4);
            }
        }
        
        // Update overall health status
        const aliveCount = this.gameData.getAliveMembers().length;
        if (aliveCount === 0) {
            this.gameData.health = 'dead';
        } else {
            const avgHealth = this.gameData.getTotalHealth();
            if (avgHealth >= 80) this.gameData.health = 'good';
            else if (avgHealth >= 50) this.gameData.health = 'fair';
            else if (avgHealth >= 20) this.gameData.health = 'poor';
            else this.gameData.health = 'very poor';
        }
    }
    
    getIllnessDamage(illness) {
        const damageMap = {
            'Dysentery': 1.5,
            'Cholera': 2,
            'Typhoid': 1.8,
            'Measles': 1,
            'Fever': 0.8,
            'Broken Leg': 0.5,
            'Snake Bite': 1.2,
            'Exhaustion': 0.6
        };
        return damageMap[illness] || 1;
    }
    
    calculateRecoveryChance(member) {
        // Base recovery chance per day
        let chance = 5;
        
        // Resting increases recovery
        if (this.gameData.pace === 'slow') {
            chance += 10;
        } else if (this.gameData.pace === 'grueling') {
            chance -= 5;
        }
        
        // Good rations help recovery
        if (this.gameData.rations === 'filling') {
            chance += 8;
        } else if (this.gameData.rations === 'bare bones') {
            chance -= 5;
        }
        
        // Longer illness means more likely to recover
        if (member.illnessDays > 7) {
            chance += 15;
        } else if (member.illnessDays > 3) {
            chance += 5;
        }
        
        return Math.max(0, chance);
    }
    
    checkRandomEvents() {
        // Random event chance (8% per day)
        if (Math.random() < 0.08) {
            this.triggerRandomEvent();
        }
        
        // Disease chance (3% per day)
        if (Math.random() < 0.03) {
            this.triggerDiseaseEvent();
        }
        
        // Weather changes (15% chance per day)
        if (Math.random() < 0.15) {
            this.updateWeather();
        }
    }
    
    triggerRandomEvent() {
        const event = getRandomEvent();
        
        if (event.disease) {
            // Disease event
            this.triggerDiseaseEvent(event);
        } else {
            // Regular event
            let fullMessage = event.message;
            
            const result = event.effect(this.gameData);
            if (result) {
                fullMessage += ' ' + result;
            }
            
            this.showTemporaryMessage(fullMessage, 4);
        }
    }
    
    triggerDiseaseEvent(specificEvent = null) {
        const aliveMembers = this.gameData.getAliveMembers();
        if (aliveMembers.length === 0) return;
        
        // Pick random party member who isn't already sick
        const healthyMembers = aliveMembers.filter(m => !m.illness);
        
        if (healthyMembers.length === 0) {
            // Everyone is already sick, skip this event
            return;
        }
        
        const victim = healthyMembers[Math.floor(Math.random() * healthyMembers.length)];
        
        const diseaseEvent = specificEvent || getRandomEvent('disease');
        
        // Apply disease damage
        victim.health = Math.max(0, victim.health - diseaseEvent.severity);
        victim.illness = diseaseEvent.disease;
        victim.illnessDays = 0; // Track how long they've been sick
        
        const message = `${victim.name} ${diseaseEvent.message}!`;
        this.showTemporaryMessage(message, 4);
        
        // Check if disease killed them
        if (victim.health <= 0) {
            victim.alive = false;
            victim.health = 0;
        }
    }
    
    updateWeather() {
        const weathers = ['fair', 'warm', 'cool', 'cold', 'very cold', 'stormy'];
        const currentIndex = weathers.indexOf(this.gameData.weather);
        
        // Tend toward fair weather, but allow changes
        const rand = Math.random();
        if (rand < 0.5) {
            this.gameData.weather = 'fair';
        } else if (rand < 0.7) {
            this.gameData.weather = weathers[Math.max(0, Math.min(currentIndex + 1, weathers.length - 1))];
        } else {
            this.gameData.weather = weathers[Math.floor(Math.random() * weathers.length)];
        }
    }
    
    checkLandmarks() {
        // Find the next landmark we haven't reached yet
        const currentMiles = this.gameData.milesTraveled;
        
        // Check each landmark to see if we just passed it
        for (let landmark of Landmarks) {
            // If we haven't marked this landmark as visited and we've reached it
            if (!this.gameData.visitedLandmarks.includes(landmark.name) && 
                currentMiles >= landmark.distance) {
                this.reachLandmark(landmark);
                break; // Only handle one landmark at a time
            }
        }
    }
    
    updateNextLandmark() {
        const next = Landmarks.find(l => !this.gameData.visitedLandmarks.includes(l.name));
        this.gameData.nextLandmark = next ? next.name : 'Oregon City';
        this.gameData.nextLandmarkDistance = next ? next.distance : this.gameData.totalMiles;
    }
    
    reachLandmark(landmark) {
        this.traveling = false;
        
        // Mark as visited
        this.gameData.visitedLandmarks.push(landmark.name);
        
        // Update next landmark
        this.updateNextLandmark();
        
        // Handle different landmark types
        if (landmark.type === 'river') {
            // River crossing
            this.game.stateManager.pushState(new RiverCrossingState(this.game, this.gameData, landmark));
        } else if (landmark.type === 'fort') {
            // Fort - can trade/rest
            this.showTemporaryMessage(`You have reached ${landmark.name}!`, 3);
            this.game.stateManager.pushState(new TradingState(this.game, this.gameData, landmark.name));
        } else if (landmark.type === 'destination') {
            // Reached Oregon!
            this.reachedOregon();
        } else {
            // Regular landmark
            this.showTemporaryMessage(`You have reached ${landmark.name}!`, 3);
            setTimeout(() => {
                this.traveling = true;
            }, 2000);
        }
    }
    
    showTemporaryMessage(msg, duration) {
        this.message = msg;
        this.showMessage = true;
        this.messageTimer = duration;
    }
    
    getDaysInMonth(month) {
        const days = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return days[month];
    }
    
    reachedOregon() {
        this.traveling = false;
        this.game.stateManager.setState(new GameOverState(this.game, this.gameData, 'reached'));
    }
    
    render(renderer) {
        // Top status bar
        this.renderStatusBar(renderer);
        
        // Main travel view
        this.renderTrailScene(renderer);
        
        // Messages below progress bar
        if (this.showMessage) {
            this.renderMessage(renderer);
        }
        
        // Bottom info panel
        this.renderInfoPanel(renderer);
    }
    
    renderStatusBar(renderer) {
        const y = 20;
        
        renderer.drawText(this.gameData.getDateString(), 20, y, renderer.colors.info);
        
        const weather = `Weather: ${this.gameData.weather}`;
        renderer.drawText(weather, 250, y, renderer.colors.text);
        
        const health = `Health: ${this.gameData.health}`;
        const healthColor = this.gameData.health === 'good' ? renderer.colors.primary :
                           this.gameData.health === 'fair' ? renderer.colors.accent :
                           renderer.colors.danger;
        renderer.drawText(health, 450, y, healthColor);
        
        const pace = `Pace: ${this.gameData.pace}`;
        renderer.drawText(pace, 600, y, renderer.colors.text);
    }
    
    renderTrailScene(renderer) {
        const centerX = renderer.width / 2;
        const centerY = 200;
        
        // Simple trail representation
        renderer.drawText('===========================================', centerX, centerY - 40, renderer.colors.secondary, 'center');
        renderer.drawText('The trail stretches ahead...', centerX, centerY, renderer.colors.text, 'center');
        renderer.drawText('===========================================', centerX, centerY + 40, renderer.colors.secondary, 'center');
        
        // Progress
        const milesRemaining = this.gameData.totalMiles - this.gameData.milesTraveled;
        const progressText = `${this.gameData.milesTraveled} miles traveled - ${milesRemaining} miles to go`;
        renderer.drawText(progressText, centerX, centerY + 80, renderer.colors.primary, 'center');
        
        // Progress bar
        const barWidth = 600;
        const barX = (renderer.width - barWidth) / 2;
        const percentage = (this.gameData.milesTraveled / this.gameData.totalMiles) * 100;
        renderer.drawProgressBar(barX, centerY + 110, barWidth, 20, percentage, renderer.colors.accent);
    }
    
    renderMessage(renderer) {
        const centerX = renderer.width / 2;
        const messageY = 345; // Right below the progress bar
        
        // Determine message color based on content
        let messageColor = renderer.colors.info;
        if (this.message.includes('died') || this.message.includes('Dead') || this.message.includes('Game Over')) {
            messageColor = renderer.colors.danger;
        } else if (this.message.includes('Out of food') || this.message.includes('damaged')) {
            messageColor = renderer.colors.accent;
        } else if (this.message.includes('Oregon') || this.message.includes('Found')) {
            messageColor = renderer.colors.primary;
        }
        
        // Message text
        renderer.drawText(this.message, centerX, messageY, messageColor, 'center');
    }
    
    renderInfoPanel(renderer) {
        const y = 380;
        
        // Supplies
        renderer.drawText('Supplies:', 50, y, renderer.colors.info);
        renderer.drawText(`Food: ${Math.floor(this.gameData.supplies.food)} lbs`, 50, y + 25, renderer.colors.text);
        renderer.drawText(`Ammunition: ${this.gameData.supplies.ammunition} boxes`, 50, y + 50, renderer.colors.text);
        renderer.drawText(`Clothing: ${this.gameData.supplies.clothing} sets`, 50, y + 75, renderer.colors.text);
        
        // Party
        renderer.drawText('Party:', 300, y, renderer.colors.info);
        let memberY = y + 25;
        this.gameData.partyMembers.forEach(member => {
            if (member.alive) {
                const healthColor = member.health > 70 ? renderer.colors.primary :
                                  member.health > 40 ? renderer.colors.accent :
                                  renderer.colors.danger;
                let statusText = `${member.name}: ${Math.floor(member.health)}%`;
                if (member.illness) {
                    statusText += ` (${member.illness})`;
                }
                renderer.drawText(statusText, 300, memberY, healthColor);
                memberY += 25;
            }
        });
        
        // Next landmark
        renderer.drawText('Next landmark:', 550, y, renderer.colors.info);
        const nextLandmark = this.gameData.nextLandmark || 'Kansas River Crossing';
        const distanceToNext = (this.gameData.nextLandmarkDistance || 102) - this.gameData.milesTraveled;
        renderer.drawText(nextLandmark, 550, y + 25, renderer.colors.text);
        renderer.drawText(`${Math.max(0, Math.round(distanceToNext))} miles`, 550, y + 50, renderer.colors.secondary);
        
        // Controls hint
        if (this.traveling) {
            renderer.drawText('Press SPACE or ENTER for options', renderer.width / 2, 560, renderer.colors.secondary, 'center');
        }
    }
}
