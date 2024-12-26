const {Builder, By, util} = require('selenium-webdriver');
// const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const uuid = require('uuid');

dotenv.config();
const URI = process.env.URI;
const PORT = process.env.PORT;

const app = express();
