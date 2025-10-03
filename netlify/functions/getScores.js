// netlify/functions/getScores.js
const axios = require('axios');

exports.handler = async function(event, context) {
    try {
        // Hole die Live-Spieldaten von der externen API
        const response = await axios.get('https://api.sprade.tv/v3/scoreboard/oln.json');
        const gamesData = response.data;

        // Gib die erhaltenen Spieldaten direkt als JSON zurück
        return {
            statusCode: 200,
            body: JSON.stringify(gamesData)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: 'Fehler beim Laden der Spieldaten: ' + error.message
        };
    }
};
