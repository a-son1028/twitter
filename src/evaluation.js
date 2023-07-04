import "./configs/mongoose.config";
import axios from "axios";
import { Promise } from "bluebird";
import fs from "fs";
import _ from "lodash";
import moment from "moment";
import path from "path";
import { HumanChatMessage, SystemChatMessage } from "langchain/schema";
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
  PromptTemplate,
} from "langchain/prompts";
import { LLMChain } from "langchain/chains";

import { chat } from "./services/openai";
import { numTokens, numBertTokens } from "./helpers/text";
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

import Models from "./models";

// main();
async function main() {
  try {
    const outputFilePath = "./output/eval1-gpt.json";

    let tweets = await Models.Tweet.find().select("text realCreatedAt");
    tweets = tweets.map((tweet) => {
      return {
        ...tweet.toJSON(),
        realCreatedAt: moment(tweet.realCreatedAt).utc().format("YYYY-MM-DD"),
      };
    });
    const tweetsByDate = _.groupBy(tweets, "realCreatedAt");

    const prompt = PromptTemplate.fromTemplate(
      `Think from the point of view from Bitcoin investors. You are reading tweets from twitter and want to decide whether you want to invest (buy, sell or hold) your bitcoin. Can you help me to identify the daily sentiment on twitter by categorizing analyzing all tweets and categorize today's overall sentiment as either "bearish" or "bullish". Just give me the final category, you don't have to show the tweet again. You should be able to regconize each tweet because the tweets will be within the quotation mark ("") and after each tweet there will be a semi colon (;):
        {tweetContent}`
    );
    for (const date in tweetsByDate) {
      const resultText = await fs.readFileSync(outputFilePath, "utf-8");
      const result = JSON.parse(resultText);
      const isExisted = result.some((item) => item.date === date);
      if (isExisted) continue;

      const tweets = tweetsByDate[date];

      let tweetContent = tweets.reduce((acc, tweet) => {
        acc += `\n"${tweet.text}";`;
        return acc;
      }, "");

      const context = await prompt.format({ tweetContent });
      const tokenCount = numTokens(context);
      if (tokenCount <= 4096) {
        const chain = new LLMChain({ llm: chat, prompt });
        const res = await chain.call({ tweetContent });

        result.push({ date, value: res.text });
        fs.writeFileSync(outputFilePath, JSON.stringify(result), "utf8");
      }
    }

    console.log("DONE");
  } catch (err) {
    console.log(err);
  }
}

test();
async function test() {
  try {
    const result = [];
    let tweets = await Models.Tweet.find().select("text realCreatedAt");
    // .limit(1);
    tweets = tweets.map((tweet) => {
      return {
        ...tweet.toJSON(),
        realCreatedAt: moment(tweet.realCreatedAt).utc().format("YYYY-MM-DD"),
      };
    });
    const tweetsByDate = _.groupBy(tweets, "realCreatedAt");

    for (const date in tweetsByDate) {
      const tweets = tweetsByDate[date];

      const content = tweets.reduce((acc, tweet) => {
        acc += `\n"${tweet.text}";`;
        return acc;
      }, "");

      if (numBertTokens(content) <= 512) {
        result.push({
          date,
          content,
        });
      }
    }

    fs.writeFileSync("./tweets-content.json", JSON.stringify(result));
    console.log("DONE");
  } catch (err) {
    console.log(err);
  }
}

async function test2() {
  const vader = require("vader-sentiment");
  const input = "I loved the movie. The acting was great!";
  const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(input);
  console.log(intensity);
  // {neg: 0.0, neu: 0.299, pos: 0.701, compound: 0.8545}
}

// reportErrorByDate();
async function reportErrorByDate() {
  try {
    const header = [
      { id: "date", title: "date" },
      { id: "error", title: "error" },
      { id: "tweetCount", title: "tweet count" },
      { id: "tokenCount", title: "token count" },
    ];
    let rows = [];

    let tweets = await Models.Tweet.find({
      authorUsername: {
        $nin: ["whale_alert", "MessariCrypto", "WatcherGuru", "SushiSwap"],
      },
      dataset: {
        $in: ["kol", "company"],
      },
    }).select("text realCreatedAt");
    // .limit(1);
    tweets = tweets.map((tweet) => {
      return {
        ...tweet.toJSON(),
        realCreatedAt: moment(tweet.realCreatedAt).utc().format("YYYY-MM-DD"),
      };
    });
    const tweetsByDate = _.groupBy(tweets, "realCreatedAt");

    const prompt = PromptTemplate.fromTemplate(
      `Think from the point of view from Bitcoin investors. You are reading tweets from twitter and want to decide whether you want to invest (buy, sell or hold) your bitcoin. Can you help me to identify the daily sentiment on twitter by categorizing analyzing all tweets and categorize today's overall sentiment as either "bearish" or "bullish". Just give me the final category, you don't have to show the tweet again. You should be able to regconize each tweet because the tweets will be within the quotation mark ("") and after each tweet there will be a semi colon (;):
              {tweetContent}`
    );
    for (const date in tweetsByDate) {
      const tweets = tweetsByDate[date];

      let tweetContent = tweets.reduce((acc, tweet) => {
        acc += `\n"${tweet.text}";`;
        return acc;
      }, "");

      const context = await prompt.format({ tweetContent });
      const tokenCount = numTokens(context);

      rows.push({
        date,
        error: tokenCount > 4096 ? "x" : "",
        tweetCount: tweets.length,
        tokenCount: tokenCount,
      });
    }

    rows = _.orderBy(rows, "tokenCount", "desc");

    const csvWriter = createCsvWriter({
      path: `./tweets-error.csv`,
      header,
    });
    csvWriter.writeRecords(rows);

    console.log("DONE");
  } catch (err) {
    console.log(err);
  }
}
