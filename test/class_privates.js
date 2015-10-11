var assert = require("assert");
var cls = require("../cls");
var JSC = require('jscheck');


describe('class (cls) [private properties]',function(){

    var Main, instance;

    it('should not copy private properties',function(){

        Main = cls('main',function(){return{

            /**
             *
             * @method privateFN private
             * @returns {string}
             */
            privateFN:function(){
                return '    this should not be visible outside instance';
            },

            /**
             *
             * @method publicFN public
             * @returns {string}
             */
            publicFN:function(){
                return this.privateFN();
            }

        };});
    });

    it("should create a class instance",function(){
        instance = new Main();
    });

    it("should not have access to private properties outside a class methods",function(){

        assert.throws( function(){
            instance.privateFN();
        },"there can't be privateFN available");

    });

    it("should have access to private property inside a instance",function(){
        assert( instance.publicFN(), "publicFN should have access to privateFN" );
    });

    var Nested;

    it('should create nested class constructor',function(){
        Nested = cls('nested',Main,function(){return {

            /**
             * @method propNested public
             * @return {undefined}
             */
            propNested:function propNested(){
                return this.privateFN;
            }

        };});
    });

    var nestedInstance;

    it('should create a nested instance',function(){
        nestedInstance = new Nested();
    });

    it('should not inherite private properties from Main class',function(){
        assert(!nestedInstance.propNested(),'private properties cannot be inherited');
    });

});
