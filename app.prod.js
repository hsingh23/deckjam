'use strict';
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
var app = angular.module('deckjam', ['ngMaterial', 'angulartics', 'angulartics.google.analytics']).config(function ($mdThemingProvider) {
  var customBlueMap = $mdThemingProvider.extendPalette('light-blue', {
    'contrastDefaultColor': 'light',
    'contrastDarkColors': ['50'],
    '50': 'ffffff'
  });
  $mdThemingProvider.definePalette('customBlue', customBlueMap);
  $mdThemingProvider.theme('default').primaryPalette('customBlue', {
    'default': '500',
    'hue-1': '50'
  }).accentPalette('pink');
  $mdThemingProvider.theme('input', 'default').primaryPalette('grey');
}).directive('iconText', function ($mdMedia) {
  return {
    restrict: 'E',
    scope: {
      tip: '@',
      icon: '@',
      style: '@?'
    },
    template: '<md-tooltip style="{{style}}" hide-gt-xs="hide-gt-xs">\n      {{tip}}\n    </md-tooltip>\n    <md-icon hide-gt-xs="hide-gt-xs" class="material-icons" style="{{style}}">\n      {{icon}}\n    </md-icon>\n    <span style="{{style}}" hide-xs>{{tip}}</span>'
  };
}).directive('loseFocus', function () {
  return {
    link: function link(scope, element, attrs) {
      scope.$watch(attrs.loseFocus, function (value) {
        if (value === true) {
          element[0].blur();
        }
      });
    }
  };
}).controller('homeContainer', ["$scope", "$http", "$mdToast", "$mdMedia", "$analytics", '$anchorScroll', function (_, $http, $mdToast, $mdMedia, $analytics, $anchorScroll) {
  _.api = 'http://ayudh.org:3337';
  _.goTo = function (id) {
    return $anchorScroll(id);
  };
  _.losefocus = false;
  _.draggable = false;
  // _.api = 'http://localhost:3337'
  _.createdOne = localStorage.createdOne && parseInt(localStorage.createdOne) || 0;
  _.fetching = false;
  _.getSetsforTerm = function (term) {
    return $http.get(_.api + '/quizlet/search?query=' + term, { cache: true });
  };
  _.getSets = function (sets) {
    return $http.get(_.api + '/quizlet/sets?query=' + sets, { cache: true });
  };
  _.decks = JSON.parse(localStorage.decks || '{}');
  _.selected = JSON.parse(localStorage.selected || '{}');
  _.selectedOrder = "time";
  _.reverse = true;
  _.md = false;
  _.searched = "your last search term";
  _.numSelected = function () {
    return lo.size(_.selected);
  };
  _.numDecks = function () {
    return lo.size(_.decks);
  };
  _.selectedArray = function () {
    return lo.values(_.selected);
  };
  _.startIndexes = {};
  if (_.numSelected() == 0 && _.numDecks() == 0) {
    $mdToast.showSimple('Search: Try searching for flashcards above.');
  }
  if (_.numSelected() > 0) {
    $mdToast.showSimple('You have ' + _.numSelected() + ' cards selected. Remember to clear them if you are making a new set.');
  }
  function selectTerm(term, setId) {
    if (term.selected) {
      _.selected[term.id] = lo.assign({}, term);
      _.selected[term.id].setId = setId;
      _.selected[term.id].time = new Date().getTime();
    } else {
      delete _.selected[term.id];
    }
    localStorage.selected = JSON.stringify(_.selected);
  }
  _.selectClickTerm = function (term, setId) {
    // checkbox check for tablet and below
    // if(!$mdMedia('gt-md')) {
    term.selected = !term.selected;
    selectTerm(term, setId);
    // }
  };
  _.selectDragTerm = function (term, setId) {
    var mouseDown = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    // drag anywhere for above that
    if ($mdMedia('gt-md')) {
      term.selected = mouseDown ? !term.selected : term.selected;
      selectTerm(term, setId);
    }
  };
  _.removeDeck = function (id) {
    return delete _.decks[id];
  };
  _.selectAll = function (id) {
    if (_.decks[id]) {
      // some unselected, then select all
      if (_.decks[id].terms.find(function (x) {
        return !x.selected;
      })) {
        _.decks[id].terms.forEach(function (term) {
          term.selected = true;
          _.selected[term.id] = lo.assign({}, term);
          _.selected[term.id].setId = id;
          _.selected[term.id].time = new Date().getTime();
        });
      } else {
        // unselect everything
        _.decks[id].terms.forEach(function (term) {
          term.selected = false;
          delete _.selected[term.id];
        });
      }
      localStorage.selected = JSON.stringify(_.selected);
    }
  };
  _.clearSelected = function () {
    _.selected = {};
    localStorage.selected = '{}';
  };
  _.swapSelected = function (id) {
    var _$selected$id = _.selected[id],
        term = _$selected$id.term,
        definition = _$selected$id.definition;

    _.selected[id].definition = term;
    _.selected[id].term = definition;
    localStorage.selected = JSON.stringify(_.selected);
  };
  _.swapDeck = function (id) {
    var _$decks$id = _.decks[id],
        lang_terms = _$decks$id.lang_terms,
        lang_definitions = _$decks$id.lang_definitions;

    _.decks[id].lang_terms = lang_definitions;
    _.decks[id].lang_definitions = lang_terms;
    _.decks[id].terms.forEach(function (o) {
      var term = o.term,
          definition = o.definition;

      o.definition = term;
      o.term = definition;
    });
  };

  _.removeSelected = function (id) {
    var _$selected$id2 = _.selected[id],
        setId = _$selected$id2.setId,
        rank = _$selected$id2.rank;

    if (_.decks[setId]) {
      _.decks[setId].terms[rank].selected = false;
    }
    delete _.selected[id];
    localStorage.selected = JSON.stringify(_.selected);
  };
  _.create = function (title) {
    _.url = null;
    _.creating = true;
    var data = lo.map(_.selected, function (v, k) {
      return lo.pick(v, ['term', 'definition', 'image']);
    });
    $http({
      method: 'POST',
      url: _.api + '/create-set',
      data: JSON.stringify({
        title: title,
        lang_terms: 'en',
        lang_definitions: 'en',
        data: data
      })
    }).then(function (res) {
      _.url = 'https://quizlet.com' + res.data.url;
      _.creating = false;
      if (res.data.error) {
        $mdToast.showSimple(res.data.error);
      } else {
        $mdToast.showSimple("Your deck is created");
        _.createdOne += 1;
        localStorage.createdOne = _.createdOne;
        _.selected_actions = 'home';
      }
    }).catch(function () {
      _.creating = false;
      _.selected_actions = 'home';
      $mdToast.showSimple("Unable to create deck");
      $analytics.eventTrack("Create Failed", { category: 'Create', label: lo.map(_.selected, function (v, k) {
          return lo.pick(v, ['image']);
        }) });
    });
  };
  _.import = function (importUrl) {
    _.fetching = true;
    var x = importUrl && importUrl.match(/\d+/);
    x && x[0] && _.getSets(x[0]).then(function (res) {
      _.fetching = false;
      _.selected_actions = 'home';
      res.data.forEach(function (set) {
        set.terms.forEach(function (term) {
          term.selected = true;
          _.selected[term.id] = lo.assign({}, term);
          _.selected[term.id].setId = set.id;
          _.selected[term.id].time = new Date().getTime();
        });
      });
    }).catch(function () {
      _.fetching = false;
      _.selected_actions = 'home';
    });
    localStorage.selected = JSON.stringify(_.selected);
  };
  function getSets(setIds) {
    _.getSets(setIds.map(function (a) {
      return a.id;
    }).join(',')).then(function (res) {
      res.data.forEach(function (set) {
        var terms = lo.filter(set.terms, function (card) {
          if (_.bloom.test(card.term + card.definition)) {
            return false;
          } else {
            _.bloom.add(card.term + card.definition);
            return true;
          }
        });
        terms.forEach(function (t, i) {
          return t.rank = i;
        });
        if (terms.length > 2) {
          _.decks[set.id] = lo.pick(set, ['url', 'title', 'creator', 'display_timestamp', 'lang_terms', 'lang_definitions']);
          _.decks[set.id].terms = terms;
          _.decks[set.id].terms_length = terms.length;
        }
      });
      _.fetching = false;
      _.selectedIndex = 0;
      localStorage.decks = JSON.stringify(_.decks);
      $mdToast.showSimple(_.numDecks() + " Quizlet decks loaded. Click the checkbox to choose a card.");
    }).catch(function () {
      _.fetching = false;
      $mdToast.showSimple("Unable to get terms - try another query");
    });
  }
  _.performSearch = function () {
    return _.getTerms({ restartIndex: true, replaceTerms: true, replaceBloom: true });
  };
  _.loadNext = function () {
    return _.getTerms({ restartIndex: false, replaceTerms: true, replaceBloom: false });
  };
  _.loadPrevious = function () {
    _.startIndexes[_.search] = _.startIndexes[_.search] - 20;
    _.getTerms({ restartIndex: false, replaceTerms: true, replaceBloom: true });
  };
  _.getTerms = function (_ref) {
    var _ref$restartIndex = _ref.restartIndex,
        restartIndex = _ref$restartIndex === undefined ? true : _ref$restartIndex,
        _ref$replaceTerms = _ref.replaceTerms,
        replaceTerms = _ref$replaceTerms === undefined ? true : _ref$replaceTerms,
        _ref$replaceBloom = _ref.replaceBloom,
        replaceBloom = _ref$replaceBloom === undefined ? true : _ref$replaceBloom;

    _.losefocus = true;
    _.fetching = true;
    _.decks = replaceTerms ? {} : _.decks || {};
    _.bloom = replaceBloom ? new BloomFilter(3e5, 3e-5) : _.bloom || new BloomFilter(3e5, 3e-5);
    var term = _.search.trim();
    $analytics.eventTrack(restartIndex ? "Load more" : "Search", { category: 'Fetch', label: term });
    if (term.length > 2) {
      _.searched = term;
      _.getSetsforTerm(term).then(function (res) {
        var startIndex = _.startIndexes[term] = restartIndex ? 0 : _.startIndexes[term] || 0;
        getSets(res.data.sets.slice(startIndex, startIndex + 10));
        _.startIndexes[term] += 10;
      }).catch(function () {
        _.fetching = false;
        $mdToast.showSimple("Unable to get terms - try another query");
      });
    }
  };
}]);

//# sourceMappingURL=app.prod.js.map