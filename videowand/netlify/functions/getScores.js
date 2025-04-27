const fetch = require('node-fetch'); // Installiere node-fetch

exports.handler = async (event, context) => {
    try {
        const response = await fetch('https://www.sprade.tv/tools/scoreboard/livescore_oln.json');
        const data = await response.json();
        
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Fehler beim Abrufen der Daten' })
        };
    }
};
