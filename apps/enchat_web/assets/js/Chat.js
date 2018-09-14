import moment from 'moment';
import { Presence, Socket } from 'phoenix';

import { User } from './chat/User';
import { QueryString } from './QueryString';

export class Chat {
  constructor() {
    this.presences = {};
    this.User = new User();

    this.connect();
    this.addListeners();
  }

  connect() {
    this.setStatus('connecting');

    this.socket = new Socket('/socket', {
      params: {
        token: window.userToken,
        name: QueryString.getParameter('name'),
      },
    });

    this.socket.connect();

    this.lobby = this.socket.channel('room:lobby', {});

    this.lobby
      .join()
      .receive('ok', () => this.setStatus('connected'))
      .receive('error', (resp) => console.warn('Unable to join', resp))
      .receive('timeout', (resp) => console.warn('Request timed out...', resp));
  }

  setStatus(state) {
    const iconEl = document.querySelector('.chat .status-container .status-icon');
    const textEl = document.querySelector('.chat .status-container .status-text');

    iconEl.className = `status-icon ${state}`;
    textEl.innerHTML = state.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  }

  sendMessage(text) {
    return new Promise((resolve, reject) => {
      const req = this.lobby.push('message:new', {text});

      req.receive('ok', resolve);
      req.receive('error', reject);
      req.receive('timeout', reject);
    });
  }

  addMessage(message) {
    const container = document.querySelector('.chat .message-container');

    switch (message.type) {
      case 'system':
        break;
      case 'message':
        const msg = document.createElement('div');
        msg.className = 'message';

        const date = document.createElement('span');
        date.className = 'date';
        date.innerText = `[${moment(message.sent).format('HH:mm:ss')}]`;
        msg.appendChild(date);

        const name = document.createElement('span');
        name.className = 'name';
        name.innerText = message.from;
        msg.appendChild(name);

        const text = document.createElement('span');
        text.className = 'text';
        text.innerText = message.text;
        msg.appendChild(text);
  
        container.appendChild(msg);
        break;
      default:
        break;
    }

    console.log('new message', message);
  }

  addListeners() {
    this.lobby.on('test', console.warn);

    this.lobby.on('message:new', (message) => this.addMessage(message));
    this.lobby.on('user:join', (message) => console.log(message));

    document
      .querySelector('form.input-container')
      .addEventListener('submit', (event) => {
        event.preventDefault();
        const textInput = event.srcElement.querySelector('input[type="text"]');
        const inputs = event.srcElement.querySelectorAll('input');
        const data = new FormData(event.srcElement);
        const text = data.get('message');

        if (!text) {
          return;
        }

        inputs.forEach((el) => {
          el.disabled = true;
        });

        this
          .sendMessage(text)
          .then(() => {
            textInput.value = '';
          })
          .catch(console.warn)
          .finally(() => {
            inputs.forEach((el) => {
              el.disabled = false;
            });

            textInput.focus();
          });
      });

    this.addPresenceListeners();
  }

  addPresenceListeners() {
    this.lobby.on('presence_state', (state) => {
      const newPresences = Presence.syncState(this.presences, state);

      Object.assign(this.presences, newPresences);

      this.handlePresenceUpdate(newPresences);
    });

    this.lobby.on('presence_diff', (diff) => {
      const newPresences = Presence.syncDiff(this.presences, diff);

      Object.assign(this.presences, newPresences);

      this.handlePresenceUpdate(newPresences);
    });
  }

  handlePresenceUpdate(presences = {}) {
    const el = document.querySelector('.user-container');
    el.innerHTML =
        this
          .User
          .getUsers(presences)
          .sort((a, b) => Math.sign(a.name.localeCompare(b.name)))
          .map((user) => `<div class="user"><span class="time">${moment(user.joined).format('HH:mm')}</span><span class="name">${user.name}</span></div>`)
          .reduce((acc, str) => acc + str, '');
  }
}
