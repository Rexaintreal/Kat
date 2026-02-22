# Kat

A VS Code companion that tracks the lines of code you write each day. Your cat (Kat) survives or loses hearts based on your daily progress. If you miss too many days...... the cat **DIES** !! PLEASE MAINTAIN YOUR STREAKS

## Features

- **Daily Line Goal** - Set a target goal of lines to write each day (can be changed later)
- **Hearts System** - Start with 3 hearts, lose one for every day you miss your goal
- **Streaks** - Build a streak by hitting your goal daily, earn a heart back every 5 days (max 3)
- **Progress Bar** - Visual progress bar to show your daily goal inside the Kat webview panel
- **Status Bar** - Live progress bar always visible at the bottom of VS Code
- **Heatmap** - A 30-day history grid (GitHub styled) showing which days you hit your goal and by how much
- **Milestone Notifications** - Get notified at 25%, 50%, 75%, and 100% of your goal
- **Revive** - Revive your cat once after it dies and start fresh
- **Reset** - Wipe all progress, hearts, streaks and history and start over

## Commands

| Command | Description |
|---|---|
| `Open Kat` | Opens the Kat panel |
| `Set Kat Goal` | Set or update your daily line goal |
| `Reset Kat` | Reset all progress, streaks, hearts and history |

## Setup

Install from the VS Code marketplace and Kat will activate automatically when VS Code starts. On first launch it will ask you to set a daily line goal.

To set or change your goal at any time, open the command palette (`Ctrl+Shift+P`) and run `Set Kat Goal`.

## How It Works

Kat counts every new line you write across any file in your workspace. At the end of each day your progress is saved. If you met your goal, your streak goes up. If you missed it, you lose a heart. Miss enough days and the cat dies. Hit your goal 5 days in a row to earn a heart back.

## Project Structure

```
kat/
├── assets/
│   ├── alive.png
│   ├── dead.png
│   ├── heart.png
│   └── heart-empty.png
├── extension.js
├── package.json
├── logo.ico
└── README.md
```

## Author

Saurabh Tiwari

- GitHub: [@Rexaintreal](https://github.com/Rexaintreal)

## License

MIT License - [LICENSE](LICENSE)