module.exports = cls.class( "YoMan", function () {
  return {

    /**
     * [function description]
     * @method  hello
     * @param   {string} name = "John"
     * @returns {undefined}
     */
    Yo: function ( name ) {
      console.log( "Yo " + name + "!" );
    },

    req: function () {
      var test = Test();
      test.hello();
    }

  };
} );
