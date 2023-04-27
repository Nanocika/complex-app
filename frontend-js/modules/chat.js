export default class Chat {
  constructor() {
    this.openedYet = false
    this.chatWrapper = document.querySelector("#chat-wrapper")
    this.openIcon = document.querySelector(".header-chat-icon")
    this.injectHTML()
    this.closeIcon = document.querySelector(".chat-title-bar-close")
    this.events()
  }

  //EVENTS
  events() {
    this.openIcon.addEventListener("click", () => this.showChat())
    this.closeIcon.addEventListener("click", () => this.hideChat())
  }

  //METHODS

  injectHTML() {
    this.chatWrapper.innerHTML = `
       <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
       <div id ="chat" class = "chat-log"></div>
       <form id="chatForm" class="chat-form border-top">
       <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
       </form>
       `
  }

  showChat() {
    if (!this.openedYet) {
      this.openConnection()
    }
    this.openedYet = true
    this.chatWrapper.classList.add("chat--visible")
  }

  openConnection() {
    //now this io function here at frontend  see the io tools from footer.ejs rendered back by webserver
    //this function will open a connection between server and browser
    this.socket = io()
    alert("Connection SOCKET IO ist opened NOW 1 ")
  }

  hideChat() {
    this.chatWrapper.classList.remove("chat--visible")
  }
}
