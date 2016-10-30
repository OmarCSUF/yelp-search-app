(function ($) {
  console.log('Yelp Fusin API v3');

  var App = {
    proxy: '<YOUR PROXY URL>',
    
    yelp: {
      token_url: 'https://api.yelp.com/oauth2/token',
      search_url: 'https://api.yelp.com/v3/businesses/search',
      reviews_url: 'https://api.yelp.com/v3/businesses/{id}/reviews'
    },
    
    auth: {
      expires_in: undefined,
      token_type: undefined,
      access_token: undefined
    },

    init: function () {
      console.log('Init');
      
      App.getToken({
        success: App.start
      });
    },
    
    getToken: function (options) {
      console.log('Getting Token');
      
      var opts = {
        success: undefined
      };
          
      opts = $.extend(opts, options);
      
      $.ajax({
        url: App.proxy,
        data: {
          url: App.yelp.token_url,
          method: 'POST',
          grant_type: 'client_credentials'
        },
        dataType: 'jsonp',
        cache: true,
        success: function (data) {
          if (typeof data === 'object' && typeof data.access_token !== 'undefined') {
            App.auth = data;
            
            if (typeof opts.success === 'function') {
              opts.success.apply(App);
            }
          } else {
            App.error('Unable to retrieve token!');
          }
        },
        error: function () {
          App.error('Unable to retrieve token!');
        }
      });
    },
    
    error: function (message) {
      console.error(message);  
    },
    
    start: function () {
      console.log('Starting App');
      
      $('.loading').hide();
      $('.search').fadeIn();
      $('.btn-search').on('click', App.search).trigger('click');
    },

    setup: function (elem) {
      $('.modal-reviews').off('show.bs.modal').on('show.bs.modal', App.getReviews);
    },
    
    search: function () {
      console.log('Searching');
      
      var term = $('input.search').val(),
          location = $('input.location').val();
      
      $('.results').html('');

      console.log(term);
      
      if (term !== '') {
        $.ajax({
          url: App.proxy,
          dataType: 'jsonp',
          data: {
            url: App.yelp.search_url,
            term: term,
            location: location,
            token: App.auth.access_token
          },
          cache: true,
          success: function(data) {
              console.log('Search Results');
              console.log(data);

              var template = $('#tmpl-search-results').html(),
                  html = _.template(template);

              $('.results').html(html(data));
              
              App.setup($('.results'));
          },
          error: function () {
            console.error('Yelp search failed..');

            var template = $('#tmpl-search-results').html(),
                html = _.template(template);

            $('.results').html(html());
          }
        });
      }
    },
    
    getReviews: function (e) {
      console.log('Getting Reviews');

      var $modal = $(this),
          $btn = $(e.target),
          $tr = $btn.closest('tr'),
          id = $tr.data('id'),
          url = App.yelp.reviews_url.replace(/\{id\}/i, id),
          $loading = $('.loading', $modal),
          $tblReviews = $('.table-reviews', $modal),
          $reviews = $('.reviews', $modal);

      console.log(id);
      
      $loading.show();
      $tblReviews.hide();
      
      $.ajax({
        url: App.proxy,
        dataType: 'jsonp',
        data: {
          url: url,
          token: App.auth.access_token
        },
        cache: true,
        success: function(data) {
            console.log('Reviews');
            console.log(data);

            var template = $('#tmpl-reviews').html(),
                html = _.template(template);

            $reviews.html(html(data));
            $tblReviews.show();
            $loading.hide();
            App.setup($reviews);
        },
        error: function () {
          console.error('Yelp search failed..');

          var template = $('#tmpl-reviews').html(),
              html = _.template(template);

          $reviews.html(html());
          $tblReviews.show();
          $loading.hide();
        }
      });
    },
    
    getAddress: function (location) {
      var value = '';
      
      if (location.address1) {
        value += location.address1 + '<br />';
      }
      
      if (location.city) {
        value += location.city;
        if (location.state) {
          value += ',' + location.state;
        }
        if (location.zip_code) {
          value += location.zip_code;
        }
        
        value += '<br />';
      }
      
      return value;
    },
    
    getGoogleQuery: function (location) {
      var value = [];
      
      if (location.address1) {
        value.push(location.address1);
      }
      
      if (location.city) {
        value.push(location.city);
      }
      
      if (location.state) {
        value.push(location.state);
      }
      
      if (location.zip_code) {
        value.push(location.zip_code);
      }
      
      value = value.join(' ').replace(/\s+/g, '+');
      
      return value;
    },
    
    getDate: function (date) {
      var value = '';
      
      if (typeof date === 'string') {
        date = date.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
          date = date.replace(/\s+.*/i, '').split('-');
          value = date[2].replace(/^0/, '')  + '/' + date[1].replace(/^0/, '') + '/' + date[0].substr(2, 2);
        }
      }
      
      return value;
    }
  };

  window.App = App;

  $(function () {
    App.init();
  });
})(jQuery);