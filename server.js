// // const {Builder, By, util} = require('selenium-webdriver');
// const mongoose = require('mongoose');
// const express = require('express');
// const dotenv = require('dotenv');
// // const uuid = require('uuid');
// const {exec} = require('child_process');
// const Records = require('./models/Record');

// dotenv.config();
// const URI = process.env.URI;
// const PORT = process.env.PORT;

// const app = express();

// app.use(express.static('public'));

// app.get('/run-scrapper', async (req, res) => {
//     exec('node x_scrapper.js', async (error, stdout, stderr) => {
//         if (error) {
//             console.error(`Error executing script: ${error.message}`);
//             return res.status(500).send(`Automation script failed: ${error.message}`);
//         }
//         if (stderr) {
//             console.error(`Script stderr: ${stderr}`);
//         }

//         try {
//             const record = JSON.parse(stdout);

//             const trends = new Records(record);
//             await trends.save();

//             console.log('Saved trends to MongoDB:', trends);
//             return res.status(200).send('Trends saved to MongoDB successfully!');
//         } catch (err) {
//             console.error('Error saving to MongoDB:', err);
//             return res.status(500).send('Failed to save trends to MongoDB.');
//         }
//     });
// });


// app.listen(PORT, ()=>{console.log(`Server running on http://localhost:${PORT}`);
// })

// mongoose.connect(URI).then(()=>console.log("MongoDB Connected")
// ).catch((err) => console.log("Database cannot be connected. Error: ", err)
// );

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const socketIo = require('socket.io');
const Records = require('./models/Record'); // Make sure this model exists
const http = require('http');

dotenv.config();

const URI = process.env.URI;
const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// Scraper function
async function runScraper(io) {
    const { promisify } = require('util');
    const sleep = promisify(setTimeout);

    async function scrollToBottom(driver) {
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");
        await driver.sleep(2000);  
    }

    const options = new chrome.Options();
    options.addArguments('--headless'); // Headless mode
    options.addArguments('--no-sandbox'); // Disable sandboxing
    options.addArguments('--disable-dev-shm-usage'); // Workaround for containers

    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    try {
        // Step 1: Log in to X (formerly Twitter)
        await io.emit('log', 'Navigating to login page...');
        await driver.get('https://x.com/login');

        // Enter username
        const usernameField = await driver.wait(until.elementLocated(By.xpath("/html/body/div/div/div/div[1]/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div[4]/label/div/div[2]/div/input")), 10000);
        await usernameField.sendKeys(process.env.TWITTER_USERNAME, '\n');
        await io.emit('log', 'Entered username');

        // Wait for password field
        await sleep(3000);

        const passwordField = await driver.wait(until.elementLocated(By.xpath("/html/body/div/div/div/div[1]/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[1]/div/div/div[3]/div/label/div/div[2]/div[1]/input")), 10000);
        await passwordField.sendKeys(process.env.TWITTER_PASSWORD, '\n');
        await io.emit('log', 'Entered password');

        // Wait for home page to load
        await driver.wait(until.urlContains("home"), 15000);
        await io.emit('log', 'Logged in, navigating to trending page...');

        // Step 2: Navigate to the trending topics page
        await driver.get('https://x.com/explore/tabs/trending');
        await scrollToBottom(driver);
        await io.emit('log', 'Scraping trending topics...');

        // Step 3: Scrape trends
        const trendsText = [];
        for (let i = 2; i < 20; i++) {
            try {
                const trendXPath = `/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/section/div/div/div[${i}]/div/div/div/div/div[2]/span`;
                const trendElement = await driver.wait(until.elementLocated(By.xpath(trendXPath)), 2000);
                const trendText = await trendElement.getText();
                trendsText.push(trendText);
            } catch (err) {
                await io.emit('log', `Error scraping trend at index ${i}: ${err.message}`);
            }
        }

        // Step 4: Prepare the JSON record
        const record = {
            trend1: trendsText[0] || null,
            trend2: trendsText[1] || null,
            trend3: trendsText[2] || null,
            trend4: trendsText[3] || null,
            trend5: trendsText[4] || null,
            timestamp: new Date().toISOString(),
        };

        // Output record as JSON
        await io.emit('log', 'Scraping complete, saving data...');
        console.log(JSON.stringify(record));

        // Save to MongoDB
        const trends = new Records(record);
        await trends.save();
        await io.emit('log', 'Saved trends to MongoDB');

    } catch (error) {
        await io.emit('log', `An error occurred: ${error.message}`);
        console.error("An error occurred:", error);
    } finally {
        await driver.quit();
    }
}

// Endpoint to trigger scraper
app.get('/run-scrapper', async (req, res) => {
    // Emit log message to client
    io.emit('log', 'Starting the scraper...');
    try {
        await runScraper(io);
        res.status(200).send('Scraper completed successfully!');
    } catch (err) {
        res.status(500).send('Failed to run scraper.');
    }
});

// Serve the app
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Connect to MongoDB
mongoose.connect(URI).then(() => {
    console.log("MongoDB Connected");
}).catch((err) => {
    console.log("Database cannot be connected. Error: ", err);
});
