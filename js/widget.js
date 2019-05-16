/* widjet.js
 * ---------
 * Tender Blacklist widget.
 *
 * Author: Code for Africa
 * URL: https://codeforafrica.org/
 * License: MIT
 */

var TenderBlacklist = {
  fn: {}
};

$(function () {
  TenderBlacklist.fn.load_data();

  $('.widget input').keypress(function (e) {
    if (e.which == 13) {
      TenderBlacklist.fn.search();
    }
  });

  $('.widget button').click(function () {
    TenderBlacklist.fn.search();
  });

});


TenderBlacklist.fn.load_data = function () {
  var data = $.getJSON('/js/data.json');
  data.then(function (response) {
    TenderBlacklist.data = response.response.ZPROCSUPP;

    TenderBlacklist.index = lunr(function () {
      // boost increases the importance of words found in this field
      this.field('name', {
        boost: 10
      });
      this.field('additionalinfo');
      this.field('address');
      this.field('city');
      this.field('statecode');
      this.field('country', {
        boost: 5
      });
      this.field('reason');

      for (let i = 0; i < TenderBlacklist.data.length; i++) {
        this.add({
          'name': TenderBlacklist.data[i].SUPP_NAME,
          'additionalinfo': TenderBlacklist.data[i].ADD_SUPP_INFO,
          'address': TenderBlacklist.data[i].SUPP_ADDR,
          'city': TenderBlacklist.data[i].SUPP_CITY,
          'statecode': TenderBlacklist.data[i].SUPP_STATE_CODE,
          'country': TenderBlacklist.data[i].COUNTRY_NAME,
          'reason': TenderBlacklist.data[i].DEBAR_REASON,
          'id': i
        });
      }
    });

    TenderBlacklist.fn.search_examples();
    TenderBlacklist.fn.search_enable();

    // pym.js
    if (typeof pymChild !== 'undefined') {
      pymChild.sendHeight();
    }
  });
};


TenderBlacklist.fn.search_examples = function () {
  var search_examples = '';
  for (var i = 2; i >= 0; i--) {
    var random_id = Math.floor(Math.random() * TenderBlacklist.data.length) + 1;
    var entity = TenderBlacklist.data[random_id - 1];
    search_examples += '<a onclick="javascript:TenderBlacklist.fn.search_example(\'' + toTitleCase(entity.SUPP_NAME) + '\');">';
    search_examples += toTitleCase(TenderBlacklist.data[random_id - 1].SUPP_NAME) + '</a>, ';
  }
  search_examples = search_examples.substring(0, search_examples.length - 2);
  $('.widget p.examples span').html(search_examples);
};

TenderBlacklist.fn.search_example = function (query) {
  $('.widget input').focus();
  $('.widget input').val(query);
  TenderBlacklist.fn.search(true);
};


TenderBlacklist.fn.search_enable = function () {
  $('.widget button').html('<i class="fa fa-btn fa-search"></i>');

  $('.widget input').prop('disabled', false);
  $('.widget button').prop('disabled', false);
};


TenderBlacklist.fn.search = function (is_example = false) {
  var query = $('.widget input').val();
  var results = TenderBlacklist.index.search(query + '~2');

  var results_html = '';
  $.each(results, function (index, value) {
    var entity = TenderBlacklist.data[value.ref];

    results_html += '<li class="list-group-item">';
    results_html += '<p>' + toTitleCase(entity.SUPP_NAME) + '</p>';

    results_html += '<small><strong>Country:</strong> ' + toTitleCase(entity.COUNTRY_NAME) + '</small><br/>';

    results_html += '<small><strong>Reason:</strong> ' + entity.DEBAR_REASON + '</small><br/>';

    var from_date = moment(entity.DEBAR_FROM_DATE).format('Do MMM YYYY');
    var to_date = moment(entity.DEBAR_TO_DATEs).format('Do MMM YYYY');
    results_html += '<small><strong>Period:</strong> ' + from_date + ' to ' + to_date + '</small><br/>';

    results_html += '</li>';
  });

  if (results.length === 0) {
    results_html = '<p class="text-center"><em>No results found for "' + query + '"</em></p>';
  }

  $('.widget .results-list').html(results_html);

  $('.results').removeClass('hidden');

  // pym.js
  if (typeof pymChild !== 'undefined') {
    pymChild.sendHeight();
  }

  // send google analytics event
  var ga_event_action = 'search';
  if (is_example) {
    var ga_event_action = 'search:example';
  }
  ga('send', 'event', 'Search', ga_event_action, query);

};


// Copied from http://projects-beta.worldbank.org/en/projects-operations/procurement/debarred-firms
TenderBlacklist.fn.generateAddress = function (dataItem) {
  addr = '';
  if (dataItem.SUPP_ADDR != null) {
    addr = dataItem.SUPP_ADDR;
  }

  if (dataItem.SUPP_CITY != null) {
    if (dataItem.SUPP_ADDR != null) {
      addr = addr + ', ' + dataItem.SUPP_CITY;
    } else {
      addr = dataItem.SUPP_CITY;
    }
  }
  if (dataItem.SUPP_STATE_CODE != null) {
    if (dataItem.SUPP_ADDR != null || dataItem.SUPP_CITY != null) {
      addr = addr + ', ' + dataItem.SUPP_STATE_CODE;
    } else {
      addr = dataItem.SUPP_STATE_CODE;
    }
  }
  if (dataItem.SUPP_ZIP_CODE != null) {
    if (dataItem.SUPP_ADDR != null || dataItem.SUPP_CITY != null || dataItem.SUPP_STATE_CODE != null) {
      addr = addr + ', ' + dataItem.SUPP_ZIP_CODE;
    } else {
      addr = dataItem.SUPP_ZIP_CODE;
    }
  }
  return addr
}