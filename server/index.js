const {
    gql
} = require('apollo-server');
const {
    ApolloServer
} = require('apollo-server-express');
const {
    ApolloServerPluginDrainHttpServer
} = require('apollo-server-core');
const express = require('express');
const http = require('http');
const {
    createServer
} = require('http');
const {
    makeExecutableSchema
} = require('@graphql-tools/schema');
const {
    WebSocketServer
} = require('ws');
const {
    useServer
} = require('graphql-ws/lib/use/ws');
const {
    PubSub
} = require('graphql-subscriptions');

const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const winston = require('winston');
const SentryWinston = require('winston-sentry-log');
require('dotenv').config()

const options = {
  config: {
    dsn: process.env.SENTRY_DSN
  },
  level: "info"
};

const logger = winston.createLogger({
    transports: [new SentryWinston(options),
    new winston.transports.Console(),]
});

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

const transaction = Sentry.startTransaction({
  op: "test",
  name: "My First Test Transaction",
});


const typeDefs = gql `
    type Chat {
        id: Int!
        from: String!
        message: String!
    }

    type Query {
        chats: [Chat]
        hello: String
    }

    type Mutation {
        sendMessage(from: String!, message: String!): Chat
    }

    type Subscription {
        messageSent: Chat
    }

    `;

const chats = [{
    id: 1,
    from: 'Chat 1',
    message: "Hello, how are you?",
}]

const pubsub = new PubSub();

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
        sendMessage(root, {
            from,
            message
        }) {
            const chat = {
                id: chats.length + 1,
                from,
                message
            }
            chats.push(chat)
            pubsub.publish('MESSAGE_SEND', { messageSent: chat })
            return chat
        }
    },
    Subscription: {
        messageSent: {
            subscribe: (root, args) => {
                return pubsub.asyncIterator('MESSAGE_SEND')
            }
        }
    }
};

async function startApolloServer(typeDefs, resolvers) {
    // Create the schema, which will be used separately by ApolloServer and
    // the WebSocket server.
    const schema = makeExecutableSchema({
        typeDefs,
        resolvers
    });

    // Create an Express app and HTTP server; we will attach both the WebSocket
    // server and the ApolloServer to this HTTP server.
    const app = express();
    const httpServer = createServer(app);

    // Create our WebSocket server using the HTTP server we just set up.
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
    });
    // Save the returned server's info so we can shutdown this server later
    const serverCleanup = useServer({
        schema
    }, wsServer);



    // Set up ApolloServer.
    const server = new ApolloServer({
        schema,
        csrfPrevention: true,
        plugins: [
            // Proper shutdown for the HTTP server.
            ApolloServerPluginDrainHttpServer({
                httpServer
            }),

            // Proper shutdown for the WebSocket server.
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
        ],
    });
    await server.start();
    server.applyMiddleware({
        app
    });

    const PORT = 4000;
    // Now that our HTTP server is fully set up, we can listen to it.
    httpServer.listen(PORT, () => {
        logger.info(
            `Server is now running on http://localhost:${PORT}${server.graphqlPath}`,
        );
    });
}

(async () => {
    await startApolloServer(typeDefs, resolvers);
    logger.info('Server started');
})();