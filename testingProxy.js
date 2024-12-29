const axios = require('axios');
const dotenv = require('dotenv')
dotenv.config();

const proxyConfig = {
    protocol: 'http',
    host: 'us-ca.proxymesh.com',
    port: 31280,
    auth: {
        username: process.env.PROXY_USERNAME,
        password: process.env.PROXY_PASSWORD
    }
};

async function testProxy() {
    try {
        const response = await axios.get('http://api.ipify.org?format=json', {
            proxy: proxyConfig
        });
        console.log("Proxy IP:", response.data.ip);
    } catch (error) {
        console.error("Proxy Test Failed:", error.message);
    }
}

testProxy();
