import tweetModel from "./tweet.model";
import tweet2Model from "./tweet2.model";

class Model {
  constructor() {
    this.Tweet = tweetModel;
    this.TweetORG = tweet2Model;
  }
}
export default new Model();
