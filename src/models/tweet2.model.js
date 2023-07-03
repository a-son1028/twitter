var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var answerSchema = new Schema(
  {
    text: String,
    authorId: String,
    authorUsername: String,
    publicMetrics: Schema.Types.Mixed,
    id: String,
    editHistoryTweetIds: Schema.Types.Mixed,
    realCreatedAt: Schema.Types.Date,
    attachments: Schema.Types.Mixed,
    contextAnnotations: Schema.Types.Mixed,
    lang: String,
    keyword: String,
    dataset: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

export default mongoose.model("tweets-org", answerSchema);
