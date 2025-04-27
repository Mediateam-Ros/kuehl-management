// netlify/functions/getScores.js
const axios = require('axios');

exports.handler = async function(event, context) {
    try {
        // Hole die Live-Spieldaten von der externen API
        const response = await axios.get('https://www.sprade.tv/tools/scoreboard/livescore_oln.json');
        const gamesData = response.data;

        // Sicherstellen, dass wir nur die ersten 6 Spiele holen
        const formattedData = gamesData.slice(0, 6).map(game => {
            // Extrahiere die Drittel-Daten für jedes Spiel
            const thirdPeriods = [];
            for (let i = 1; i <= 8; i++) {
                if (game[`drittel${i}`]) {
                    thirdPeriods.push(game[`drittel${i}`]);
                }
            }

            return {
                homeTeam: game.home1,
                awayTeam: game.away1,
                homeScore: game.score1.split(" ")[0],  // z.B. 4
                awayScore: game.score1.split(" ")[1].replace('(', ''),  // z.B. 3
                homeLogo: game.homeimage1,
                awayLogo: game.awayimage1,
                gameTime: thirdPeriods.join(', ') || 'Spiel noch nicht gestartet',  // Zeigt alle Drittel an
            };
        });

        // Gib die transformierten Daten als JSON zurück
        return {
            statusCode: 200,
            body: JSON.stringify(formattedData)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: 'Fehler beim Laden der Spieldaten: ' + error.message
        };
    }
};
