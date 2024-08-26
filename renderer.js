// Constants for DOM elements
const startButton = document.getElementById('startButton');
const backButton = document.getElementById('backButton');
const audioPlayer = document.getElementById('audioPlayer');
const scoresDiv = document.getElementById('scores');
const teamsInput = document.getElementById('teamsInput');
const entriesInput = document.getElementById('entriesInput');
const fileInput = document.getElementById('fileInput');
const teamInfoInputInput = document.getElementById('songs');
const songsContainer = document.getElementById('songsContainer');

// Initialize the application
function initialize() {
    overrideWindowMethods();
    attachEventListeners();
    createSongInputs();
}

// Attach event listeners to DOM elements
function attachEventListeners() {
    startButton?.addEventListener('click', handleStartButtonClick);
    backButton?.addEventListener('click', handleBackButtonClick);
    teamsInput?.addEventListener('input', checkInputs);
    entriesInput?.addEventListener('input', checkInputs);
    fileInput?.addEventListener('change', checkInputs);
    teamInfoInputInput?.addEventListener('change', checkInputs);
}

// Check if all inputs are valid and enable/disable the start button
function checkInputs() {
    const allInputsValid = teamsInput.value && entriesInput.value && fileInput.files.length > 0;
    startButton.disabled = !allInputsValid;
    startButton.textContent = teamInfoInputInput.checked ? 'Choose Songs' : 'Start Program';
}

// Handle start button click event
async function handleStartButtonClick() {
    const numTeams = parseInt(teamsInput?.value) || await window.electronAPI.getGlobalData('numTeams');
    const numEntries = parseInt(entriesInput?.value) || await window.electronAPI.getGlobalData('numEntries');
    const filePath = fileInput?.files[0]?.path || await window.electronAPI.getGlobalData('filePath');
    const teamInfoInput = teamInfoInputInput?.checked || false;

    if (!isValidNumber(numTeams, 2, 99, 'teams')) return;
    if (!isValidNumber(numEntries, 1, 99, 'entries')) return;
    if (!filePath) {
        alert('Please upload an Excel file.');
        return;
    }

    saveGlobalData({ numTeams, numEntries, filePath, teamInfoInput });

    const targetScreen = teamInfoInput ? 'screens/teamInfoInput.html' : 'screens/main.html';
    window.electronAPI.navigate(targetScreen);
}

// Validate if the number is within a specific range
function isValidNumber(value, min, max, type) {
    if (value < min || value > max) {
        alert(`Please enter a valid number of ${type} (${min}-${max}).`);
        return false;
    }
    return true;
}

// Save data to global state
function saveGlobalData({ numTeams, numEntries, filePath, teamInfoInput }) {
    window.electronAPI.setGlobalData('numTeams', numTeams);
    window.electronAPI.setGlobalData('numEntries', numEntries);
    window.electronAPI.setGlobalData('filePath', filePath);
    window.electronAPI.setGlobalData('teamInfoInput', teamInfoInput);
}

// Create song input fields dynamically
async function createSongInputs() {
    const teamInfoInput = await window.electronAPI.getGlobalData('teamInfoInput');
    const numTeams = await window.electronAPI.getGlobalData('numTeams');

    if (teamInfoInput) {
        generateSongInputs(numTeams);
    }
}

async function generateSongInputs(numTeams) {
    try {
        const documentsPath = await window.electronAPI.getDocumentsPath(); // Await the promise
        const path = await window.electronAPI.getPath(); // Await the promise to get the path module
        const songsFolder = path.join(documentsPath, 'Giro-413-data'); // Now use the path.join

        if (songsContainer) {
            songsContainer.innerHTML = ''; // Clear existing content

            for (let i = 1; i <= numTeams; i++) {
                const div = document.createElement('div');
                div.className = 'team-input';
                div.innerHTML = `
                    <label for="team${i}Song">Team ${i}</label>
                    <input type="text" id="team${i}Name" placeholder="Name for team ${i}">
                    <input type="file" id="team${i}Song" accept=".mp3" data-default-song="${path.join(songsFolder, `team${i}.mp3`)}">
                `;
                songsContainer.appendChild(div);

                // Add event listener for song upload
                const songInput = document.getElementById(`team${i}Song`);
                songInput?.addEventListener('change', (event) => handleSongUpload(i, event));

                // Add event listener for name input
                const nameInput = document.getElementById(`team${i}Name`);
                nameInput?.addEventListener('input', (event) => handleNameInput(i, event));
            }
        }
    } catch (error) {
        console.error('Error generating song inputs:', error);
    }
}

// Handle song upload for each team
function handleSongUpload(teamNumber, event) {
    const input = event.target;
    if (input.files && input.files[0]) {
        const filePath = input.files[0].path;
        let audioFilesPath = window.electronAPI.getGlobalDataSync('audioFiles') || {};
        audioFilesPath[teamNumber] = filePath;
        window.electronAPI.setGlobalData('audioFiles', audioFilesPath);
    }
}

// Handle team name input for each team
function handleNameInput(teamNumber, event) {
    const input = event.target;
    const teamName = input.value.trim();
    let teamNames = window.electronAPI.getGlobalDataSync('teamNames') || {};
    teamNames[teamNumber] = teamName;
    window.electronAPI.setGlobalData('teamNames', teamNames);
}

function resetGlobalData() {
    window.electronAPI.setGlobalData('numTeams', null);
    window.electronAPI.setGlobalData('numEntries', null);
    window.electronAPI.setGlobalData('filePath', null);
    window.electronAPI.setGlobalData('teamInfoInput', null);
    window.electronAPI.setGlobalData('audioFiles', {});
    window.electronAPI.setGlobalData('teamNames', {});
}

// Handle back button click event
function handleBackButtonClick() {
    resetGlobalData();  // Reset all global data

    if (audioPlayer) { // Check if audioPlayer exists
        if (!audioPlayer.paused) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        }
    }
    window.electronAPI.navigate('screens/setup.html');
}

// Override window.alert and window.confirm
function overrideWindowMethods() {
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;

    window.alert = (message) => {
        const result = originalAlert(message);
        window.electronAPI.send('focus-fix');
        return result;
    };

    window.confirm = (message) => {
        const result = originalConfirm(message);
        window.electronAPI.send('focus-fix');
        return result;
    };
}

// Handle Excel data received from Electron.
function handleExcelData(data) {
    displayScores(data.scores, data.winningTeam);
    loadAudioFiles(data.scores.length);
    playWinningTeamAudio(data.winningTeam);
}

// Handle updated Excel data
function handleExcelUpdated(data) {
    displayScores(data.scores, data.winningTeam);
    playWinningTeamAudio(data.winningTeam);
}

// Load audio files for each team
function loadAudioFiles() {
    const numTeams = window.electronAPI.getGlobalDataSync('numTeams');
    let audioFilesPath = window.electronAPI.getGlobalDataSync('audioFiles') || {};

    for (let i = 1; i <= numTeams; i++) {
        if (!audioFilesPath[i]) {
            audioFilesPath[i] = `../team_songs/team${i}.mp3`;  // Set default path if none exists
        }
    }

    window.electronAPI.setGlobalData('audioFiles', audioFilesPath);
}

// Play audio for the winning team
function playWinningTeamAudio(winningTeam) {
    if (audioPlayer) {
        const audioFilesPath = window.electronAPI.getGlobalDataSync('audioFiles');
        if (winningTeam && audioFilesPath?.[winningTeam]) {
            audioPlayer.src = audioFilesPath[winningTeam];
            audioPlayer.play();
        }
    }
}

// Display scores and highlight the winning team
function displayScores(scores, winningTeam = null) {
    const scoresDiv = document.getElementById('scores'); // Ensure you have the correct reference
    if (scoresDiv) {
        scoresDiv.innerHTML = ''; // Clear previous content

        // Retrieve the saved team names from global data
        const teamNames = window.electronAPI.getGlobalDataSync('teamNames') || {};

        // Create a sortable array of scores with their indices
        const sortedScores = scores
            .map((score, index) => ({ score, index: index + 1 })) // Create objects with scores and indices
            .sort((a, b) => b.score - a.score); // Sort by score in descending order

        const ul = document.createElement('ul');
        sortedScores.forEach(({ score, index }) => {
            const li = document.createElement('li');
            // Use the saved team name or a default name if not available
            const teamName = teamNames[index] || `Team ${index}`;
            li.textContent = `${teamName}: ${score}`;
            if (winningTeam !== null && index === winningTeam) {
                li.classList.add('highlight');
            }
            ul.appendChild(li);
        });

        scoresDiv.appendChild(ul);
    }
}

// Run the initialization function
initialize();

// Electron event listeners
window.electronAPI.onExcelData(handleExcelData);
window.electronAPI.onExcelUpdated(handleExcelUpdated);