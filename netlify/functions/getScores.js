// netlify/functions/getScores.js
const axios = require('axios');

exports.handler = async function(event, context) {
    try {
        // Hole die Live-Spieldaten von der externen API
        const response = await axios.get('https://www.sprade.tv/tools/scoreboard/livescore_oln.json');
        const gamesData = response.data;

        // Sicherstellen, dass wir nur die ersten 6 Spiele holen
        const formattedData = gamesData.slice(0, 6).map(game => {
            // Extrahiere die Drittel-Daten für jedes Spiel und die relevanten Felder
            const thirdPeriods = [];
            const homeTeams = [];
            const awayTeams = [];
            const scores = [];
            const homeLogos = [];
            const awayLogos = [];

            // Iteriere über alle 8 Felder (home1 bis home8, away1 bis away8, drittel1 bis drittel8)
            for (let i = 1; i <= 8; i++) {
                if (game[`home${i}`] && game[`away${i}`] && game[`score${i}`]) {
                    homeTeams.push(game[`home${i}`]);
                    awayTeams.push(game[`away${i}`]);
                    scores.push(game[`score${i}`].split(" ")[0] + " - " + game[`score${i}`].split(" ")[1].replace('(', ''));
                    awayLogos.push(game[`awayimage${i}`]);
                    homeLogos.push(game[`homeimage${i}`]);
                    if (game[`drittel${i}`]) {
                        thirdPeriods.push(game[`drittel${i}`]);
                    }
                }
            }

            return {
                homeTeams: homeTeams.join(', '),
                awayTeams: awayTeams.join(', '),
                scores: scores.join(', '),
                gameTime: thirdPeriods.join(', ') || 'Spiel noch nicht gestartet',
                homeLogos: homeLogos.join(', '),
                awayLogos: awayLogos.join(', ')
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
