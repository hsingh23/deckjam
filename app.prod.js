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
var app = angular.module('deckjam', ['ngMaterial']).config(function ($mdThemingProvider) {
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
}).controller('homeContainer', ["$scope", "$http", function (_, $http) {
  _.getSetsforTerm = function (term) {
    return $http.get('http://ayudh.org:3337/quizlet/search?query=' + term, { cache: true });
  };
  _.getSets = function (sets) {
    return $http.get('http://ayudh.org:3337/quizlet/sets?query=' + sets, { cache: true });
  };
  _.decks = JSON.parse(localStorage.decks || '{}');
  _.selected = JSON.parse(localStorage.selected || '{}');
  _.selectedOrder = "time";
  _.reverse = true;
  _.md = false;
  _.selectedArray = function () {
    return lo.values(_.selected);
  };
  _.selectTerm = function (term, setId) {
    var mouseDown = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    term.selected = !!mouseDown ? !!!term.selected : !!term.selected;
    if (term.selected) {
      _.selected[term.id] = lo.assign({}, term);
      _.selected[term.id].setId = setId;
      _.selected[term.id].time = new Date().getTime();
    } else {
      delete _.selected[term.id];
    }
    localStorage.selected = JSON.stringify(_.selected);
  };
  _.removeDeck = function (id) {
    return delete _.decks[id];
  };
  _.selectAll = function (id) {
    if (_.decks[id]) {
      // all selected, then unselect all
      if (_.decks[id].terms.find(function (x) {
        return !!x.selected;
      })) {
        _.decks[id].terms.forEach(function (term) {
          term.selected = false;
          delete _.selected[term.id];
        });
      } else {
        _.decks[id].terms.forEach(function (term) {
          term.selected = true;
          _.selected[term.id] = lo.assign({}, term);
          _.selected[term.id].setId = id;
          _.selected[term.id].time = new Date().getTime();
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
  };
  _.removeSelected = function (id) {
    var _$selected$id2 = _.selected[id],
        setId = _$selected$id2.setId,
        rank = _$selected$id2.rank;

    if (_.decks[setId]) {
      _.decks[setId].terms[rank].selected = false;
    }
    delete _.selected[id];
  };
  _.create = function (title) {
    _.url = null;
    _.creating = true;
    $http({
      method: 'POST',
      url: 'http://ayudh.org:3337/create-set',
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
    }).catch(function () {
      _.creating = false;
    });
  };
  _.import = function (importUrl) {
    var x = importUrl && importUrl.match(/\d+/);
    x && x[0] && _.getSets(x[0]).then(function (res) {
      res.data.forEach(function (set) {
        set.terms.forEach(function (term) {
          term.selected = true;
          _.selected[term.id] = lo.assign({}, term);
          _.selected[term.id].setId = set.id;
          _.selected[term.id].time = new Date().getTime();
        });
      });
    });
  };
  _.getTerms = function (replace) {
    _.decks = !!replace ? {} : _.decks || {};
    _.bloom = !!replace ? new BloomFilter(3e5, 3e-5) : _.bloom || new BloomFilter(3e5, 3e-5);
    _.search.split(',').forEach(function (term) {
      _.getSetsforTerm(term.trim()).then(function (data) {
        _.getSets(data.data.sets.map(function (a) {
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
          localStorage.decks = JSON.stringify(_.decks);
        });
      });
    });
  };
}]);

//# sourceMappingURL=data:application/json;base64,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RSxLQUFqQixDQUFyQjtBQUNELFNBbkJIO0FBb0JDLE9BckJIO0FBc0JDLEtBdkJIO0FBd0JDLEdBM0JIO0FBNEJELENBbEg0QixDQWpCbkIsQ0FBViIsImZpbGUiOiJhcHAucHJvZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIGJhYmVsXCI7XG5pZiAobG9jYXRpb24ucHJvdG9jb2wgIT0gJ2h0dHA6Jykge1xuICBsb2NhdGlvbi5wcm90b2NvbCA9ICdodHRwOic7XG59XG4vLyBpZiAoJ3NlcnZpY2VXb3JrZXInIGluIG5hdmlnYXRvcikge1xuLy8gICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3Rlcignc2VydmljZS13b3JrZXIuanMnKTtcbi8vIH1cbi8vIHJlbW92ZWQgc2VydmljZSB3b3JrZXJzIGFuZCBmZXRjaCBiZWNhdXNlIHF1aXpsZXQgZG9lcyBub3QgZG8gY29ycyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zNDk0MDA3NCBcbi8vIG5vLWNvcnMgbW9kZSB3b24ndCBzZW5kIGF1dGhvcml6YXRpb24gaGVhZGVyIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9SZXF1ZXN0L21vZGVcbnZhciBsbyA9IF87XG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2RlY2tqYW0nLCBbJ25nTWF0ZXJpYWwnXSlcbi5jb25maWcoZnVuY3Rpb24oJG1kVGhlbWluZ1Byb3ZpZGVyKSB7XG4gIHZhciBjdXN0b21CbHVlTWFwID0gJG1kVGhlbWluZ1Byb3ZpZGVyLmV4dGVuZFBhbGV0dGUoJ2xpZ2h0LWJsdWUnLCB7XG4gICAgJ2NvbnRyYXN0RGVmYXVsdENvbG9yJzogJ2xpZ2h0JyxcbiAgICAnY29udHJhc3REYXJrQ29sb3JzJzogWyc1MCddLFxuICAgICc1MCc6ICdmZmZmZmYnXG4gIH0pXG4gICRtZFRoZW1pbmdQcm92aWRlci5kZWZpbmVQYWxldHRlKCdjdXN0b21CbHVlJywgY3VzdG9tQmx1ZU1hcClcbiAgJG1kVGhlbWluZ1Byb3ZpZGVyLnRoZW1lKCdkZWZhdWx0JylcbiAgICAucHJpbWFyeVBhbGV0dGUoJ2N1c3RvbUJsdWUnLCB7XG4gICAgICAnZGVmYXVsdCc6ICc1MDAnLFxuICAgICAgJ2h1ZS0xJzogJzUwJ1xuICAgIH0pXG4gICAgLmFjY2VudFBhbGV0dGUoJ3BpbmsnKVxuICAkbWRUaGVtaW5nUHJvdmlkZXIudGhlbWUoJ2lucHV0JywgJ2RlZmF1bHQnKVxuICAgIC5wcmltYXJ5UGFsZXR0ZSgnZ3JleScpXG59KVxuLmNvbnRyb2xsZXIoJ2hvbWVDb250YWluZXInLCBbXCIkc2NvcGVcIixcIiRodHRwXCIsKF8sICRodHRwKT0+IHtcbiAgXy5nZXRTZXRzZm9yVGVybSA9ICh0ZXJtKT0+ICRodHRwLmdldChgaHR0cDovL2F5dWRoLm9yZzozMzM3L3F1aXpsZXQvc2VhcmNoP3F1ZXJ5PSR7dGVybX1gLCB7IGNhY2hlOiB0cnVlfSlcbiAgXy5nZXRTZXRzID0gKHNldHMpPT4gJGh0dHAuZ2V0KGBodHRwOi8vYXl1ZGgub3JnOjMzMzcvcXVpemxldC9zZXRzP3F1ZXJ5PSR7c2V0c31gLCB7IGNhY2hlOiB0cnVlfSlcbiAgXy5kZWNrcyA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmRlY2tzIHx8ICd7fScpXG4gIF8uc2VsZWN0ZWQgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5zZWxlY3RlZCB8fCAne30nKVxuICBfLnNlbGVjdGVkT3JkZXIgPSBcInRpbWVcIlxuICBfLnJldmVyc2UgPSB0cnVlXG4gIF8ubWQgPSBmYWxzZVxuICBfLnNlbGVjdGVkQXJyYXkgPSAoKT0+IGxvLnZhbHVlcyhfLnNlbGVjdGVkKVxuICBfLnNlbGVjdFRlcm0gPSAodGVybSwgc2V0SWQsIG1vdXNlRG93bj10cnVlKSA9PiB7XG4gICAgdGVybS5zZWxlY3RlZCA9ICghIW1vdXNlRG93bikgPyAhISF0ZXJtLnNlbGVjdGVkIDogISF0ZXJtLnNlbGVjdGVkXG4gICAgaWYgKHRlcm0uc2VsZWN0ZWQpIHtcbiAgICAgIF8uc2VsZWN0ZWRbdGVybS5pZF0gPSBsby5hc3NpZ24oe30sdGVybSlcbiAgICAgIF8uc2VsZWN0ZWRbdGVybS5pZF0uc2V0SWQgPSBzZXRJZFxuICAgICAgXy5zZWxlY3RlZFt0ZXJtLmlkXS50aW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKVxuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgXy5zZWxlY3RlZFt0ZXJtLmlkXVxuICAgIH1cbiAgICBsb2NhbFN0b3JhZ2Uuc2VsZWN0ZWQgPSBKU09OLnN0cmluZ2lmeShfLnNlbGVjdGVkKVxuICB9XG4gIF8ucmVtb3ZlRGVjayA9IGlkPT4gZGVsZXRlIF8uZGVja3NbaWRdXG4gIF8uc2VsZWN0QWxsID0gaWQ9PiB7XG4gICAgaWYgKF8uZGVja3NbaWRdKSB7XG4gICAgICAvLyBhbGwgc2VsZWN0ZWQsIHRoZW4gdW5zZWxlY3QgYWxsXG4gICAgICBpZiAoXy5kZWNrc1tpZF0udGVybXMuZmluZCh4PT4gISF4LnNlbGVjdGVkKSl7XG4gICAgICAgIF8uZGVja3NbaWRdLnRlcm1zLmZvckVhY2godGVybSA9PiB7XG4gICAgICAgICAgdGVybS5zZWxlY3RlZCA9IGZhbHNlXG4gICAgICAgICAgZGVsZXRlIF8uc2VsZWN0ZWRbdGVybS5pZF1cbiAgICAgICAgfSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF8uZGVja3NbaWRdLnRlcm1zLmZvckVhY2godGVybSA9PiB7XG4gICAgICAgICAgdGVybS5zZWxlY3RlZCA9IHRydWVcbiAgICAgICAgICBfLnNlbGVjdGVkW3Rlcm0uaWRdID0gbG8uYXNzaWduKHt9LHRlcm0pXG4gICAgICAgICAgXy5zZWxlY3RlZFt0ZXJtLmlkXS5zZXRJZCA9IGlkXG4gICAgICAgICAgXy5zZWxlY3RlZFt0ZXJtLmlkXS50aW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgbG9jYWxTdG9yYWdlLnNlbGVjdGVkID0gSlNPTi5zdHJpbmdpZnkoXy5zZWxlY3RlZClcbiAgICB9XG4gIH1cbiAgXy5jbGVhclNlbGVjdGVkID0gKCk9PiB7XG4gICAgXy5zZWxlY3RlZCA9IHt9XG4gICAgbG9jYWxTdG9yYWdlLnNlbGVjdGVkID0gJ3t9J1xuICB9XG4gIF8uc3dhcFNlbGVjdGVkID0gaWQ9PiB7XG4gICAgdmFyIHt0ZXJtLCBkZWZpbml0aW9ufSA9IF8uc2VsZWN0ZWRbaWRdXG4gICAgXy5zZWxlY3RlZFtpZF0uZGVmaW5pdGlvbiA9IHRlcm1cbiAgICBfLnNlbGVjdGVkW2lkXS50ZXJtID0gZGVmaW5pdGlvblxuICB9XG4gIF8ucmVtb3ZlU2VsZWN0ZWQgPSBpZD0+IHtcbiAgICB2YXIge3NldElkLCByYW5rfSA9IF8uc2VsZWN0ZWRbaWRdXG4gICAgaWYoXy5kZWNrc1tzZXRJZF0pIHtcbiAgICAgIF8uZGVja3Nbc2V0SWRdLnRlcm1zW3JhbmtdLnNlbGVjdGVkID0gZmFsc2VcbiAgICB9XG4gICAgZGVsZXRlIF8uc2VsZWN0ZWRbaWRdXG4gIH1cbiAgXy5jcmVhdGUgPSAodGl0bGUpPT4ge1xuICAgIF8udXJsID0gbnVsbFxuICAgIF8uY3JlYXRpbmcgPSB0cnVlXG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICB1cmw6ICdodHRwOi8vYXl1ZGgub3JnOjMzMzcvY3JlYXRlLXNldCcsXG4gICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgbGFuZ190ZXJtczogJ2VuJyxcbiAgICAgICAgbGFuZ19kZWZpbml0aW9uczogJ2VuJyxcbiAgICAgICAgZGF0YTogbG8ubWFwKF8uc2VsZWN0ZWQsICh2LGspPT4gbG8ucGljayh2LCBbJ3Rlcm0nLCAnZGVmaW5pdGlvbicsICdpbWFnZSddKSlcbiAgICAgIH0pXG4gICAgfSkudGhlbihyZXM9PntcbiAgICAgIF8udXJsID0gYGh0dHBzOi8vcXVpemxldC5jb20ke3Jlcy5kYXRhLnVybH1gXG4gICAgICBfLmNyZWF0aW5nID0gZmFsc2VcbiAgICB9KS5jYXRjaCgoKT0+e18uY3JlYXRpbmc9ZmFsc2V9KVxuICB9XG4gIF8uaW1wb3J0ID0gKGltcG9ydFVybCkgPT4ge1xuICAgIHZhciB4ID0gaW1wb3J0VXJsICYmIGltcG9ydFVybC5tYXRjaCgvXFxkKy8pXG4gICAgeCAmJiB4WzBdICYmIF8uZ2V0U2V0cyh4WzBdKS50aGVuKHJlcz0+e1xuICAgICAgcmVzLmRhdGEuZm9yRWFjaChzZXQ9PiB7XG4gICAgICAgIHNldC50ZXJtcy5mb3JFYWNoKHRlcm0gPT4ge1xuICAgICAgICAgIHRlcm0uc2VsZWN0ZWQgPSB0cnVlXG4gICAgICAgICAgXy5zZWxlY3RlZFt0ZXJtLmlkXSA9IGxvLmFzc2lnbih7fSx0ZXJtKVxuICAgICAgICAgIF8uc2VsZWN0ZWRbdGVybS5pZF0uc2V0SWQgPSBzZXQuaWRcbiAgICAgICAgICBfLnNlbGVjdGVkW3Rlcm0uaWRdLnRpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0pXG4gIH1cbiAgXy5nZXRUZXJtcyA9IChyZXBsYWNlKT0+IHtcbiAgICBfLmRlY2tzID0gISFyZXBsYWNlID8ge30gOiAoXy5kZWNrcyB8fCB7fSlcbiAgICBfLmJsb29tID0gISFyZXBsYWNlID8gbmV3IEJsb29tRmlsdGVyKDNlNSwgM2UtNSkgOiAoXy5ibG9vbSB8fCBuZXcgQmxvb21GaWx0ZXIoM2U1LCAzZS01KSlcbiAgICBfLnNlYXJjaC5zcGxpdCgnLCcpLmZvckVhY2godGVybT0+IHtcbiAgICAgIF8uZ2V0U2V0c2ZvclRlcm0odGVybS50cmltKCkpLnRoZW4oZGF0YT0+IHtcbiAgICAgICAgXy5nZXRTZXRzKGRhdGEuZGF0YS5zZXRzLm1hcChhPT5hLmlkKS5qb2luKCcsJykpXG4gICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIHJlcy5kYXRhLmZvckVhY2goc2V0PT4ge1xuICAgICAgICAgICAgICB2YXIgdGVybXMgPSBsby5maWx0ZXIoc2V0LnRlcm1zLCBjYXJkPT4ge1xuICAgICAgICAgICAgICAgIGlmIChfLmJsb29tLnRlc3QoY2FyZC50ZXJtICsgY2FyZC5kZWZpbml0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIF8uYmxvb20uYWRkKGNhcmQudGVybSArIGNhcmQuZGVmaW5pdGlvbilcbiAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB0ZXJtcy5mb3JFYWNoKCh0LGkpID0+IHQucmFuayA9IGkpXG4gICAgICAgICAgICAgIGlmICh0ZXJtcy5sZW5ndGggPiAyKXtcbiAgICAgICAgICAgICAgICBfLmRlY2tzW3NldC5pZF0gPSBsby5waWNrKHNldCwgWyd1cmwnLCAndGl0bGUnLCAnbW9kaWZpZWRfZGF0ZScsICdsYW5nX3Rlcm1zJywgJ2xhbmdfZGVmaW5pdGlvbnMnXSlcbiAgICAgICAgICAgICAgICBfLmRlY2tzW3NldC5pZF0udGVybXMgPSB0ZXJtc1xuICAgICAgICAgICAgICAgIF8uZGVja3Nbc2V0LmlkXS50ZXJtc19sZW5ndGggPSB0ZXJtcy5sZW5ndGhcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5kZWNrcyA9IEpTT04uc3RyaW5naWZ5KF8uZGVja3MpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxufV0pXG4iXX0=