import "./configs/mongoose.config";
import axios from "axios";
import { Promise } from "bluebird";
import fs from "fs";
import _ from "lodash";
import moment from "moment";
import path from "path";
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

import Models from "./models";
const BEARER_TOKEN =
  "AAAAAAAAAAAAAAAAAAAAAA4bSgEAAAAAdt3uTCY8gO9lt08Vkk06uU5sHLs%3DA2gukEfF9yhQZW37PYKewMPqk0kGX8pwDmw8drNOiua4DaSiWR";

const usernames = [
  "cz_binance",
  "zachxbt",
  "Fwiz",
  "zooko",
  "molly0xFFF",
  "RishiSunak",
  "balajis",
  "ysiu",
  "nsitharaman",
  "punk6529",

  "alifarhat79",
  "alex_pertsev",
  "BrantlyMillegan",
  "miladymaker",
  "RepMaxineWaters",
  "PatrickMcHenry",
  "McGuinnessEU",
  "DylanMacalinao",
  "simplyianm",
  "HeatherReyhan",
  "fewocious",
  "bobbyhundreds",
  "KanavKariya",
  "hodlonaut",
  "Dr_CSWright",
  "tylerxhobbs",
  "CryptoHayes",
  "amirhaleem",
  "ChandlerGuo",
  "KeithGrossman",
  "glennEmartin",
  "SenLummis",
  "SenGillibrand",
  "cobie",
  "BlackRock",
  "FedorovMykhailo",
  "FatManTerra",
  "chrismd10",
  "RealMattDamon",
  "stablekwon",
  "Mashinsky",
  "zhusu",
  "Steven_Ehrlich",
  "nic__carter",
  "ArtOnBlockchain",
  "VitalikButerin",
  "adambrotman",
  "Reddit",
  "evabeylin",
  "CFTCbehnam",
  "GaryGensler",
  "SBF_FTX",
  "GordonGoner",
  "VStrangeYUGA",
  "CryptoGarga",
  "avery_akkineni",
  "garyvee",
  "BowTiedBull",
  "EmeldaZmaz",
  "pwuille",
  "n1ckler",
  "real_or_random",
  "ajtowns",
  "jackmallers",
  "elonmusk",
  "trungfinity",
  "katie_haun",
  "allseeingseneca",
  "whatsyouryat",
  "PolyNetwork2",
  "roneilr",
  "FireblocksHQ",
  "FrancisSuarez",
  "CamiRusso",
  "TimBeiko",
  "mcuban",
  "woonomic",
  "bitcoinzay",
  "StaniKulechov",
  "twobitidiot",
  "IOHK_Charles",
  "AndreCronjeTech",
  "gavofyork",
  "AriannaSimpson",
  "paoloardoino",
  "AntonioMJuliano",
  "jerallaire",
  "dannyryan",
  "saylor",
  "SenWarren",
  "BarrySilbert",
  "SereyChea",
  "raycivkit",
  "builtwithbtc",
  "Bitfinexed",
  "rleshner",
  "dfinzer",
  "matthall2000",
  "pents90",
  "brian_armstrong",
  "jack",
  "KMSmithDC",
  "beeple",
  "aeyakovenko",
  "ParisHilton",
  "3LAU",
  "jimmyfallon",
];

const usernamesOrg = [
  "BloombergMrkts",
  "BloombergNews",
  "Forbes",
  "Reuters",
  "BW",
  "ftfinancenews",
  "CNNMoney",
  "CNBCFastMoney",
  "WSJ",
  "YahooFinance",
  "CNBCWorld",
  "MarketWatch",
  "IBDinvestors",
  "MSN_Money",
  "FoxBusiness",
  "RealMarketNews",
  "NYSE",
  "TabbFORUM",
  "EconBizFin",
  "CNBCClosingBell",
  "dowbands",
  "FXstreetNews",
  "Street_Insider",
  "HedgeWorld",
  "cr_harper",
  "binance",
  "0xPolygonLabs",
  "0xpolygon",
  "web3isgreat",
  "Conservatives",
  "remiliacorp",
  "charlottefang77",
  "milady_sonoro",
  "yojimbo_king",
  "financialcmte",
  "FSCDems",
  "tailwindcss",
  "FewoWorld",
  "jump_",
  "ctdl21",
  "Maelstromfund",
  "novalabs_",
  "helium",
  "MoonPay",
  "CelsiusNetwork",
  "opnx_official",
  "ForbesCrypto",
  "krakenfx",
  "Citi",
  "BoozAllen",
  "artblocks_io",
  "larvalabs",
  "graphprotocol",
  "egirl_capital",
  "optimismfnd",
  "SECGov",
  "yugalabs",
  "boredapeyc",
  "cryptopunksnfts",
  "othersidemeta",
  "MeebitsNFTs",
  "Vaynermedia",
  "veefriends",
  "Synapseprotocol",
  "Blockstream",
  "ChaincodeLabs",
  "nixbitcoinorg",
  "donnerlab1",
  "AxieInfinity",
  "SkyMavisHQ",
  "HaunVentures",
  "AudiusProject",
  "MiamiMayor",
  "usmayors",
  "DefiantNews",
  "ETHmovie",
  "business",
  "ethereum",
  "krbecrypto",
  "LensProtocol",
  "AaveAave",
  "messaricrypto",
  "DFA2024",
  "fantomfdn",
  "yearnfi",
  "thekeep3r",
  "a16z",
  "tether_to",
  "bitfinex",
  "holepunch_to",
  "keet_io",
  "dYdX",
  "circle",
  "MicroStrategy",
  "DCGco",
  "Grayscale",
  "GenesisTrading",
  "CoinDesk",
  "FoundryServices",
  "LunoGlobal",
  "opensea",
  "Coinbase",
  "BlockchainAssn",
];

const usernamesPerson = [
  "VitalikButerin",
  "saylor",
  "MessariCrypto",
  "Apompliano",
  "garyvee",
  "aantonop",
  "WatcherGuru",
  "whale_alert",
  "IvanOnTech",
  "peckshield",
  "farokh",
  "BanklessHQ",
  "aantonop",
  "Bybit_Official",
  "ToneVays",
  "ErikVoorhees",
  "ethereumJoseph",
  "MessariCrypto",
  "TheCryptoDog",
  "mdudas",
  "PaikCapital",
  "SushiSwap",
  "girlgone_crypto",
  "100trillionUSD",
  "kennethbosak",
  "CryptoKaleo",
  "WClementeIII",
  "BTC_Archive",
  "LynAldenContact",
  "CryptoDiffer",
  "TheMoonCarl",
  "CryptoWendyO",
  "nic__carter",
  "whale_alert",
  "altcoingordon",
  "lopp",
  "ASvanevik",
  "opensea",
  "tydanielsmith",
  "chamath",
  "APompliano",
  "CaitlinLong_",
  "brian_armstrong",
  "SatoshiLite",
  "laurashin",
  "Melt_Dem",
  "aantonop",
  "tyler",
  "NickSzabo4",
  "BarrySilbert",
  "RaoulGMI",
  "zhusu",
  "woonomic",
  "BrianBrooksUS",
  "VladZamfir",
  "aantonop",
  "ethereumJoseph",
  "gavofyork",
  "naval",
  "tayvano_",
  "simondlr",
  "cburniske",
  "koeppelmann",
  "jwolpert",
  "lrettig",
  "ricburton",
  "el33th4xor",
  "evan_van_ness",
  "FEhrsam",
  "laurashin",
  "AriDavidPaul",
  "avsa",
  "0xstark",
  "JohnLilic",
  "ummjackson",
  "Disruptepreneur",
  "wheatpond",
  "leashless",
  "APompliano",
  "twobitidiot",
  "_jillruth",
  "trentmc0",
  "Melt_Dem",
  "technocrypto",
  "brian_armstrong",
  "nlw",
  "samcassatt",
  "spencernoon",
  "rogerkver",
  "brockpierce",
  "officialmcafee",
  "JihanWu",
  "AriDavidPaul",
  "TuurDemeester",
  "jimmysong",
  "mikojava",
  "durov",
  "aantonop",
  "peterktodd",
  "adam3us",
  "VinnyLingham",
  "bobbyclee",
  "ErikVoorhees",
  "barrysilbert",
  "TimDraper",
  "koreanjewcrypto",
  "MichaelSuppo",
  "DiaryofaMadeMan",
  "aradchenko1",
];

const usernamesCompany = [
  "coinbase",
  "bitfinex",
  "krakenfx",
  "BittrexExchange",
  "BithumbOfficial",
  "Aurora_dao",
  "binance",
  "BitMEXdotcom",
  "OKEx_",
  "Bitstamp",
  "ethereum",
  "NEO_Blockchain",
  "0xProject",
  "Uttoken",
  "Ripple",
  "EOS_io",
  "StellarOrg",
  "monero",
  "litecoin",
  "Dashpay",
  "Cointelegraph",
  "coindesk",
  "BitcoinMagazine",
  "CoinMarketCap",
  "CryptoCoinsNews",
];

// main();
async function main() {
  try {
    const TwitterAPI = await axios.create({
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
      baseURL: "https://api.twitter.com/2",
    });

    const keywords = [
      // "bitcoin", "btc",
      "crypto",
      "cryptocurrency",
    ];
    const tweetFields = [
      "created_at",
      "author_id",
      "public_metrics",
      "attachments",
      "context_annotations",
      "lang",
    ];

    for (const username of usernamesCompany) {
      const result = [];
      for (const keyword of keywords) {
        let nextToken = "";

        const q = `from:${username} (#${keyword} OR @${keyword})`;
        do {
          let tweetRes = await TwitterAPI.get(`tweets/search/all`, {
            params: {
              query: q,
              "tweet.fields": tweetFields.join(","),
              max_results: 100,
              start_time: "2018-01-01T00:00:00.000Z",
              ...(nextToken && {
                next_token: nextToken,
              }),
            },
          });
          tweetRes = tweetRes.data;
          const { meta, data } = tweetRes;

          await Promise.map(
            data || [],
            (item) => {
              const {
                id,
                text,
                author_id: authorId,
                public_metrics: publicMetrics,
                edit_history_tweet_ids: editHistoryTweetIds,
                created_at: realCreatedAt,
                attachments,
                context_annotations: contextAnnotations,
                lang,
              } = item;
              result.push({
                id,
                text,
                authorId,
                authorUsername: username,
                publicMetrics,
                editHistoryTweetIds,
                realCreatedAt,
                attachments,
                contextAnnotations,
                lang,
                keyword,
              });
              return Models.Tweet.updateOne(
                { id },
                {
                  id,
                  text,
                  cleanedText: removeSpecialCharactersAndEmoticons(text),
                  authorId,
                  authorUsername: username,
                  publicMetrics,
                  editHistoryTweetIds,
                  realCreatedAt,
                  attachments,
                  contextAnnotations,
                  lang,
                  keyword,
                  dataset: "company",
                },
                {
                  upsert: true,
                  setDefaultsOnInsert: true,
                }
              );
            },
            { concurrency: 100 }
          );

          nextToken = meta.next_token;
          console.log(1, nextToken);
          await sleep(1000);
        } while (!!nextToken);
      }
    }

    console.log("DONE");
  } catch (err) {
    console.log(err);
  }
}

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

test();
async function test() {
  // const tweets = await Models.Tweet.find();

  // const dates = _.map(tweets, "realCreatedAt").map((item) =>
  //   moment(item).format("YYYY-MM-DD")
  // );
  // console.log(_.uniq(dates).length, dates.length);

  // const fileNames = fs.readdirSync("./output");
  // console.log(fileNames);
  // let result = [];
  // for (const fileName of fileNames) {
  //   const data = await fs.readFileSync(`./output/${fileName}`, "utf-8");
  //   const tweets = JSON.parse(data);

  //   result = [...result, ...tweets];
  // }

  // console.log(result.length);
  // fs.writeFileSync("./tweets-full.json", JSON.stringify(result, null, 2));

  // export CSV
  const header = [
    { id: "text", title: "text" },
    { id: "cleanedText", title: "cleanedText" },
    { id: "formalText", title: "formalText" },
    { id: "date", title: "date" },
    { id: "location", title: "location" },
    { id: "dataset", title: "dataset" },
    { id: "keyword", title: "keyword" },
  ];
  // Set the start time to 11:00 PM
  const startHour = 23; // Starting hour (inclusive)
  const endHour = 24; // Ending hour (exclusive)

  const tweets = await Models.Tweet.find({
    // authorUsername: { $ne: "whale_alert" },
    // $expr: {
    //   $and: [
    //     { $gte: [{ $hour: "$realCreatedAt" }, startHour] },
    //     { $lt: [{ $hour: "$realCreatedAt" }, endHour] },
    //   ],
    // },
    // keyword: {
    //   $in: ["bitcoin", "btc"],
    // },
    // dataset: {
    //   $in: ["kol", "company"],
    // },
  }).select("text cleanedText realCreatedAt dataset keyword author");
  // .limit(10);

  let rows = tweets.map((item) => {
    let date = moment(item.realCreatedAt);

    if (date.utc().format("HH") === "23") {
      date = date.add(1, "hour");
    }

    return {
      text: item.text,
      cleanedText: item.cleanedText.trim(),
      formalText: `"${item.cleanedText.trim()}";`,
      date: date.utc().format("YYYY-MM-DD HH:mm"),
      location: item.author.location,
      dateTimestamp: moment(item.realCreatedAt).valueOf(),
      dataset: item.dataset,
      keyword: item.keyword,
    };
  });

  fs.writeFileSync("./tweets-and-dates.json", JSON.stringify(rows));
  rows = _.orderBy(rows, "dateTimestamp", "desc");
  const csvWriter = createCsvWriter({
    path: `./tweets-and-dates.csv`,
    header,
  });
  csvWriter.writeRecords(rows);

  // missing dates
  // const result = [];
  // const tweets = await Models.Tweet.find();

  // let dates = _.map(tweets, "realCreatedAt").map((item) =>
  //   moment(item).utc().format("YYYY-MM-DD")
  // );
  // dates = _.uniq(dates);

  // let startDate = moment("2018-01-01T00:00:00.000Z").utc();

  // while (startDate.isBefore(moment())) {
  //   startDate = startDate.add(1, "day");

  //   if (!dates.includes(startDate.format("YYYY-MM-DD"))) {
  //     result.push(startDate.format("YYYY-MM-DD"));
  //   }
  // }
  // console.log(result);
  // fs.writeFileSync("./missing-dates(org).txt", JSON.stringify(result, null, 2));

  console.log("DONE");
}

// getNumberOfTweetsForEachAuthors();
async function getNumberOfTweetsForEachAuthors() {
  const tweets = await Models.Tweet.find().select("id authorUsername dataset");

  const tweetsByAuthors = _.groupBy(tweets, "authorUsername");

  const header = [
    { id: "username", title: "username" },
    { id: "tweet_count", title: "tweet count" },
    { id: "dataset", title: "dataset" },
  ];
  let rows = Object.entries(tweetsByAuthors).map(([authorUsername, tweets]) => {
    return {
      username: authorUsername,
      tweet_count: tweets.length,
      dataset: tweets[0].dataset,
    };
  });

  rows = _.orderBy(rows, "tweet_count", "desc");
  const csvWriter = createCsvWriter({
    path: `./tweets-count-by-authors.csv`,
    header,
  });
  csvWriter.writeRecords(rows);

  console.log("DONE");
}

// getNumberOfTweetsByDates();
async function getNumberOfTweetsByDates() {
  let tweets = await Models.Tweet.find().select("realCreatedAt");

  tweets = tweets.map((tweet) => {
    return {
      ...tweet.toJSON(),
      realCreatedAt: moment(tweet.realCreatedAt).utc().format("YYYY-MM-DD"),
    };
  });

  const tweetsByDate = _.groupBy(tweets, "realCreatedAt");

  const header = [
    { id: "date", title: "date" },
    { id: "tweet_count", title: "tweet count" },
  ];
  let rows = Object.entries(tweetsByDate).map(([date, tweets]) => {
    return {
      date,
      tweet_count: tweets.length,
    };
  });

  rows = _.orderBy(rows, "tweet_count", "desc");
  const csvWriter = createCsvWriter({
    path: `./tweets-count-by-dates.csv`,
    header,
  });
  csvWriter.writeRecords(rows);

  console.log("DONE");
}

// updateCleanedText();
async function updateCleanedText() {
  const tweets = await Models.Tweet.find().select("text");

  await Promise.map(
    tweets,
    (tweet) => {
      const { _id, text } = tweet;

      const cleanedText = removeSpecialCharactersAndEmoticons(text);

      return Models.Tweet.updateOne(
        { _id },
        {
          cleanedText,
        }
      );
    },
    {
      concurrency: 100,
    }
  );

  console.log("DONE");
}
function removeSpecialCharactersAndEmoticons(content) {
  // Remove URLs
  content = content.replace(/(https?:\/\/[^\s]+)/g, "");

  // Remove special characters
  content = content.replace(/[^\w\s]|_/g, "");

  // Remove emoticons
  content = content.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "");

  return content;
}

// getTweetsByThread();
async function getTweetsByThread() {
  try {
    const TwitterAPI = await axios.create({
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
      baseURL: "https://api.twitter.com/2",
    });
    const tweetFields = [
      "created_at",
      "author_id",
      "public_metrics",
      "attachments",
      "context_annotations",
      "lang",
    ];
    const keywords = ["bitcoin", , "btc"];

    for (const keyword of keywords) {
      const q = `conversation_id:1669364383900639234 (#${keyword} OR @${keyword})`;
      let tweetRes = await TwitterAPI.get(`tweets/search/all`, {
        params: {
          query: q,
          "tweet.fields": tweetFields.join(","),
          max_results: 100,
          start_time: "2018-01-01T00:00:00.000Z",
          // ...(nextToken && {
          //   next_token: nextToken,
          // }),
        },
      });
      tweetRes = tweetRes.data;
      const { meta, data } = tweetRes;

      console.log(tweetRes);
      await sleep(1000);
    }
  } catch (err) {
    console.log(err);
  }
}

// updateTweetAuthors();
async function updateTweetAuthors() {
  try {
    const TwitterAPI = await axios.create({
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
      baseURL: "https://api.twitter.com/2",
    });
    const tweets = await Models.Tweet.find({
      author: { $exists: false },
    }).select("authorId");

    const userFields = [
      "created_at",
      "description",
      "id",
      "name",
      "location",
      "profile_image_url",
      "public_metrics",
      "protected",
      "url",
      "verified",
    ];

    const tweetChunks = _.chunk(tweets, 100);
    await Promise.map(
      tweetChunks,
      async (tweetChunk) => {
        const userIds = _.map(tweetChunk, "authorId");

        let tweetUsers = await TwitterAPI.get(
          `users?ids=${userIds.join(",")}`,
          {
            params: {
              "user.fields": userFields.join(","),
            },
          }
        );

        tweetUsers = tweetUsers.data;
        const { data: users } = tweetUsers;

        await Promise.map(
          tweetChunk,
          (tweet) => {
            const { _id, authorId } = tweet;

            const author = users.find((item) => item.id === authorId);
            return Models.Tweet.updateOne(
              { _id },
              {
                author,
              }
            );
          },
          { concurrency: 50 }
        );

        return;
      },
      {
        concurrency: 1,
      }
    );
  } catch (err) {
    console.log(err);
  }
}
