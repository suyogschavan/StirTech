// const {Builder, By, util} = require('selenium-webdriver');
const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv');
// const uuid = require('uuid');
const {exec} = require('child_process');
const Records = require('./models/Record');

dotenv.config();
const URI = process.env.URI;
const PORT = process.env.PORT;

const app = express();

app.use(express.static('public'));

app.get('/run-scrapper', async (req, res) => {
    exec('node x_scrapper.js', async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error.message}`);
            return res.status(500).send(`Automation script failed: ${error.message}`);
        }
        if (stderr) {
            console.error(`Script stderr: ${stderr}`);
        }

        try {
            const record = JSON.parse(stdout);

            const trends = new Records(record);
            await trends.save();

            console.log('Saved trends to MongoDB:', trends);
            return res.status(200).send('Trends saved to MongoDB successfully!');
        } catch (err) {
            console.error('Error saving to MongoDB:', err);
            return res.status(500).send('Failed to save trends to MongoDB.');
        }
    });
});


app.listen(PORT, ()=>{console.log(`Server running on http://localhost:${PORT}`);
})

mongoose.connect(URI).then(()=>console.log("MongoDB Connected")
).catch((err) => console.log("Database cannot be connected. Error: ", err)
);

