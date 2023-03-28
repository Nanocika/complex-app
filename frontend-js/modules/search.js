import axios from 'axios'

export default class Search {
  // 1. Select DOM elements, and keep track of any useful data
  constructor() {
    this.injectHTML()
    this.headerSearchIcon = document.querySelector(".header-search-icon")
    this.overlay = document.querySelector(".search-overlay")
    this.closeIcon = document.querySelector(".close-live-search")
    this.inputField = document.querySelector("#live-search-field")
    this.resultsArea = document.querySelector(".live-search-results")
    this.loaderIcon  = document.querySelector(".circle-loader")
    this.typingwaitTimer
    this.previousValue = ""
    this.events()
  }
  // 2. Events
  events() {
    this.inputField.addEventListener("keyup", ()=> this.keyPressHandler())
    this.closeIcon.addEventListener("click", () => this.closeOverlay())
    this.headerSearchIcon.addEventListener("click", (e) => {
      e.preventDefault()
      this.openOverlay()
    })
  }
  // 3. Methods
  
  /*ha elengedi a billenyut (p) akkor indul el a methodus, elindul az kerek icon, es elkezd 3 mp varni es csak utan indul a serverre a request
  de ha 3 mp alatt elenged egy ujabb billenytyut akkor nem varja meg az idozitot , hanem  indul a methodus ujra es nulazza az eddig idozito
  es a send request csak akkor indul ha 3 mp utan se nyom le ujabb billenyut a felhasznalo  */  
  
   keyPressHandler() {
    let value = this.inputField.value
    
    if (value == "") {
      clearTimeout(this.typingWaitimer)
      this.hideLoaderIcon()
      this.hideResultsArea()
    }

    if (value != "" && value != this.previousValue){
      clearTimeout(this.typingWaitimer)//clears to zero
      this.showLoaderIcon()
      this.hideResultsArea()
      this.typingWaitimer = setTimeout(()=>this.sendRequest(), 750)
    }
    this.previousValue = value
  }

 // ez a methodus meg csak annyit csinal hogy a kereses sikeres talalatakor kiirja a bongeszo
 // konzoljara a nyers JSON adatot (egy tomb a postokkal amiben szerepel az input. value vagy a bodyban vagy a titleben)
 // + renderel egy statikus HTMLT (ebbe kesoobb JS -el beleirjuk a helyes postot a tombol)
 // sikertelenseg-kor  kiir egy hibauzit  
 sendRequest() {
      axios.post('/search', {searchTerm: this.inputField.value}).then(response=>{
        
        
        console.log(response.data)
        this.renderResultsHTML(response.data)
      }).catch(()=>{
        alert("Hello, the request failed.")
      })
  }


  renderResultsHTML(posts){
    if (posts.length){
      this.resultsArea.innerHTML = `          <div class="list-group shadow-sm">

      <div class="list-group-item active"><strong>Search Results</strong> (4 items found)</div>



      <a href="#" class="list-group-item list-group-item-action">

        <img class="avatar-tiny" src=https://gravatar.com/avatar/b9216295c1e3931655bae6574ac0e4c2?s=128> <strong>Example Post #1</strong>

        <span class="text-muted small">by barksalot on 0/14/2019</span>

      </a>

      <a href="#" class="list-group-item list-group-item-action">

        <img class="avatar-tiny" src=https://gravatar.com/avatar/b9408a09298632b5151200f3449434ef?s=128> <strong>Example Post #2</strong>

        <span class="text-muted small">by brad on 0/12/2019</span>

      </a>

      <a href="#" class="list-group-item list-group-item-action">

        <img class="avatar-tiny" src=https://gravatar.com/avatar/b9216295c1e3931655bae6574ac0e4c2?s=128> <strong>Example Post #3</strong>

        <span class="text-muted small">by barksalot on 0/14/2019</span>

      </a>

      <a href="#" class="list-group-item list-group-item-action">

        <img class="avatar-tiny" src=https://gravatar.com/avatar/b9408a09298632b5151200f3449434ef?s=128> <strong>Example Post #4</strong>

        <span class="text-muted small">by brad on 0/12/2019</span>

      </a>

    </div>`
    
  } else {
      this.resultsArea.innerHTML = `<p class = "alert alert-danger text-center shadow-sm">Sorry, we could not find any results for that search</p>`
  }
    this.hideLoaderIcon()
    this.showResultsArea()
  }

  showLoaderIcon() {
    this.loaderIcon.classList.add("circle-loader--visible")
  }
  
  hideLoaderIcon() {
    this.loaderIcon.classList.remove("circle-loader--visible")
  }
  
  showResultsArea(){
    this.resultsArea.classList.add("live-search-results--visible")

  }

  hideResultsArea(){
    this.resultsArea.classList.remove("live-search-results--visible")

  }
  
  openOverlay() {
    this.overlay.classList.add("search-overlay--visible")
    setTimeout(()=>this.inputField.focus(), 50)
  }
  closeOverlay() {
    this.overlay.classList.remove("search-overlay--visible")
    this.inputField.value = ""
  }
  injectHTML() {
    document.body.insertAdjacentHTML('beforeend', `<div class="search-overlay">

    <div class="search-overlay-top shadow-sm">

      <div class="container container--narrow">

        <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>

       

        <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">

       

        <span class="close-live-search"><i class="fas fa-times-circle"></i></span>

      </div>

    </div>

 

    <div class="search-overlay-bottom">

      <div class="container container--narrow py-3">

        <div class="circle-loader"></div>

        <div class="live-search-results"></div>

      </div>

    </div>

  </div>`)

  }
}//class END
