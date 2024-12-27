
const { Builder, By, until } = require('selenium-webdriver');
const dotenv = require('dotenv');
const uuid = require('uuid');
const chrome = require('selenium-webdriver/chrome')

dotenv.config();

const { promisify } = require('util');
const sleep = promisify(setTimeout);

async function scrollToBottom(driver) {
    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");
    await driver.sleep(2000);  
}

(async () => {
    // const driver = await new Builder().forBrowser('chrome').build();

    const options = new chrome.Options();
    options.addArguments('--headless'); // Headless mode
    options.addArguments('--no-sandbox'); // Disable sandboxing, necessary for running in some environments
    options.addArguments('--disable-dev-shm-usage'); // Workaround for containerized environments

    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();


    try {
        // Step 1: Log in to X (formerly Twitter)
        await driver.get('https://x.com/login');
        // console.log("On login page");
        
        // Enter username
        const usernameField = await driver.wait(until.elementLocated(By.name("text")), 10000);
        await usernameField.sendKeys(process.env.TWITTER_USERNAME, '\n');
        // console.log("Username filled")
        
        sleep(3000);

        // Enter password
        const passwordField = await driver.wait(until.elementLocated(By.name("password")), 10000);
        await passwordField.sendKeys(process.env.TWITTER_PASSWORD, '\n');
        // console.log("Password filled");
        
        // Wait for home page to load
        await driver.wait(until.urlContains("home"), 15000);
        // console.log("On home page");
        
        // Step 2: Navigate to the trending topics page
        await driver.get('https://x.com/explore/tabs/trending');
        await scrollToBottom(driver);
        // console.log("On trending page")

        // Step 3: Scrape trends
        const trendsText = [];
        for (let i = 2; i < 20; i++) {
            try {
                const trendXPath = `/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/section/div/div/div[${i}]/div/div/div/div/div[2]/span`;
                const trendElement = await driver.wait(until.elementLocated(By.xpath(trendXPath)), 2000);
                const trendText = await trendElement.getText();
                trendsText.push(trendText);
            } catch (err) {
                console.error(`Error scraping trend at index ${i}: ${err.message}`);
            }
        }

        // Step 4: Prepare the JSON record
        const record = {
            // _id: uuid.v4(),
            trend1: trendsText[0] || null,
            trend2: trendsText[1] || null,
            trend3: trendsText[2] || null,
            trend4: trendsText[3] || null,
            trend5: trendsText[4] || null,
            timestamp: new Date().toISOString(),
        };

        // Output record as JSON
        console.log(JSON.stringify(record));
    } catch (error) {
        console.error("An error occurred:", error);
        process.exit(1);
    } finally {
        await driver.quit();
    }
})();

