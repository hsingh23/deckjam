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
}).controller('homeContainer', ["$scope", "$http", "$mdToast", "$mdMedia", function (_, $http, $mdToast, $mdMedia) {
  _.api = 'http://ayudh.org:3337';
  _._sm = function () {
    return !$mdMedia('md');
  };
  _.sm = function () {
    return $mdMedia('md');
  };
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
  _.numSelected = function () {
    return lo.size(_.selected);
  };
  _.numDecks = function () {
    return lo.size(_.decks);
  };
  _.selectedArray = function () {
    return lo.values(_.selected);
  };
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
    // checkbox check in small, whole rows checks >sm
    if (!$mdMedia('md')) {
      term.selected = !term.selected;
      selectTerm(term, setId);
    }
  };
  _.selectDragTerm = function (term, setId) {
    var mouseDown = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    // checkbox check in small, whole rows checks >sm
    if ($mdMedia('md')) {
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
    $http({
      method: 'POST',
      url: _.api + '/create-set',
      data: JSON.stringify({
        title: title,
        lang_terms: 'en',
        lang_definitions: 'en',
        data: lo.map(_.selected, function (v, k) {
          return lo.pick(v, ['term', 'definition', 'image']);
        })
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
          _.decks[set.id] = lo.pick(set, ['url', 'title', 'modified_date', 'lang_terms', 'lang_definitions']);
          _.decks[set.id].terms = terms;
          _.decks[set.id].terms_length = terms.length;
        }
      });
      _.fetching = false;
      _.selectedIndex = 0;
      localStorage.decks = JSON.stringify(_.decks);
    }).catch(function () {
      _.fetching = false;
      $mdToast.showSimple("Unable to get terms - try another query");
    });
  }
  _.getTerms = function (replace) {
    _.fetching = true;
    _.decks = !!replace ? {} : _.decks || {};
    _.bloom = !!replace ? new BloomFilter(3e5, 3e-5) : _.bloom || new BloomFilter(3e5, 3e-5);
    _.search.split(',').forEach(function (term) {
      _.getSetsforTerm(term.trim()).then(function (res) {
        getSets(res.data.sets.slice(0, 10));
        getSets(res.data.sets.slice(10, 20));
      }).catch(function () {
        _.fetching = false;
        $mdToast.showSimple("Unable to get terms - try another query");
      });
    });
  };
}]);

//# sourceMappingURL=data:application/json;base64,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SSxJQUFKLENBQVMsSUFBVCxDQUFjLEtBQWQsQ0FBb0IsRUFBcEIsRUFBdUIsRUFBdkIsQ0FBUjtBQUNELE9BSEQsRUFJQyxLQUpELENBSU8sWUFBSTtBQUNULFVBQUUsUUFBRixHQUFhLEtBQWI7QUFDQSxpQkFBUyxVQUFULENBQW9CLHlDQUFwQjtBQUNELE9BUEQ7QUFRRCxLQVREO0FBVUQsR0FkRDtBQWVELENBM0s0QixDQWxDbkIsQ0FBViIsImZpbGUiOiJhcHAucHJvZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIGJhYmVsXCI7XG5pZiAobG9jYXRpb24ucHJvdG9jb2wgIT0gJ2h0dHA6Jykge1xuICBsb2NhdGlvbi5wcm90b2NvbCA9ICdodHRwOic7XG59XG4vLyBpZiAoJ3NlcnZpY2VXb3JrZXInIGluIG5hdmlnYXRvcikge1xuLy8gICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3Rlcignc2VydmljZS13b3JrZXIuanMnKTtcbi8vIH1cbi8vIHJlbW92ZWQgc2VydmljZSB3b3JrZXJzIGFuZCBmZXRjaCBiZWNhdXNlIHF1aXpsZXQgZG9lcyBub3QgZG8gY29ycyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zNDk0MDA3NCBcbi8vIG5vLWNvcnMgbW9kZSB3b24ndCBzZW5kIGF1dGhvcml6YXRpb24gaGVhZGVyIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9SZXF1ZXN0L21vZGVcbnZhciBsbyA9IF87XG4vLyB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2RlY2tqYW0nLCBbJ25nTWF0ZXJpYWwnXSlcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZGVja2phbScsIFsnbmdNYXRlcmlhbCcsICdhbmd1bGFydGljcycsICdhbmd1bGFydGljcy5nb29nbGUuYW5hbHl0aWNzJ10pXG4uY29uZmlnKGZ1bmN0aW9uKCRtZFRoZW1pbmdQcm92aWRlcikge1xuICB2YXIgY3VzdG9tQmx1ZU1hcCA9ICRtZFRoZW1pbmdQcm92aWRlci5leHRlbmRQYWxldHRlKCdsaWdodC1ibHVlJywge1xuICAgICdjb250cmFzdERlZmF1bHRDb2xvcic6ICdsaWdodCcsXG4gICAgJ2NvbnRyYXN0RGFya0NvbG9ycyc6IFsnNTAnXSxcbiAgICAnNTAnOiAnZmZmZmZmJ1xuICB9KVxuICAkbWRUaGVtaW5nUHJvdmlkZXIuZGVmaW5lUGFsZXR0ZSgnY3VzdG9tQmx1ZScsIGN1c3RvbUJsdWVNYXApXG4gICRtZFRoZW1pbmdQcm92aWRlci50aGVtZSgnZGVmYXVsdCcpXG4gICAgLnByaW1hcnlQYWxldHRlKCdjdXN0b21CbHVlJywge1xuICAgICAgJ2RlZmF1bHQnOiAnNTAwJyxcbiAgICAgICdodWUtMSc6ICc1MCdcbiAgICB9KVxuICAgIC5hY2NlbnRQYWxldHRlKCdwaW5rJylcbiAgJG1kVGhlbWluZ1Byb3ZpZGVyLnRoZW1lKCdpbnB1dCcsICdkZWZhdWx0JylcbiAgICAucHJpbWFyeVBhbGV0dGUoJ2dyZXknKVxufSlcbi5kaXJlY3RpdmUoJ2ljb25UZXh0JywgZnVuY3Rpb24oJG1kTWVkaWEpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0UnLFxuICAgIHNjb3BlOiB7XG4gICAgICB0aXA6ICdAJyxcbiAgICAgIGljb246ICdAJyxcbiAgICAgIHN0eWxlOiAnQD8nXG4gICAgfSxcbiAgICB0ZW1wbGF0ZTogYDxtZC10b29sdGlwIHN0eWxlPVwie3tzdHlsZX19XCIgaGlkZS1ndC14cz1cImhpZGUtZ3QteHNcIj5cbiAgICAgIHt7dGlwfX1cbiAgICA8L21kLXRvb2x0aXA+XG4gICAgPG1kLWljb24gaGlkZS1ndC14cz1cImhpZGUtZ3QteHNcIiBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCIgc3R5bGU9XCJ7e3N0eWxlfX1cIj5cbiAgICAgIHt7aWNvbn19XG4gICAgPC9tZC1pY29uPlxuICAgIDxzcGFuIHN0eWxlPVwie3tzdHlsZX19XCIgaGlkZS14cz57e3RpcH19PC9zcGFuPmBcbiAgfVxufSlcbi5jb250cm9sbGVyKCdob21lQ29udGFpbmVyJywgW1wiJHNjb3BlXCIsIFwiJGh0dHBcIiwgXCIkbWRUb2FzdFwiLCBcIiRtZE1lZGlhXCIgLChfLCAkaHR0cCwgJG1kVG9hc3QsICRtZE1lZGlhKT0+IHtcbiAgXy5hcGkgPSAnaHR0cDovL2F5dWRoLm9yZzozMzM3J1xuICBfLl9zbSA9ICgpPT4gISRtZE1lZGlhKCdtZCcpXG4gIF8uc20gPSAoKT0+ICRtZE1lZGlhKCdtZCcpXG4gIC8vIF8uYXBpID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzMzNydcbiAgXy5jcmVhdGVkT25lID0gbG9jYWxTdG9yYWdlLmNyZWF0ZWRPbmUgJiYgcGFyc2VJbnQobG9jYWxTdG9yYWdlLmNyZWF0ZWRPbmUpIHx8IDBcbiAgXy5mZXRjaGluZyA9IGZhbHNlXG4gIF8uZ2V0U2V0c2ZvclRlcm0gPSAodGVybSk9PiAkaHR0cC5nZXQoYCR7Xy5hcGl9L3F1aXpsZXQvc2VhcmNoP3F1ZXJ5PSR7dGVybX1gLCB7IGNhY2hlOiB0cnVlfSlcbiAgXy5nZXRTZXRzID0gKHNldHMpPT4gJGh0dHAuZ2V0KGAke18uYXBpfS9xdWl6bGV0L3NldHM/cXVlcnk9JHtzZXRzfWAsIHsgY2FjaGU6IHRydWV9KVxuICBfLmRlY2tzID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZGVja3MgfHwgJ3t9JylcbiAgXy5zZWxlY3RlZCA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLnNlbGVjdGVkIHx8ICd7fScpXG4gIF8uc2VsZWN0ZWRPcmRlciA9IFwidGltZVwiXG4gIF8ucmV2ZXJzZSA9IHRydWVcbiAgXy5tZCA9IGZhbHNlXG4gIF8ubnVtU2VsZWN0ZWQgPSAoKT0+IGxvLnNpemUoXy5zZWxlY3RlZClcbiAgXy5udW1EZWNrcyA9ICgpPT4gbG8uc2l6ZShfLmRlY2tzKVxuICBfLnNlbGVjdGVkQXJyYXkgPSAoKT0+IGxvLnZhbHVlcyhfLnNlbGVjdGVkKVxuICBmdW5jdGlvbiBzZWxlY3RUZXJtKHRlcm0sIHNldElkKSB7XG4gICAgaWYgKHRlcm0uc2VsZWN0ZWQpIHtcbiAgICAgIF8uc2VsZWN0ZWRbdGVybS5pZF0gPSBsby5hc3NpZ24oe30sdGVybSlcbiAgICAgIF8uc2VsZWN0ZWRbdGVybS5pZF0uc2V0SWQgPSBzZXRJZFxuICAgICAgXy5zZWxlY3RlZFt0ZXJtLmlkXS50aW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKVxuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgXy5zZWxlY3RlZFt0ZXJtLmlkXVxuICAgIH1cbiAgICBsb2NhbFN0b3JhZ2Uuc2VsZWN0ZWQgPSBKU09OLnN0cmluZ2lmeShfLnNlbGVjdGVkKVxuICB9XG4gIF8uc2VsZWN0Q2xpY2tUZXJtID0gKHRlcm0sIHNldElkKSA9PiB7XG4gICAgLy8gY2hlY2tib3ggY2hlY2sgaW4gc21hbGwsIHdob2xlIHJvd3MgY2hlY2tzID5zbVxuICAgIGlmKCEkbWRNZWRpYSgnbWQnKSkge1xuICAgICAgdGVybS5zZWxlY3RlZCA9ICF0ZXJtLnNlbGVjdGVkXG4gICAgICBzZWxlY3RUZXJtKHRlcm0sIHNldElkKVxuICAgIH1cbiAgfVxuICBfLnNlbGVjdERyYWdUZXJtID0gKHRlcm0sIHNldElkLCBtb3VzZURvd249dHJ1ZSkgPT4ge1xuICAgIC8vIGNoZWNrYm94IGNoZWNrIGluIHNtYWxsLCB3aG9sZSByb3dzIGNoZWNrcyA+c21cbiAgICBpZigkbWRNZWRpYSgnbWQnKSl7XG4gICAgICB0ZXJtLnNlbGVjdGVkID0gKG1vdXNlRG93bikgPyAhdGVybS5zZWxlY3RlZCA6IHRlcm0uc2VsZWN0ZWRcbiAgICAgIHNlbGVjdFRlcm0odGVybSwgc2V0SWQpXG4gICAgfVxuICB9XG4gIF8ucmVtb3ZlRGVjayA9IGlkPT4gZGVsZXRlIF8uZGVja3NbaWRdXG4gIF8uc2VsZWN0QWxsID0gaWQ9PiB7XG4gICAgaWYgKF8uZGVja3NbaWRdKSB7XG4gICAgICAvLyBzb21lIHVuc2VsZWN0ZWQsIHRoZW4gc2VsZWN0IGFsbFxuICAgICAgaWYgKF8uZGVja3NbaWRdLnRlcm1zLmZpbmQoeD0+ICF4LnNlbGVjdGVkKSl7XG4gICAgICAgIF8uZGVja3NbaWRdLnRlcm1zLmZvckVhY2godGVybSA9PiB7XG4gICAgICAgICAgdGVybS5zZWxlY3RlZCA9IHRydWVcbiAgICAgICAgICBfLnNlbGVjdGVkW3Rlcm0uaWRdID0gbG8uYXNzaWduKHt9LHRlcm0pXG4gICAgICAgICAgXy5zZWxlY3RlZFt0ZXJtLmlkXS5zZXRJZCA9IGlkXG4gICAgICAgICAgXy5zZWxlY3RlZFt0ZXJtLmlkXS50aW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKVxuICAgICAgICB9KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdW5zZWxlY3QgZXZlcnl0aGluZ1xuICAgICAgICBfLmRlY2tzW2lkXS50ZXJtcy5mb3JFYWNoKHRlcm0gPT4ge1xuICAgICAgICAgIHRlcm0uc2VsZWN0ZWQgPSBmYWxzZVxuICAgICAgICAgIGRlbGV0ZSBfLnNlbGVjdGVkW3Rlcm0uaWRdXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2VsZWN0ZWQgPSBKU09OLnN0cmluZ2lmeShfLnNlbGVjdGVkKVxuICAgIH1cbiAgfVxuICBfLmNsZWFyU2VsZWN0ZWQgPSAoKT0+IHtcbiAgICBfLnNlbGVjdGVkID0ge31cbiAgICBsb2NhbFN0b3JhZ2Uuc2VsZWN0ZWQgPSAne30nXG4gIH1cbiAgXy5zd2FwU2VsZWN0ZWQgPSBpZD0+IHtcbiAgICB2YXIge3Rlcm0sIGRlZmluaXRpb259ID0gXy5zZWxlY3RlZFtpZF1cbiAgICBfLnNlbGVjdGVkW2lkXS5kZWZpbml0aW9uID0gdGVybVxuICAgIF8uc2VsZWN0ZWRbaWRdLnRlcm0gPSBkZWZpbml0aW9uXG4gICAgbG9jYWxTdG9yYWdlLnNlbGVjdGVkID0gSlNPTi5zdHJpbmdpZnkoXy5zZWxlY3RlZClcbiAgfVxuICBfLnJlbW92ZVNlbGVjdGVkID0gaWQ9PiB7XG4gICAgdmFyIHtzZXRJZCwgcmFua30gPSBfLnNlbGVjdGVkW2lkXVxuICAgIGlmKF8uZGVja3Nbc2V0SWRdKSB7XG4gICAgICBfLmRlY2tzW3NldElkXS50ZXJtc1tyYW5rXS5zZWxlY3RlZCA9IGZhbHNlXG4gICAgfVxuICAgIGRlbGV0ZSBfLnNlbGVjdGVkW2lkXVxuICAgIGxvY2FsU3RvcmFnZS5zZWxlY3RlZCA9IEpTT04uc3RyaW5naWZ5KF8uc2VsZWN0ZWQpXG4gIH1cbiAgXy5jcmVhdGUgPSAodGl0bGUpPT4ge1xuICAgIF8udXJsID0gbnVsbFxuICAgIF8uY3JlYXRpbmcgPSB0cnVlXG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICB1cmw6IGAke18uYXBpfS9jcmVhdGUtc2V0YCxcbiAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICBsYW5nX3Rlcm1zOiAnZW4nLFxuICAgICAgICBsYW5nX2RlZmluaXRpb25zOiAnZW4nLFxuICAgICAgICBkYXRhOiBsby5tYXAoXy5zZWxlY3RlZCwgKHYsayk9PiBsby5waWNrKHYsIFsndGVybScsICdkZWZpbml0aW9uJywgJ2ltYWdlJ10pKVxuICAgICAgfSlcbiAgICB9KS50aGVuKHJlcz0+e1xuICAgICAgXy51cmwgPSBgaHR0cHM6Ly9xdWl6bGV0LmNvbSR7cmVzLmRhdGEudXJsfWBcbiAgICAgIF8uY3JlYXRpbmcgPSBmYWxzZVxuICAgICAgaWYgKHJlcy5kYXRhLmVycm9yKSB7XG4gICAgICAgICRtZFRvYXN0LnNob3dTaW1wbGUocmVzLmRhdGEuZXJyb3IpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkbWRUb2FzdC5zaG93U2ltcGxlKFwiWW91ciBkZWNrIGlzIGNyZWF0ZWRcIilcbiAgICAgICAgXy5jcmVhdGVkT25lICs9IDFcbiAgICAgICAgbG9jYWxTdG9yYWdlLmNyZWF0ZWRPbmUgPSBfLmNyZWF0ZWRPbmVcbiAgICAgICAgXy5zZWxlY3RlZF9hY3Rpb25zID0gJ2hvbWUnXG4gICAgICB9XG4gICAgfSkuY2F0Y2goKCk9PntcbiAgICAgIF8uY3JlYXRpbmc9ZmFsc2VcbiAgICAgIF8uc2VsZWN0ZWRfYWN0aW9ucyA9ICdob21lJ1xuICAgICAgJG1kVG9hc3Quc2hvd1NpbXBsZShcIlVuYWJsZSB0byBjcmVhdGUgZGVja1wiKVxuICAgIH0pXG4gIH1cbiAgXy5pbXBvcnQgPSAoaW1wb3J0VXJsKSA9PiB7XG4gICAgXy5mZXRjaGluZyA9IHRydWVcbiAgICB2YXIgeCA9IGltcG9ydFVybCAmJiBpbXBvcnRVcmwubWF0Y2goL1xcZCsvKVxuICAgIHggJiYgeFswXSAmJiBfLmdldFNldHMoeFswXSkudGhlbihyZXM9PntcbiAgICAgIF8uZmV0Y2hpbmcgPSBmYWxzZVxuICAgICAgXy5zZWxlY3RlZF9hY3Rpb25zID0gJ2hvbWUnXG4gICAgICByZXMuZGF0YS5mb3JFYWNoKHNldD0+IHtcbiAgICAgICAgc2V0LnRlcm1zLmZvckVhY2godGVybSA9PiB7XG4gICAgICAgICAgdGVybS5zZWxlY3RlZCA9IHRydWVcbiAgICAgICAgICBfLnNlbGVjdGVkW3Rlcm0uaWRdID0gbG8uYXNzaWduKHt9LHRlcm0pXG4gICAgICAgICAgXy5zZWxlY3RlZFt0ZXJtLmlkXS5zZXRJZCA9IHNldC5pZFxuICAgICAgICAgIF8uc2VsZWN0ZWRbdGVybS5pZF0udGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKClcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSkuY2F0Y2goKCk9PntcbiAgICAgIF8uZmV0Y2hpbmcgPSBmYWxzZVxuICAgICAgXy5zZWxlY3RlZF9hY3Rpb25zID0gJ2hvbWUnXG4gICAgfSlcbiAgICBsb2NhbFN0b3JhZ2Uuc2VsZWN0ZWQgPSBKU09OLnN0cmluZ2lmeShfLnNlbGVjdGVkKVxuICB9XG4gIGZ1bmN0aW9uIGdldFNldHMoc2V0SWRzKSB7XG4gICAgXy5nZXRTZXRzKHNldElkcy5tYXAoYT0+YS5pZCkuam9pbignLCcpKVxuICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICByZXMuZGF0YS5mb3JFYWNoKHNldD0+IHtcbiAgICAgICAgdmFyIHRlcm1zID0gbG8uZmlsdGVyKHNldC50ZXJtcywgY2FyZD0+IHtcbiAgICAgICAgICBpZiAoXy5ibG9vbS50ZXN0KGNhcmQudGVybSArIGNhcmQuZGVmaW5pdGlvbikpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfLmJsb29tLmFkZChjYXJkLnRlcm0gKyBjYXJkLmRlZmluaXRpb24pXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgdGVybXMuZm9yRWFjaCgodCxpKSA9PiB0LnJhbmsgPSBpKVxuICAgICAgICBpZiAodGVybXMubGVuZ3RoID4gMil7XG4gICAgICAgICAgXy5kZWNrc1tzZXQuaWRdID0gbG8ucGljayhzZXQsIFsndXJsJywgJ3RpdGxlJywgJ21vZGlmaWVkX2RhdGUnLCAnbGFuZ190ZXJtcycsICdsYW5nX2RlZmluaXRpb25zJ10pXG4gICAgICAgICAgXy5kZWNrc1tzZXQuaWRdLnRlcm1zID0gdGVybXNcbiAgICAgICAgICBfLmRlY2tzW3NldC5pZF0udGVybXNfbGVuZ3RoID0gdGVybXMubGVuZ3RoXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICBfLmZldGNoaW5nID0gZmFsc2VcbiAgICAgIF8uc2VsZWN0ZWRJbmRleD0wXG4gICAgICBsb2NhbFN0b3JhZ2UuZGVja3MgPSBKU09OLnN0cmluZ2lmeShfLmRlY2tzKVxuICAgIH0pLmNhdGNoKCgpPT57XG4gICAgICBfLmZldGNoaW5nID0gZmFsc2VcbiAgICAgICRtZFRvYXN0LnNob3dTaW1wbGUoXCJVbmFibGUgdG8gZ2V0IHRlcm1zIC0gdHJ5IGFub3RoZXIgcXVlcnlcIilcbiAgICB9KVxuICB9XG4gIF8uZ2V0VGVybXMgPSAocmVwbGFjZSk9PiB7XG4gICAgXy5mZXRjaGluZyA9IHRydWVcbiAgICBfLmRlY2tzID0gISFyZXBsYWNlID8ge30gOiAoXy5kZWNrcyB8fCB7fSlcbiAgICBfLmJsb29tID0gISFyZXBsYWNlID8gbmV3IEJsb29tRmlsdGVyKDNlNSwgM2UtNSkgOiAoXy5ibG9vbSB8fCBuZXcgQmxvb21GaWx0ZXIoM2U1LCAzZS01KSlcbiAgICBfLnNlYXJjaC5zcGxpdCgnLCcpLmZvckVhY2godGVybT0+IHtcbiAgICAgIF8uZ2V0U2V0c2ZvclRlcm0odGVybS50cmltKCkpLnRoZW4ocmVzPT4ge1xuICAgICAgICBnZXRTZXRzKHJlcy5kYXRhLnNldHMuc2xpY2UoMCwxMCkpXG4gICAgICAgIGdldFNldHMocmVzLmRhdGEuc2V0cy5zbGljZSgxMCwyMCkpXG4gICAgICB9KVxuICAgICAgLmNhdGNoKCgpPT57XG4gICAgICAgIF8uZmV0Y2hpbmcgPSBmYWxzZVxuICAgICAgICAkbWRUb2FzdC5zaG93U2ltcGxlKFwiVW5hYmxlIHRvIGdldCB0ZXJtcyAtIHRyeSBhbm90aGVyIHF1ZXJ5XCIpXG4gICAgICB9KVxuICAgIH0pXG4gIH1cbn1dKVxuIl19