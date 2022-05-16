<template>
  <Chat />
</template>

<script lang="ts">

import { useQuery } from '@urql/vue';
import {provideClient} from '@urql/vue'
import Chat from "./components/Chat.vue";
import { createClient, defaultExchanges, subscriptionExchange } from 'urql';
import { createClient as createWSClient } from 'graphql-ws';

const wsClient = createWSClient({
  url: 'ws://localhost:4000/graphql',
});

const client = createClient({
  url: 'http://localhost:4000/graphql',
  exchanges: [
    ...defaultExchanges,
    subscriptionExchange({
      forwardSubscription: (operation) => ({
        subscribe: (sink) => ({
          unsubscribe: wsClient.subscribe(operation, sink),
        }),
      }),
    }),
  ],
});
export default {
  components: {
    Chat,
  },
  setup() {
    provideClient(client);

  },
};
</script>
