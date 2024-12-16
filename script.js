const ApiPath = 'https://backend.integlynx.com/api/';
const MessageGet = ApiPath + 'messages';
const MessageSend = ApiPath + 'messages/send';
const MessageDelete = ApiPath + 'messages/delete';
const MessageEdit = ApiPath + 'messages/edit';
let send_cooldown = false;


document.addEventListener("DOMContentLoaded", function() {
  let sidebarMenu = document.getElementById('sidebar-menu');
  let navItems = ['*Bold*', '# Heading 1', '`Code`', '_Italic_', '~Strikethrough~'];
  navItems.forEach(item => {
    let li = document.createElement('li');
    let button = document.createElement('button');
    button.onclick = function() { ButtonExecute(item); };
    button.textContent = item;
    li.appendChild(button);
    sidebarMenu.appendChild(li);
  });
  reloadmessages();
});


function handleEnterPress(ele, event) {
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      return;
    } else {
      event.preventDefault();
      send();
    }
  }
}

function handleEditEnterPress(ele, event, id) {
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      return;
    } else {
      event.preventDefault();
      sendEditMessage(id, ele.innerText);
    }
  }
}


async function reloadmessages() {
  let chatWindow = document.getElementById('chat-window');
  chatWindow.innerHTML = "";
  let messages = await (await fetch(MessageGet)).json();
  messages.forEach(msg => {
    console.log("Message: " + JSON.stringify(msg));
    let messageContent = msg.message;
    let messageId = msg.id;
    let messageRaw = msg.raw.replaceAll("\\", "\\\\").replaceAll("\'", "\\\'");
    let div = document.createElement('div');
    div.classList.add('message');
    div.id = "message-" + messageId;
    div.innerHTML = `
    <p name="message-content" onkeydown="handleEditEnterPress(this, event, ${messageId})">${messageContent}</p> <br/>
    <pre class="msg_id">${messageId}</pre>
    <button class="message-button delete-btn" onclick="deleteMessage(${messageId})">Delete</button>
    <button class="message-button edit-btn" onclick="editMessage(${messageId}, '${messageRaw}')">Edit</button>
    `;
    chatWindow.appendChild(div);
  });
  chatWindow.scrollIntoView({
    behavior: 'smooth',
    block: 'end',
  });
}


async function send() {
  if (!send_cooldown) {
    send_cooldown = true;
    let messageInput = document.getElementById('message-input');
    let message = messageInput.innerText;

    await fetch(MessageSend, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ "message": message })
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    messageInput.innerHTML = "";
    console.log("Message input: " + messageInput.innerText);
    send_cooldown = false;
    reloadmessages();
  }
}


function ButtonExecute(name) {
  msgbar = document.getElementById("message-input");
  msgbar.innerHTML = name;
}


async function deleteMessage(id) {
  await fetch(MessageDelete, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "id": id })
  });
  await new Promise(resolve => setTimeout(resolve, 1000));
  reloadmessages();
}

async function editMessage(id, raw) {
  let messageDiv = document.getElementById('message-' + id);
  let message = messageDiv.querySelector('p[name="message-content"]');

  message.contentEditable = true;
  message.innerText = raw;

  messageDiv.innerHTML = `
  ${message.outerHTML} <br/>
  <pre class="msg_id">${id}</pre>
  <button class="message-button cancel-btn" onclick="reloadMessage(${id}, document.getElementById('message-' + ${id}).querySelector('p').innerText, '${raw}')">Cancel</button>
  <button class="message-button send-edit-btn" onclick="sendEditMessage(${id}, document.getElementById('message-' + ${id}).querySelector('p').innerText)">Send</button>
  `;

  message = messageDiv.querySelector('p[name="message-content"]');
  message.focus();
  const range = document.createRange();
  const selection = document.getSelection();
  range.selectNodeContents(message); // Selects the entire content of the element
  range.collapse(false); // Collapse to the end of the content
  selection.removeAllRanges();
  selection.addRange(range);
}

async function sendEditMessage(id, message) {
  const response = await fetch(MessageEdit, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "id": id, "message": message })
  });

  const responseobj = await response.json();
  reloadMessage(id, responseobj.message, responseobj.raw);
}

function reloadMessage(id, message, raw) {
  let messageDiv = document.getElementById('message-' + id);
  messageDiv.innerHTML = `
  <p name="message-content" onkeydown="handleEditEnterPress(this, event, ${id})">${message}</p> <br/>
  <pre class="msg_id">${id}</pre>
  <button class="message-button delete-btn" onclick="deleteMessage(${id})">Delete</button>
  <button class="message-button edit-btn" onclick="editMessage(${id},'${raw.replaceAll("\\", "\\\\").replaceAll("\'", "\\\'")}')">Edit</button>
  `;
}