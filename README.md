# clsjs


PROS

* Easy dynamic javascript classes (kind of mixin).
* Private, protected, static, final and const declarations.
* Runtime type checking (with classes as types too).
* Default method arguments.
* Automatic constructor execution.
* Builtin class and object compression (json alternative, you can send class or object with functions through http - compressed).
* New methods/properties can be added dynamically.
* ES5 compatible, browser and nodejs support.
* Builtin bundle creation for browser.

CONS

* Hard to minify, but you don't need minification at all. There is command line bundle creator.
Bundle creator search for all classes with given filter, merge them into one file "bundle.cls.js" and
you can use it in the browser (like in browserify).
If you really need, you can also save the class as object and then minify it with "saveAsObject" method SomeClass.saveAsObject("SomeClass.cls.js");
Or create classes from objects with declarations instead of comment block declarations.


TODO

* Automatic testing - no need to manually write basic tests
* Automatic visualization - UML generation
* Automatic documentation

### How to use it

Most declarations are defined in comment blocks like below...

```javascript
var MyClass = cls.class("MyClass",function(){
  return {


    /**
     * this is constructor - it can return something else than instance
     * @method  MyClass
     * @param   {string} name = 'Alex Murphy'
     * @returns {undefined}
     */
    MyClass:function(name){
      console.log("my name is",name);
    },

    /**
     * @method  statMet static
     * @returns {string}
     */
    statMet:function(){
      return "this is static method";
    },

    /**
     * some description if needed...
     * @property {string} prop private
     */
    prop:"this is private property",

    /**
     * @method  publ
     * @returns {string}
     */
    publ:function(){
      // by default methods and properties are public
      return "this is public property";
    },

    /**
     * some description if needed...
     * @method  meth private
     * @returns {string} some description
     */
    meth:function(){
      return "this is private method";
    },

    /**
     * @method  protector protected final
     * @param   {string} name = 'John'
     * @param   {string} surname = 'Doe'
     * @returns {string}         
     */
    protector:function(name,surname){
      // if name and surname are null or undefined then use default
      // declared after '=' sign
      // this method can't be overriden
      return name+" "+surname;
    },

    /**
     * if you want to mix this class then you must express it
     * @method  mix public
     * @param   {object} obj
     * @returns {undefined}
     */
    mix:function(obj){
      this.mixWithObject(obj);
    }

  };
});

// static methods ...
var st = MyClass.statMet(); // "this is static method"


// you don't need to write "new" keyword
var myInstance = MyClass("Robocop");
```

### Extending

```javascript
var Second = cls.class("Second",function(){
  return {

    /**
     * @method  secondFeature public
     * @returns {string}
     */
    secondFeature:function(){
      return "some additional function";
    }

  };
});

// you can extend classes dynamically like mixin but order is important
// left class doesn't have access to right class properties/methods
// argument list can be of course longer cls.extend(one,two,three,four...and so on)
var Ext = cls.extend(MyClass,Second);

// crating instance
var ExtInstance = Ext();

var test = ExtInstance.publ(); // "this is public property"
var test2 = ExtInstance.secondFeature(); // "some additional function"

//static from MyClass is also inherited
Ext.statMet();

// or another way
var Ext = MyClass.extend(Second);

// or with array - array can be dynamically generated
var Ext = cls.extend([MyClass,Second]);

// or something like this - but this way is the worst way because you loose flexibility
// an workaround for this(flexibility problem) is cls.getSingleClass("Ext") to retrieve
// only "EXt" class itself without inheriting anything
var Ext = MyClass.extend(cls.class("Ext",function(){
  return {
    // code for Extension here
  };
}));
// it is always better to store functionality in variables so you can reuse them
var Ext = cls.class("Ext",function(){
  return {
    // code for Extension here
  };
});
var Ext_ = MyClass.extend(Ext);
var Ext_instance = new Ext_;
```

### Mix-in

```javascript
var dynamo = {

  'someOtherMethod':{
    declarations:['public','final'],
    value:function(){
      return "this method is added at runtime";
    }
  },

  'dynapro':{
    value:"This is dynamic property added somewhere in code execution"
  }

};
// the "mix" method is declared in MyClass
myInstance.mix(dynamo);
myInstance.someOtherMethod(); //"this method is added at runtime"
```

### Factories

```javascript
var Honda = cls.class("Honda",function(){
  return {
    drive:function(){
      console.log("brrrrrruuuuummmmm");
    }
  }
});

var Car = cls.class("Car",function(){
  return {

    Car:function(model){
      if( typeof model !== 'undefined'){
        return this.factory(model);
      }
    },

    /**
     * [function description]
     * @method  factory static
     * @param   {string} model
     * @returns {anytype}
     */
    factory:function(model){
      switch (model){
        case "Honda":return Honda();
      }
    }
  };
});

var myCar;
myCar = Car("Honda");
// or
myCar = Car.factory("Honda");
```

### Stateless classes

```javascript
//if you want keep states outside class - no problem
// just give it to the constructor - like factory


var SomeClass = cls.class("SomeClass",function(){
  return {

    /**
     * temporary property to work with
     * @property {object|null|undefined} states public
     */
    states:null,

    /**
     * stateless class must have states from outside world
     * @method  SomeClass
     * @param   {object} states = {"name":"John","surname":"Doe"}
     * @returns {anytype}
     */
    SomeClass:function(states){
      // default states are json compatible string declared in comment block
      // so when there is no states defaults will be used
      this.states = states;
    },

    sayMyName:function(){
      console.log(this.states.name+" "+this.states.surname);
    }

  };
});

// you can load states from db or whatever
var states = {
  name:"Mark",
  surname:"Schwarzeneger"
};
//and when instantiate reference to it
var instance = SomeClass(states);
instance.sayMyName(); // "Mark Schwarzeneger"

```


## Documentation and examples

soon
