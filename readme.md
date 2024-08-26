# Giro-413 Player

## Overview

The Giro-413 Player is an application designed to manage and play audio files during a Giro-413 event. Users can input their own audio files and team names or use default settings. The application supports Excel file (xlsx) input to read scores and dynamically updates the audio playback based on these scores.

Upon the first start of the application, a folder named `Giro-413-data` will be automatically created in your `Documents` directory. This folder will include the following:

- Excel Template: An Excel file named `Pointscore.xlsx`, pre-populated with data for four teams and three entries, serving as a template for your event. You can customize this file to fit your specific needs.

- Team Songs: Four sample songs, each published under Creative Commons license.

## Features

- **Customizable Team Information:** Input team names and upload specific songs for each team.
- **Excel Integration:** Read scores from an Excel file to dynamically update the scores and winning team.
- **Audio Playback:** Automatically play audio files associated with the winning team.
- **Default Settings:** If custom audio files are not provided, the application will use default MP3 files from the `team_songs` folder. For example:
  - If you have 2 teams, the application will attempt to load `team1.mp3` and `team2.mp3` from the `team_songs` folder.
  - If you have 4 teams, it will look for `team1.mp3`, `team2.mp3`, `team3.mp3`, and `team4.mp3`.
  Ensure that the MP3 files in the `team_songs` folder are named appropriately to match the number of teams.

### Key Files

- **`main.js`**: Main process script for the Electron app. Handles window creation, file watching, and global state management.
- **`renderer.js`**: Renderer process script. Manages the user interface, handles user inputs, and interacts with the main process.
- **`preload.js`**: Preload script to expose safe APIs to the renderer process.
- **`styles.css`**: CSS file for styling the application.
- **`screens/`**: HTML files for different application views.
- **`team_songs/`**: Directory containing default MP3 files for teams.

## Setup

### Prerequisites

- Node.js (>= 12.0.0)
- npm (Node Package Manager)

### Installation

1. **Clone the repository:**
```bash
   git clone https://github.com/your-username/giro-413-player.git
   cd giro-413-player
```

2. **Install dependencies:**
```bash
npm install
```

3. **Optional: Install nodemon for automatic restarts during development:**
```bash
npm install -g nodemon
```

## Running the Application
- To start the application:
```bash
npm start
```

- **To run with nodemon for automatic restarts:**
```bash
nodemon
```

## Build executable
The project comes included with `electron-builder` setup for Windows, Mac and Linux. To build for your specific operating system, run:
```bash
npm run dist
```

## Usage
1. **Setup:**
    - Open the application and go to the setup page.
    - Enter the number of teams and entries.
    - Upload an Excel file (.xlsx) containing the scores.
    - Optionally, check the checkbox to customize team names and upload specific songs.

2. **Team Info Input:**
    - If the checkbox for customization is checked, enter team names and upload specific songs for each team.

3. **Score Overview:**
    - View the scores and winning team on the main page. Every time the Excel file is being saved, the score and audio will automatically update.

4. **Optional: Project score**
    - It is possible to drag the bar chart from the Excel file onto a seperate screen for projection.

## Limitations
The application currently only supports MP3 files for team songs.
If no custom songs are provided, default MP3 files from the team_songs folder will be used.

## Troubleshooting
- **Application not starting:** Ensure all dependencies are installed and that you have the correct version of Node.js.
- **Excel file not found:** Check that the file path is correct and that the file is accessible.
- **Audio not playing:** Verify that the MP3 files are working, and if they are not inputtet, that they are correctly placed in the team_songs folder and named correctly

## Contributing
Contributions are welcome! Please submit issues or pull requests through the GitHub repository.

## License
This project is free to use and distribute