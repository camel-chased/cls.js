/**
 * FullClass - creating full featured class system in javascript
 *
 * Author: Rafal Pospiech <https://github.com/camel-chased>
 * License: MIT
 *
 */
/*
 classFacade have access all of the properties/methods
 classInstance have access to public only - verified by facade


 public
 classInstance.method -> classFacade -> classProperties
 where "this" is pointing to classFacade itself

 private
 within a class method
 classInstance.method -> classFacade -> classProperties
 where classInstance "this" is pointing to facade
 outside classInstance there is no private methods/properties

 */

var cls = (function () {

  /**
   * Short method for creating class constructor
   *
   * @param {String} name = of the class
   * @param {object} obj = class to extend (optional)
   * @param {object} ext = class structure
   * @returns {object} class constructor that can create instances new myClass()
   */
  var cls = function createClass(name, obj, ext) {
    return cls.create(name, obj, ext);
  };

  // -------------- builtin helpers ------------------

  /**
   * type - helper for defining variable type
   *
   * @param {Object} obj = the variable
   * @returns {String} typeof
   */
  cls.type = function type(obj) {

    if (typeof obj === 'undefined') {
      return 'undefined';
    }
    if (obj === null) {
      return 'null';
    }
    if (obj === undefined) {
      return 'undefined';
    }

    if (Array.isArray(obj)) {
      return 'array';
    } else if (typeof obj === 'object') {
      if (cls.isDef(obj.constructor)) {
        if (cls.isDef(obj.constructor.name)) {
          if (obj.constructor.name !== '') {
            return obj.constructor.name;
          } else {
            return typeof obj;
          }
        } else {
          return typeof obj;
        }

      } else {
        return 'object';
      }
    } else {
      return typeof obj;
    }

  };

  /**
   * clone - just clone the object recurively
   *
   * @param {Object} o = object to clone
   * @param {Object} to = (optional) defining where to clone
   * @returns {Object} cloned object
   */
  cls.clone = function clone(o, to) {
    var clone = {},
      key = '',
      keys,
      i = 0,
      len = 0,
      item,
      value;

    if (cls.type(o) !== 'object' && cls.type(o) !== 'array') {
      return o;
    }

    keys = Object.keys(o);
    len = keys.length;

    if (cls.type(o) === 'array') {
      clone = [];
    }

    for (; i < len; i++) {
      key = keys[i];
      value = o[key];

      if (cls.type(value) === 'array' || cls.type(value) === 'object') {
        item = cls.clone(value);
      } else {
        item = value;
      }

      clone[key] = item;
      if (typeof to !== 'undefined') {
        if (cls.type(to) === 'object' || cls.type(to) === 'function') {
          to[key] = item;
        }
      }
    }
    return clone;
  };

  /**
   * merge two objects recursively
   *
   * @param {Object} obj1 = object that will be base
   * @param {Object} obj2 = object to copy from
   * @returns {Object} fresh new object with merget properties
   */
  cls.merge = function merge(obj1, obj2) {

    var key,
      keys = Object.keys(obj2),
      len = keys.length,
      i = 0,
      tmp = {},
      _obj2 = cls.clone(obj2),
      obj3 = cls.clone(obj1);


    for (; i < len; i++) {
      key = keys[i];
      if (cls.type(_obj2[key]) === 'object' && cls.type(obj1[key]) === 'object') {
        tmp = cls.merge(obj3[key], _obj2[key]);
        obj3[key] = tmp;
      } else {
        obj3[key] = _obj2[key];
      }
    }
    return obj3;
  };

  var hasOwn = Object.prototype.hasOwnProperty;
  var toString = Object.prototype.toString;

  function forEach (obj, fn, ctx) {
      if (toString.call(fn) !== '[object Function]') {
          throw new TypeError('iterator must be a function');
      }
      var l = obj.length;
      if (l === +l) {
          for (var i = 0; i < l; i++) {
              fn.call(ctx, obj[i], i, obj);
          }
      } else {
          for (var k in obj) {
              if (hasOwn.call(obj, k)) {
                  fn.call(ctx, obj[k], k, obj);
              }
          }
      }
  };

  /**
   * freeze objects recuresively
   *
   * @param {Object} obj
   * @returns {Object} freezed object
   */
  cls.freeze = function freeze(obj) {
    if (typeof obj === 'undefined')
      return undefined;

    var propNames = Object.getOwnPropertyNames(obj);
    forEach(propNames,function (name) {
      var prop = obj[name];
      if (typeof prop === 'object' && !Object.isFrozen(prop)) {
        cls.freeze(prop);
      }
    });

    return Object.freeze(obj);
  };

  /**
   * isDef is just isDefined checking fn
   *
   * @param {any} val
   * @returns {Boolean}
   */
  cls.isDef = function isDef(val) {
    return typeof val !== 'undefined' && val !== null;
  };

  /**
   * guid - generate unique id for classes
   *
   * @returns {String}
   */
  cls.guid = function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  };



  /**
   * converts default parameters to its type like string, number, object
   * @method convertParamDefault
   * @param {string} types ; only firs type is converted
   * @param {string} value
   * @returns {Array|Object|Boolean}
   */
  cls.convertParamDefault = function convertParamDefault(types, value) {

    var tmp = '',
      i = 0,
      type;

    type = types[0];

    type = type.toLowerCase();

    if (cls.isDef(value)) {
      if (cls.type(value) === 'string') {
        tmp = value.toLowerCase();
        if (tmp === 'undefined' || tmp === 'null') {
          switch (tmp) {
          case 'undefined':
            value = undefined;
            break;
          case 'null':
            value = null;
            break;
          }
          return value;
        }
      }
    }

    switch (type) {
    case 'string':
      if (value.substr(0, 1) === "'" || value.substr(0, 1) === '"') {
        value = value.replace(/^[\'\"]{1}([^\'\"]+)[\'\"]{1}$/gi, "$1");
      }
      break;
    case 'number':
      value = Number(value);
      break;
    case 'object':
      value = JSON.parse(value);
      break;
    case 'array':
      value = JSON.parse(value);
      break;
    case 'bool':
    case 'boolean':
      if (value.toLowerCase() === 'true') {
        value = true;
      } else if (value.toLowerCase() === 'false') {
        value = false;
      } else {
        throw new Error("Boolean values must be either true or false.");
      }
      break;
    }

    return value;
  };


  /**
   * generate the argument types declaration from comment block
   * method is extending passed in classType with arguments property
   * @method generateArgumentTypes
   * @param {object} classType
   * @returns {undefined}
   */
  function generateArgumentTypes(classType) {

    var params = /^\s?\@param\s+\{([^\}]+)\}\s([a-z0-9\_\$]+)\s?(?:\=\s?([^\n]+))?\s?$/gim,
      tmp = params.exec(classType.str),
      paramDef = {};
    classType.arguments = [];

    if (cls.isDef(tmp)) {

      if (tmp.length < 3) {
        throw new Error("Variable declaration is incorrect.");
      }
      if (cls.isDef(tmp[1]) && cls.isDef(tmp[2])) {

        paramDef = {
          types: tmp[1].split('|'),
          name: tmp[2]
        };
        if (cls.isDef(tmp[3])) {
          paramDef.default = cls.convertParamDefault(tmp[1].split('|'), tmp[3]);
        }

        classType.arguments.push(paramDef);

      } else {
        throw new Error("Variable declaration is incorrect.");
      }
    }
  };


  /**
   * check declaration combinations like ['static','public']
   * there is no such thing like ['public','private']
   * @method checkDeclarations
   * @param {array} declarations
   * @param {string} className; for error info
   * @param {string} propName; for error info
   * @returns {boolean}
   */
  cls.checkDeclarations = function checkDeclarations(declarations, className, propName, isMethod) {

    var ok = true;

    if (declarations.length > 2)
      return false;
    if (declarations.indexOf('public') !== -1 && declarations.indexOf('private') !== -1)
      ok = false;
    if (declarations.indexOf('public') !== -1 && declarations.indexOf('protected') !== -1)
      ok = false;
    if (declarations.indexOf('private') !== -1 && declarations.indexOf('protected') !== -1)
      ok = false;
    if( declarations.indexOf('const') !== -1 && isMethod ){
      ok = false;
    }
    if( declarations.indexOf('final') !== -1 && !isMethod ){
      ok = false;
    }
    if (!ok) {
      throw new Error("Property declarations in class [" + className + "] property [" + propName +
        "] are incorrect.");
    }
    return ok;
  };



  cls.propertyTypeMismatch = function (className, property, available, wasType) {
    if (Array.isArray(available)) {
      available = available.join(',');
    }
    throw new Error("Type mismatch in class [ " + className + " ] property [ " +
      property + " ] should be " + available + ", '" + wasType + "' given.");
  };

  cls.ArgumentTypeMismatch = function (className, method, argument, available, wasType) {
    if (Array.isArray(available)) {
      available = available.join(',');
    }
    throw new Error("Type mismatch in class [ " + className + " ] method [ " +
      method + " ] argument [ " + argument + " ] should be " + available + ", '" + wasType + "' given.");
  };

  /**
   * when updating property value we must check type of the new value
   * @method checkClassPropertyType
   * @param {object} classInstance
   * @param {object} classProperties
   * @param {string} key
   * @param {anytype} val
   * @returns {boolean}
   */
  cls.checkClassPropertyType = function checkClassPropertyType(classObject, key, val) {

    if (cls.isDef(classObject.classProperties[key])) {
      if (cls.isDef(classObject.classProperties[key].types)) {
        //console.log('property type',key,classProperties[key].types);

        if (classObject.classProperties[key].types.indexOf(cls.type(val)) === -1 &&
          classObject.classProperties[key].types[0] !== 'anytype') {
          var className = classObject.classInstance.getCurrentClassName(),
            availableTypes = classObject.classProperties[key].types.join(",");
          cls.propertyTypeMismatch(className, key, availableTypes, cls.type(val));
        }
      }
    }
    return true;
  };

  /**
   * check passed in arguments for class method - type definition
   * and if undefined assigning default value if declared
   * @method checkMethodArgTypes
   * @param {object} classInstance
   * @param {object} classProperties
   * @param {object} classProperties
   * @param {string} methodName
   * @param {array} args
   * @returns {array} arguments
   */
  function checkMethodArgTypes(classObject, methodName, args) {

    var params,
      val, type = '',
      i = 0,
      newArgs = [];

    if (cls.isDef(classObject.classProperties[methodName])) {
      if (cls.isDef(classObject.classProperties[methodName].arguments)) {

        params = classObject.classProperties[methodName].arguments;
        for (i in params) {
          val = params[i];

          if( !Object.prototype.hasOwnProperty.call(params,i) ){ continue; }


          if (!cls.isDef(args[i])) {

            if (cls.isDef(val.default)) {

              newArgs[i] = val.default;

            } else if (val.types.indexOf('undefined')) {

              newArgs[i] = undefined;

            } else {
              cls.ArgumentTypeMismatch(classObject.classInstance.getCurrentClassName(), methodName, val.name, val.types,
                'undefined');
            }
          } else {
            newArgs[i] = args[i];
          }

          type = cls.type(newArgs[i]);
          if (val.types.indexOf(type) === -1 && val.types[0] !== 'anytype') {
            cls.ArgumentTypeMismatch(classObject.classInstance.getCurrentClassName(), methodName, val.name, val.types, type);
          }
        }

      }
    }else{
      throw new Error("There is no such method like ",methodName );
    }

    return newArgs;
  };



  /**
   * filter class properties by declaration type like public, private etc
   * if classId is defined then fn return only delcarations of specified class
   * @method getClassPropertiesOf
   * @param {object} classObject
   * @param {string} declarationName
   * @param {string} classId
   * @returns {object} propertyName -> propertyValue
   */
  cls.getClassPropertiesOf = function getClassPropertiesOf(classProperties, declarationName, classId) {

    var result = {},
      name = '',
      type;

    //console.log('classObject',classObject);
    for (name in classProperties) {
      type = classProperties[name];
      //console.log('type',type);
      if (cls.isDef(type.declarations)) {
        //console.log('declaration',type.declarations);
        if (type.declarations.indexOf(declarationName) !== -1) {
          // now we are going to check classId if it exists
          if (cls.isDef(classId)) {

            //console.log('type.classId',type.classId,classId);
            if (type.classId === classId) {
              result[name] = type.value;
            }

          } else {
            result.push(name);
          }
        }
      }
    }
    //console.log('getClassPropertiesOf',declarationName,result);
    return result;
  };



  /**
   * check "is" object to correspond "should" object for type matching
   * @method checkObjectContentTypes
   * @param {object} is
   * @param {object} should
   * @param {string} path - for exception information
   * @returns {boolean}
   */
  cls.checkObjectContentTypes = function checkObjectContentTypes(is, should, path) {

    var keys = Object.keys(is),
      len = keys.length,
      i = 0,
      key = '',
      isVal,
      shouldVal,
      isType = '',
      shouldType = '',
      recursiveOk = true;

    if (!cls.isDef(path)) {
      path = '';
    }

    for (; i < len; i++) {
      key = keys[i];

      if (!cls.isDef(should[key])) {
        continue;
      }

      isVal = is[key];
      shouldVal = should[key];

      isType = cls.type(isVal);
      shouldType = cls.type(shouldVal);

      if (isType === 'object' || isType === 'function') {

        recursiveOk = cls.checkObjectContentTypes(isVal, shouldVal, path + '.' + key);
        if (!recursiveOk) {
          return false;
        }

      } else {
        if (isType !== shouldType) {
          path = path + '.' + key;
          path = path.substr(1);
          throw new Error("Type mismatch. Object property [ " + path + " ] should be an " + shouldType + ".\n'" +
            isType + "' given.");
        }
      }
    }
    return true;
  };


  /**
   * declare variables with type checking
   * newObj is only mediator setter/getter
   * @method var
   * @param {object} obj
   * @param {string} path for informational purpose
   * @returns {object}
   */
  cls.var = function (obj, path) {

    var newObj = {},
      key = '',
      keys = '',
      i = 0,
      len = 0,
      type = '',
      val;

    if (!cls.isDef(path)) {
      path = '';
    }

    keys = Object.keys(obj);
    //console.log('traversing ',obj,keys);
    for (len = keys.length; i < len; i++) {
      key = keys[i];
      val = obj[key];
      type = cls.type(val);


      (function (newObj, val, key, type, obj, path) {
        var newType = '',
          keys = [],
          contentOk = true,
          tmp = {};

        if (type === 'object' || type === 'function') {

          tmp = cls.var(obj[key], path + '.' + key);
          Object.defineProperty(newObj, key, {
            get: function () {
              return tmp;
            },
            set: function (newVal) {
              var newType = cls.type(newVal);
              if (newType !== type && type !== 'anytype') {
                path = path + '.' + key;
                path = path.substr(1);
                throw new Error("Type mismatch. Object [ " + path + " ] should be an " + type + ".\n'" +
                  newType + "' given.");
              } else {
                // newVal is object or function
                contentOk = cls.checkObjectContentTypes(newVal, obj[key], path + '.' + key);
                if (contentOk) {
                  obj[key] = tmp;
                }
              }
            }
          });

        } else {

          Object.defineProperty(newObj, key, {
            //getting object from old object
            get: function () {
              return obj[key];
            },
            //setting object to old object
            set: function (newVal) {

              newType = cls.type(newVal);
              if (newType !== type && type !== 'anytype') {
                path = path + '.' + key;
                path = path.substr(1);
                throw new Error("Type mismatch. Object [ " + path + " ] should be an " + type + ",");
              } else {
                // this is a basic type and is verified just assign it
                obj[key] = newVal;
              }
            }
          });
        }

      }(newObj, val, key, type, obj, path));

    }

    return newObj;
  };



  /**
   * search for comment blocks in a given string and parse it to object
   * @method getCommentBlocks
   * @param {string} str
   * @param {string} className - for error info
   * @returns {object}
   */
  cls.getCommentBlocks = function getCommentBlocks(source, className, classId, classProperties) {

    //var commentBlock = /\/\*\*?\s?([^\/]+)(?!(\*\/))\n?/gi,
    var commentBlock = /\/\*\*?\s*([^\/]+)/gim,
      blocks = classProperties,
      tmp = [],
      parsed = '',
      method = /^\s?\@method +([^\s]+) *(?:([^\n \t]+))?(?: +([^\n]+))?\s?$/gim,
      methodObj = {},
      property = /^\@property +\{([^\}]+)\} +([^ \t\r\n]+) *([^\s\*\/]+)?(?: +([^\n\/]+))?$/gim,
      propertyObj = {},
      returns = /^\@returns?\s+\{([^\}]+)\}/gim,
      returnObj = {},
      i = 0,
      len = 0,
      block = '',
      types = {},
      methodName = '',
      propertyName = [],
      blockNames = [],
      blockName = '',
      declarations = []
    str = '',
      obj = {};
    if (!cls.isDef(classProperties)) {
      throw new Error('there is no classProperties object!');
    }

    if (cls.type(source) === 'function') {
      str = source.toString();
      obj = source();
    } else {
      throw new Error("comment blocks can only be defined in functions that returns object");
    }

    while (cls.isDef(tmp)) {
      method.lastIndex = 0;
      property.lastIndex = 0;

      tmp = commentBlock.exec(str);
      if (cls.isDef(tmp)) {
        parsed = String(tmp[1]).
        replace(/^[\t\*]+/gim, '').
        replace(/[\*]+/gim, '').
        replace(/^[ \t\n]{2,50}/gi, '').
        replace(/\n/gi, '').
        replace(/(\@)/gi, "\n$1").
        replace(/^\s+/gim, '').
        replace(/\s+$/gim, '');
        //checking out method name if this is method
        methodObj = method.exec(parsed);

        // if property is an method
        if (cls.isDef(methodObj)) {
          //console.log('creating property',methodName,classId);
          methodName = methodObj[1];
          // check if declared property is defined in object
          if (!cls.isDef(obj[methodName])) {
            throw new Error("Property '" + methodName + "' is declared but not defined in [ " + className +
              " ] class.");
          }
          blocks[methodName] = {
            'types': ['function']
          };

          // ---------------- IMPORTANT ------------------

          blocks[methodName].classId = classId;
          blocks[methodName].className = className;

          // ---------------- IMPORTANT ------------------


          if (methodObj.length === 4) {
            if (cls.isDef(methodObj[2])) {
              // declaration is an array like ['public','static']
              declarations = [methodObj[2]];

              if (cls.isDef(methodObj[3])) {
                declarations.push(methodObj[3]);
              }
              if (cls.checkDeclarations(declarations, className, methodName, true)) {
                blocks[methodName].declarations = declarations;
              }
              //define public property only when they are undeclared
            } else if (!cls.isDef(blocks[methodName].declarations)) {
              blocks[methodName].declarations = ['public'];
            }
          }
          blocks[methodName].str = parsed;

          generateArgumentTypes(blocks[methodName]);

          // if this is a method it should have a return value
          returnObj = returns.exec(parsed);
          if (cls.isDef(returnObj)) {
            blocks[methodName].returns = returnObj[1].split('|');
          }

        } else {
          // if property is property
          propertyObj = property.exec(parsed);

          if (cls.isDef(propertyObj)) {
            propertyName = propertyObj[2];


            blocks[propertyName] = {};
            blocks[propertyName].str = parsed;
            blocks[propertyName].types = propertyObj[1].split('|');

            // ---------------- IMPORTANT ------------------

            blocks[propertyName].classId = classId;
            blocks[propertyName].className = className;

            // ---------------- IMPORTANT ------------------

            if (cls.isDef(propertyObj[3])) {
              // declaration is an array 3 and 4['public','static']
              declarations = [propertyObj[3]];
              if (cls.isDef(propertyObj[4])) {
                declarations.push(propertyObj[4]);
              }
              if (cls.checkDeclarations(declarations, className, propertyName,false)) {
                blocks[propertyName].declarations = declarations;
              }
              // public only when undeclared
            } else if (!cls.isDef(blocks[propertyName].declarations)) {
              blocks[propertyName].declarations = ['public'];
            }
          }
        }

      }
    }
    return blocks;
  };


  /**
   * checking classProperty object, if some values are empty then fill it with defaults
   * @method  classProperty
   * @param   {object} data
   *          data contains: classId, value, declarations, types, arguments, returns
   * @returns {object} classProperty
   */
  function classProperty(data) {
    var posibleDeclarations = ['public', 'protected', 'private', 'static', 'const', 'final'];
    if (cls.isDef(data)) {

      if (!cls.isDef(data.classId)) {
        throw new Error("classId is not defined");
      }
      /* value can be undefined of corse
      if (!cls.isDef(data.value)) {
        throw new Error("value is not defined");
      }*/
      if (!cls.isDef(data.declarations)) {
        data.declarations = ['public'];
      } else {
        if (cls.type(data.declarations) !== 'array') {
          throw new Error("property declaration must be an array");
        } else {
          forEach(data.declarations,function (val) {
            if (cls.type(val) !== 'string') {
              throw new Error("property declaration must be a string");
            }
            if (posibleDeclarations.indexOf(val) === -1) {
              throw new Error("Unrecognized property declaration: '" + val + "'");
            }
          });
        }
      }
      if (!cls.isDef(data.types)) {
        if (cls.type(data.value) === 'function') {
          data.types = ['function'];
        } else {
          data.types = ['anytype'];
        }
      }
      if (data.types.indexOf('function') !== -1 && !cls.isDef(data.returns)) {
        data.returns = ['anytype'];
      }
      if (data.types.indexOf('function') !== -1 && !cls.isDef(data.arguments)) {
        data.arguments = [];
      }
    } else {
      throw new Error("cannot create property from empty object");
    }
  }

  /**
   * fill out property information with default values if needed
   * @method  defaultClassType
   * @param   {[type]} classId [description]
   * @param   {[type]} name [description]
   * @param   {[type]} value [description]
   * @param   {[type]} classProperties [description]
   * @param   {[type]} declarations [description]
   * @returns {[type]} [description]
   */
  function defaultClassType(classId, name, value, classProperties, declarations) {

    var data = classProperties[name] ? classProperties[name] : {};
    data.classId = classId;
    data.value = value;
    if (cls.isDef(declarations)) {
      data.declarations = declarations;
    }
    classProperty(data);
    classProperties[name] = data;
  }

  /**
   * generate classProperties from function with comment blocks containing information
   * @method  function
   * @param   {[type]} className [description]
   * @param   {[type]} source [description]
   * @param   {[type]} classId [description]
   * @param   {[type]} classProperties [description]
   * @returns {[type]} [description]
   */
  cls.classPropertiesFromFunction = function (className, source, classId, classProperties) {

    var objStr = '',
      result = {},
      obj = {},
      name = '';


    //console.log('creatig properties from function',classId,objStr);
    cls.getCommentBlocks(source, className, classId, classProperties);
    //console.log('classProperties',classProperties,"\n\n");
    obj = source();
    // setting up property.value and default parameters if needed
    forEach(obj,function (value, name) {
      defaultClassType(classId, name, value, classProperties);
      classProperties[name].value = value;
    });

    return classProperties;
  };

  /**
   * add property to classProperties - check declarations and fill with default values if needed
   * @method  function
   * @param   {[type]} classProperties [description]
   * @param   {[type]} name [description]
   * @param   {[type]} data [description]
   * @returns {[type]} [description]
   */
  cls.addToClassProperties = function (classProperties, name, data) {
    classProperty(data);
    classProperties[name] = data;
  };

  /**
   * generate properties from object wich contain property information instead of function with comment blocks
   * @method  function
   * @param   {[type]} className [description]
   * @param   {[type]} source [description]
   * @param   {[type]} classId [description]
   * @param   {[type]} classProperties [description]
   * @returns {[type]} [description]
   */
  cls.classPropertiesFromObject = function (className, source, classId, classProperties) {

    forEach(source,function (val, name) {
      cls.addToClassProperties(classProperties, name, val);
    });
    return classProperties;
  };

  /**
   * generate classProperties from bluePrint function or object
   * @method  generateClassProperties
   * @param   {[type]} className [description]
   * @param   {[type]} source [description]
   * @param   {[type]} classId [description]
   * @param   {[type]} classProperties [description]
   * @returns {[type]} [description]
   */
  cls.generateClassProperties = function generateClassProperties(className, source, classId, classProperties) {

    if (!cls.isDef(classProperties)) {
      //console.log("\n\n",'creating new classProperties',"\n\n");
      classProperties = new cls.clsClassProperties();
    }

    if (cls.type(source) === 'function') {
      cls.classPropertiesFromFunction(className, source, classId, classProperties);
    } else if (cls.type(source) === 'object') {
      cls.classPropertiesFromObject(className, source, classId, classProperties);
    }

    return classProperties;
  };

  /**
   * check if property is declared as declared
   * @method  typeIs
   * @param   {[type]} type [description]
   * @param   {[type]} declaration [description]
   * @returns {[type]} [description]
   */
  cls.typeIs = function typeIs(type, declaration) {
    var index = type.declarations.indexOf(declaration);
    return index >= 0;
  };
  cls.isType = cls.typeIs;
  /**
   * classInstance constructor - instance is an outside world object
   * @method  clsClassInstance
   * @param   {[type]} classId [description]
   * @param   {[type]} className [description]
   * @param   {[type]} childOf [description]
   * @param   {[type]} mixedWith [description]
   * @returns {[type]} [description]
   */
  cls.clsClassInstance = function classInstance(classId, className, childOf, mixedWith) {

    this.getClassId = getClassId.bind(this,classId);
    this.getCurrentClassName = getCurrentClassName.bind(this,className);
    this.getClassName = getClassName.bind(this,classId);

    this.childOf = childOf ? childOf : [];
    this.mixedWith = mixedWith ? mixedWith : [];
  };

  /**
   * add public property to instance object
   * value of property is not needed because it exists in classProperties
   * we need only name to access it
   * creating an instance is last step for class creation so there is no need to add property elsewhere
   * @method  function
   * @param   {[type]} propertyName [description]
   * @returns {[type]} [description]
   */
  cls.clsClassInstance.prototype.addPublicProperty = function (propertyName) {
    var classId = this.getClassId();
    var className = this.getCurrentClassName();
    var self = this;
    var classObject = __allClasses[classId];
    var classProperties = classObject.classProperties;
    var classData = classObject.classData;

    if (!classProperties.propertyExists(propertyName)) {
      throw new Error("'" + propertyName + "' doesn't exists");
    }

    // property declaration must exists here so
    if (classProperties[propertyName].declarations.indexOf('public') === -1) {
      throw new Error("'" + propertyName + "' is not public property and cannot be added to instance.");
    }

    if (!cls.isDef(self[propertyName])) {
      Object.defineProperty(self, propertyName, {
        enumerable: true,
        get: function () {
          return classData.get(classId, propertyName);
        },
      });
    }
  };

  /**
   * classProperties constructor
   * @method  clsClassProperties
   * @returns {[type]} [description]
   */
  cls.clsClassProperties = function classProperties() {

  };

  cls.clsClassProperties.prototype.propertyExists = function (propertyName) {
    return cls.isDef(this[propertyName]);
  };

  function getClassId(classId) {
    return classId;
  }

  function getCurrentClassName(className) {
    return className;
  }

  function getClassName(classId){

    var obj = getObject(classId);
    var facade = obj.classFacade;
    var child = facade.child;

    //console.log("--getting class child",child);

    while( child !== '' ){
      //console.log("Getting clasName for child",child);
      obj = getObject( child );
      facade = obj.classFacade;
      child = facade.child;
    }

    return facade.getCurrentClassName();

  }

  /**
   * classFacade constructor
   * @method  clsClassFacade
   * @param   {[type]} classId [description]
   * @param   {[type]} className [description]
   * @param   {[type]} childOf [description]
   * @param   {[type]} mixedWith [description]
   * @returns {[type]} [description]
   */
  cls.clsClassFacade = function classFacade(classId, className) {

    this.getClassId = getClassId.bind(this,classId);
    this.getCurrentClassName = getCurrentClassName.bind(this,className);
    this.getClassName = getClassName.bind(this,classId);
    this.mixedWith = [];
    this.child = '';
    this.parent = '';
  };

  /**
   * adding another property to facade - if we are creating facade from object not function
   * or if we are extending/mixing other classes
   * property is added to classProperties object too, because we can use this function in runtime
   * @method  function
   * @param   {[type]} propertyName [description]
   * @param   {[type]} data [description]
   * @returns {[type]} [description]
   */
  cls.clsClassFacade.prototype.addProperty = function (propertyName, data, addToClassProperties, classId) {

    if (!cls.isDef(classId)) {
      classId = this.getClassId();
    }
    //console.log('facade.addProperty',classId);
    var className = this.getCurrentClassName();
    var classObject = __allClasses[classId];
    var classData = classObject.classData;
    var self = this;

    if (!cls.isDef(addToClassProperties)) {
      addToClassProperties = false;
    }
    if (addToClassProperties === true) {
      cls.addToClassProperties(classObject.classProperties, propertyName, data);
    }

    if (!cls.isDef(self[propertyName])) {
      // from now we can only set properties through setter - we cannot defineProoperty that is already defined
      Object.defineProperty(self, propertyName, {
        enumerable: true,
        get: function () {
          return classData.get(classId, propertyName);
        },
        set: function (newVal) {
          return classData.set(classId, className,propertyName, newVal);
        }
      });
    }
    // we cannot add property to instance here because it may not exists yet
    // instaces will have their own prototype function to adding public properties
  };

  /**
   * constructor for classData object
   * @method  clsClassData
   * @param   {[type]} classProperties [description]
   * @returns {[type]} [description]
   */
  cls.clsClassData = function classData(classProperties) {
    this.classFacades = {}; // key->value by classId
    this.classProperties = classProperties;
  };

  /**
   * add another facade to array, needed for binding purpose
   * @method addClassFacade
   * @param  {[type]} classId [description]
   * @param  {[type]} classFacade [description]
   */
  cls.clsClassData.prototype.addClassFacade = function addClassFacade(classId, classFacade) {
    this.classFacades[classId] = classFacade;
  };

  /**
   * checking if property exists in classData object
   * @method  propertyExists
   * @param   {[type]} propertyName [description]
   * @returns {[type]} [description]
   */
  cls.clsClassData.prototype.propertyExists = function propertyExists(propertyName) {
    return cls.isDef(this.classProperties) && cls.isDef(this.classProperties[propertyName]);
  };

  /**
   * checking if some class can get property because of inheritance or mix
   * @method  function
   * @param   {[type]} classId [description]
   * @param   {[type]} propertyName [description]
   * @returns {[type]} [description]
   */
  cls.clsClassData.prototype.mixedWithOrChildOfPropertyOwner = function (classId, propertyName) {

    var facade = this.classFacades[classId];
    var property = this.classProperties[propertyName];

    if (classId === facade.getClassId()) {
      return true;
    }
    if (facade.mixedWith.indexOf(property.classId)) {
      return true;
    }
    if (facade.inherits.indexOf(property.classId)) {
      return true;
    }

    return false;
  };

  function getName(classId) {
    var obj = getObject(classId);
    return obj.classFacade.getCurrentClassName();
  }

  /**
   * MAIN logic for getting data from classData object
   * this function executes every time when class wants some property
   * function is checking that class can get it
   * and is binding right facade to it if it can
   * @method  get
   * @param   {[type]} classId [description]
   * @param   {[type]} className [description]
   * @param   {[type]} propertyName [description]
   * @returns {[type]} [description]
   */
  cls.clsClassData.prototype.get = function get(classId, propertyName) {
    var className = getName(classId);
    if (!this.propertyExists(propertyName)) {
      throw new Error("There is no property like " + propertyName + " in " + className);
    }
    var result = this.classProperties[propertyName];
    //console.log('getting', propertyName, 'from', className, classId);

    if (cls.isDef(result)) {

      // this is only way to get real data
      if (result.classId === classId) {

        //console.log(className, 'is owner of', propertyName, 'property of type', cls.type(result.value));
        // if its mine property i can get it no matter what
        if (cls.type(result.value) === 'function') {

          var facade = this.classFacades[classId];
          var obj = getObject(classId);
          //return result.value.bind(facade);
          return function preMethod(){
            var _args = arguments;
            _args = checkMethodArgTypes(  obj , propertyName, _args );
            return result.value.apply(facade,_args);
          }

        } else {
          return result.value;
        }



      } else if (cls.typeIs(result, 'public')) {

        // if its public property i can get it
        // binding to myself because i should have all properties even
        // private of parents but i cannot access it directly
        var targetName = getName(result.classId);
        //console.log('redirecting to', targetName, result.classId, 'who has this property', propertyName);
        return this.get(result.classId, propertyName);

      } else if (cls.isDef(classId) &&
        cls.typeIs(result, 'protected') &&
        this.mixedWithOrChildOfPropertyOwner(classId, propertyName)) {


        // if its protected property and i can
        // access it becase i'm neighbor or child
        var targetName = getName(result.classId);
        //console.log(targetName, 'is mixed with or child of', className);
        return this.get(result.classId, propertyName);


      } else if (cls.isDef(classId) && cls.typeIs(result, 'private')) {

        //console.log('classId:', classId, 'result.classId:', result.classId);
        //console.log('this facade', classId);
        //console.log('result facade', getName(result.classId), result.classId);
        //console.log('are we extending?', this.classFacades[classId].extends === result.classId);
        throw new Error("Cannot access private properties of other classes.");


      } else {

        //console.log('classId', classId, 'result.classId', result.classId);
        throw new Error("Cannot access '" + propertyName + "' from outside a class.");


      }
      // TODO: static const
    } else {
      return undefined;
    }
  };


  cls.clsClassData.prototype.set = function set(classId, className, propertyName, value) {

    var obj = getObject(classId);
    var propertyClassId = obj.classProperties[ propertyName ].classId;
    var facade = obj.classFacade;
    var proprertyObject = getObject(propertyClassId);
    var propertyFacade = propertyObject.classFacade;
    var property = obj.classProperties[ propertyName ];

    if( cls.type( property.value ) === 'function' ){
      if( cls.isType( property,'final' ) ){
        throw new Error("Method '"+propertyName+"' is final and cannot be changed.");
      }
    }else{
      if( cls.isType(property,'const') ){
        throw new Error("Property '"+propertyName+"' is const and cannot be changed.");
      }
    }

    if( classId === propertyClassId){
      obj.classProperties[ propertyName ].value = value;
    }else if(facade.inherits.indexOf( propertyClassId )){
      obj.classProperties[ propertyName ].value = value;
    }else{
      throw new Error("Cannot change property '"+propertyName+"' only child classes can redefine properties.");
    }

  };

  var __allClasses = {}; // all classes goes here waiting to be extended / mixed


  /**
   *
   * @method  fireConstructor
   * @param   {classInstance}   instance
   * @returns {undefined}
   */
  function fireConstructor(instance,args){
    if( !Array.isArray(args)){
      args = Array.prototype.slice.call(args);
    }
    var facade = getFacadeOfInstance(instance);
    var classId = facade.getClassId();
    var obj = getObject(classId);
    var className = facade.getCurrentClassName();

    // if we have constructor we can fire it because if we are here it means that instance is createNested
    // if we are collecting classes to extend no constructor will fire only when new instance is created
    // constructor will fire it - when all classes are prepared and ready to instantiate
    if( cls.isDef( facade[className] ) &&  obj.classProperties[className].classId === classId ){
      facade[className].apply(facade,args);
    }else if(facade.parent !== ''){
      classId = facade.parent;
      obj = getObject(classId);
      instance = obj.classInstance;
      facade = obj.classFacade;
      fireConstructor(instance,args);
    }
  }

  /**
   * classCreator
   * @param  {string} className           [description]
   * @param  {object} source              [description]
   * @return {classConstructor}           [description]
   */
  cls.class = function (className, source) {

    var sourceType = '',
      nameType = '';

    if (!cls.isDef(className) && !cls.isDef(source)) {
      throw new Error("There is no source for class creation.");
    }

    nameType = cls.type(className);

    if (nameType === 'function' || nameType === 'classConstructor') {
      if (cls.isDef(className.isConstructor)) {
        return className;
      }
    }

    if (nameType !== 'string') {
      throw new Error("class name should be a string");
    }

    sourceType = cls.type(source);

    if (sourceType !== 'function' && sourceType !== 'object') {
      throw new Error("Source for class creation must be a function or specially prepared object.");
    }

    var classConstructor = function classConstructor() {
      var args = arguments;
      var instance = cls.create(className, source);
      fireConstructor( instance, args );
      return instance;
    }
    classConstructor.___type = 'class';
    classConstructor.___source = source;
    classConstructor.___className = className;
    classConstructor.___arguments = arguments;
    classConstructor.isConstructor = true;
    classConstructor.extend = constructorExtend.bind(classConstructor);

    return classConstructor;
  }


  /**
   * creating a class instance
   * @method  create
   * @param   {[type]} className [description]
   * @param   {[type]} source [description]
   * @returns {[type]} [description]
   */
  function _create(className, source, classProperties, classData) {

    var classId = cls.guid(), // new classId for each class
      classInstance = {},
      classFacade = {},
      publicProperties = {},
      result = {},
      obj = {};

    if (cls.type(className) !== 'string') {
      throw new Error("className should be a string "+cls.type(className)+" given.");
    }

    //console.log(source);

    if (cls.isDef(source.___source)) {
      //console.log('getting source from',source);
      source = source.___source;
    }

    if (cls.type(source) === 'function') {
      obj = source();
    }

    if (!cls.isDef(classProperties)) {
      classProperties = new cls.clsClassProperties();
    }

    cls.generateClassProperties(className, source, classId, classProperties);
    //console.log('generated classProperties',classProperties);
    if (!cls.isDef(classData)) {
      classData = new cls.clsClassData(classProperties);
    } // we don't need to assign properties to classData because classData is searching in classProperties

    classFacade = new cls.clsClassFacade(classId, className);
    publicProperties = cls.getClassPropertiesOf(classProperties, 'public', classId);

    // if there are two extending classes then there is a third one
    // that is extending second one and have all properties of two
    classFacade.extend = '';
    // extendingFacade is classId of third facade that contains all properties from extending
    classFacade.extendingFacade = '';
    classFacade.parent = '';
    classFacade.parentName = '';
    classFacade.inherits = [];
    classFacade.child = '';

    result.classId = classId;
    result.classProperties = classProperties;
    result.classFacade = classFacade;
    result.classData = classData;
    result.publicProperties = publicProperties;
    setObject(classId, result);

    forEach(classProperties,function (val, name) {
      if (val.classId === classFacade.getClassId()) {
        classFacade.addProperty(name, val, false);
      }
    });
    classData.addClassFacade(classId, classFacade);

    classInstance = new cls.clsClassInstance(classId, className);
    classInstance.constructor.name = className;
    result.classInstance = classInstance;
    forEach(publicProperties,function (val, name) {
      classInstance.addPublicProperty(name);
    });
    return classInstance;
  };


  cls.create = function create(className, source) {
    return _create(className, source);
  }

  function getObject(classId) {
    return __allClasses[classId];
  }

  function setObject(classId, result) {
    __allClasses[classId] = result;
  }


  function getClassObjectOfInstance(instance) {
    var classId = instance.getClassId();
    var classObject = getObject(classId);
    return classObject;
  }

  var getClassObjectOfFacade = getClassObjectOfInstance;

  function getFacadeOfInstance(instance) {
    var classId = instance.getClassId();
    var classObject = getObject(classId);
    return classObject.classFacade;
  }

  /**
   * @method _buildChildsInfo
   * @param  {array} instances  array of classId
   * @return {[type]}           [description]
   */
  function _instanceInherits(instance) {
    var allChilds = [];
    // traverse all parents to the first class and collect classId
    var object = getClassObjectOfInstance(instance);
    var facade = object.classFacade;
    var fuse = 1000;
    while (facade.parent !== '' && fuse >= 0) {
      if (facade.parent !== '') {
        object = getObject(facade.parent);
        facade = object.classFacade;
      }
      var classId = facade.getClassId();
      allChilds.push(classId);
      fuse--;
    }
    return allChilds;
  }

  /**
   * extending a class - classical inheritance
   * first argument is a new class name and then
   * @method  extend
   * @param   {string} className
   * @param   {array} classesToExtend to extend, instead of array you can use argument list class1,class2,class3...
   * @returns {Object} extended Class
   */
  function _extend(firstClass, secondClass, classProperties, classData) {

    var args = Array.prototype.slice.call(arguments),
      classes = [],
      instances = [],
      instance = {},
      classId = '',
      classObjects = {},
      classFacade = {},
      secondClassInstance = {},
      secondClassFacade = {},
      secondClassObject = {},
      firstClassInstance = {},
      firstClassFacade = {},
      mixedWith = [];

    if (!cls.isDef(classProperties)) {
      classProperties = new cls.clsClassProperties();
      classData = new cls.clsClassData(classProperties);
    }

    if (firstClass.___type === 'class') {//simple class
      firstClassInstance = _create(firstClass.___className, firstClass, classProperties, classData);
    } else {//extended class
      firstClassInstance = _extend(firstClass.___firstClass, firstClass.___secondClass, classProperties, classData);
    }
    firstClassFacade = getFacadeOfInstance(firstClassInstance);

    if( secondClass.___type === 'class'){//simple class
      secondClassInstance = _create(secondClass.___className, secondClass, classProperties, classData);
    }else{//extended class
      secondClassInstance = _extend(secondClass.___firstClass,secondClass.___secondClass,classProperties, classData);
    }

    secondClassObject = __allClasses[secondClassInstance.getClassId()];
    secondClassFacade = secondClassObject.classFacade;


    //classProperties = secondClassObject.classProperties;
    //classData = secondClassObject.classData;

    // last one is one that we are extending

    secondClassFacade.extend = firstClassInstance.getClassId();
    secondClassFacade.parent = firstClassInstance.getClassId();
    secondClassFacade.parentName = firstClassInstance.getCurrentClassName();
    secondClassFacade.inherits = _instanceInherits(secondClassInstance);
    secondClassFacade.child = '';
    var childId = secondClassFacade.getClassId();
    firstClassFacade.child = childId;


    // we have facades with childOf array containing other classes
    // now we must mix properties in classProperties object so classData can access it and check
    var secondClassId = secondClassInstance.getClassId();
    forEach(classProperties,function (val, key) {
      // adding properties from parent classes
      if (val.classId !== secondClassId) {
        secondClassFacade.addProperty(key, val, false);
        if (cls.typeIs(val, 'public')) {
          secondClassInstance.addPublicProperty(key);
        }
      }
    });

    return secondClassInstance;
  };


  function arrayExtend(array, classProperties, classData) {
    var result = array[0];
    forEach(array,function (val, i) {
      if (i > 0) {
        result = cls.extend(result, val, classProperties,classData);
      }
    });
    return result;
  }


  function constructorExtend(className, source) {
    if( cls.type( className ) === 'string'){
      var nextClass = cls.class(className, source);
      return cls.extend(this, nextClass);
    }else{
      return cls.extend(this,className); //className is cls.class already
    }
  }


  cls.extend = function extend(firstClass, secondClass) {

    if (cls.type(firstClass) === 'array') {
      return arrayExtend(firstClass);
    }

    var classConstructor = function classConstructor() {
        var args = arguments;
        var instance = _extend(firstClass, secondClass);
        fireConstructor( instance, args );
        return instance;
      }
      // if we want another extend we must have source for creation purpose
    classConstructor.___type = 'extend';
    classConstructor.___firstClass = firstClass;
    classConstructor.___secondClass = secondClass;
    classConstructor.___arguments = arguments;
    classConstructor.___className = secondClass.___className;
    classConstructor.isConstructor = true;
    classConstructor.extend = constructorExtend.bind(classConstructor);
    return classConstructor;
  }


  cls.empty = function empty(className){
    return cls.class(className,function(){ return {} });
  }


  cls._getAllFacades = function () {
    var facades = {};
    forEach(__allClasses,function (val, classId) {
      facades[val.classFacade.getCurrentClassName() + '_' + classId] = val.classFacade;
    });
    return facades;
  }

  cls.logParents = function (instance) {
    var classId = instance.getClassId();
    var className = instance.getCurrentName();
    var classFacade = __allClasses[classId].classFacade;
    var parent = classFacade.parent;
    var parentName = classFacade.parentName;
    //console.log(className + '_' + classId, 'have parent', parentName + '_' + parent);
    //console.log(' ->', className, 'inherits', classFacade.inherits);
    if (parent !== '') {
      cls.logParents(__allClasses[parent].classInstance);
    }
  }

  cls.childOf = function (instance) {
    var classId = instance.getClassId();
    var classFacade = __allClasses[classId].classFacade;
    //console.log(classFacade.getCurrentClassName(), 'inherits', classFacade.inherits);
  }

  cls.logProperties = function () {
    forEach(__allClasses,function (obj, classId) {
      var props = obj.classProperties;
      var facade = obj.classFacade;
      //console.log('#class', facade.getCurrentClassName(), facade.getClassId(), 'have properties:');
      forEach(props,function (val, name) {
        //console.log('  ', name, 'with id', val.classId);
      });
    });
  }

  return cls;
}());

if (typeof module !== 'undefined') {
  module.exports = cls;
}
