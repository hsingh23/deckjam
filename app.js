"use babel"
if (location.protocol != 'http:') {
  location.protocol = 'http:'
}
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('service-worker.js')
// }
// removed service workers and fetch because quizlet does not do cors http://stackoverflow.com/a/34940074 
// no-cors mode won't send authorization header https://developer.mozilla.org/en-US/docs/Web/API/Request/mode
var lo = _
// var app = angular.module('deckjam', ['ngMaterial'])
var app = angular.module('deckjam', ['ngMaterial', 'angulartics', 'angulartics.google.analytics'])
.config(function($mdThemingProvider, $locationProvider, $sceProvider) {
  $locationProvider.html5Mode(true)
  $sceProvider.enabled(false)
  var customBlueMap = $mdThemingProvider.extendPalette('light-blue', {
    'contrastDefaultColor': 'light',
    'contrastDarkColors': ['50'],
    '50': 'ffffff'
  })
  $mdThemingProvider.definePalette('customBlue', customBlueMap)
  $mdThemingProvider.theme('default')
    .primaryPalette('customBlue', {
      'default': '500',
      'hue-1': '50'
    })
    .accentPalette('pink')
  $mdThemingProvider.theme('input', 'default')
    .primaryPalette('grey')
})
.directive('postRepeatDirective', ['$timeout', function ($timeout) {
  return function (scope) {
    if (scope.$first)
      window.a = new Date() // window.a can be updated anywhere if to reset counter at some action if ng-repeat is not getting started from $first
    if (scope.$last)
      $timeout(function () {
        console.log("## DOM rendering list took: " + (new Date() - window.a) + " ms")
      })
  }
}])
.directive('iconText', function($mdMedia) {
  return {
    restrict: 'E',
    scope: {
      tip: '@?',
      text: '@',
      icon: '@',
      style: '@?'
    },
    template: `<md-tooltip style="{{style}}" hide-gt-xs>
      {{tip || text}}
    </md-tooltip>
    <md-icon hide-gt-xs class="material-icons" style="{{style}}">
      {{icon}}
    </md-icon>
    <span style="{{style}}" hide-xs>{{text}}</span>`
  }
})
.filter("highlight", function() {
  return function(text, search, caseSensitive) {
    if (text && (search || angular.isNumber(search))) {
      text = text.toString()
      search = search.toString()
      // if (caseSensitive) {
      //   return text.split(search).join("<span class=\"ui-match\">" + search + "</span>")
      // } else {
        return text.replace(new RegExp(search, "gi"), "<span class=\"ui-match\">$&</span>")
      // }
    } else {
      return text
    }
  }
})
.directive('loseFocus', function() {
  return {
    link: function(scope, element, attrs) {
      scope.$watch(attrs.loseFocus, function(value) {
        if(value === true) {
          element[0].blur()
        }
      })
    }
  }
})
.controller('homeContainer', ["$scope", "$http", "$mdToast", "$mdMedia", "$analytics", '$anchorScroll', '$location', '$window', (_, $http, $mdToast, $mdMedia, $analytics, $anchorScroll, $location, $window)=> {
  _.filter = ''
  _.matchCard = card=> {
    var search = new RegExp(_.filter, 'i')
    return card.term.match(search) || card.definition.match(search) 
  }
  _.api = 'http://ayudh.org:3337'
  _.goTo = id=> $anchorScroll(id)
  _.losefocus = false
  _.draggable = false
  // _.api = 'http://localhost:3337'
  _.createdOne = localStorage.createdOne && parseInt(localStorage.createdOne) || 0
  _.fetching = false
  _.getSetsforTerm = (term)=> $http.get(`${_.api}/quizlet/search?query=${term}`, { cache: true})
  _.getSets = (sets)=> $http.get(`${_.api}/quizlet/sets?query=${sets}`, { cache: true})
  _.decks = JSON.parse(localStorage.decks || '{}')
  _.selected = JSON.parse(localStorage.selected || '{}')
  _.selectedOrder = "time"
  _.reverse = true
  _.md = false
  _.searched = "your last search term"
  _.numSelected = ()=> lo.size(_.selected)
  _.numDecks = ()=> lo.size(_.decks)
  _.selectedArray = ()=> lo.values(_.selected)
  _.startIndexes = {}
  if(_.numSelected() == 0 && _.numDecks() == 0 ){
    $mdToast.showSimple(`Search: Try searching for flashcards above.`)
  }
  if(_.numSelected() > 0){
    $mdToast.showSimple(`You have ${_.numSelected()} cards selected. Remember to clear them if you are making a new set.`)
  }
  function selectTerm(term, setId) {
    if (term.selected) {
      _.selected[term.id] = lo.assign({},term)
      _.selected[term.id].setId = setId
      _.selected[term.id].time = (new Date()).getTime()
    } else {
      delete _.selected[term.id]
    }
    localStorage.selected = JSON.stringify(_.selected)
  }
  _.selectClickTerm = (term, setId) => {
    // checkbox check for tablet and below
    // if(!$mdMedia('gt-md')) {
      term.selected = !term.selected
      selectTerm(term, setId)
    // }
  }
  _.selectDragTerm = (term, setId, mouseDown=true) => {
    // drag anywhere for above that
    if($mdMedia('gt-md')){
      term.selected = (mouseDown) ? !term.selected : term.selected
      selectTerm(term, setId)
    }
  }
  _.removeDeck = id=> delete _.decks[id]
  _.selectAll = id=> {
    if (_.decks[id]) {
      // some unselected, then select all
      if (_.decks[id].terms.find(x=> !x.selected)){
        _.decks[id].terms.forEach(term => {
          term.selected = true
          _.selected[term.id] = lo.assign({},term)
          _.selected[term.id].setId = id
          _.selected[term.id].time = (new Date()).getTime()
        })
      } else {
        // unselect everything
        _.decks[id].terms.forEach(term => {
          term.selected = false
          delete _.selected[term.id]
        })
      }
      localStorage.selected = JSON.stringify(_.selected)
    }
  }
  _.clearSelected = ()=> {
    _.selected = {}
    localStorage.selected = '{}'
  }
  _.swapSelected = id=> {
    var {term, definition} = _.selected[id]
    _.selected[id].definition = term
    _.selected[id].term = definition
    localStorage.selected = JSON.stringify(_.selected)
  }
  _.swapDeck = id=> {
    var {lang_terms, lang_definitions} = _.decks[id]
    _.decks[id].lang_terms = lang_definitions
    _.decks[id].lang_definitions = lang_terms
    _.decks[id].terms.forEach(o=>{
      var {term, definition} = o
      o.definition = term
      o.term = definition
    })
  }

  _.removeSelected = id=> {
    var {setId, rank} = _.selected[id]
    if(_.decks[setId]) {
      _.decks[setId].terms[rank].selected = false
    }
    delete _.selected[id]
    localStorage.selected = JSON.stringify(_.selected)
  }
  _.create = (title)=> {
    _.url = null
    _.creating = true
    var data = lo.map(_.selected, (v,k)=> lo.pick(v, ['term', 'definition', 'image']))
    $http({
      method: 'POST',
      url: `${_.api}/create-set`,
      data: JSON.stringify({
        title: title,
        lang_terms: 'en',
        lang_definitions: 'en',
        data
      })
    }).then(res=>{
      _.url = `https://quizlet.com${res.data.url}`
      _.creating = false
      if (res.data.error) {
        $mdToast.showSimple(res.data.error)
      } else {
        $mdToast.showSimple("Your deck is created")
        _.createdOne += 1
        localStorage.createdOne = _.createdOne
        _.selected_actions = 'home'
      }
    }).catch(()=>{
      _.creating=false
      _.selected_actions = 'home'
      $mdToast.showSimple("Unable to create deck")
      $analytics.eventTrack("Create Failed", {category: 'Create', label: lo.map(_.selected, (v,k)=> lo.pick(v, ['image']))})
    })
  }
  _.import = (importUrl) => {
    _.fetching = true
    var x = importUrl && importUrl.match(/\d+/)
    x && x[0] && _.getSets(x[0]).then(res=>{
      _.fetching = false
      _.selected_actions = 'home'
      res.data.forEach(set=> {
        set.terms.forEach(term => {
          term.selected = true
          _.selected[term.id] = lo.assign({},term)
          _.selected[term.id].setId = set.id
          _.selected[term.id].time = (new Date()).getTime()
        })
      })
    }).catch(()=>{
      _.fetching = false
      _.selected_actions = 'home'
    })
    localStorage.selected = JSON.stringify(_.selected)
  }
  function getSets(setIds) {
    _.getSets(setIds.map(a=>a.id).join(','))
    .then(res => {
      res.data.forEach(set=> {
        var terms = lo.filter(set.terms, card=> {
          if (_.bloom.test(card.term + card.definition)) {
            return false
          } else {
            _.bloom.add(card.term + card.definition)
            return true
          }
        })
        terms.forEach((t,i) => t.rank = i)
        if (terms.length > 2){
          _.decks[set.id] = lo.pick(set, ['url', 'title', 'creator', 'display_timestamp', 'lang_terms', 'lang_definitions'])
          _.decks[set.id].terms = terms
          _.decks[set.id].terms_length = terms.length
        }
      })
      _.fetching = false
      _.selectedIndex=0
      localStorage.decks = JSON.stringify(_.decks)
      $window.decks = _.decks
      $mdToast.showSimple(_.numDecks() + " Quizlet decks loaded. Click the checkbox to choose a card.")
    }).catch(()=>{
      _.fetching = false
      $mdToast.showSimple("Unable to get terms - try another query")
    })
  }
  _.performSearch = ()=> _.getTerms({restartIndex:true, replaceTerms: true, replaceBloom: true})
  _.loadNext = ()=> _.getTerms({restartIndex:false, replaceTerms: true, replaceBloom: false})
  _.loadPrevious = ()=> {
    _.startIndexes[_.search]  = _.startIndexes[_.search] - 20
    _.getTerms({restartIndex:false, replaceTerms: true, replaceBloom: true})
  }
  _.getTerms = ({restartIndex=true, replaceTerms=true, replaceBloom=true})=> {
    _.losefocus = true
    _.fetching = true
    _.decks = replaceTerms ? {} : (_.decks || {})
    _.bloom = replaceBloom ? new BloomFilter(3e5, 3e-5) : (_.bloom || new BloomFilter(3e5, 3e-5))
    var term = _.search.trim()
    $analytics.eventTrack((restartIndex ? "Load more": "Search"), {category: 'Fetch', label: term})
    if(term.length > 2){
      $location.search('q', term)
      $mdToast.showSimple(`Searching quizlet for ${term} cards: ~8 seconds`)
      _.searched = term
      _.getSetsforTerm(term).then(res=> {
        var startIndex =_.startIndexes[term] = restartIndex ? 0 : (_.startIndexes[term] || 0)
        getSets(res.data.sets.slice(startIndex,startIndex+10))
        _.startIndexes[term] += 10
      })
      .catch(()=>{
        _.fetching = false
        $mdToast.showSimple("Unable to get terms - try another query")
      })
    }
  }

  // query params
  _.search = $location.search()['q']
  _.search && _.performSearch()
}])
