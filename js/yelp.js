(function ($) {
  console.log('Yelp Fusin API v3');

  /**
   * Core application business logic
   */
  var App = {
    // Proxy url for jsonp AWS S3 requests
    proxy: '<YOUR PROXY URL>',
    
    // Yelp API Endpoints
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
    
    /**
     * Initializes the application by retrieving the API token
     */
    init: function () {
      console.log('Init');
      
      App.getToken({
        success: App.start
      });
    },
    
    /**
     * Retrieves the API token and stores it
     *
     * @param object options Any additional request options
     */
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
    
    /**
     * Outputs application errors
     *
     * @param array|string message The error message
     */
    error: function (message) {
      message = (typeof message === 'string') ? [message] : message;
      
      if ($.isArray(message)) {
        if (message.length > 1) {
          $('.modal-errors .errors').html('<ol><li>' + message.join('</li><li>') + '</li></ol>');
        } else { 
          $('.modal-errors .errors').html(message[0]);
        }
        
        $('.modal-errors').modal('show'); 
        console.error(message.join('\n'));
      }
    },
    
    /**
     * Starts the application if a token was successfully obtain
     */
    start: function () {
      console.log('Starting App');
      
      $('.loading').hide();
      $('.search').fadeIn();
      $('.btn-search').on('click', App.search).trigger('click');
    },

    /**
     * Sets up dynamically built DOM elements
     *
     * @param object elem The dynamic parent element
     */
    setup: function (elem) {
      $('.modal-reviews').off('show.bs.modal').on('show.bs.modal', App.getReviews);
    },
    
    /**
     * Performs Yelp API searching and updates the DOM
     */
    search: function () {
      console.log('Searching');
      
      var term = $('input.search').val(),
          location = $('input.location').val();
      
      $('.results').html('');

      console.log('Search Term:', term);
      
      if (term) {
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
    
    /**
     * Retrieves user reviews based on the Yelp business id
     *
     * @param object e The javascript event
     */
    getReviews: function (e) {
      var $modal = $(this),
          $btn = $(e.target),
          $tr = $btn.closest('tr'),
          id = $tr.data('id'),
          url = App.yelp.reviews_url.replace(/\{id\}/i, id),
          $loading = $('.loading', $modal),
          $tblReviews = $('.table-reviews', $modal),
          $reviews = $('.reviews', $modal);
      
      $loading.show();
      $tblReviews.hide();
      
      // Retrieve and cache review calls
      if ($reviews.data('reviews')) {
        $tblReviews.show();
        $loading.hide();
      } else {
        console.log('Getting Reviews');
        console.log('Business ID:', id);
        
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
              $reviews.data('reviews', data);
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
      }
    },
    
    /**
     * Takes the Yelp location object and assembles an address for display
     *
     * @param object location The Yelp location object
     * @return string A display friendly address
     */
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
    
    /**
     * Takes the Yelp location object and assembles a goolge maps address query string
     *
     * @param object location The Yelp location object
     * @return string A goolge maps address query string
     */
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
    
    /**
     * Takes a mysql formatted date and formats it to m/d/y
     *
     * @param string date THe mysql formatted date
     * @return string The formatted date
     */
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