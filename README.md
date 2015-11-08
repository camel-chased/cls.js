# clsjs


PROS

* Easy dynamic javascript classes (kind of mixin).
* Private, protected, static, final and const declarations.
* Runtime type checking (with classes as types too).
* Default method arguments.
* Automatic constructor execution.
* Builtin class and object compression (json alternative, you can send class through http compressed).
* New methods/properties can be added dynamically.
* ES5 compatible, browser and nodejs support.

CONS

* Can't be minified (sort of) - compression added instead or you can minify without comment block minification

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
     * @property {string} prop
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
    }

  };
});

// static methods ...
var st = MyClass.statMet(); // "this is static method"


// you don't need to write "new" keyword
var myInstance = MyClass("Robocop");

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
var Ext = cls.extend(MyClass,Second);
var ExtInstance = Ext();

var test = Ext.publ(); // "this is public property"
var test2 = Ext.secondFeature(); // "some additional function"
```


## Documentation and examples

soon
