"use babel";
// removed service workers and fetch because quizlet does not do cors http://stackoverflow.com/a/34940074 
// no-cors mode won't send authorization header https://developer.mozilla.org/en-US/docs/Web/API/Request/mode
var lo = _;
//  'ngAnimate', 'ngAria', 'ngMessages'
var app = angular.module('deckjam', ['ngMaterial', 'ngMdIcons'])
// .config(function($mdThemingProvider){
//   $mdThemingProvider.theme('default')
//     .primaryPalette("brown")
//     .accentPalette('red')
//     .warnPalette('yellow');
// })
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
  _.clearSelected = ()=> {
    _.selected = {}
    localStorage.selected = '{}'
  }
  _.removeSelected = id=> {
    var {setId, rank} = _.selected[id]
    if(_.decks[setId]) {
      _.decks[setId].terms[rank].selected = false
    }
    delete _.selected[id]
  }
  _.create = ()=> {
    _.url = null
    _.creating = true
    $http({
      method: 'POST',
      url: 'http://ayudh.org:3337/create-set',
      data: JSON.stringify({
        title: _.title || 'hello',
        lang_terms: 'en',
        lang_definitions: 'en',
        data: lo.map(_.selected, (v,k)=> lo.pick(v, ['term', 'definition', 'image']))
      })
    }).then(res=>{
      console.log(res.data)
      _.url = `https://quizlet.com${res.data.url}`
      _.creating = false
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
                lo.pick(set, ['url', 'title', 'modified_date', 'lang_terms', 'lang_definitions'])
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

NodeList.prototype.forEach = NodeList.prototype.forEach || Array.prototype.forEach;

var observer = new MutationObserver(_.debounce(()=> {
  console.log("called");
  // Stickyfill.stickies.forEach(function (el) {
  //   Stickyfill.remove(el);
  // })
  document.querySelectorAll(".sticky").forEach(function (el) {
    console.log(el);
    Stickyfill.add(el);
  })
  Stickyfill.rebuild()
}, 500));
observer.observe(document.querySelector("body"), { childList: true})
Stickyfill.init()