import { createApp, provide, h } from 'vue'
import { createPinia } from 'pinia'
import { ApolloClient, createHttpLink, InMemoryCache, HttpLink, split } from '@apollo/client/core'
import { createApolloProvider } from '@vue/apollo-option'
import VueApolloComponents from '@vue/apollo-components'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { provideApolloClient } from "@vue/apollo-composable";
import { WebSocketLink } from "@apollo/client/link/ws"
import { getMainDefinition } from "@apollo/client/utilities"

import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

import App from './App.vue'


// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: 'http://localhost:4000/graphql',
})

const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
}));

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const link = split(
  // split based on operation type
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    )
  },
  wsLink,
  httpLink
)

// Cache implementation
const cache = new InMemoryCache()

// Create the apollo client
const apolloClient = new ApolloClient({
  link: link,
  cache,
})

const apolloProvider = createApolloProvider ({
  defaultClient: apolloClient
})

provideApolloClient(apolloClient)


const app = createApp(App)

app.use(createPinia())
app.use(apolloProvider)
app.use(VueApolloComponents)

app.mount('#app')
