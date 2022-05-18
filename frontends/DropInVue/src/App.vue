<template>
  <div id="app" class="container" style="padding-top: 100px">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card">
          <div class="card-body">
            <div class="row" v-if="entered">
              <div class="col-md-12">
                <div class="card">
                  <div class="card-header">Chatbox</div>
                  <div class="card-body">
                    <dl v-for="(chat, id) in messages" :key="id">
                      <dt>{{ chat.from }}</dt>
                      <dd>{{ chat.message }}</dd>
                    </dl>

                    <hr />
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Type your message..."
                      v-model="newMessage"
                      @keyup.enter="sendMessageMutation"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="row" v-else>
              <div class="col-md-12">
                <form method="post" @submit.prevent="enterChat">
                  <div class="form-group">
                    <div class="input-group">
                      <input
                        type="text"
                        class="form-control"
                        placeholder="Enter your username"
                        v-model="username"
                      />
                      <div class="input-group-append">
                        <button class="btn btn-primary" @click="enterChat">
                          Enter
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, watch } from "vue";
import { useQuery, useMutation, useSubscription } from "@vue/apollo-composable";
import gql from "graphql-tag";

const CHATS_QUERY = gql`
  query MyHelloQuery {
    chats {
      id
      from
      message
    }
  }
`;

const SEND_MESSAGES_MUTATION = gql`
  mutation ($from: String!, $message: String!) {
    sendMessage(from: $from, message: $message) {
      id
    }
  }
`;

const MESSAGES_SUBSCRIPTION = gql`
  subscription Subscription {
    messageSent {
      from
      message
      id
    }
  }
`;

export default {
  setup() {
    const username = ref("");
    const messages = ref([]);
    const entered = ref(false);
    const newMessage = ref("");

    const enterChat = () => {
      entered.value = !!username.value != "";
    };

    const { result: resultQuery } = useQuery(CHATS_QUERY);

    const { mutate: sendMessageMutation, onDone: sendMessagesDone } =
      useMutation(SEND_MESSAGES_MUTATION, () => ({
        variables: {
          from: username.value,
          message: newMessage.value,
        },
      }));

    sendMessagesDone(() => {
      newMessage.value = "";
    });

    watch(resultQuery, (value) => {
      messages.value = value.chats;
    });

    const { result } = useSubscription(MESSAGES_SUBSCRIPTION);

    watch(
      result,
      (data) => {
        console.log(`data.messageSent: ${JSON.stringify(data.messageSent)}`);
        messages.value = [...messages.value, data.messageSent];
      },
      {
        lazy: true, // Don't immediately execute handler
      }
    );

    return {
      username,
      messages,
      entered,
      enterChat,
      sendMessageMutation,
      newMessage,
    };
  },
};
</script>
