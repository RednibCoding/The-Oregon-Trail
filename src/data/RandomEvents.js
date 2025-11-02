export const RandomEvents = {
    // Positive events
    positive: [
        {
            message: 'Found wild fruit and berries!',
            effect: (gameData) => {
                gameData.supplies.food += 20;
            }
        },
        {
            message: 'Beautiful weather - making good time!',
            effect: (gameData) => {
                gameData.weather = 'fair';
            }
        },
        {
            message: 'Helpful travelers shared some food.',
            effect: (gameData) => {
                gameData.supplies.food += 15;
            }
        },
        {
            message: 'Found abandoned supplies on the trail.',
            effect: (gameData) => {
                gameData.supplies.ammunition += 1;
                gameData.supplies.food += 10;
            }
        },
        {
            message: 'Party morale is high!',
            effect: (gameData) => {
                gameData.partyMembers.forEach(m => {
                    if (m.alive) m.health = Math.min(100, m.health + 5);
                });
            }
        }
    ],
    
    // Negative events
    negative: [
        {
            message: 'Wagon wheel broke!',
            effect: (gameData) => {
                if (gameData.supplies.wheels > 0) {
                    gameData.supplies.wheels -= 1;
                    return 'Used a spare wheel to repair.';
                } else {
                    gameData.partyMembers.forEach(m => {
                        if (m.alive) m.health = Math.max(0, m.health - 10);
                    });
                    return 'No spare wheel! Delayed repairs damaged health.';
                }
            }
        },
        {
            message: 'Wagon axle broke!',
            effect: (gameData) => {
                if (gameData.supplies.axles > 0) {
                    gameData.supplies.axles -= 1;
                    return 'Used a spare axle to repair.';
                } else {
                    gameData.partyMembers.forEach(m => {
                        if (m.alive) m.health = Math.max(0, m.health - 15);
                    });
                    return 'No spare axle! Major delays damaged health.';
                }
            }
        },
        {
            message: 'Wagon tongue broke!',
            effect: (gameData) => {
                if (gameData.supplies.tongues > 0) {
                    gameData.supplies.tongues -= 1;
                    return 'Used a spare tongue to repair.';
                } else {
                    gameData.partyMembers.forEach(m => {
                        if (m.alive) m.health = Math.max(0, m.health - 12);
                    });
                    return 'No spare tongue! Repairs damaged health.';
                }
            }
        },
        {
            message: 'Heavy rain and storms!',
            effect: (gameData) => {
                gameData.weather = 'stormy';
                return 'Progress slowed by bad weather.';
            }
        },
        {
            message: 'Very cold weather!',
            effect: (gameData) => {
                gameData.weather = 'very cold';
                if (gameData.supplies.clothing < 3) {
                    gameData.partyMembers.forEach(m => {
                        if (m.alive) m.health = Math.max(0, m.health - 8);
                    });
                    return 'Inadequate clothing in cold weather.';
                }
                return 'Bitter cold slows travel.';
            }
        },
        {
            message: 'Thieves stole supplies during the night!',
            effect: (gameData) => {
                const foodLost = Math.min(50, Math.floor(gameData.supplies.food * 0.2));
                const ammoLost = Math.min(3, gameData.supplies.ammunition);
                gameData.supplies.food -= foodLost;
                gameData.supplies.ammunition -= ammoLost;
                return `Lost ${foodLost} lbs of food and ${ammoLost} boxes of ammunition.`;
            }
        },
        {
            message: 'Ox died!',
            effect: (gameData) => {
                if (gameData.supplies.oxen > 0) {
                    gameData.supplies.oxen -= 1;
                    return 'Lost an ox. Travel will be slower.';
                }
                return null;
            }
        },
        {
            message: 'Fire in the wagon!',
            effect: (gameData) => {
                const foodLost = Math.min(40, Math.floor(gameData.supplies.food * 0.15));
                const clothingLost = Math.min(2, gameData.supplies.clothing);
                gameData.supplies.food -= foodLost;
                gameData.supplies.clothing -= clothingLost;
                return `Lost ${foodLost} lbs of food and ${clothingLost} sets of clothing.`;
            }
        }
    ],
    
    // Disease events
    diseases: [
        {
            disease: 'Dysentery',
            severity: 15,
            message: 'has dysentery'
        },
        {
            disease: 'Cholera',
            severity: 20,
            message: 'has cholera'
        },
        {
            disease: 'Typhoid',
            severity: 18,
            message: 'has typhoid fever'
        },
        {
            disease: 'Measles',
            severity: 12,
            message: 'has measles'
        },
        {
            disease: 'Fever',
            severity: 10,
            message: 'has a fever'
        },
        {
            disease: 'Broken Leg',
            severity: 14,
            message: 'broke their leg'
        },
        {
            disease: 'Snake Bite',
            severity: 16,
            message: 'was bitten by a snake'
        },
        {
            disease: 'Exhaustion',
            severity: 8,
            message: 'is exhausted'
        }
    ]
};

export function getRandomEvent(type = 'any') {
    if (type === 'positive') {
        return RandomEvents.positive[Math.floor(Math.random() * RandomEvents.positive.length)];
    } else if (type === 'negative') {
        return RandomEvents.negative[Math.floor(Math.random() * RandomEvents.negative.length)];
    } else if (type === 'disease') {
        return RandomEvents.diseases[Math.floor(Math.random() * RandomEvents.diseases.length)];
    } else {
        // Random type
        const rand = Math.random();
        if (rand < 0.3) return getRandomEvent('positive');
        else if (rand < 0.7) return getRandomEvent('negative');
        else return getRandomEvent('disease');
    }
}
