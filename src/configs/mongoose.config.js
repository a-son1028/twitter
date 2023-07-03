import mongoose from "mongoose";

const url = "mongodb://127.0.0.1:27017/pj-twitter?authSource=admin";
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("error", (err) => {
  console.log(err);
  console.log("Connect MONDGODB ERROR");
});

mongoose.set("debug", true);
