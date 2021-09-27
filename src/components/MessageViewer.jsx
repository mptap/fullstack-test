import classnames from "classnames";
import formatRelative from "date-fns/formatRelative";
import React from "react";
import { reactToMessage } from "../actions";
import { useChannelStore } from "../stores/channels";
import { useMessageStore } from "../stores/messages";
import { useUserStore } from "../stores/users";
import MessageEditor from "./MessageEditor";
import { EMOJI_LIST } from "../constants";
import styles from "./MessageViewer.module.scss";

const getActiveUserReactions = (activeUserId, reactions = []) => {
  const activeUserIndex = reactions.findIndex(
    (reaction) => reaction.userId === activeUserId
  );
  return activeUserIndex === -1 ? [] : reactions[activeUserIndex].reactedWith;
};

const getEmojiIndex = (emojiId, activeUserId, reactions = []) => {
  let reactedWith = getActiveUserReactions(activeUserId, reactions);
  return reactedWith.indexOf(emojiId);
};

const saveReaction = (emojiId, activeUserId, messageId, reactions = []) => {
  let reactedWith = getActiveUserReactions(activeUserId, reactions);
  const emojiIndex = getEmojiIndex(emojiId, activeUserId, reactions);

  if (emojiIndex !== -1) { // activeUser has un-clicked emoji
    reactedWith.splice(emojiIndex, 1);
  } else { // activeUser has clicked emoji
    reactedWith.push(emojiId);
  }

  reactToMessage({
    messageId,
    reactedWith,
  });
};

const isSelectedByActiveUser = (emojiId, activeUserId, reactions = []) => {
  return getEmojiIndex(emojiId, activeUserId, reactions) > -1;
};

const getEmojiCount = (reactions, emojiId) => {
  if (!reactions) {
    return 0;
  }
  return reactions.filter(
    (reaction) =>
      reaction.reactedWith &&
      reaction.reactedWith.length &&
      reaction.reactedWith.includes(emojiId)
  ).length;
};

const Message = ({ content, reactions, createdAt, id, userId, channelId }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const user = useUserStore((state) =>
    state.users.find((user) => user.id === userId)
  );

  const activeUserId = useUserStore((state) => state.activeUserId);
  const dateInstance = React.useMemo(() => new Date(createdAt), [createdAt]);

  return (
    <div className={styles.message}>
      <div className={styles.metadata}>
        {user == null ? null : (
          <span className={styles.username}>{user.username}</span>
        )}
        <span className={styles.timestamp}>
          {formatRelative(dateInstance, new Date())}
        </span>
      </div>
      {isEditing ? (
        <MessageEditor
          channelId={channelId}
          id={id}
          content={content}
          onClose={() => setIsEditing(false)}
        />
      ) : (
        content
      )}
      {userId === activeUserId && !isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          className={styles.editButton}
        >
          Edit
        </button>
      ) : null}
      <div>
        {EMOJI_LIST.map((emoji, index) => {
          return (
            <button
              onClick={() => saveReaction(index, activeUserId, id, reactions)}
              className={classnames(styles.emojiReaction, {
                [styles.emojiReactionActive]: isSelectedByActiveUser(
                  index,
                  activeUserId,
                  reactions
                ),
              })}
              key={index}
            >
              {emoji} {getEmojiCount(reactions, index)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MessageViewer = () => {
  const allMessages = useMessageStore((state) => state.messages);
  const activeChannelId = useChannelStore((state) => state.activeChannelId);
  const messagesForActiveChannel = React.useMemo(
    () =>
      allMessages.filter((message) => message.channelId === activeChannelId),
    [activeChannelId, allMessages]
  );
  const isEmpty = messagesForActiveChannel.length === 0;

  return (
    <div
      className={classnames(styles.wrapper, { [styles.wrapperEmpty]: isEmpty })}
    >
      {isEmpty ? (
        <div className={styles.empty}>
          No messages{" "}
          <span aria-label="Sad face" role="img">
            😢
          </span>
        </div>
      ) : (
        messagesForActiveChannel.map((message) => (
          <Message
            channelId={activeChannelId}
            key={message.id}
            id={message.id}
            content={message.content}
            reactions={message.reactions}
            createdAt={message.createdAt}
            userId={message.userId}
          />
        ))
      )}
    </div>
  );
};

export default MessageViewer;
