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
                    <dl v-for="(chat, id) in chats.chats" :key="id">
                      <dt>{{ chat.from }}</dt>
                      <dd>{{ chat.message }}</dd>
                    </dl>

                    <hr />
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Type your message..."
                      v-model="message"
                      @keyup.enter="sendMessage"
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

<script>
import { onMounted, ref } from "vue";
import { useQuery } from '@urql/vue';
import { useMutation } from '@urql/vue';
export default {
    setup() {
    const username = ref("");
    const message = ref("");
    const entered = ref(false);

    const enterChat = () => {
      entered.value = !!username.value != "";
    };

    const sendMessageMutation = useMutation(`
        mutation($username: String!, $message: String!) {
          sendMessage(from: $username, message: $message) {
            id
            from
            message
          }
        }
      `);
    const sendMessage = () => {
      const variables = {
        username: username.value,
        message: message.value
      };
      sendMessageMutation.executeMutation(variables).then(result => console.log(result));
      message.value = ""
    }

    const result = useQuery({
      query: `
        query {
          chats {
            id
            from
            message
          }
        }
      `,
    });


    return {
      username,
      message,
      entered,
      enterChat,
      chats: result.data,
      sendMessage
    };
    }
}
</script>

<style>

</style>