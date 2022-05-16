const chats = [{
    id: 1,
    from: 'Chat 1',
    message: "Hello, how are you?",
}]
const CHAT_CHANNEL = 'CHAT_CHANNEL'


const resolvers = {
    Query: {
        chats(root, args, context) {
            return chats
        },
        hello() {
            return 'Hello world!'
        }
    },
    Mutation: {
        sendMessage(root, { from, message }, { pubsub }) {
            const chat = { id: chats.length + 1, from, message }
            chats.push(chat)
            pubsub.publish(CHAT_CHANNEL, { messageSent: chat })
            return chat
        }
    },

    Subscription: {
        messageSent: {
            subscribe: (root, args, { pubsub }) => {
                return pubsub.asyncIterator(CHAT_CHANNEL)
            }
        }
    }
};

module.exports = resolvers