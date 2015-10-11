var assert = require("assert");
var cls = require("../cls");
var JSC = require('jscheck');


describe('class (cls) [protected properties]',function(){

    var Main;
    it('should create class constructor',function(){
        Main = cls('main',function(){return {

            /**
             * @property {string} prop public
             */
            prop:'this is property',

            /**
             * @method  publicProp public
             * @returns {string} [description]
             */
            publicProp:function publicProp(){
                return 'this is public property and '+this.prop;
            },

            /**
             * @method  protectedProp protected
             * @returns {string} [description]
             */
            protectedProp:function protectedProp(){
                return 'this is protected property and '+this.prop;
            },

            /**
             * @method  privateProp private
             * @returns {string} [description]
             */
            privateProp:function privateProp(){
                return 'this is private property and '+this.prop;
            },

            /**
             *
             * @method  getProtected public
             * @returns {function} [description]
             */
            getProtected:function getProtected(){
                return this.protectedProp();
            },


            getPrivate:function getPrivate(){
                return this.privateProp();
            },

            getPublic:function getPublic(){
                return this.publicProp();
            }

        };});

        assert(Main);
        assert.equal(cls.type( Main ),'function');
    });

    var instance;

    it('should create class instance',function(){

        instance = new Main();
        assert(instance);
    });

    it('instance should be a pseudo class',function(){
        assert.equal(cls.type(instance),'pseudoclass');
    });

    it('should have invisible from outside instance protected property',function(){
        assert(!instance.protectedProp);
    });


    it('should have access to protected property',function(){
        assert.equal( cls.type( instance.getProtected() ),'string' );
    });

    it('should have access to private property',function(){
        assert.equal( cls.type( instance.getPrivate() ), 'string');
    });

    it('should not have child functionality',function(){
        assert(!instance.addedFunc);
    });

    var Inherited;
    it('should extend class',function(){
        Inherited = cls('inherited',Main,function(){return{
            /**
             * [addedFunc description]
             * @method      addedFunc   public
             * @returns     {string}    [description]
             */
            addedFunc:function addedFunc(){
                return 'this function was added to Main class';
            },
            /**
             * [addedProt description]
             * @method  addedProt protected
             * @returns {string} [description]
             */
            addedProt:function addedProt(){
                return 'this is added protected function';
            },
            /**
             * [addedPriv description]
             * @method  addedPriv private
             * @returns {[type]} [description]
             */
            addedPriv:function addedPriv(){
                return 'this is added private property';
            },
            /**
             * [getAddedProt description]
             * @method  getAddedProt public
             * @returns {string} [description]
             */
            getAddedProt:function getAddedProt(){
                return this.addedProt();
            },
            /**
             * [getAddedPriv description]
             * @method  getAddedPriv public
             * @returns {[type]} [description]
             */
            getAddedPriv:function getAddedPriv(){
                return this.addedPriv();
            }

        };});
    });

    var inheritedInstance;
    it('should create inherited instance',function(){
        inheritedInstance = new Inherited();
    });

    it('should have added functionality (should extend)',function(){
        assert(inheritedInstance.addedFunc);
    });
    it('should return string from added functionality',function(){
        assert.equal(cls.type( inheritedInstance.addedFunc() ), 'string');
    });
    it('should not have private function from parent',function(){
        assert(!inheritedInstance.privateProp);
    });

    it('should not have access to protected property outide inherited instance',function(){
        assert(!inheritedInstance.protectedProp);
    });

    it('should have inherited protected property - returning string',function(){
        assert.equal( cls.type( inheritedInstance.getProtected()),'string' );
    });

    it('should not have access to private added property outside',function(){
        assert(!inheritedInstance.addedPriv);
    });

    it('should have access to added private property - returning string',function(){
        assert.equal( cls.type( inheritedInstance.getAddedPriv() ),'string' );
    });
    it('should not have access to private property from 1st class',function(){
        assert.throws(function(){
            var prv = inheritedInstance.getPrivate();
            console.log(prv);
        });
    });

    var Inh2;
    it('should create 3 class constructor based on inherited one',function(){
        Inh2 = cls('inh3',Inherited,function(){return {
            /**
             * [thirdPriv description]
             * @method  thirdPriv private
             * @returns {string} [description]
             */
            thirdPriv:function thirdPriv(){
                return 'this is third inherit private func';
            },

            /**
             * [thirdProt description]
             * @method  thirdProt protected
             * @returns {[type]} [description]
             */
            thirdProt:function thirdProt(){
                return 'this is third protected method';
            },

            /**
             * [thirdPub description]
             * @method  thirdPub public
             * @returns {[type]} [description]
             */
            thirdPub:function thirdPub(){
                return 'this is third public property';
            },

            getThirdPriv:function getThirdPriv(){
                return this.thirdPriv();
            },
            getThirdProt:function getThirdProt(){
                return this.thirdProt();
            }

        };});
        assert(cls.type( Inh2),'string');
    });

    var inh2;
    it('should create third instance based on inherited one',function(){
        inh2 = new Inh2();
        assert.equal( cls.type( inh2),'pseudoclass' );
    });

    it('should have third added property by extending iherited one',function(){
        assert(inh2.thirdPub);
    });
    it('should have third private property not accessible outside',function(){
        assert(!inh2.thirdPriv);
    });
    it('should have third protected property not accessible outside',function(){
        assert(!inh2.thirdProt);
    });

    it('should have access to third private prop inside class instance (returns string)',function(){
        assert( cls.type( inh2.getThirdPriv() ),'string');
    });
    it('should have access to third protected prop inside class instance (returns string)',function(){
        assert( cls.type( inh2.getThirdProt() ),'string');
    });

    it('should have inherited publicProp from first class (return string)',function(){
        assert.equal( cls.type( inh2.publicProp()), 'string');
    });
    it('should have inherited publicProp from first class (return string)',function(){
        assert.equal( cls.type( inh2.publicProp()), 'string');
    });

    it('should not have acces to protected prop from 1st class',function(){
        assert(!inh2.protectedProp);
    });
    it('should have access to protected prop from 1st class inside instance',function(){
        assert( cls.type( inh2.getProtected() ),'string' );
    });

    it('should not have access to private property from 1st class',function(){
        assert.throws(function(){
            var prv = inh2.getPrivate();
            console.log(prv);
        });
    });

    it('should have access to protected prop form class 2 inside instance',function(){
        assert( cls.type( inh2.getAddedProt() ),'string' );
    });
    it('should have access to private prop form public method inside instance from class 2',function(){
        assert.equal( cls.type( inh2.getAddedPriv() ), 'string' );
    });

    //TODO add recursive loop and check public, private, and protected types

});
