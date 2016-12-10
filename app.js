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
var app = angular.module('deckjam', ['ngMaterial'])
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
.controller('homeContainer', ["$scope","$http",(_, $http)=> {
  _.getSetsforTerm = (term)=> $http.get(`http://ayudh.org:3337/quizlet/search?query=${term}`, { cache: true})
  _.getSets = (sets)=> $http.get(`http://ayudh.org:3337/quizlet/sets?query=${sets}`, { cache: true})
  _.decks = JSON.parse(localStorage.decks || '{}')
  _.selected = JSON.parse(localStorage.selected || '{}')
  _.selectedOrder = "time"
  _.reverse = true
  _.md = false
  _.selectedArray = ()=> lo.values(_.selected)
  _.selectTerm = (term, setId, mouseDown=true) => {
    term.selected = (!!mouseDown) ? !!!term.selected : !!term.selected
    if (term.selected) {
      _.selected[term.id] = lo.assign({},term)
      _.selected[term.id].setId = setId
      _.selected[term.id].time = (new Date()).getTime()
    } else {
      delete _.selected[term.id]
    }
    localStorage.selected = JSON.stringify(_.selected)
  }
  _.removeDeck = id=> delete _.decks[id]
  _.selectAll = id=> {
    if (_.decks[id]) {
      // all selected, then unselect all
      if (_.decks[id].terms.find(x=> !!x.selected)){
        _.decks[id].terms.forEach(term => {
          term.selected = false
          delete _.selected[term.id]
        })
      } else {
        _.decks[id].terms.forEach(term => {
          term.selected = true
          _.selected[term.id] = lo.assign({},term)
          _.selected[term.id].setId = id
          _.selected[term.id].time = (new Date()).getTime()
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
  }
  _.removeSelected = id=> {
    var {setId, rank} = _.selected[id]
    if(_.decks[setId]) {
      _.decks[setId].terms[rank].selected = false
    }
    delete _.selected[id]
  }
  _.create = (title)=> {
    _.url = null
    _.creating = true
    $http({
      method: 'POST',
      url: 'http://ayudh.org:3337/create-set',
      data: JSON.stringify({
        title: title,
        lang_terms: 'en',
        lang_definitions: 'en',
        data: lo.map(_.selected, (v,k)=> lo.pick(v, ['term', 'definition', 'image']))
      })
    }).then(res=>{
      _.url = `https://quizlet.com${res.data.url}`
      _.creating = false
    }).catch(()=>{_.creating=false})
  }
  _.import = (importUrl) => {
    var x = importUrl && importUrl.match(/\d+/)
    x && x[0] && _.getSets(x[0]).then(res=>{
      res.data.forEach(set=> {
        set.terms.forEach(term => {
          term.selected = true
          _.selected[term.id] = lo.assign({},term)
          _.selected[term.id].setId = set.id
          _.selected[term.id].time = (new Date()).getTime()
        })
      })
    })
  }
  _.getTerms = (replace)=> {
    _.decks = !!replace ? {} : (_.decks || {})
    _.bloom = !!replace ? new BloomFilter(3e5, 3e-5) : (_.bloom || new BloomFilter(3e5, 3e-5))
    _.search.split(',').forEach(term=> {
      _.getSetsforTerm(term.trim()).then(data=> {
        _.getSets(data.data.sets.map(a=>a.id).join(','))
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
            localStorage.decks = JSON.stringify(_.decks)
          })
        })
      })
    }
}])
