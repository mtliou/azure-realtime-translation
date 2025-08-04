// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// <disable>JS1001.SyntaxError</disable>

(function () {
    "use strict";

    // pull in the required packages.
    require('dotenv').config();
    const express = require('express');
    const axios = require('axios');
    const bodyParser = require('body-parser');
    const pino = require('express-pino-logger')();
    const cors = require('cors');
    const path = require('path');

    const app = express();
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json()); // Add JSON body parser
    app.use(pino);
    app.use(cors());
    
    // Serve static files from public directory
    app.use(express.static(path.join(__dirname, '../public')));
    app.use(express.static(path.join(__dirname, '..'))); // Serve root files too

    app.get('/api/get-speech-token', async (req, res, next) => {
        res.setHeader('Content-Type', 'application/json');
        const speechKey = process.env.SPEECH_KEY;
        const speechRegion = process.env.SPEECH_REGION;

        if (speechKey === 'paste-your-speech-key-here' || speechRegion === 'paste-your-speech-region-here') {
            res.status(400).send('You forgot to add your speech key or region to the .env file.');
        } else {
            const headers = { 
                headers: {
                    'Ocp-Apim-Subscription-Key': speechKey,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };

            try {
                const tokenResponse = await axios.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, headers);
                res.send({ token: tokenResponse.data, region: speechRegion });
            } catch (err) {
                res.status(401).send('There was an error authorizing your speech key.');
            }
        }
    });

    // ElevenLabs TTS endpoint
    app.post('/api/elevenlabs-tts', async (req, res, next) => {
        try {
            const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
            
            if (!elevenLabsKey || elevenLabsKey === 'your_elevenlabs_api_key_here') {
                return res.status(400).send('ElevenLabs API key not configured in .env file');
            }
            
            const { text, voice = 'Rachel', model_id = 'eleven_turbo_v2_5', voice_settings } = req.body;
            
            if (!text) {
                return res.status(400).send('Text is required');
            }
            
            const elevenLabsResponse = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
                {
                    text,
                    model_id,
                    voice_settings: voice_settings || {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0.5,
                        use_speaker_boost: true
                    }
                },
                {
                    headers: {
                        'Accept': 'audio/mpeg',
                        'xi-api-key': elevenLabsKey,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream'
                }
            );
            
            res.setHeader('Content-Type', 'audio/mpeg');
            elevenLabsResponse.data.pipe(res);
            
        } catch (error) {
            console.error('ElevenLabs TTS error:', error.response?.data || error.message);
            res.status(500).send('Error generating speech with ElevenLabs');
        }
    });

    // Translation endpoint using Azure Translator
    app.post('/api/translate', async (req, res, next) => {
        try {
            const translatorKey = process.env.TRANSLATOR_KEY;
            const translatorRegion = process.env.TRANSLATOR_REGION || 'global';
            
            if (!translatorKey || translatorKey === 'your_translator_key_here') {
                return res.status(400).send('Azure Translator key not configured');
            }
            
            const { text, from, to } = req.body;
            
            if (!text || !to) {
                return res.status(400).send('Text and target language are required');
            }
            
            const response = await axios.post(
                'https://api.cognitive.microsofttranslator.com/translate',
                [{ text }],
                {
                    headers: {
                        'Ocp-Apim-Subscription-Key': translatorKey,
                        'Ocp-Apim-Subscription-Region': translatorRegion,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        'api-version': '3.0',
                        'from': from || 'auto',
                        'to': to
                    }
                }
            );
            
            const translation = response.data[0]?.translations[0]?.text || text;
            res.json({ translation });
            
        } catch (error) {
            console.error('Translation error:', error.response?.data || error.message);
            res.status(500).send('Error translating text');
        }
    });

    // Default route to serve index.html
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Express server is running on http://localhost:${PORT}`);
        console.log(`API endpoints available at http://localhost:${PORT}/api/*`);
        console.log(`Static files served from /public directory`);
    });
}());
// </disable>
