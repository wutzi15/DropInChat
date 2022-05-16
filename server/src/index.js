const {
  createServer,
  createPubSub
} = require('@graphql-yoga/node')
const typeDefs = require('./schema')
const resolvers = require('./resolver')
const pubsub = createPubSub()
// const server = createServer({
//   graphiql: {
//     defaultQuery: /* GraphQL */ `
//       query {
//         hello
//       }
//     `,
//   },
//   typeDefs,
//   resolvers,
//   context: {
//     pubsub
//   }
// })

const server = createServer({
  schema: {
    typeDefs,
    resolvers
  },
  context: {
    pubsub
  }
})
// start the server and explore http://localhost:4000/graphql
server.start()

server.start(() => console.log('Server is running on localhost:4000'))