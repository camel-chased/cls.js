# clsjs
javascript classes with protected, private, public, static declarations, with runtime type checking and default function arguments.  
This module can be used in node.js or in the browser.  
No dependency needed.  

this module doesn't have some features yet (see todo's at the bottom of this page)  
If you want to speed up clsjs developement just give it a star!  

### less lines of code with more secure application
You don't need to checkout type of your arguments in every function with clsjs.  
Just declare type you want and clsjs will always check it for you.  
So many lines of code are not necessary now.  
You don't need type checking and declaring default values in each function (it can be frustrating sometimes).  
Furthermore you will be able to generate documentation from your classes automaticly - clsjs will do it for you.  
In the future it will also have basic tests out of the box, so when you write some class, basic test will be waiting to launch.  
clsjs don't need to be compiled to javascript - it is pure javascript.  

```js
var MyClass = cls('MyClass',function(){return {

    /**
     * @method  easyPeasy public
     * @param   {string} name = 'John'
     * @param   {string} surname = 'Doe'
     * @returns {string}
     */
    easyPeasy:function easyPeasy(name,surname){
        /*  this is not necessary now
            if( typeof name === 'undefined'){
                name = "John";
            }
            if( typeof surname === 'undefined' ){
                surname = "Doe";
            }
            if( typeof name !== 'string'){
                throw new Error("no so fast!");
            }
            if( typeof surname !== 'string'){
                throw new Error("no so fast!");
            }
         */
        return name+' '+surname;
    },


    /**
     * @method  complicatedStructure public
     * @param   {object} complicatedOne
     * @returns {undefined}
     */
    complicatedStructure:function complicatedStructure( complicatedOne ){
        // how to check complicated structures?
        // like this:
        var v = cls.var({
            // just declare it, how you want it to be
            construction:{
                this_is:{
                    a:{
                        complicated:{
                            structure:true
                        }
                    }
                }
            }
        });

        v.construction = complicatedOne;    // this will throw an error if complicatedOne
                                            // argument doesn't have same structure like declared one above
                                            // checking this manualy can be a nightmare huh?
    }

};});
```
### declaring types by comment blocks
Comment blocks are very handy if you are building larger app or collaborate with other programmers.  
They describe what every method is doing and what types of arguments are welcome.  
If you are programmer for some time, you already know that.  
In clsjs you don't need to learn a lot of tricks to get started.  
Just do what you are doing in a daily basis, and you will have more out of it.
Just comment your methods like this:
```js

var MyClass = cls('MyClass',function(){ return {

    /**
     * Just place here description and declare types
     * clsjs will parse this and will work accordingly
     * @method  commentThis public
     * @param   {string} name = 'John'
     * @returns {string}
     */
    commentThis: function commentThis( name ){
        return 'it is easy '+name;
    }

}; });

var instance = new MyClass();
var result = instance.commentThis();
console.log( result );                  // it is easy John

```

## usage

```js

var classContructor = cls('someClass',function(){return {

    /**
     * @method someMethod public
     * @param {string} name = 'defaultName'
     * @returns {undefined}
     */
    someMethod:function someMethod(name){
        console.log(name);
    }

};});

var classInstance = new classConstructor();

classInstance.someMethod();         // logs 'defaultName'
classInstance.someMethod('john');   // logs 'john'
classInstance.someMethod(23);       // type mismatch error thrown

```

### constructor
```js
var SomeClass = cls('SomeClass',function(){ return {

    /** @property {number} someNumber protected */
    someNumber: 0,

    /**
     * @method  __construct public
     * @param   {number} someArg = 0
     * @returns {number}
     */
    __construct:function __construct(someArg){
        this.someNumber = someArg + 1;
        console.log(someArg);
        return this.someNumber;
    },

    /**
     * getting protected property
     * @method  getSomeNr
     * @returns {number}
     */
    getSomeNr:function getSomeNr(){
        return this.someNumber;
    }

}; });

var instance = new SomeClass(10);   // 10
var nr = instance.getSomeNr();
console.log( nr );                  // 11
```

### extending

```js

var extConstr=cls('someExtension',classConstructor,function(){return{

    // by default methods are public
    /**
     * [someOtherFn description]
     * @method  someOtherFn
     * @returns {undefined} [description]
     */
    someOtherFn:function someOtherFn(){
        return this.someMethod('yeaaah');
    }

};});

var extInstance = new extConstr();
extInstance.someOtherFn();          // logs 'yeaaah'

```

### private

Private properties/methods are not inherited and cannot access them outside a class instance.

```js
var clsPrv = cls('clsPrv',function(){return{

    /** @property {string} privateProp private */
    privateProp:'hello world',

    /**
     * [privateFn description]
     * @method  privateFn private
     * @returns {string} some string telling something...
     */
    privateFn:function privateFn(){
        return 'this is private fn that cannot be accessed anywhere else outside this instance';
    },


    publicFn:function publicFn(){
        return this.privateFn();
    }

};});

var prvInstance = new clsPrv();
prvInstance.privateFn();            //throws error
prvInstance.publicFn();             //return string 'this is....'

var prvExt = cls('prvExt',clsPrv,function(){return{

    publicTest:function publicTest(){
        return this.privateFn();
    }

};});

var extInstance = new prvExt();
extInstance.publicTest();           // throws error because of privateFn does not exist in this instance
```

### protected

protected properties/methods are visible only within a class instance and are inherited to child classes
you cannot access protected variables outside a class instance


### type checking inside a method

```js

var MyClass = cls('MyClass',function(){return{

    someMethod:function someMethod(){
        // cls.var is an obj with type checking on write
        // this variables will must be of the same type
        // if not error is thrown
        var v = cls.var({                   // instead of declaring variables like var someVar;
            someString:'hello!',            // place it in cls.var object
            someNumber:123,
            simpleObj:{},
            obj:{
                objects:{
                    are:{
                        also:{
                            available:true
                            // if you declare obj like this
                            // you wan't be able to save other construction
                            // it must be contructed that way
                            // if not error is thrown, if you want flexible
                            // obj then use {} object and later add some values
                        }
                    }
                }
            }
        });

        v.someString = 'world!';
        console.log( v.someString );        // world!
        v.someString = 23;                  // error is thrown

        v.simpleObj.name='John';            //{'name':'John'}
        v.simpleObj.surname='Smith';        //{'name':'John','surname':'Smith'}
        v.obj = {};                         // error
        v.obj= {                            // only this structure will be saved
            objects:{                       // types of properties also will be checked
                are:{
                    also:{
                        available:false
                    }
                }
            }
        };

    }

};});

```

### problems
methods in instances are not equal (but they are)
```js
var clsCon = cls('someClass',function(){return{

    someMethod:function someMethod(){
        return 'ok';
    }

};});

var instance_1 = new clsCon();
var instance_2 = new clsCon();
console.log( instance_1.someMethod === instance_2.someMethod ); //false
```
`instance_1.someMethod` and `instance_2.someMethod` is the same method (same reference of method)  
but they are wrapped up by bounding functions so they no longer equal  
in the end they are point to same fn  
so someMethod is only once declared in memory but bounding function is declared twice here  
this is ok because bounding function is very small and do not eat a lot of memory  


### todo's:
* checking return types
* static declarations
* type checking for class Constructors / Instances (inside methods / as argument / as return values)
* accessing protected variables through other instances of the same class
* make better documentation
