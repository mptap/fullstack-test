const path = require("path");
const Datastore = require("../lib/datastore");

const db = new Datastore({
  filename: path.join(__dirname, "../data/reactions.db"),
});

class Reaction {
  constructor(rawReaction) {
    const { messageId, userId, reactedWith } = rawReaction;
    this.messageId = messageId;
    this.userId = userId;
    this.reactedWith = reactedWith;
  }

  static getAll() {
    return db
      .find({})
      .then((rawReactions) =>
        rawReactions.map((rawReaction) => new Reaction(rawReaction))
      );
  }

  static getByMessageId(messageId) {
    return db
      .find({ messageId })
      .then((rawReactions) =>
        rawReactions.map((rawReaction) => new Reaction(rawReaction))
      );
  }

  save() {
    try {
      return db.update(
        { userId: this.userId, messageId: this.messageId },
        this.serialize(),
        { upsert: true }
      );
    } catch (e) {
      return Promise.reject(e);
    }
  }

  serialize() {
    return {
      messageId: this.messageId,
      userId: this.userId,
      reactedWith: this.reactedWith,
    };
  }
}

module.exports = Reaction;
