// const { Builder, By, until } = require('selenium-webdriver');
// const dotenv = require('dotenv');

// dotenv.config();

// (async () => {
//     const driver = await new Builder().forBrowser('chrome').build();
//     try {
//         await driver.get('https://x.com/login');
//         const usernameField = await driver.wait(until.elementLocated(By.name("text")), 10000);
//         await usernameField.sendKeys(process.env.TWITTER_USERNAME, '\n');
//         await driver.wait(until.elementLocated(By.name("password")), 10000).sendKeys(process.env.TWITTER_PASSWORD, '\n');
//         await driver.wait(until.urlContains("home"), 10000);
//         await driver.get('https://x.com/explore/tabs/trending');

//         // Wait for the timeline explore section to load
//         const parentElement = await driver.wait(
//             until.elementLocated(By.xpath("//div[@aria-label='Timeline: Explore']")), 
//             10000
//         );

//         // Check if parentElement is located successfully
//         console.log("Parent element located:", parentElement);

//         // Now, find all spans with class 'r-18u37iz' under this parent element
//         const trendSpans = await parentElement.findElements(By.xpath(".//span[contains(@class, 'r-18u37iz')]"));

//         // Log the number of spans found
//         console.log('Number of trend spans found:', trendSpans.length);

//         if (trendSpans.length === 0) {
//             console.log("No spans found. Printing parent element HTML for debugging:");

//             // Retrieve and print the parent element's outer HTML for further inspection
//             const parentHTML = await parentElement.getAttribute('outerHTML');
//             console.log(parentHTML);
//         }

//         const trendsText = [];

//         // Loop through and extract text from the spans
//         for (let i = 0; i < trendSpans.length; i++) {
//             const text = await trendSpans[i].getText();
//             if (text) {
//                 trendsText.push(text);
//             }
//         }

//         // Log the trend texts
//         console.log('Trend texts:', trendsText);

//     } catch (error) {
//         console.error("An error occurred: ", error);
//     } finally {
//         await driver.quit(); // Optionally, uncomment this to close the browser
//     }
// })();

// Function to scroll to the bottom of the page
async function scrollToBottom(driver) {
    await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");
    await driver.sleep(2000);  // Wait for a bit to load more content
}

const { Builder, By, until } = require('selenium-webdriver');
const dotenv = require('dotenv');

dotenv.config();

(async () => {
    const driver = await new Builder().forBrowser('chrome').build();
    try {
        await driver.get('https://x.com/login');
        const usernameField = await driver.wait(until.elementLocated(By.name("text")), 10000);
        await usernameField.sendKeys(process.env.TWITTER_USERNAME, '\n');
        await driver.wait(until.elementLocated(By.name("password")), 10000).sendKeys(process.env.TWITTER_PASSWORD, '\n');
        await driver.wait(until.urlContains("home"), 10000);
        await driver.get('https://x.com/explore/tabs/trending');

        // Wait for the timeline explore section to load
        const parentElement = await driver.wait(
            until.elementLocated(By.xpath("//div[@aria-label='Timeline: Explore']")), 
            10000
        );

        // Scroll to the bottom to load more content
        await scrollToBottom(driver);

        // Wait a little to ensure new elements load
        const trendSpans = await parentElement.findElements(By.xpath(".//span[contains(@class, 'r-18u37iz')]"));

        // Log the number of trend spans found
        console.log('Number of trend spans found:', trendSpans.length);

        if (trendSpans.length === 0) {
            console.log("No spans found. Printing parent element HTML for debugging:");

            // Retrieve and print the parent element's outer HTML for further inspection
            const parentHTML = await parentElement.getAttribute('outerHTML');
            console.log(parentHTML);
        }

        const trendsText = [];

        // Loop through and extract text from the spans
        for (let i = 0; i < trendSpans.length; i++) {
            const text = await trendSpans[i].getText();
            if (text) {
                trendsText.push(text);
            }
        }

        // Log the trend texts
        console.log('Trend texts:', trendsText);

    } catch (error) {
        console.error("An error occurred: ", error);
    } finally {
        // await driver.quit(); // Optionally, uncomment this to close the browser
    }
})();
