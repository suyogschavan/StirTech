const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const proxy = require('selenium-webdriver/proxy');
const socketIo = require('socket.io');
const Records = require('./models/Record'); 
const http = require('http');
const path = require('path');

dotenv.config();

const URI = process.env.URI;
const PORT = process.env.PORT;
const proxyHost = 'us-ca.proxymesh.com:31280';
const proxyUsername = process.env.PROXY_USERNAME;
const proxyPassword = process.env.PROXY_PASSWORD;

// Setting up proxy string
const proxyUrl = `http://${proxyUsername}:${proxyPassword}@${proxyHost}`;



const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const proxyOptions = proxy.manual({
    http:"us-ca.proxymesh.com:31280",
    https:"us-ca.proxymesh.com:31280",
    // https:
    // https:`us-ca.proxymesh.com:31280`,
    // http:`us-il.proxymesh.com:31280`,
    // // https:`us-il.proxymesh.com:31280`,
    // http:`us-ny.proxymesh.com:31280`,
    // // https:`${proxyUsername}:${proxyPassword}@us-ny.proxymesh.com:31280`,
});


async function runScraper(io) {
    const { promisify } = require('util');
    const sleep = promisify(setTimeout);

    async function scrollToBottom(driver) {
        await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");
        await driver.sleep(3000);  
    }

    const options = new chrome.Options()
    // .setProxy(proxyOptions);
    options.addArguments('--headless'); // Headless mode
    options.addArguments('--no-sandbox'); // Disable sandboxing
    options.addArguments('--disable-dev-shm-usage'); // Workaround for containers
    // options.setProxy(proxy.manual({ http: proxyUrl, https: proxyUrl }));

    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    try {
        // Step 1: Log in to X (formerly Twitter)
        await io.emit('log', 'Navigating to login page...');
        await driver.get('https://x.com/login');
        // await sleep(3000);
        await io.emit('log', 'On login page ');

        // Enter username
        const usernameField = await driver.wait(until.elementLocated(By.name("text")), 20000);
        await usernameField.sendKeys(process.env.TWITTER_USERNAME, '\n');
        await io.emit('log', 'Entered username');

        // Wait for password field
        // await sleep(3000);
        try {
            const emailField = await driver.wait(until.elementLocated(By.name("text")), 5000);
            await emailField.sendKeys(process.env.TWITTER_EMAIL, '\n');
            await io.emit('log', 'Entered email (additional step)');
        } catch (error) {
            await io.emit('log', 'No email field required, proceeding to password...');
        }

        const passwordField = await driver.wait(until.elementLocated(By.name("password")), 10000);
        await passwordField.sendKeys(process.env.TWITTER_PASSWORD, '\n');
        await io.emit('log', 'Entered password');

        try {
            const emailField = await driver.wait(until.elementLocated(By.name("text")), 5000);
            await emailField.sendKeys(process.env.TWITTER_EMAIL, '\n');
            await io.emit('log', 'Entered email (additional step)');
        } catch (error) {
            await io.emit('log', 'No email field required, proceeding to password...');
        }

        // Wait for home page to load
        await driver.wait(until.urlContains("home"), 15000);
        await io.emit('log', 'Logged in, navigating to trending page...');

        // Step 2: Navigate to the trending topics page
        await driver.get('https://x.com/explore/tabs/trending');
        await scrollToBottom(driver);
        await io.emit('log', 'Scraping trending topics...');
        await sleep(3000);

        // Step 3: Scrape trends
        const trendsText = [];
        let counter = 0;
        for (let i = 2; i < 20; i++) {
            try {
                const trendXPath = `/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/section/div/div/div[${i}]/div/div/div/div/div[2]/span`;
                const trendElement = await driver.wait(until.elementLocated(By.xpath(trendXPath)), 3000);
                const trendText = await trendElement.getText();
                trendsText.push(trendText);
                counter++;
                if(counter >= 5) break;
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

        await driver.get('http://api.ipify.org/?format=json');
        const body = await driver.findElement(By.tagName('body')).getText();
        console.log("IP:", body);

        // Output record as JSON
        await io.emit('log', 'Scraping complete, saving data...');
        // console.log(JSON.stringify(record));

        const trends = new Records(record);
        await trends.save();
        console.log(trends);
        await io.emit('log', 'Saved trends to MongoDB');
        return trends;

    } catch (error) {
        await io.emit('log', `An error occurred: ${error.message}`);
        console.error("An error occurred:", error);
    } finally {
        await driver.quit();
    }
}

app.get('/', (req, res) => {
    // res.send('Server is running!');
    // res.send('./public/index.html');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to trigger scraper
app.get('/run-scrapper', async (req, res) => {
    // Emit log message to client
    io.emit('log', 'Starting the scraper...');
    try {
        const data = await runScraper(io);
        res.status(200).send(data);
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


module.exports = app;
