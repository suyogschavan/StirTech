const {Builder, By, util} = require('selenium-webdriver');
const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv');
const uuid = require('uuid');
const {exec} = require('child_process');
const Records = require('./models/Record');

dotenv.config();
const URI = process.env.URI;
const PORT = process.env.PORT;

const app = express();

app.use(express.static('public'));

app.get('/run-scrapper', async (req, res)=>{
    exec('node x_scrapper.js', async (error, stdout, stderr)=>{
        if(error){
            console.error(`Error executing script: ${error.message}`);
            res.status(500).send("Automation script failed! ");
            return;
        }
        if (stderr) {
            console.error(`Script stderr: ${stderr}`);
          }
        
          try {
            // Parse JSON output from Selenium script
            const record = JSON.parse(stdout);

            // Save to MongoDB
            const trends = new Records(record);
            await trends.save();

            console.log('Saved trends to MongoDB:', trends);
            res.send('Trends saved to MongoDB successfully!');
        } catch (err) {
            console.error('Error saving to MongoDB:', err);
            res.status(500).send('Failed to save trends to MongoDB.');
        }
    });
});

app.listen(PORT, ()=>{console.log(`Server running on http://localhost:${PORT}`);
})

mongoose.connect(URI).then(()=>console.log("MongoDB Connected")
).catch((err) => console.log("Database cannot be connected. Error: ", err)
);