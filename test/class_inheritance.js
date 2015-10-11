var assert = require("assert");
var cls = require("../cls");
var JSC = require('jscheck');

describe('class (inheritance)', function() {

    var Main;

    it('should create a class constructor', function () {

        Main = cls('main',function(){return {

                /* @property {number} level public */
                level:0,

                /** @property {number} prv private */
                prv:10,

                test:'jol',

                name:'John',
                surname:'Kowalski',

                /**
                 * @method __construct
                 * @param {number|undefined} level
                 * @returns {undefined}
                 */
                __construct:function( level ){

                    //console.log('name',this.getName(),'level:',level);
                    if( cls.type( level) === 'number'){
                        this.level = level;
                        assert.equal(this.level,level,'levels doesnt match');
                    }
                },


                getUserName:function(){
                    return this.name+' '+this.surname;
                },

                /**
                 * @method sayHi
                 * @param {string} name = 'default john'
                 * @returns {number} level
                 */
                sayHi:function( name ){
                    var v = cls.var({
                        name:'John',
                        surname:'Kowalski'
                    });
                    //assert.equal(cls.type(this.level),'number','level should be a number');
                    //console.log('hi! '+name+" this is level "+this.level+" my id is",this.getId());

                    return this.level;
                },


                /*
                @method sayHello
                @param {string} test = 'john'
                @returns {undefined}
                 */
                sayHello: function(test) {
                  return 100;
                },

                /**
                 * protected method check
                 * @method  protMet protected
                 * @returns {undefined} [description]
                 */
                protMet:function protMet(){
                    return 'this is protected method';
                }

        };});

        assert(Main,'Main class creator should be already defined');
        assert.equal(cls.type( Main ),'function');
    });

    var main;

    it('should create class instance',function(){
        main = new Main(0);
        assert(main);
        assert.equal( cls.type( main ),'pseudoclass');
    });

    it('should have methods sayHello and sayHi',function(){
        console.log(main);
        assert.equal( cls.type( main.sayHi ), 'function' );
        assert.equal( cls.type( main.sayHello ), 'function' );
    });

    it('should return number in sayHi and sayHello',function(){
        assert.equal( cls.type( main.sayHi() ),'number','sayHi method should return number');
        assert.equal( cls.type( main.sayHello() ), 'number','sayHello method should return number');
    });


    var i = 0,
    len = 100,
    Nested,
    instance;

    function createNested(Nested,i){
        var Nested_child;
        Nested_child = cls('nested_'+i,Nested,function(){return{


            // hello is undeclared
            hello : function(){
                //console.log('hello',this.getName());
            },

            /* @property {string} privVal private */
            privVal:'this is private value and should not be inherited'

        };});
        return Nested_child;
    }

    it('should create first Nested constructor',function(){
        Nested = createNested(Main,0);
        assert(Nested,'Nested should be defined');
        assert.equal( cls.type( Nested ), 'function' );
    });


    it('should create 100 classes extended by previous (nested)',function(){

        for(;i < len; i++){
            Nested = createNested(Nested,i);
            instance = new Nested(i);
            instance.sayHi('Ralph_'+i);
        }
    });

    it('instance should be pseudoClass type',function(){
        assert.equal(cls.type(instance),'pseudoclass');
    });

    it('different class instances cannot be same objects',function(){
        assert.notStrictEqual(instance,main);
    });

    it('should have methodhs sayHi and hello inherited from first parent class',function(){
        assert.equal(cls.type(instance.hello),'function');
        assert.equal(cls.type(instance.sayHi),'function');
    });

    it('should not have same level property',function(){
        //console.log('instance',instance);
        //console.log('main',main);
        assert.notEqual(instance.level,main.level);
        //console.log(instance.level,main.level);
        ///console.log( instance.getUserName() );
    });
    /*
    it('should have same sourceObjects prototypes (getBaseObject)',function(){
        var mainObj,instanceObj;
        console.log(Main);
        mainObj = Main.getBaseObject();
        instanceObj = Nested.getBaseObj();
    });

    it('should have the same methods prototypes',function(){
        assert.strictEqual(instance.sayHello,main.sayHello);
    });
    */

});




describe('random properties generation',function(){

    var len=1000,
        classObj = {},
        randomNames = [],
        randomMethods = [],
        method, property,
        i = 0,
        pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$',
        randomName = JSC.string(JSC.integer(5, 20), JSC.one_of(pool)),
        anyValue = JSC.any();


    it('should generate 1000 different class properties and 1000 different methods',function(){

            for( i = 0; i < len; i++){
                randomNames.push( randomName() );
            }

            for( i = 0; i < len; i++){
                randomMethods.push( randomName() );
            }
            //console.log(randomNames,randomMethods);
            // internal method that will check every property name
            method=function(){

                var name = '' , keys = Object.keys( this ), index = 0;

                //console.log('this',this);

                for( index in randomNames ){
                    name = randomNames[index];
                    assert.notEqual( keys.indexOf( name ),-1,'there is no property like "'+name+'" in class');

                }

                for( index in randomMethods ){
                    name = randomNames[index];
                    assert.notEqual( keys.indexOf( name ),-1,'there is no property like "'+name+'" in class');
                }

            };


            for( i = 0; i < len; i++){

                classObj[ randomNames[ i ] ]=anyValue();
                classObj[ randomMethods[ i ] ]=method;

            }

            classObj.check = method;

            var classObject = function(){ return classObj; };
            var newClass = cls('newClass',classObject);
            //console.log('creating new instance',newClass.getClassTypes());
            var instance = new newClass();
            //console.log('instance',instance.getClassTypes());

            instance.check();

    });

});
