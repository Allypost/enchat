import moment from 'moment';
import forge from 'node-forge';
import { Presence, Socket } from 'phoenix';

import { User } from './chat/User';
import { QueryString } from './QueryString';

export class Chat {
  constructor() {
    this.presences = {};
    this.User = new User();

    this
      .generateKeys()
      .then(() => {
        this.connect();
        this.addListeners();
      });
  }

  get roomNames() {
    const base = ['lobby', `user:${this.name}`];

    return base;
  }

  get container() {
    return document.querySelector('.chat');
  }

  get messageContainer() {
    return this.container.querySelector('.message-container');
  }

  get userContainer() {
    return this.container.querySelector('.user-container');
  }
  
  get statusContainer() {
    return this.container.querySelector('.status-container');
  }

  get name() {
    return QueryString.getParameter('name');
  }

  get isScrolledToBottom() {
    const { messageContainer } = this;

    return messageContainer.scrollHeight - messageContainer.clientHeight <= messageContainer.scrollTop + 1;
  }

  room(name) {
    const room = this.rooms.find(({name: roomName}) => name === roomName) || {};

    return room.room || {push() {}};
  }

  generateKeys() {
    return new Promise((resolve) => {
      forge.pki.rsa.generateKeyPair({ bits: 1024, workers: -1 }, (err, keys) => {
        this.keypair = keys;
        resolve(keys);
      });
    });
  }

  connect() {
    this.setStatus('connecting');

    this.socket = new Socket('/socket', {
      params: {
        token: window.userToken,
        name: this.name,
        publicKey: forge.pki.publicKeyToPem(this.keypair.publicKey),
      },
    });

    this.socket.connect();

    this
      .joinRooms()
      .then(() => this.setStatus('connected'));
  }

  joinRooms() {
    this.rooms = this.roomNames.map((name) => ({name, room: this.socket.channel(`room:${name}`, {})}));
    
    const roomPromises = this.rooms.map(this.joinRoom);

    return Promise.all(roomPromises);
  }

  joinRoom({name, room}) {
    return (
      new Promise((resolve, reject) =>
        room
          .join()
          .receive('ok', (...args) => resolve({name, args}))
          .receive('error', (...args) => reject({name, args}))
          .receive('timeout', (...args) => reject({name, args})))
    );
  }

  setStatus(state) {
    const iconEl = this.statusContainer.querySelector('.status-icon');
    const textEl = this.statusContainer.querySelector('.status-text');

    iconEl.className = `status-icon ${state}`;
    textEl.innerHTML = state.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  }

  sendMessage(text, room = 'lobby') {
    return new Promise((resolve, reject) => {
      const req = this.room(room).push('message:new', {text});

      req.receive('ok', resolve);
      req.receive('error', reject);
      req.receive('timeout', reject);
    });
  }

  addMessage(roomName, message) {
    const container = this.messageContainer;
    const atBottom = this.isScrolledToBottom;
    const msg = document.createElement('div');
    msg.classList.add('message');

    if (message.type === 'system') {
      msg.classList.add('system');

      const date = document.createElement('span');
      date.className = 'date';
      date.innerText = `[${moment(message.sent).format('HH:mm:ss')}]`;
      msg.appendChild(date);

      const text = document.createElement('span');
      text.className = 'text';
      text.innerText = message.text;
      msg.appendChild(text);
    }

    if (message.type === 'message') {
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
    }

    container.appendChild(msg);
    
    if (atBottom || message.from === this.name) {
      container.scrollTop = container.scrollHeight - container.clientHeight;
    }
  }

  addListeners() {
    this
      .rooms
      .forEach(({name, room}) => {
        room.on('message:new', (message) => this.addMessage(name, message));
        room.on('user:join', (message) => console.log('|> USER JOINED', name, message));
      });

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
    this.room('lobby').on('presence_state', (state) => {
      const newPresences = Presence.syncState(this.presences, state);

      Object.assign(this.presences, newPresences);

      this.handlePresenceUpdate(newPresences);
    });

    this.room('lobby').on('presence_diff', (diff) => {
      const newPresences = Presence.syncDiff(this.presences, diff);

      Object.assign(this.presences, newPresences);

      this.handlePresenceUpdate(newPresences);
    });
  }

  handlePresenceUpdate(presences = {}) {
    this
      .userContainer
      .innerHTML =
        this
          .User
          .getUsers(presences)
          .sort((a, b) => Math.sign(a.name.localeCompare(b.name)))
          .map((user) => `<div class="user"><span class="time">${moment(user.joined).format('HH:mm')}</span><span class="name">${user.name}</span></div>`)
          .reduce((acc, str) => acc + str, '');
  }
}
