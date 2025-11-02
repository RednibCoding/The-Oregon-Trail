# The Oregon Trail

A faithful recreation of the classic 1985 educational computer game, built with modern ES6 JavaScript and HTML5 Canvas.

![Oregon Trail Game](https://img.shields.io/badge/Status-Complete-brightgreen)

## About

Relive the journey of 19th-century pioneers traveling from Independence, Missouri to Oregon City, Oregon along the historic Oregon Trail. Manage your resources, make critical decisions, and guide your party of five across 2,040 miles of dangerous frontier territory.

## Features

### Core Gameplay
- **Complete Journey** - Travel all 2,040 miles from Independence to Oregon City
- **16 Historical Landmarks** - Visit forts, cross rivers, and reach important waypoints
- **Party Management** - Lead a party of 5 members with individual health tracking
- **Resource Management** - Manage oxen, food, ammunition, clothing, and spare parts
- **Date System** - Start anytime from March to July 1848, experience the passage of time

### Game Mechanics
- **Store System** - Purchase supplies at the start and at forts along the trail
- **Travel Mechanics** - Control pace (slow/steady/grueling) and rations (bare bones/meager/filling)
- **Random Events** - Face weather, disease, robberies, breakdowns, and lucky finds
- **River Crossings** - Choose to ford, caulk, ferry, or wait for better conditions
- **Hunting Mini-Game** - Retro grid-based hunting with authentic 1980s feel
- **Trading System** - Buy and sell supplies at forts with dynamic pricing
- **Health System** - Monitor health, treat illnesses, rest to recover
- **Scoring System** - Earn points based on distance, survivors, supplies, and profession

### Authentic Retro Style
- **Terminal Aesthetics** - Black background with green/yellow text like the original
- **ASCII-Style Graphics** - Simple, retro character-based visuals
- **Keyboard Controls** - Arrow keys and space bar navigation
- **Grid-Based Movement** - Tick-based hunting mechanics true to the original

## Professions

Choose your profession at the start - it affects difficulty and scoring:

- **Banker** - Start with $1,600 (Easy, 1x score multiplier)
- **Carpenter** - Start with $800 (Medium, 2x score multiplier)  
- **Farmer** - Start with $400 (Hard, 3x score multiplier)

## How to Play

### Starting Out
1. Enter your name and choose your profession
2. Name your 4 party members
3. Choose your starting month (earlier is better!)
4. Buy supplies at the general store

### On the Trail
- **SPACE/ENTER** - Open travel menu
- **Arrow Keys** - Navigate menus
- Change your pace and rations to balance speed vs. safety
- Rest when party members are sick or injured
- Hunt for food when ammunition is available
- Trade at forts to restock supplies

### Survival Tips
- Keep food stocked - your party eats every day
- Slower pace = less wear but slower progress
- Better rations = healthier party but more food consumption
- Rest to recover from illnesses
- Don't waste ammunition hunting more than you can carry (100 lbs limit)
- Trade wisely - prices vary at different forts

## Scoring

Your final score is based on:
- **Distance traveled** (1 pt/mile)
- **Surviving party members** (50 pts each)
- **Party health** (1 pt per health point)
- **Remaining supplies** (varying values)
- **Remaining cash** (0.5 pts per dollar)
- **Completion bonus** (500 pts for reaching Oregon)
- **Profession multiplier** (1x - 3x)

### Score Ratings
- 10,000+ : Legendary Trail Blazer
- 7,500+ : Outstanding Pioneer
- 5,000+ : Successful Settler
- 3,000+ : Experienced Traveler
- 1,500+ : Competent Adventurer
- 500+ : Novice Explorer
- < 500 : Struggling Wanderer

## Technical Details

### Built With
- **Vanilla JavaScript (ES6 Modules)** - No frameworks, pure modern JS
- **HTML5 Canvas** - 800x600 retro-styled rendering
- **State Machine Pattern** - Clean game state management
- **Event-Driven Architecture** - Modular random event system

### Project Structure
```
oregon-trail/
├── index.html
├── styles/
│   └── main.css
└── src/
    ├── main.js
    ├── core/
    │   ├── Game.js
    │   ├── Renderer.js
    │   ├── InputHandler.js
    │   └── StateManager.js
    ├── states/
    │   ├── GameState.js
    │   ├── TitleState.js
    │   ├── SetupState.js
    │   ├── StoreState.js
    │   ├── TravelState.js
    │   ├── TravelMenuState.js
    │   ├── RestState.js
    │   ├── RiverCrossingState.js
    │   ├── HuntingState.js
    │   ├── TradingState.js
    │   └── GameOverState.js
    └── data/
        ├── GameData.js
        ├── Landmarks.js
        └── RandomEvents.js
```

## Running the Game

1. Clone or download this repository
2. Start a local server (required for ES6 modules):
   - **Python 3**: `python -m http.server 8000`
   - **Python 2**: `python -m SimpleHTTPServer 8000`
   - **VS Code**: Use the Live Server extension
   - **Node.js**: `npx http-server`
3. Open `http://localhost:8000` in your browser
4. Start your journey on the Oregon Trail!

**Note**: Due to CORS restrictions with ES6 modules, you must use a local server. Opening `index.html` directly in a browser will not work.

## Historical Note

The original Oregon Trail was created in 1971 by Don Rawitsch, Bill Heinemann, and Paul Dillenberger. The 1985 Apple II version by MECC became one of the most influential educational games ever made, teaching millions of students about American pioneer life.

This recreation aims to capture the spirit and gameplay of that classic while using modern web technologies.

## Controls Reference

### General
- **Arrow Keys** - Navigate menus and move character (hunting)
- **SPACE** - Open menu, shoot (hunting), select option
- **ENTER** - Select menu option, confirm action
- **ESC** - Go back, close menu

### Travel Screen
- **SPACE/ENTER** - Open travel menu
  - Continue on trail
  - Check supplies
  - Look at map
  - Change pace
  - Change rations
  - Stop to rest
  - Attempt to trade
  - Hunt for food

### Hunting
- **Arrow Keys** - Move your character (@)
- **SPACE** - Shoot in the direction you're facing
- Characters: r=rabbit, s=squirrel, d=deer, B=buffalo

## License

This is a fan recreation for educational purposes. The Oregon Trail is a trademark of HarperCollins Publishers.

---

**Have you got what it takes to reach Oregon?**

*You have died of dysentery.*
