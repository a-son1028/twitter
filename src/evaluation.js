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
const vader = require("vader-sentiment");
const csv = require("csvtojson");

import Models from "./models";

// getGPTJSON();
async function getGPTJSON() {
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

// getGPTJSON2();
async function getGPTJSON2() {
  try {
    const outputFilePath = "./output/eval2-gpt.json";

    const dataset = require("../tweets-and-dates.json");

    const tweets = dataset.map((item) => {
      return {
        text: item.text,
        realCreatedAt: moment(item.dateTimestamp).utc().format("YYYY-MM-DD"),
        date: item.date,
        dateTimestamp: item.dateTimestamp,
        dataset: item.dataset,
        keyword: item.keyword,
      }
    });

    const tweetsByDate = _.groupBy(tweets, "realCreatedAt");

    const prompt = PromptTemplate.fromTemplate(
      `Think like a Bitcoin investor deciding to buy, sell, or hold based on Twitter sentiment. Categorize each tweet into one of three groups: "Bearish," "Neutral," or "Bullish." You don't need to show the tweets again—just provide the total count for each category.

        IMPORTANT: Respond in the format: Bearish: X\n Neutral: Y\n Bullish: Z (without quotes) where X, Y, and Z are the counts. Only respond with the numbers; no extra text.

        Tweets:
        {tweetContent}`
    );

    const resultText = await fs.readFileSync(outputFilePath, "utf-8");
    const result = JSON.parse(resultText);

    await Promise.map(
      Object.entries(tweetsByDate),
      async ([date, tweets]) => {
  
      const isExisted = result.some((item) => item.date === date);
      if (isExisted) return;

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
    }, {
      concurrency: 1
    })

    console.log("DONE");
  } catch (err) {
    console.log(err);
  }
}

// gptReport();
async function gptReport() {
  const resultText = await fs.readFileSync("./output/eval1-gpt.json", "utf-8");
  const result = JSON.parse(resultText);

  const header = [
    { id: "date", title: "date" },
    { id: "label", title: "label" },
  ];

  let rows = result.map((item) => {
    let date = moment(item.date);

    return {
      date: item.date,
      label: item.value.toLowerCase().includes("bullish")
        ? "bullish"
        : "bearish",
      dateTimestamp: date.valueOf(),
    };
  });

  rows = _.orderBy(rows, "dateTimestamp", "desc");
  const csvWriter = createCsvWriter({
    path: `./approach-1(gpt).csv`,
    header,
  });
  csvWriter.writeRecords(rows);

  console.log("DONE");
}


gptReport2();
async function gptReport2() {
  const parseTextToJson = (input) => {
    const result = {};
    input.split(', ').forEach(pair => {
      const [key, value] = pair.split(': ');
      result[key] = parseInt(value);
    });
    return result;
  };

  const resultText = await fs.readFileSync("./output/eval2-gpt.json", "utf-8");
  const result = JSON.parse(resultText);

  const header = [
    { id: "date", title: "date" },
    { id: "Bearish", title: "Bearish" },
    { id: "Neutral", title: "Neutral" },
    { id: "Bullish", title: "Bullish" },
  ];

  let rows = result.map((item) => {
    let date = moment(item.date);

    const jsonValue = parseTextToJson(item.value.replace(/tweets/g, "").replace(/\n/g, ", "));
    
    return {
      date: item.date,
      Bearish: jsonValue.Bearish,
      Neutral: jsonValue.Neutral,
      Bullish: jsonValue.Bullish,
      dateTimestamp: date.valueOf(),
    };
  });

  rows = _.orderBy(rows, "dateTimestamp", "desc");
  const csvWriter = createCsvWriter({
    path: `./approach-2(gpt).csv`,
    header,
  });
  csvWriter.writeRecords(rows);

  console.log("DONE");
}

// bertReport2();
async function bertReport2() {
  const resultText = await fs.readFileSync(
    "./tweets-bert-predict.json",
    "utf-8"
  );
  let result = JSON.parse(resultText);
  result = result.map((item) => {
    return {
      ...item,
      date: moment.utc(item.date, "YYYY-MM-DD HH:mm").format("YYYY-MM-DD"),
    };
  });

  const groupByDate = _.groupBy(result, "date");
  const header = [
    { id: "date", title: "date" },
    { id: "label", title: "label" },
  ];
  let rows = [];

  for (const date in groupByDate) {
    const items = groupByDate[date];

    const labels = _.countBy(_.map(items, "sentiment"), (item) => item);

    rows.push({
      date,
      label: `Negative: ${labels.Negative || 0}, Neutral: ${
        labels.Neutral || 0
      }, Positive: ${labels.Positive || 0}`,
      dateTimestamp: moment(date).valueOf(),
    });
  }

  rows = _.orderBy(rows, "dateTimestamp", "desc");
  const csvWriter = createCsvWriter({
    path: `./approach-2(bert).csv`,
    header,
  });
  csvWriter.writeRecords(rows);

  console.log("DONE");
}

// getBertContents();
async function getBertContents() {
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

// vaderReport();
async function vaderReport() {
  try {
    const result = [];
    let tweets = await Models.Tweet.find().select("text realCreatedAt");
    // .limit(1);

    const header = [
      { id: "date", title: "date" },
      { id: "label", title: "label" },
    ];
    let rows = [];

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

      const intensity =
        vader.SentimentIntensityAnalyzer.polarity_scores(content);

      if (intensity.neu < 0.5) {
        console.log(intensity);
      }

      rows.push({
        date,
        label: intensity.neu >= 0.5 ? "Neutral" : "",
        dateTimestamp: moment(date).valueOf(),
      });
    }

    rows = _.orderBy(rows, "dateTimestamp", "desc");
    const csvWriter = createCsvWriter({
      path: `./approach-1(vader).csv`,
      header,
    });
    csvWriter.writeRecords(rows);

    // fs.writeFileSync("./tweets-content.json", JSON.stringify(result));
    console.log("DONE");
  } catch (err) {
    console.log(err);
  }
}

// vaderReport2();
async function vaderReport2() {
  try {
    let tweets = await Models.Tweet.find().select("text realCreatedAt");
    // .limit(100);

    const header = [
      { id: "date", title: "date" },
      { id: "label", title: "label" },
    ];
    let rows = [];

    tweets = tweets.map((tweet) => {
      return {
        ...tweet.toJSON(),
        realCreatedAt: moment(tweet.realCreatedAt).utc().format("YYYY-MM-DD"),
      };
    });

    const tweetsByDate = _.groupBy(tweets, "realCreatedAt");

    for (const date in tweetsByDate) {
      const tweets = tweetsByDate[date];

      const labels = {
        positive: 0,
        negative: 0,
        neutral: 0,
      };
      for (const tweet of tweets) {
        const { text } = tweet;
        const intensity =
          vader.SentimentIntensityAnalyzer.polarity_scores(text);

        const label = getVaderLabel(intensity);
        labels[label]++;
      }

      rows.push({
        date,
        label: `Negative: ${labels.negative}, Neutral: ${labels.neutral}, Positive: ${labels.positive}`,
        dateTimestamp: moment(date).valueOf(),
      });
    }

    rows = _.orderBy(rows, "dateTimestamp", "desc");
    const csvWriter = createCsvWriter({
      path: `./approach-2(vader).csv`,
      header,
    });
    csvWriter.writeRecords(rows);

    console.log("DONE");
  } catch (err) {
    console.log(err);
  }
}
function getVaderLabel(intensity) {
  if (intensity.pos >= 0.5) return "positive";
  else if (intensity.neg >= 0.5) return "negative";
  else return "neutral";
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

// main();
async function main() {
  // await Promise.all([
  //   confusionMatrixGPT(),
  //   confusionMatrixGPT2(),
  //   confusionMatrixBert(),
  //   confusionMatrixBert2(),
  //   confusionMatrixVader(),
  //   confusionMatrixVader2(),
  // ]);
  await getLabelsForTweets();
  await getTweetsReport();
}

async function getTweetsReport() {
  const header = [
    {
      id: "text",
      title: "Original tweet",
    },
    {
      id: "cleanedText",
      title: "Tweet that has been cleaned",
    },
    {
      id: "date",
      title: "Date",
    },
    {
      id: "gpt",
      title: "ChatGPT",
    },
    {
      id: "bert",
      title: "Bert",
    },
    {
      id: "vader",
      title: "Vader",
    },
  ];
  let rows = [];
  const tweets = await Models.Tweet.find({
    $or: [
      {
        realCreatedAt: {
          $gte: new Date("2019-10-26T00:00:00.000+00:00"),
          $lte: new Date("2019-10-26T23:59:59.000+00:00"),
        },
      },
      {
        realCreatedAt: {
          $gte: new Date("2019-06-28T00:00:00.000+00:00"),
          $lte: new Date("2019-06-28T23:59:59.000+00:00"),
        },
      },
    ],
  });

  for (const tweet of tweets) {
    const {
      text,
      cleanedText,
      realCreatedAt,
      gptLabel,
      vaderlabel,
      bertLabel,
    } = tweet;
    rows.push({
      text,
      cleanedText,
      date: moment(realCreatedAt).utc().format("YYYY-MM-DD HH:mm"),
      gpt: gptLabel,
      bert: bertLabel,
      vader: vaderlabel,
      dateTimestamp: moment(realCreatedAt).valueOf(),
    });
  }

  rows = _.orderBy(rows, "dateTimestamp", "desc");

  const csvWriter = createCsvWriter({
    path: `./tweets-report.csv`,
    header,
  });
  csvWriter.writeRecords(rows);
  console.log("DONE");
}

async function getLabelsForTweets() {
  const tweets = await Models.Tweet.find({
    gptLabel: {
      $exists: false,
    },
    $or: [
      {
        realCreatedAt: {
          $gte: new Date("2019-10-26T00:00:00.000+00:00"),
          $lte: new Date("2019-10-26T23:59:59.000+00:00"),
        },
      },
      {
        realCreatedAt: {
          $gte: new Date("2019-06-28T00:00:00.000+00:00"),
          $lte: new Date("2019-06-28T23:59:59.000+00:00"),
        },
      },
    ],
  });
  const bertResultText = await fs.readFileSync(
    "./tweets-bert-predict-2.json",
    "utf-8"
  );
  const bertResult = JSON.parse(bertResultText);
  const prompt = PromptTemplate.fromTemplate(
    `Think from the point of view from Bitcoin investors. You are reading tweets from twitter and want to decide whether you want to invest (buy, sell or hold) your bitcoin. Can you help me to identify the daily sentiment on twitter by categorizing analyzing all tweets and categorize today's overall sentiment as either "bearish" or "bullish". Just give me the final category, you don't have to show the tweet again. You should be able to regconize each tweet because the tweets will be within the quotation mark ("") and after each tweet there will be a semi colon (;):
      {tweetContent}`
  );
  const chain = new LLMChain({ llm: chat, prompt });
  const data = [];
  // 2021-05-26 15:46
  for (const tweet of tweets) {
    const { text, realCreatedAt, _id } = tweet;
    // data.push({
    //   text,
    //   date: realCreatedAt,
    // });
    const res = await chain.call({ tweetContent: text });
    const gptLabel = res.text.toLowerCase().includes("bullish")
      ? "bullish"
      : "bearish";
    const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(text);
    const vaderlabel = getVaderLabel(intensity);
    const bertRow = bertResult.find(
      (item) => item.date === moment(realCreatedAt).toISOString()
    );
    const bertLabel = bertRow.sentiment;

    await Models.Tweet.updateOne(
      { _id },
      {
        gptLabel: gptLabel.toLowerCase(),
        vaderlabel: vaderlabel.toLowerCase(),
        bertLabel: bertLabel.toLowerCase(),
      }
    );
  }

  // fs.writeFileSync("./tweets-test.json", JSON.stringify(data));
  console.log("DONE");
}
async function confusionMatrixGPT() {
  const bitcoinPrice = await csv({
    noheader: false,
    output: "csv",
  }).fromFile("bitcoin-prices.csv");

  const resultText = await fs.readFileSync("./output/eval1-gpt.json", "utf-8");
  const result = JSON.parse(resultText);

  let data = result.map((item) => {
    let date = moment(item.date);

    return {
      date: item.date,
      label: item.value.toLowerCase().includes("bullish") ? "P" : "N",
      dateTimestamp: date.valueOf(),
    };
  });

  const { X, Y, Z, W } = data.reduce(
    (acc, { date, label }) => {
      const realData = bitcoinPrice.find(
        (item) =>
          moment.utc(item[0], "DD-MMM-YYYY").format("YYYY-MM-DD") === date
      );

      if (realData) {
        const percentage = Number(realData[2].replace("%", ""));
        const realLalel = percentage >= 0 ? "P" : "N";

        if (label === "N" && realLalel === "N") acc.X++;
        else if (label === "P" && realLalel === "N") acc.Y++;
        else if (label === "N" && realLalel === "P") acc.Z++;
        else if (label === "P" && realLalel === "P") acc.W++;
      }
      return acc;
    },
    { X: 0, Y: 0, Z: 0, W: 0 }
  );

  // await generateConfusionMatrix({ X, Y, Z, W }, "approach-1(gpt)");
  // console.log("DONE");
  return data;
}

async function confusionMatrixGPT2() {
  const bitcoinPrice = await csv({
    noheader: false,
    output: "csv",
  }).fromFile("bitcoin-prices.csv");

  const resultText = await fs.readFileSync("./output/eval2-gpt.json", "utf-8");
  const result = JSON.parse(resultText);

  let data = result.map((item) => {
    let date = moment(item.date);

    const labels = item.value
      .replace(/tweets/g, "")
      .replace(/tweet/g, "")
      .replace(/\n/g, ", ")
      .split(",")
      .map((item) => item.trim());
    if (labels.length !== 3) return;
    let Nlabel = Number(labels[0].toLowerCase().replace("bearish:", "").trim());
    let Plabel = Number(labels[2].toLowerCase().replace("bullish:", "").trim());

    let label;
    if (Nlabel > Plabel) label = "N";
    else label = "P";

    return {
      date: item.date,
      label: label,
      dateTimestamp: date.valueOf(),
    };
  });
  data = data.filter((item) => !!item);

  const { X, Y, Z, W } = data.reduce(
    (acc, { date, label }) => {
      const realData = bitcoinPrice.find(
        (item) =>
          moment.utc(item[0], "DD-MMM-YYYY").format("YYYY-MM-DD") === date
      );

      if (realData) {
        const percentage = Number(realData[2].replace("%", ""));
        const realLalel = percentage >= 0 ? "P" : "N";

        if (label === "N" && realLalel === "N") acc.X++;
        else if (label === "P" && realLalel === "N") acc.Y++;
        else if (label === "N" && realLalel === "P") acc.Z++;
        else if (label === "P" && realLalel === "P") acc.W++;
      }
      return acc;
    },
    { X: 0, Y: 0, Z: 0, W: 0 }
  );

  // await generateConfusionMatrix({ X, Y, Z, W }, "approach-2(gpt)");
  // console.log("DONE");

  return data;
}

async function confusionMatrixBert() {
  const bitcoinPrice = await csv({
    noheader: false,
    output: "csv",
  }).fromFile("bitcoin-prices.csv");

  let data = [
    { date: "2023-06-18", label: "N" },
    { date: "2023-06-17", label: "N" },
    { date: "2019-11-17", label: "N" },
    { date: "2018-08-19", label: "N" },
  ];

  const { X, Y, Z, W } = data.reduce(
    (acc, { date, label }) => {
      const realData = bitcoinPrice.find(
        (item) =>
          moment.utc(item[0], "DD-MMM-YYYY").format("YYYY-MM-DD") === date
      );

      if (realData) {
        const percentage = Number(realData[2].replace("%", ""));
        const realLalel = percentage >= 0 ? "P" : "N";

        if (label === "N" && realLalel === "N") acc.X++;
        else if (label === "P" && realLalel === "N") acc.Y++;
        else if (label === "N" && realLalel === "P") acc.Z++;
        else if (label === "P" && realLalel === "P") acc.W++;
      }
      return acc;
    },
    { X: 0, Y: 0, Z: 0, W: 0 }
  );

  // await generateConfusionMatrix({ X, Y, Z, W }, "approach-1(bert)");
  // console.log("DONE");
  return data;
}

async function confusionMatrixBert2() {
  const bitcoinPrice = await csv({
    noheader: false,
    output: "csv",
  }).fromFile("bitcoin-prices.csv");

  const resultText = await fs.readFileSync(
    "./tweets-bert-predict.json",
    "utf-8"
  );
  let result = JSON.parse(resultText);
  result = result.map((item) => {
    return {
      ...item,
      date: moment.utc(item.date, "YYYY-MM-DD HH:mm").format("YYYY-MM-DD"),
    };
  });

  const groupByDate = _.groupBy(result, "date");

  let data = [];
  for (const date in groupByDate) {
    const items = groupByDate[date];

    const labels = _.countBy(_.map(items, "sentiment"), (item) => item);

    let label;
    if (labels.Negative > labels.Positive) label = "N";
    else label = "P";

    data.push({
      date,
      label,
      dateTimestamp: moment(date).valueOf(),
    });
  }

  const { X, Y, Z, W } = data.reduce(
    (acc, { date, label }) => {
      const realData = bitcoinPrice.find(
        (item) =>
          moment.utc(item[0], "DD-MMM-YYYY").format("YYYY-MM-DD") === date
      );

      if (realData) {
        const percentage = Number(realData[2].replace("%", ""));
        const realLalel = percentage >= 0 ? "P" : "N";

        if (label === "N" && realLalel === "N") acc.X++;
        else if (label === "P" && realLalel === "N") acc.Y++;
        else if (label === "N" && realLalel === "P") acc.Z++;
        else if (label === "P" && realLalel === "P") acc.W++;
      }
      return acc;
    },
    { X: 0, Y: 0, Z: 0, W: 0 }
  );

  // await generateConfusionMatrix({ X, Y, Z, W }, "approach-2(bert)");
  // console.log("DONE");
  return data;
}

async function confusionMatrixVader() {
  const bitcoinPrice = await csv({
    noheader: false,
    output: "csv",
  }).fromFile("bitcoin-prices.csv");

  let tweets = await Models.Tweet.find().select("text realCreatedAt");
  let data = [];

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

    const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(content);

    data.push({
      date,
      label: intensity.neu >= 0.5 ? "P" : "N",
      dateTimestamp: moment(date).valueOf(),
    });
  }

  const { X, Y, Z, W } = data.reduce(
    (acc, { date, label }) => {
      const realData = bitcoinPrice.find(
        (item) =>
          moment.utc(item[0], "DD-MMM-YYYY").format("YYYY-MM-DD") === date
      );

      if (realData) {
        const percentage = Number(realData[2].replace("%", ""));
        const realLalel = percentage >= 0 ? "P" : "N";

        if (label === "N" && realLalel === "N") acc.X++;
        else if (label === "P" && realLalel === "N") acc.Y++;
        else if (label === "N" && realLalel === "P") acc.Z++;
        else if (label === "P" && realLalel === "P") acc.W++;
      }
      return acc;
    },
    { X: 0, Y: 0, Z: 0, W: 0 }
  );

  // console.log({ X, Y, Z, W });
  // await generateConfusionMatrix({ X, Y, Z, W }, "approach-1(vader)");
  // console.log("DONE");
  return data;
}

async function confusionMatrixVader2() {
  const bitcoinPrice = await csv({
    noheader: false,
    output: "csv",
  }).fromFile("bitcoin-prices.csv");

  let tweets = await Models.Tweet.find().select("text realCreatedAt");

  let data = [];

  tweets = tweets.map((tweet) => {
    return {
      ...tweet.toJSON(),
      realCreatedAt: moment(tweet.realCreatedAt).utc().format("YYYY-MM-DD"),
    };
  });

  const tweetsByDate = _.groupBy(tweets, "realCreatedAt");

  for (const date in tweetsByDate) {
    const tweets = tweetsByDate[date];

    const labels = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };
    for (const tweet of tweets) {
      const { text } = tweet;
      const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(text);

      const label = getVaderLabel(intensity);
      labels[label]++;
    }

    let label;
    if (labels.negative > labels.positive) label = "N";
    else label = "P";
    data.push({
      date,
      label,
      dateTimestamp: moment(date).valueOf(),
    });
  }

  const { X, Y, Z, W } = data.reduce(
    (acc, { date, label }) => {
      const realData = bitcoinPrice.find(
        (item) =>
          moment.utc(item[0], "DD-MMM-YYYY").format("YYYY-MM-DD") === date
      );

      if (realData) {
        const percentage = Number(realData[2].replace("%", ""));
        const realLalel = percentage >= 0 ? "P" : "N";

        if (label === "N" && realLalel === "N") acc.X++;
        else if (label === "P" && realLalel === "N") acc.Y++;
        else if (label === "N" && realLalel === "P") acc.Z++;
        else if (label === "P" && realLalel === "P") acc.W++;
      }
      return acc;
    },
    { X: 0, Y: 0, Z: 0, W: 0 }
  );

  // console.log({ X, Y, Z, W });
  // await generateConfusionMatrix({ X, Y, Z, W }, "approach-2(vader)");
  // console.log("DONE");

  return data;
}

async function generateConfusionMatrix({ X, Y, Z, W }, fileName) {
  const header = [
    {
      id: "name",
      title: "",
    },
    {
      id: "begin",
      title: "",
    },
  ];
  const header2 = [
    {
      id: "name",
      title: "",
    },
    {
      id: "predictY",
      title: "Predicted value: YES",
    },
    {
      id: "predictN",
      title: "Predicted value: NO",
    },
  ];
  const Precision = X / (X + Z);
  const Recall = X / (X + Y);
  const F1 = (2 * (Precision * Recall)) / (Precision + Recall);
  const Accuracy = (X + W) / (X + Y + Z + W);

  const PrecisionBull = W / (W + Y);
  const RecallBull = W / (W + Z);
  const F1Bull =
    (2 * (PrecisionBull * RecallBull)) / (PrecisionBull + RecallBull);

  const rows = [
    {
      name: "Percision(Bullest)",
      begin: PrecisionBull,
    },
    {
      name: "Recall(Bullest)",
      begin: RecallBull,
    },
    {
      name: "F1(Bullest)",
      begin: F1Bull,
    },
    {
      name: "Percision(Bearest)",
      begin: Precision,
    },
    {
      name: "Recall(Bearest)",
      begin: Recall,
    },
    {
      name: "F1(Bearest)",
      begin: F1,
    },
    {
      name: "Accuracy",
      begin: Accuracy,
    },
  ];

  const rows2 = [
    {
      name: "Actual value: Yes",
      predictY: W,
      predictN: Z,
    },
    {
      name: "Actual value: No",
      predictY: Y,
      predictN: X,
    },
  ];

  const csvWriter = createCsvWriter({
    path: `./output/confusion-matrix/${fileName}-accuracy.csv`,
    header,
  });
  const csvWriter2 = createCsvWriter({
    path: `./output/confusion-matrix/${fileName}-confusion.csv`,
    header: header2,
  });
  await csvWriter.writeRecords(rows);
  await csvWriter2.writeRecords(rows2);
}

// test();
async function test() {
  const dataString = fs.readFileSync(
    "/Users/a1234/Downloads/alternative.json",
    "utf8"
  );
  const data = JSON.parse(dataString);

  const header = [
    { id: "date", title: "date" },
    { id: "value_classification", title: "value_classification" },
  ];

  const rows = data.data.map(({ value_classification, timestamp }) => {
    const date = moment.unix(timestamp).format("YYYY-MM-DD");

    return {
      date,
      value_classification,
    };
  });
  const csvWriter = createCsvWriter({
    path: `./alternative-report.csv`,
    header,
  });
  csvWriter.writeRecords(rows);

  console.log("DONE");
}

// test2();
async function test2() {
  const [gptData, bertData, vaderData] = await Promise.all([
    confusionMatrixGPT(),
    confusionMatrixBert(),
    confusionMatrixVader(),
  ]);

  const header = [
    { id: "date", title: "date" },
    { id: "gpt", title: "GPT" },
    { id: "bert", title: "Bert" },
    { id: "vader", title: "Vader" },
    { id: "bitcoin", title: "Bitcoin outcome" },
  ];

  const bitcoinPrice = await csv({
    noheader: false,
    output: "csv",
  }).fromFile("bitcoin-prices.csv");

  let rows = bitcoinPrice.map((bitcoinItem) => {
    const date = moment.utc(bitcoinItem[0], "DD-MMM-YYYY").format("YYYY-MM-DD");
    const percentage = Number(bitcoinItem[2].replace("%", ""));
    const realLalel = percentage >= 0 ? "P" : "N";

    const gptItem = gptData.find((item) => item.date === date);
    const bertItem = bertData.find((item) => item.date === date);
    const vaderItem = vaderData.find((item) => item.date === date);

    return {
      date,
      gpt: gptItem ? gptItem.label : "",
      bert: bertItem ? bertItem.label : "",
      vader: vaderItem ? vaderItem.label : "",
      bitcoin: realLalel,
      dateTimestamp: moment(date).valueOf(),
    };
  });

  rows = _.orderBy(rows, "dateTimestamp", "desc");
  const csvWriter = createCsvWriter({
    path: `./three-approaches-report.csv`,
    header,
  });
  csvWriter.writeRecords(rows);

  console.log("DONE");
}

// test3();
async function test3() {
  const [gptData, bertData, vaderData] = await Promise.all([
    confusionMatrixGPT2(),
    confusionMatrixBert2(),
    confusionMatrixVader2(),
  ]);

  const header = [
    { id: "date", title: "date" },
    { id: "gpt", title: "GPT" },
    { id: "bert", title: "Bert" },
    { id: "vader", title: "Vader" },
    { id: "bitcoin", title: "Bitcoin outcome" },
  ];

  const bitcoinPrice = await csv({
    noheader: false,
    output: "csv",
  }).fromFile("bitcoin-prices.csv");

  let rows = bitcoinPrice.map((bitcoinItem) => {
    const date = moment.utc(bitcoinItem[0], "DD-MMM-YYYY").format("YYYY-MM-DD");
    const percentage = Number(bitcoinItem[2].replace("%", ""));
    const realLalel = percentage >= 0 ? "P" : "N";

    const gptItem = gptData.find((item) => item.date === date);
    const bertItem = bertData.find((item) => item.date === date);
    const vaderItem = vaderData.find((item) => item.date === date);

    return {
      date,
      gpt: gptItem ? gptItem.label : "",
      bert: bertItem ? bertItem.label : "",
      vader: vaderItem ? vaderItem.label : "",
      bitcoin: realLalel,
      dateTimestamp: moment(date).valueOf(),
    };
  });

  rows = _.orderBy(rows, "dateTimestamp", "desc");
  const csvWriter = createCsvWriter({
    path: `./three-approaches-report(2).csv`,
    header,
  });
  csvWriter.writeRecords(rows);

  console.log("DONE");
}

// Date|#26|#38|list of 1,3,14,26,48,53,54,92,73|list of 91,83,23,38,63,39,71,75,42

// test4();
async function test4() {
  const augmentoDataString = fs.readFileSync(
    "/Users/a1234/Downloads/1.json",
    "utf8"
  );
  const augmentoData = JSON.parse(augmentoDataString);

  const header = [
    {
      id: "date",
      title: "date",
    },
    {
      id: "column1",
      title: "#26",
    },
    {
      id: "column2",
      title: "#38",
    },
    {
      id: "column3",
      title: "list of 1,3,14,26,48,53,54,92,73",
    },
    {
      id: "column4",
      title: "list of 91,83,23,38,63,39,71,75,42",
    },
  ];

  let rows = augmentoData.map((item) => {
    const { counts, datetime } = item;

    return {
      column1: counts[26],
      column2: counts[38],
      column3:
        counts[1] +
        counts[3] +
        counts[14] +
        counts[26] +
        counts[48] +
        counts[53] +
        counts[54] +
        counts[92] +
        counts[73],
      column4:
        counts[91] +
        counts[83] +
        counts[23] +
        counts[38] +
        counts[63] +
        counts[39] +
        counts[71] +
        counts[75] +
        counts[42],
      date: moment(datetime).format("YYYY-MM-DD"),
      dateTimestamp: moment(datetime).valueOf(),
    };
  });

  rows = _.orderBy(rows, "dateTimestamp", "desc");
  rows = _.unionBy(rows, "date");

  const csvWriter = createCsvWriter({
    path: `./augmento-report.csv`,
    header,
  });
  csvWriter.writeRecords(rows);

  console.log("DONE");
}
