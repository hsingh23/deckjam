"use babel";
if (location.protocol != 'http:') {
  location.protocol = 'http:';
}
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('service-worker.js');
// }
// removed service workers and fetch because quizlet does not do cors http://stackoverflow.com/a/34940074 
// no-cors mode won't send authorization header https://developer.mozilla.org/en-US/docs/Web/API/Request/mode
var lo = _;
// var app = angular.module('deckjam', ['ngMaterial'])
var app = angular.module('deckjam', ['ngMaterial', 'angulartics', 'angulartics.google.analytics'])
.config(function($mdThemingProvider) {
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
.directive('iconText', function($mdMedia) {
  return {
    restrict: 'E',
    scope: {
      tip: '@',
      icon: '@',
      style: '@?'
    },
    template: `<md-tooltip style="{{style}}" hide-gt-xs="hide-gt-xs">
      {{tip}}
    </md-tooltip>
    <md-icon hide-gt-xs="hide-gt-xs" class="material-icons" style="{{style}}">
      {{icon}}
    </md-icon>
    <span style="{{style}}" hide-xs>{{tip}}</span>`
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
.controller('homeContainer', ["$scope", "$http", "$mdToast", "$mdMedia" ,(_, $http, $mdToast, $mdMedia)=> {
  _.api = 'http://ayudh.org:3337'
  _._sm = ()=> !$mdMedia('md')
  _.sm = ()=> $mdMedia('md')
  _.losefocus = false
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
  _.numSelected = ()=> lo.size(_.selected)
  _.numDecks = ()=> lo.size(_.decks)
  _.selectedArray = ()=> lo.values(_.selected)
  _.startIndexes = {}
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
    // checkbox check in small, whole rows checks >sm
    if(!$mdMedia('md')) {
      term.selected = !term.selected
      selectTerm(term, setId)
    }
  }
  _.selectDragTerm = (term, setId, mouseDown=true) => {
    // checkbox check in small, whole rows checks >sm
    if($mdMedia('md')){
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
    $http({
      method: 'POST',
      url: `${_.api}/create-set`,
      data: JSON.stringify({
        title: title,
        lang_terms: 'en',
        lang_definitions: 'en',
        data: lo.map(_.selected, (v,k)=> lo.pick(v, ['term', 'definition', 'image']))
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
          _.decks[set.id] = lo.pick(set, ['url', 'title', 'modified_date', 'lang_terms', 'lang_definitions'])
          _.decks[set.id].terms = terms
          _.decks[set.id].terms_length = terms.length
        }
      })
      _.fetching = false
      _.selectedIndex=0
      localStorage.decks = JSON.stringify(_.decks)
    }).catch(()=>{
      _.fetching = false
      $mdToast.showSimple("Unable to get terms - try another query")
    })
  }
  _.getTerms = (replace=true, replaceBloom=true)=> {
    _.losefocus = true
    var startIndex = 0;
    _.fetching = true
    _.decks = !!replace ? {} : (_.decks || {})
    _.bloom = !!replaceBloom ? new BloomFilter(3e5, 3e-5) : (_.bloom || new BloomFilter(3e5, 3e-5))
    var term = _.search.trim()
    if(term.length > 2){
      _.getSetsforTerm(term.trim()).then(res=> {
        _.startIndexes[term] = _.startIndexes[term] || 0
        startIndex = _.startIndexes[term]
        getSets(res.data.sets.slice(startIndex,startIndex+10))
        _.startIndexes[term] = _.startIndexes[term] + 10
      })
      .catch(()=>{
        _.fetching = false
        $mdToast.showSimple("Unable to get terms - try another query")
      })
    }
  }
}])
