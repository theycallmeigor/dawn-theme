{%- comment %}
  @param cart (cart, mandatory)
  @param checkout_url (string, mandatory) the checkout url
  @param checkout_button_selector (string) the query selector for the checkout button
{% endcomment -%}

{% unless checkout_url %}
  {% assign checkout_url = 'https://checkout.{storename}.co/checkout' %}
{% endunless %}

{% unless checkout_button_selector %}
  {% assign checkout_button_selector = '[type="submit"][name="checkout"]' %}
{% endunless %}
<script>
  document.addEventListener("DOMContentLoaded", function () {

    var debug = true ? console.log.bind(console, '[DEBUG][RedirectCart]') : function () {};

    debug('Script loaded');

    window.RedirectCart = function (options) {


      var self = {};


     function productIdsWithQuantities() {
        {%- assign added_first = false -%}
        return {
          {%- for item in cart.items -%}
            {%- if item.variant.metafields.productId.productId -%}
          {%- if added_first %},{% endif -%}
           {%- if item.selling_plan_allocation -%}
          "{{ item.variant.metafields.productId.productId}}{{"|"}}{{item.selling_plan_allocation.selling_plan.name}}": {{ item.quantity | json }}
          {%- else -%}
           "{{ item.variant.metafields.productId.productId }}": {{ item.quantity | json }}
          {% endif -%}
              {%- assign added_first = true -%}
          {%- endif -%}
          {%- endfor -%}
        };
      }

      function init() {     
        self.options = Object.assign({
          checkoutButtonSelector: '{{ checkout_button_selector }}',
          checkoutUrl: '{{ checkout_url }}'
        }, options);

        self.$checkoutButton = $(self.options.checkoutButtonSelector);

        debug('Initialized with options', self.options);

        inject();
      }


      function inject() {
        debug('Inject');
        $(document).on('click', self.options.checkoutButtonSelector, checkout);
      }


      function checkout(event) {
        event.preventDefault();
        event.stopPropagation();
        var cartContents = fetch('/cart?view=meta-data.json')
        .then(response => response.json())
        .then(data => { 
          var checkoutUrl = getCheckoutURL(data);
          debug('Checkout ->', checkoutUrl);        
          window.location.href = checkoutUrl;
         });       
        
      }

      function getCartCookie(name) {
       var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
       if (match) { 
          return match[2];
       }
 	  }

      function getCheckoutURL(data) {
        cookie = getCartCookie('cart');
        affId = getCartCookie('?affId');
        //coupon = '&couponCode={{cart.cart_level_discount_applications[0].title}}';
        var urlLineItems = Object.keys(data.meta_product_id_array).reduce(function (output, productId) {             
          return output.concat([ data.meta_product_id_array[productId].id + ':' + data.meta_product_id_array[productId].quantity ]);
        }, []).join(';');

        if (typeof affId !== 'undefined')
          return self.options.checkoutUrl + '?products=' + urlLineItems + '&cartId='+cookie + '&affId='+affId;
        else
          return self.options.checkoutUrl + '?products=' + urlLineItems + '&cartId='+cookie;
      }



      init();

      return self;

    };

    var instance = new RedirectCart();

  });
</script>
