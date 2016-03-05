var to_jest_test = "to jest test!";
console.log( "this file is automaticly evaluated", window, this, window === this );


module.exports = test = cls.class( "Test", function () {
  return {

    /**
     * [function description]
     * @method  hello
     * @param   {string} name = "John"
     * @returns {undefined}
     */
    hello: function ( name ) {
      console.log( "Hello " + name + "!" );
    }

  };
} );
