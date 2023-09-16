require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const dns = require("dns");
const urlParser = require("url");
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

const urlSchema = new mongoose.Schema({
  address: {
    type: String,
    require: true,
  },
  list: Number,
});
let UrlShort = mongoose.model("Url", urlSchema);

app.post("/api/shorturl", (req, res) => {
  let url = req.body.url;

  dns.lookup(urlParser.parse(url).hostname, async (err, address, list) => {
    if (!address || !list) {
      return res.json({
        error: "invalid url",
      });
    }

    let link = await UrlShort.findOne({
      address: url,
    }).exec();

    if (link !== null) {
      return res.json({
        original_url: link.address,
        short_url: link.list,
      });
    }

    let count = await UrlShort.find().countDocuments();

    let newLink = new UrlShort({
      address: url,
      list: count + 1,
    });

    newLink.save();

    return res.json({
      original_url: newLink.address,
      short_url: newLink.list,
    });
  });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  let short_url = Number(req.params.short_url);

  let link = await UrlShort.findOne({
    list: short_url,
  }).exec();

  res.redirect(link.address);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
