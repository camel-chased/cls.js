"use strict";
/**
 * cls.js - creating full featured dynamic class system in javascript
 *
 * Author: camel-chased <https://github.com/camel-chased>
 * License: MIT
 */

var cls = ( function () {

  /**
   * Short method for creating class constructor
   *
   * @param {String} name = of the class
   * @param {object} obj = class to extend (optional)
   * @param {object} ext = class structure
   * @returns {object} class constructor that can create instances new myClass()
   */
  var cls = function createClass( name, obj, ext ) {
    return cls.create( name, obj, ext );
  };

  // -------------- builtin helpers ------------------

  /**
   * type - helper for defining variable type
   *
   * @param {Object} obj = the variable
   * @returns {String} typeof
   */
  function _type( obj ) {
    var standardConstructors = [ "Object", "Function", "String", "Number" ];
    if ( typeof obj === 'undefined' ) {
      return 'undefined';
    }
    if ( obj === null ) {
      return 'null';
    }
    if ( obj === undefined ) {
      return 'undefined';
    }

    if ( Array.isArray( obj ) ) {
      return 'array';
    } else if ( typeof obj === 'object' || typeof obj === 'Object' ) {
      if ( _isDef( obj.constructor ) ) {
        if ( _isDef( obj.constructor.name ) ) {
          if ( standardConstructors.indexOf( obj.constructor.name ) === -1 ) {
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
  cls["type"] = _type;
  /**
   * clone - just clone the object recurively
   *
   * @param {Object} o = object to clone
   * @param {Object} to = (optional) defining where to clone
   * @returns {Object} cloned object
   */
  function _clone( o, to ) {
    var clone = {},
      key = '',
      keys,
      i = 0,
      len = 0,
      item,
      value;

    if ( _type( o ) !== 'object' && _type( o ) !== 'array' ) {
      return o;
    }


    if ( _type( o ) === 'array' ) {
      clone = [];
    }

    forEach( o, function ( value, key ) {
      if ( _type( value ) === 'array' || _type( value ) === 'object' ) {
        item = _clone( value );
      } else {
        item = value;
      }

      clone[ key ] = item;
      if ( typeof to !== 'undefined' ) {
        if ( _type( to ) === 'object' || _type( to ) === 'function' ) {
          to[ key ] = item;
        }
      }
    } );
    return clone;
  };

  cls["clone"]=_clone;

  /**
   * merge two objects recursively
   *
   * @param {Object} obj1 = object that will be base
   * @param {Object} obj2 = object to copy from
   * @returns {Object} fresh new object with merget properties
   */
  function _merge( obj1, obj2 ) {

    var key,
      keys = Object.keys( obj2 ),
      len = keys.length,
      i = 0,
      tmp = {},
      _obj2 = _clone( obj2 ),
      obj3 = _clone( obj1 );


    for ( ; i < len; i++ ) {
      key = keys[ i ];
      if ( _type( _obj2[ key ] ) === 'object' && _type( obj1[ key ] ) === 'object' ) {
        tmp = _merge( obj3[ key ], _obj2[ key ] );
        obj3[ key ] = tmp;
      } else {
        obj3[ key ] = _obj2[ key ];
      }
    }
    return obj3;
  };

  cls["merge"]=_merge;

  var hasOwn = Object.prototype.hasOwnProperty;
  var toString = Object.prototype.toString;

  function forEach( obj, fn, ctx ) {
    if ( toString.call( fn ) !== '[object Function]' ) {
      throw new TypeError( 'iterator must be a function' );
    }
    if ( !_isDef( obj ) ) {
      throw new Error( "Object is undefined." );
    }
    var l = obj.length;
    if ( l === +l ) {
      for ( var i = 0; i < l; i++ ) {
        fn.call( ctx, obj[ i ], i, obj );
      }
    } else {
      for ( var k in obj ) {
        if ( hasOwn.call( obj, k ) ) {
          fn.call( ctx, obj[ k ], k, obj );
        }
      }
    }
  };

  cls["forEach"]=forEach;
  /**
   * freeze objects recuresively
   *
   * @param {Object} obj
   * @returns {Object} freezed object
   */
  function _freeze( obj ) {
    if ( typeof obj === 'undefined' )
      return undefined;

    var propNames = Object.getOwnPropertyNames( obj );
    forEach( propNames, function ( name ) {
      var prop = obj[ name ];
      if ( typeof prop === 'object' && !Object.isFrozen( prop ) ) {
        cls.freeze( prop );
      }
    } );

    return Object.freeze( obj );
  };

  /**
   * isDef is just isDefined checking fn
   *
   * @param {any} val
   * @returns {Boolean}
   */
  function _isDef( val ) {
    return typeof val !== 'undefined' && val !== null;
  };

  /**
   * guid - generate unique id for classes or something
   *
   * @returns {String}
   */
  function _guid() {
    function s4() {
      return Math.floor( ( 1 + Math.random() ) * 0x10000 )
        .toString( 16 )
        .substring( 1 );
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  };

  cls["guid"] = _guid;

  /**
   * converts default parameters to its type like string, number, object
   * @method convertParamDefault
   * @param {string} types ; only firs type is converted
   * @param {string} value
   * @returns {Array|Object|Boolean}
   */
  function convertParamDefault( types, value ) {

    var tmp = '',
      i = 0,
      type;

    type = types[ 0 ];

    type = type.toLowerCase();

    if ( _isDef( value ) ) {
      if ( _type( value ) === 'string' ) {
        tmp = value.toLowerCase();
        if ( tmp === 'undefined' || tmp === 'null' ) {
          switch ( tmp ) {
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

    switch ( type ) {
    case 'string':
      if ( value.substr( 0, 1 ) === "'" || value.substr( 0, 1 ) === '"' ) {
        value = value.replace( /^[\'\"]{1}([^\'\"]+)[\'\"]{1}$/gi, "$1" );
      }
      break;
    case 'number':
      value = Number( value );
      break;
    case 'object':
      value = JSON.parse( value );
      break;
    case 'array':
      value = JSON.parse( value );
      break;
    case 'bool':
    case 'boolean':
      if ( value.toLowerCase() === 'true' ) {
        value = true;
      } else if ( value.toLowerCase() === 'false' ) {
        value = false;
      } else {
        throw new Error( "Boolean values must be either true or false." );
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
  function generateArgumentTypes( classType ) {

    var params = /^\s?\@param\s+\{([^\}]+)\}\s([a-z0-9\_\$]+)\s?(?:\=\s?([^\n]+))?\s?$/gim,
      tmp = params.exec( classType.str ),
      paramDef = {};
    classType.arguments = [];

    if ( _isDef( tmp ) ) {

      if ( tmp.length < 3 ) {
        throw new Error( "Variable declaration is incorrect." );
      }
      if ( _isDef( tmp[ 1 ] ) && _isDef( tmp[ 2 ] ) ) {

        paramDef = {
          types: tmp[ 1 ].split( '|' ),
          name: tmp[ 2 ]
        };
        if ( _isDef( tmp[ 3 ] ) ) {
          paramDef.default = convertParamDefault( tmp[ 1 ].split( '|' ), tmp[ 3 ] );
        }

        classType.arguments.push( paramDef );

      } else {
        throw new Error( "Variable declaration is incorrect." );
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
  function checkDeclarations( declarations, className, propName, isMethod ) {

    var ok = true;

    if ( declarations.length > 2 )
      return false;
    if ( declarations.indexOf( 'public' ) !== -1 && declarations.indexOf( 'private' ) !== -1 )
      ok = false;
    if ( declarations.indexOf( 'public' ) !== -1 && declarations.indexOf( 'protected' ) !== -1 )
      ok = false;
    if ( declarations.indexOf( 'private' ) !== -1 && declarations.indexOf( 'protected' ) !== -1 )
      ok = false;
    if ( declarations.indexOf( 'const' ) !== -1 && isMethod ) {
      ok = false;
    }
    if ( declarations.indexOf( 'final' ) !== -1 && !isMethod ) {
      ok = false;
    }
    if ( !ok ) {
      throw new Error( "Property declarations in class [" + className + "] property [" + propName +
        "] are incorrect." );
    }
    return ok;
  };



  function propertyTypeMismatch( className, property, available, wasType ) {
    if ( Array.isArray( available ) ) {
      available = available.join( ',' );
    }
    throw new Error( "Type mismatch in class [ " + className + " ] property [ " +
      property + " ] should be " + available + ", '" + wasType + "' given." );
  };

  function ArgumentTypeMismatch( className, method, argument, available, wasType ) {
    if ( Array.isArray( available ) ) {
      available = available.join( ',' );
    }
    throw new Error( "Type mismatch in class [ " + className + " ] method [ " +
      method + " ] argument [ " + argument + " ] should be " + available + ", '" + wasType + "' given." );
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
  function checkClassPropertyType( classObject, key, val ) {

    if ( _isDef( classObject.classProperties[ key ] ) ) {
      if ( _isDef( classObject.classProperties[ key ].types ) ) {
        //console.log('property type',key,classProperties[key].types);

        if ( classObject.classProperties[ key ].types.indexOf( _type( val ) ) === -1 &&
          classObject.classProperties[ key ].types[ 0 ] !== 'anytype' ) {
          var className = classObject.classInstance.getCurrentClassName(),
            availableTypes = classObject.classProperties[ key ].types.join( "," );
          propertyTypeMismatch( className, key, availableTypes, _type( val ) );
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
  function checkMethodArgTypes( classObject, methodName, args ) {

    var params,
      val, type = '',
      i = 0,
      newArgs = [],
      className;

    if ( _isDef( classObject.classProperties[ methodName ] ) ) {
      if ( _isDef( classObject.classProperties[ methodName ].arguments ) ) {

        params = classObject.classProperties[ methodName ].arguments;
        if ( params.length === 0 ) {
          // if there is no argument declarations
          return Array.prototype.slice.call( args );
        }

        for ( i in params ) {
          val = params[ i ];

          if ( !Object.prototype.hasOwnProperty.call( params, i ) ) {
            continue;
          }


          if ( !_isDef( args[ i ] ) ) {

            if ( _isDef( val.default ) ) {

              newArgs[ i ] = val.default;

            } else if ( val.types.indexOf( 'undefined' ) ) {

              newArgs[ i ] = undefined;

            } else {
              ArgumentTypeMismatch( classObject.classInstance.getCurrentClassName(), methodName, val.name, val.types,
                'undefined' );
            }
          } else {
            newArgs[ i ] = args[ i ];
          }

          type = _type( newArgs[ i ] );
          if ( type === 'clsClassInstance' ) {

            className = classObject.classFacade.getClassName();
            canBeClass( newArgs[ i ], val.types, className, val.name );

          } else {

            if ( val.types.indexOf( type ) === -1 && val.types[ 0 ] !== 'anytype' ) {
              ArgumentTypeMismatch( classObject.classInstance.getCurrentClassName(), methodName, val.name, val.types,
                type );
            }
          }

        }

      } else {
        return Array.prototype.slice( args );
      }
    } else {
      throw new Error( "There is no such method like ", methodName );
    }

    return newArgs;
  };


  function checkReturnValue( classId, methodName, value ) {

    var obj = getObject( classId );
    var classProperties = obj.classProperties;
    var currentType = _type( value );
    var facade = obj.classFacade;
    var className = facade.getClassName();

    if ( currentType === 'clsClassInstance' ) {
      currentType = value.getClassName();
    }

    if ( !_isDef( classProperties[ methodName ] ) ) {
      throw new Error( "There is no method called '" + methodName + "' in [ " + className + " ] class." );
    }

    var returns = classProperties[ methodName ].returns;

    if ( returns.indexOf( 'anytype' ) >= 0 ) {
      if( currentType === 'clsClassFacade'){
        return obj.classInstance;
      }
      return value;
    }

    if ( returns.indexOf( currentType ) === -1 ) {
      throw new Error( "Type mismatch. Method [ " + methodName + " ] from [ " + className +
        " ] class, should return '" +
        returns.join( ',' ) + "', not '" + currentType + "'." );
    }

    // if some method returns "this" we must replace it with instance instead of
    // facade that have access to all properties
    // when returning "this" in methods we are gettting instance instead of facade
    if( currentType === 'clsClassFacade'){
      return obj.classInstance;
    }

    return value;
  }



  /**
   * filter class properties by declaration type like public, private etc
   * if classId is defined then fn return only delcarations of specified class
   * @method getClassPropertiesOf
   * @param {object} classObject
   * @param {string} declarationName
   * @param {string} classId
   * @returns {object} propertyName -> propertyValue
   */
  function getClassPropertiesOf( classProperties, declarationName, classId ) {

    var result = {},
      name = '',
      type;

    //console.log('classObject',classObject);
    for ( name in classProperties ) {
      type = classProperties[ name ];
      //console.log('type',type);
      if ( _isDef( type.declarations ) ) {
        //console.log('declaration',type.declarations);
        if ( type.declarations.indexOf( declarationName ) !== -1 ) {
          // now we are going to check classId if it exists
          if ( _isDef( classId ) ) {

            //console.log('type.classId',type.classId,classId);
            if ( type.classId === classId ) {
              result[ name ] = type.value;
            }

          } else {
            result.push( name );
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
  function checkObjectContentTypes( is, should, path ) {

    var keys = Object.keys( is ),
      len = keys.length,
      i = 0,
      key = '',
      isVal,
      shouldVal,
      isType = '',
      shouldType = '',
      recursiveOk = true;

    if ( !_isDef( path ) ) {
      path = '';
    }

    for ( ; i < len; i++ ) {
      key = keys[ i ];

      if ( !_isDef( should[ key ] ) ) {
        continue;
      }

      isVal = is[ key ];
      shouldVal = should[ key ];

      isType = _type( isVal );
      shouldType = _type( shouldVal );

      if ( isType === 'object' || isType === 'function' ) {

        recursiveOk = checkObjectContentTypes( isVal, shouldVal, path + '.' + key );
        if ( !recursiveOk ) {
          return false;
        }

      } else {
        if ( isType !== shouldType ) {
          path = path + '.' + key;
          path = path.substr( 1 );
          throw new Error( "Type mismatch. Object property [ " + path + " ] should be an " + shouldType + ".\n'" +
            isType + "' given." );
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
  cls["var"] = function ( obj, path ) {

    var newObj = {},
      key = '',
      keys = '',
      i = 0,
      len = 0,
      type = '',
      val;

    if ( !_isDef( path ) ) {
      path = '';
    }

    keys = Object.keys( obj );
    //console.log('traversing ',obj,keys);
    for ( len = keys.length; i < len; i++ ) {
      key = keys[ i ];
      val = obj[ key ];
      type = _type( val );


      ( function ( newObj, val, key, type, obj, path ) {
        var newType = '',
          keys = [],
          contentOk = true,
          tmp = {};

        if ( type === 'object' || type === 'function' ) {

          tmp = cls.var( obj[ key ], path + '.' + key );
          Object.defineProperty( newObj, key, {
            get: function () {
              return tmp;
            },
            set: function ( newVal ) {
              var newType = _type( newVal );
              if ( newType !== type && type !== 'anytype' ) {
                path = path + '.' + key;
                path = path.substr( 1 );
                throw new Error( "Type mismatch. Object [ " + path + " ] should be an " + type + ".\n'" +
                  newType + "' given." );
              } else {
                // newVal is object or function
                contentOk = checkObjectContentTypes( newVal, obj[ key ], path + '.' + key );
                if ( contentOk ) {
                  obj[ key ] = tmp;
                }
              }
            }
          } );

        } else {

          Object.defineProperty( newObj, key, {
            //getting object from old object
            get: function () {
              return obj[ key ];
            },
            //setting object to old object
            set: function ( newVal ) {

              newType = _type( newVal );
              if ( newType !== type && type !== 'anytype' ) {
                path = path + '.' + key;
                path = path.substr( 1 );
                throw new Error( "Type mismatch. Object [ " + path + " ] should be an " + type + "," );
              } else {
                // this is a basic type and is verified just assign it
                obj[ key ] = newVal;
              }
            }
          } );
        }

      }( newObj, val, key, type, obj, path ) );

    }

    return newObj;
  };

  var COMMENT_BLOCK = '\\/\\*\\*?\\s*([^\\/]+)';
  var METHOD_REG = '^\\s?\\@method[ \\t]+([^\\s]+)[ \\t]*(?:([^\\n\\r \\t]+))?(?:[ \\t]+([^\\n\\r]+))?\\s?$';
  var PROPERTY_REG =
    '^\\s?\\@property[ \\t]+\\{([^\\}]+)\\}[ \\t]+([^ \\t\\r\\n]+)[ \\t]*([^\\s\\*\\/]+)?(?:[ \\t]+([^\\n\\r\\/]+))?$';
  var RETURNS_REG = '^\\@returns?\[ \\t]+\\{([^\\}]+)\\}';
  var STATIC_METHOD_PROPERTY = '^\\s?\\@(method|property)[ \\t]+(?:\\{.*\\})?[ \\t]?(.*)(?:static)';
  var METHOD_PROPERTY =
    '^\\s?\\@(method|property)[ \\t]+(?:\\{[a-z0-9_\\$\\|]+\\})?[ \\t]?([a-z0-9_\\$]+)?(?:[ \\t]+([a-z]+))?';


  function cleanOutCommentBlock( tmp ) {
    var result = String( tmp[ 1 ] ).
    replace( /^[\t\*]+/gim, '' ).
    replace( /[\*]+/gim, '' ).
    replace( /^[ \t\n]{2,50}/gi, '' ).
    replace( /\n/gi, '' ).
    replace( /(\@)/gi, "\n$1" ).
    replace( /^\s+/gim, '' ).
    replace( /\s+$/gim, '' ).trim();
    return result;
  }

  function prepareMethod( oneCommentBlockStr, sourceObject, classId, classProperties ) {

    var blocks = {};
    var method = new RegExp( METHOD_REG, "gim" );
    var obj = sourceObject.obj;
    var className = sourceObject.className;
    var returns = new RegExp( RETURNS_REG, "gim" );
    var returnObj;
    var declarations = [];
    var staticProp = false;
    if ( !_isDef( classId ) ) {
      staticProp = true;
    }

    var methodObj = method.exec( oneCommentBlockStr );
    //console.log(methodObj);
    if ( _isDef( methodObj ) ) {

      var methodName = methodObj[ 1 ];

      if ( !staticProp ) {
        if ( !canOverride( classProperties, methodName, classId ) ) {
          throw new Error( "Cannot override '" + methodName + "' method." );
        }
      }

      if ( !_isDef( obj[ methodName ] ) ) {
        throw new Error( "Property '" + methodName + "' is declared but not defined in [ " + className +
          " ] class." );
      }
      blocks[ methodName ] = {
        'types': [ 'function' ]
      };
      // ---------------- IMPORTANT ------------------
      // if there is no classId it means that this is static property
      blocks[ methodName ].classId = 'static:' + className;
      if ( _isDef( classId ) ) {
        blocks[ methodName ].classId = classId;
      }
      blocks[ methodName ].className = className;
      blocks[ methodName ].value = obj[ methodName ];
      // ---------------- IMPORTANT ------------------

      if ( methodObj.length === 4 ) {
        if ( _isDef( methodObj[ 2 ] ) ) {
          // declaration is an array like ['public','final']
          declarations = [ methodObj[ 2 ] ];
          if ( _isDef( methodObj[ 3 ] ) ) {
            declarations.push( methodObj[ 3 ] );
          }
          if ( staticProp && declarations.indexOf( 'static' ) === -1 ) {
            throw new Error( "It should  be static property or classId is undefined." );
          }
          if ( checkDeclarations( declarations, className, methodName, true ) ) {
            blocks[ methodName ].declarations = declarations;
          }
          //define public property only when they are undeclared
        } else if ( !_isDef( blocks[ methodName ].declarations ) ) {
          blocks[ methodName ].declarations = [ 'public' ];
        }
      }
      blocks[ methodName ].str = oneCommentBlockStr;

      generateArgumentTypes( blocks[ methodName ] );
      // if this is a method it should have a return value
      returnObj = returns.exec( oneCommentBlockStr );
      if ( _isDef( returnObj ) ) {
        blocks[ methodName ].returns = returnObj[ 1 ].split( '|' );
        forEach( blocks[ methodName ].returns, function ( val, key ) {
          if ( val.toLowerCase() === 'type' || val.toLowerCase() === '[type]' ) {
            blocks[ methodName ].returns[ key ] = 'anytype';
          }
        } );
      }
      checkClassProperty( blocks[ methodName ], className, methodName, staticProp );

    } else {
      throw new Error( "I see death people." );
    }
    // if we have classProperties it means that we must put this method there
    if ( _isDef( classProperties ) ) {
      classProperties[ methodName ] = blocks[ methodName ];
    }
    return [ methodName, blocks[ methodName ] ];
  }


  function prepareProperty( oneCommentBlockStr, sourceObject, classId, classProperties ) {

    var className = sourceObject.className;
    var obj = sourceObject.obj;
    var blocks = {};
    var propertyReg = new RegExp( PROPERTY_REG, "gim" );
    var propertyObj;
    var propertyName;
    var staticProp = false;
    if ( !_isDef( classId ) ) {
      staticProp = true;
    }

    propertyObj = propertyReg.exec( oneCommentBlockStr );
    if ( _isDef( propertyObj ) ) {
      propertyName = propertyObj[ 2 ];

      if ( !staticProp ) {
        if ( !canOverride( classProperties, propertyName, classId ) ) {
          throw new Error( "Cannot override '" + propertyName + "' property." );
        }
      }

      blocks[ propertyName ] = {};
      blocks[ propertyName ].str = oneCommentBlockStr;
      blocks[ propertyName ].types = propertyObj[ 1 ].split( '|' );
      blocks[ propertyName ].value = obj[ propertyName ];

      // ---------------- IMPORTANT ------------------
      blocks[ propertyName ].classId = 'static:' + className;
      if ( _isDef( classId ) ) {
        blocks[ propertyName ].classId = classId;
      }
      blocks[ propertyName ].className = className;

      // ---------------- IMPORTANT ------------------

      if ( _isDef( propertyObj[ 3 ] ) ) {
        // declaration is an array 3 and 4['public','final']
        var declarations = [ propertyObj[ 3 ] ];
        if ( _isDef( propertyObj[ 4 ] ) ) {
          declarations.push( propertyObj[ 4 ] );
        }
        if ( staticProp && declarations.indexOf( 'static' ) === -1 ) {
          throw new Error( "It should  be static property or classId is undefined." );
        }
        if ( checkDeclarations( declarations, className, propertyName, false ) ) {
          blocks[ propertyName ].declarations = declarations;
        }
        // public only when undeclared
      } else if ( !_isDef( blocks[ propertyName ].declarations ) ) {
        blocks[ propertyName ].declarations = [ 'public' ];
      }
    } else {
      throw new Error( "I see death people." );
    }

    checkClassProperty( blocks[ propertyName ], className, propertyName, staticProp );

    if ( _isDef( classProperties ) ) {
      classProperties[ propertyName ] = blocks[ propertyName ];
    }
    return [ propertyName, blocks[ propertyName ] ];
  }


  function parseComments( sourceObject, className, regex, classId, classProperties ) {

    if ( regex === null || typeof regex === 'undefined') {
      regex = METHOD_PROPERTY;
    }
    var str = sourceObject.str;
    var obj = sourceObject.obj;
    var regblock = new RegExp( COMMENT_BLOCK, "gim" );
    var regmp = new RegExp( regex, "gim" );
    var mp = '';
    var proptype = '';
    var propname = '';
    var tmp = [];
    var cleanStr = '';
    var result = {}; //object with declarations types and so on
    var method, property;

    while ( _isDef( tmp ) ) {
      tmp = regblock.exec( str );
      if ( _isDef( tmp ) ) {
        cleanStr = cleanOutCommentBlock( tmp );
        regmp.lastIndex = 0;
        mp = regmp.exec( cleanStr );
        if ( _isDef( mp ) ) {
          proptype = mp[ 1 ].trim();
          propname = mp[ 2 ].trim();
          result[ propname ] = {};

          if ( proptype === 'method' ) {
            method = prepareMethod( cleanStr, sourceObject, classId, classProperties );
            result[ method[ 0 ] ] = method[ 1 ];
          } else if ( proptype === 'property' ) {
            property = prepareProperty( cleanStr, sourceObject, classId, classProperties );
            result[ property[ 0 ] ] = property[ 1 ];
          }
          if ( typeof obj[ propname ] === 'undefined' ) {
            throw new Error( "Class " + proptype + " [ " + propname + " ] is declared but not defined in [ " +
              className + " ] class." );
          }

        }

      }
    }
    return result;
  }

  function resolveStatic( obj, constructor ) {
    var staticValues = {};

    forEach( obj, function ( property, name ) {
      staticValues[ name ] = property.value;
      Object.defineProperty( constructor, name, {
        enumerable: true,
        get: function () {
          if( typeof property.value === 'function' ){
              return property.value.bind(staticValues);
          }else{
            return property.value;
          }
        }
      } );
    } );
  }


  /**
   * checking classProperty object, if some values are empty then fill it with defaults
   * WARNING: don't use it as constructor this function only for checking filling with default
   * @method  classProperty
   * @param   {object} data
   *          data contains: classId, value, declarations, types, arguments, returns
   * @returns {object} classProperty
   */
  function checkClassProperty( data, className, propertyName, staticProp ) {

    var self = this;
    var posibleDeclarations = [ 'public', 'protected', 'private', 'static', 'const', 'final' ];
    var currentType = '';

    if ( _isDef( data ) ) {

      if ( !_isDef( staticProp ) ) {
        staticProp = false;
      }
      if ( !staticProp ) {
        if ( !_isDef( data.classId ) ) {
          throw new Error( "classId is not defined" );
        }
      }
      /* value can be undefined of corse
      if (!_isDef(data.value)) {
        throw new Error("value is not defined");
      }*/
      if ( !_isDef( data.declarations ) ) {
        data.declarations = [ 'public' ];
      } else {
        if ( _type( data.declarations ) !== 'array' ) {
          throw new Error( "Property declarations must be an array of string at [ " + className + " ] [ " +
            propertyName + " ]" );
        } else {
          forEach( data.declarations, function ( val ) {
            if ( _type( val ) !== 'string' ) {
              throw new Error( "Property declaration must be a string at [ " + className + " ] [ " +
                propertyName + " ]" );
            }
            if ( posibleDeclarations.indexOf( val ) === -1 ) {
              throw new Error( "Unrecognized property declaration: '" + val + "' for property [ " +
                propertyName + " ] in class [ " + className + " ]" );
            }
          } );
        }
      }
      // default data types
      if ( !_isDef( data.types ) ) {
        if ( _type( data.value ) === 'function' ) {
          data.types = [ 'function' ];
        } else {
          data.types = [ 'anytype' ];
        }
      }

      // if there are delcared types we must check it
      if ( _isDef( data.types ) ) {
        currentType = _type( data.value );
        // if value is a classInstance then check className instead

        if ( currentType === 'clsClassInstance' ) {
          canBeClass( data.value, data.types, className, propertyName );
        } else if ( data.types.indexOf( currentType ) === -1 ) {
          if ( data.types.indexOf( 'anytype' ) === -1 ) {
            throw new Error( "Property value doesn't match declaration at [ " + className + " ] [ " + propertyName +
              " ]\nExpected: '" + data.types + "' given: '" + currentType + "'." );
          }
        }
      }


      // default returns if this is a function
      if ( data.types.indexOf( 'function' ) !== -1 && !_isDef( data.returns ) ) {
        data.returns = [ 'anytype' ];
      }

      //default arguments if this is a function
      if ( data.types.indexOf( 'function' ) !== -1 && !_isDef( data.arguments ) ) {
        data.arguments = [];
      }

      if ( _type( data.value ) === 'function' ) {
        if ( _type( data.arguments ) === 'undefined' ) {
          data.arguments = [];
        }
      }

    } else {
      throw new Error( "Cannot create property from empty object." );
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
  function defaultClassType( classId, name, value, classProperties, declarations, className ) {

    var data = classProperties[ name ] ? classProperties[ name ] : {};

    if ( !_isDef( data.classId ) ) data.classId = classId;
    if ( !_isDef( data.value ) ) data.value = value;
    if ( _isDef( declarations ) ) data.declarations = declarations;
    checkClassProperty( data, className, name );
    //only if there is no value already
    if ( !_isDef( classProperties[ name ] ) ) classProperties[ name ] = data;
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
  function classPropertiesFromFunction( className, sourceObject, classId, classProperties ) {

    var objStr = sourceObject.str,
      result = {},
      obj = sourceObject.obj,
      name = '';


    // !IMPORTANT    -------    here properties are set if they have commentBlock
    // if some property doesn't have coment block then it is created below in foreach

    parseComments( sourceObject, className, null, classId, classProperties );

    // setting up property.value and default parameters if needed
    forEach( obj, function ( value, name ) {
      defaultClassType( classId, name, value, classProperties, undefined, className );

      // if this is my property then i can add it, even if it already exists - created by getCommentBlocks
      // it is mine and i can do whatever i want - this is class from function
      // so there is no way to override object properties now
      if ( classProperties[ name ].classId === classId ) {
        classProperties[ name ].value = value;
      } else {
        if ( canOverride( classProperties, name, classId ) ) {
          classProperties[ name ].value = value;
        }
      }
    } );
    return classProperties;
  };


  /**
   * checking if we can override some methods or redefine properties
   * @method  canOverride
   * @param   {object}    classProperties [description]
   * @param   {string}    propertyName    [description]
   * @param   {string}    classId         [description]
   * @returns {boolean}                   [description]
   */
  function canOverride( classProperties, propertyName, classId ) {
    var result = true;
    if ( !_type( classProperties ) === 'object' ) {
      throw new Error( "Wrong class properties object." );
    }
    if ( !_isDef( classProperties[ propertyName ] ) ) {
      return true;
    } else {

      if ( _isType( classProperties[ propertyName ], 'final' ) || _isType( classProperties[ propertyName ],
          'const' ) || _isType( classProperties[ propertyName ], 'static' ) ) {
        throw new Error( "Cannot override '" + propertyName + "'." );
        return false;
      } else {
        return true;
      }
    }
  }

  /**
   * add property to classProperties - check declarations and fill with default values if needed
   * this function is used to generate class from object
   * @method  function
   * @param   {[type]} classProperties [description]
   * @param   {[type]} name [description]
   * @param   {[type]} data [description]
   * @returns {[type]} [description]
   */
  function _addToClassProperties( classProperties, name, data, classId ) {
    if ( _type( data ) === 'undefined' || _type( data ) === 'null' ) {
      throw new Error( "Cannot add property from empty object." );
    }
    if ( _type( data.classId ) === 'undefined' ) {
      data.classId = classId;
    }
    var obj = getObject( classId );
    var facade = obj.classFacade;
    var className = facade.getClassName();
    if ( canOverride( classProperties, name, data.classId ) ) {
      checkClassProperty( data, className, name );
      classProperties[ name ] = data;
    }
  };

  /**
   * generate properties from object which contain property information instead of function with comment blocks
   * @method  function
   * @param   {[type]} className [description]
   * @param   {[type]} source [description]
   * @param   {[type]} classId [description]
   * @param   {[type]} classProperties [description]
   * @returns {[type]} [description]
   */
  function classPropertiesFromObject( className, sourceObject, classId, classProperties ) {
    forEach( sourceObject.source, function ( property, name ) {
      property.classId = classId;
      var staticProp = false;
      if( _isDef( property.declarations )){
        staticProp = property.declarations.indexOf('static') >= 0;
      }
      checkClassProperty( property, className, name, staticProp );
      classProperties[ name ]=property;
    } );
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
  function generateClassProperties( className, sourceObject, classId, classProperties ) {

    if ( !_isDef( classProperties ) ) {
      //console.log("\n\n",'creating new classProperties',"\n\n");
      classProperties = new clsClassProperties();
    }

    if ( _type( sourceObject.source ) === 'function' ) {
      classPropertiesFromFunction( className, sourceObject, classId, classProperties );
    } else if ( _type( sourceObject.source ) === 'object' ) {
      classPropertiesFromObject( className, sourceObject, classId, classProperties );
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
  function _typeIs( type, declaration ) {
    var index = type.declarations.indexOf( declaration );
    return index >= 0;
  };
  var _isType = _typeIs;
  /**
   * classInstance constructor - instance is an outside world object
   * @method  clsClassInstance
   * @param   {[type]} classId [description]
   * @param   {[type]} className [description]
   * @param   {[type]} childOf [description]
   * @param   {[type]} mixedWith [description]
   * @returns {[type]} [description]
   */
  function clsClassInstance( classId, className, childOf, mixedWith ) {

    this.getClassId = getClassId.bind( this, classId );
    this.getCurrentClassName = getCurrentClassName.bind( this, className );
    this.getClassName = getClassName.bind( this, classId );

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
  function ___addPublicProperty( propertyName ) {
    var classId = this.getClassId();
    var className = this.getCurrentClassName();
    var self = this;
    var classObject = __allClasses[ classId ];
    var classProperties = classObject.classProperties;
    var classData = classObject.classData;

    if ( !classProperties.propertyExists( propertyName ) ) {
      throw new Error( "'" + propertyName + "' doesn't exists" );
    }

    // property declaration must exists here so
    if ( classProperties[ propertyName ].declarations.indexOf( 'public' ) === -1 ) {
      throw new Error( "'" + propertyName + "' is not public property and cannot be added to instance." );
    }

    if ( !_isDef( self[ propertyName ] ) ) {
      Object.defineProperty( self, propertyName, {
        enumerable: true,
        get: function () {
          return classData.get( classId, propertyName );
        },
        set: function ( newValue ) {
          return classData.set( classId, className, propertyName, newValue );
        }
      } );
    }
  };
  Object.defineProperty( clsClassInstance.prototype, '___addPublicProperty', {
    enumerable: false,
    configureable: false,
    get: function () {
      return ___addPublicProperty;
    }
  } );


  /**
   * classProperties constructor
   * @method  clsClassProperties
   * @returns {[type]} [description]
   */
  function clsClassProperties() {

  };

  clsClassProperties.prototype.propertyExists = function ( propertyName ) {
    return _isDef( this[ propertyName ] );
  };

  function getClassId( classId ) {
    return classId;
  }

  function getCurrentClassName( className ) {
    return className;
  }

  function getClassName( classId ) {

    var obj = getObject( classId );
    var facade = obj.classFacade;
    var child = facade.child;

    //console.log("--getting class child",child);

    while ( child !== '' ) {
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
  function clsClassFacade( classId, className ) {

    this.getClassId = getClassId.bind( this, classId );
    this.getCurrentClassName = getCurrentClassName.bind( this, className );
    this.getClassName = getClassName.bind( this, classId );
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
  function ___addProperty( propertyName, data, addToClassProperties, classId,
    inhertiance ) {

    if ( !_isDef( classId ) ) {
      classId = this.getClassId();
    }
    //console.log('facade.___addProperty',classId);
    var className = this.getCurrentClassName();
    var classObject = __allClasses[ classId ];
    var classData = classObject.classData;
    var self = this;

    if ( !_isDef( addToClassProperties ) ) {
      addToClassProperties = false;
    }
    if ( addToClassProperties === true ) {
      _addToClassProperties( classObject.classProperties, propertyName, data, classId );
    }

    checkPropertyType( classId, className, data.value, propertyName );

    if ( !_isDef( self[ propertyName ] ) ) {
      // from now we can only set properties through setter - we cannot defineProoperty that is already defined
      Object.defineProperty( self, propertyName, {
        enumerable: true,
        get: function () {
          return classData.get( classId, propertyName );
        },
        set: function ( newVal ) {
          return classData.set( classId, className, propertyName, newVal );
        }
      } );
    } else if ( data.value !== classObject.classProperties[ propertyName ].value ) {
      // it means that we are creating new value
      // if there is property we must check if we can override it
      if ( canOverride( classObject.classProperties, propertyName, classId ) ) {
        self[ propertyName ] = data.value;
      }
    }

    // we cannot add property to instance here because it may not exists yet
    // instaces will have their own prototype function to adding public properties
  };
  Object.defineProperty( clsClassFacade.prototype, '___addProperty', {
    enumerable: false,
    configureable: false,
    get: function () {
      return ___addProperty;
    }
  } )

  /**
   * dynamically add property to class instance like mixin with only one property
   * data is object with classId, declarations, arguments, returns, type and so on
   * only data.value is required to work - rest values will be default ones if not declared
   * @method addToInstance
   * @param  {string}      propertyName [description]
   * @param  {object}      data         [description]
   */
  function addToInstance( propertyName, data ) {
    var classId = this.getClassId();
    var obj = getObject( classId );
    var instance = obj.classInstance;

    this.___addProperty( propertyName, data, true, classId );
    if ( data.declarations.indexOf( 'public' ) !== -1 ) {
      instance.___addPublicProperty( propertyName );
    }
  }
  Object.defineProperty( clsClassFacade.prototype, 'addToInstance', {
    enumerable: false,
    configureable: false,
    get: function () {
      return addToInstance;
    }
  } );

  /**
   * runtime mixin inside class instance
   * obj key = name of the property/method and value is an object declaring
   * how property should behave like addToInstance
   * @method  mixWithObject
   * @param   {[type]} obj [description]
   * @returns {[type]}     [description]
   */
  function mixWithObject( obj ) {
    var self = this;
    forEach( obj, function ( val, name ) {
      self.addToInstance( name, val );
    } );
  }
  Object.defineProperty( clsClassFacade.prototype, 'mixWithObject', {
    enumerable: false,
    configureable: false,
    get: function () {
      return mixWithObject;
    }
  } );


  /**
   * get property as object from classProperties
   * WARNING!!! be careful because if you modify this property it will affect class instance
   * this is not a clone!
   * @method  getInternalProperty
   * @param   {[type]} propertyName [description]
   * @returns {[type]}              [description]
   */
  function getInternalProperty( propertyName ) {
    var classId = this.getClassId();
    var className = this.getClassName();
    var obj = getObject( classId );
    var properties = obj.classProperties;
    if ( _isDef( properties[ propertyName ] ) ) {

      return properties[ propertyName ];

    } else {
      throw new Error( "Property '" + propertyName + "' doesn't exists in [ " + className + " ] class." );
    }
  }
  Object.defineProperty( clsClassFacade.prototype, 'getInternalProperty', {
    enumerable: false,
    configureable: false,
    get: function () {
      return getInternalProperty;
    }
  } );


  /**
   * get all properties as object from classProperties
   * WARNING!!! be careful because if you modify this property it will affect class instance
   * this is not a clone!
   * @method  getInternalProperty
   * @param   {[type]} propertyName [description]
   * @returns {[type]}              [description]
   */
  function getInternalProperties() {
    var classId = this.getClassId();
    var className = this.getClassName();
    var obj = getObject( classId );
    var properties = obj.classProperties;
    return properties;
  }
  Object.defineProperty( clsClassFacade.prototype, 'getInternalProperties', {
    enumerable: false,
    configureable: false,
    get: function () {
      return getInternalProperties;
    }
  } );

  /**
   * constructor for classData object
   * @method  clsClassData
   * @param   {[type]} classProperties [description]
   * @returns {[type]} [description]
   */
  function clsClassData( classProperties ) {
    this.classFacades = {}; // key->value by classId
    this.classProperties = classProperties;
  };

  /**
   * add another facade to array, needed for binding purpose
   * @method addClassFacade
   * @param  {[type]} classId [description]
   * @param  {[type]} classFacade [description]
   */
  clsClassData.prototype.addClassFacade = function addClassFacade( classId, classFacade ) {
    this.classFacades[ classId ] = classFacade;
  };

  /**
   * checking if property exists in classData object
   * @method  propertyExists
   * @param   {[type]} propertyName [description]
   * @returns {[type]} [description]
   */
  clsClassData.prototype.propertyExists = function propertyExists( propertyName ) {
    return _isDef( this.classProperties ) && _isDef( this.classProperties[ propertyName ] );
  };

  /**
   * checking if some class can get property because of inheritance or mix
   * @method  function
   * @param   {[type]} classId [description]
   * @param   {[type]} propertyName [description]
   * @returns {[type]} [description]
   */
  clsClassData.prototype.mixedWithOrChildOfPropertyOwner = function ( classId, propertyName ) {

    var facade = this.classFacades[ classId ];
    var property = this.classProperties[ propertyName ];

    if ( classId === facade.getClassId() ) {
      return true;
    }
    if ( facade.mixedWith.indexOf( property.classId ) ) {
      return true;
    }
    if ( facade.inherits.indexOf( property.classId ) ) {
      return true;
    }

    return false;
  };

  function getName( classId ) {
    var obj = getObject( classId );
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
  clsClassData.prototype.get = function get( classId, propertyName ) {

    function preMethod() {
      var _args = arguments;
      _args = checkMethodArgTypes( obj, propertyName, _args );
      var result = property.value.apply( facade, _args );
      result = checkReturnValue( classId, propertyName, result );
      return result;
    }

    var className = getName( classId );
    if ( !this.propertyExists( propertyName ) ) {
      throw new Error( "There is no property like " + propertyName + " in " + className );
    }
    var property = this.classProperties[ propertyName ];
    //console.log('getting', propertyName, 'from', className, classId,property.declarations);

    if ( _isDef( property ) ) {

      // this is only way to get real data
      if ( property.classId === classId ) {

        //console.log(className, 'is owner of', propertyName, 'property of type', _type(result.value));
        // if its mine property i can get it no matter what
        if ( _type( property.value ) === 'function' ) {

          var facade = this.classFacades[ classId ];
          var obj = getObject( classId );
          //return result.value.bind(facade);

          return preMethod;
        } else {
          return property.value;
        }



      } else if ( _typeIs( property, 'public' ) ) {

        // if its public property i can get it
        // binding to myself because i should have all properties even
        // private of parents but i cannot access it directly
        var targetName = getName( property.classId );
        //console.log('redirecting to', targetName, result.classId, 'who has this property', propertyName);
        return this.get( property.classId, propertyName );

      } else if ( _isDef( classId ) &&
        _typeIs( property, 'protected' ) &&
        this.mixedWithOrChildOfPropertyOwner( classId, propertyName ) ) {


        // if its protected property and i can
        // access it becase i'm neighbor or child
        var targetName = getName( property.classId );
        //console.log(targetName, 'is mixed with or child of', className);
        return this.get( property.classId, propertyName );


      } else if ( _isDef( classId ) && _typeIs( property, 'private' ) ) {

        //console.log('classId:', classId, 'result.classId:', result.classId);
        //console.log('this facade', classId);
        //console.log('result facade', getName(result.classId), result.classId);
        //console.log('are we extending?', this.classFacades[classId].extends === result.classId);
        throw new Error( "Cannot access private properties of other classes." );


      } else {

        //console.log('classId', classId, 'result.classId', result.classId);
        throw new Error( "Cannot access '" + propertyName + "' from outside a class." );


      }

    } else {
      return undefined;
    }
  };

  /**
   * get class name as string of given classId
   * @method  getClassNameOf
   * @param   {[type]}       classId [description]
   * @returns {[type]}               [description]
   */
  function getClassNameOf( classId ) {
    var obj = getObject( classId );
    return obj.classFacade.getCurrentClassName();
  }

  /**
   * get array of class names from array of classId order is the same
   * @method  getClassNamesOf
   * @param   {[type]}        classesIds [description]
   * @returns {[type]}                   [description]
   */
  function getClassNamesOf( classesIds ) {
    var result = [];
    forEach( classesIds, function ( classId ) {
      result.push( getClassNameOf( classId ) );
    } );
    return result;
  }

  /**
   * check whether given instance as property can be associated
   * in other words this is type checking for classes
   * @method  canBeClass
   * @param   {[type]}   instance     [description]
   * @param   {[type]}   shouldBe     [description]
   * @param   {[type]}   className    [description]
   * @param   {[type]}   propertyName [description]
   * @returns {[type]}                [description]
   */
  function canBeClass( instance, shouldBe, className, propertyName ) {

    var valueType = instance.getClassName();
    //console.log( "canBeClass", propertyName, shouldBe, 'is', valueType );

    if ( shouldBe.indexOf( 'anytype' ) >= 0 ) {
      return true;
    }
    if ( shouldBe.indexOf( valueType ) >= 0 ) {
      return true;
    }

    var valueClassId = instance.getClassId();

    // if we inherite from class that we declared everything is ok
    var valueObj = getObject( valueClassId );
    var valueFacade = valueObj.classFacade;
    var valueInherits = valueFacade.inherits;
    var valueClassNames = getClassNamesOf( valueInherits );

    for ( var key in shouldBe ) {
      var name = shouldBe[ key ];
      if ( valueClassNames.indexOf( name ) >= 0 ) {
        return true;
      }
    }
    classTypeError( className, propertyName, valueType, shouldBe );
  }

  function classTypeError( className, propertyName, valueType, shouldBe ) {
    throw new Error( "Value of [ " + propertyName + " ] in [ " + className +
      " ] class does not match declaration.\nExpected: '" + shouldBe + "' given: '" + valueType + "'." );
  }

  /**
   * check if property is same as declared one
   * @method  checkPropertyType
   * @param   {[type]}          value        [description]
   * @param   {[type]}          className    [description]
   * @param   {[type]}          propertyName [description]
   * @returns {[type]}                       [description]
   */
  function checkPropertyType( classId, className, value, propertyName ) {

    var obj = getObject( classId );
    var shouldBe = obj.classProperties[ propertyName ].types;
    var valueType = _type( value );
    var valueClassId = '';
    var valueObj, valueFacade, valueInherits, valueClassNames;

    if ( shouldBe.indexOf( valueType ) >= 0 ) {
      return true;
    }
    if ( shouldBe.indexOf( 'anytype' ) >= 0 ) {
      return true;
    }

    // if given value is a classInstance then check className of that instance
    if ( valueType === 'clsClassInstance' ) {

      return canBeClass( value, shouldBe, className, propertyName );

    } else {
      if ( shouldBe.indexOf( valueType ) >= 0 ) {
        return true;
      }
    }

    // we are here so value is not correct
    classTypeError( className, propertyName, valueType, shouldBe );
  }

  clsClassData.prototype.set = function set( classId, className, propertyName, value ) {
    //console.log('classData.set',propertyName);
    var obj = getObject( classId );
    var propertyClassId = obj.classProperties[ propertyName ].classId;
    var facade = obj.classFacade;
    var propertyObject = getObject( propertyClassId );
    var propertyFacade = propertyObject.classFacade;
    var property = obj.classProperties[ propertyName ];

    if ( _type( property.value ) === 'function' ) {
      if ( _isType( property, 'final' ) ) {
        throw new Error( "Method '" + propertyName + "' is declared as final and cannot be changed." );
      }
    } else {
      if ( _isType( property, 'const' ) ) {
        throw new Error( "Property '" + propertyName + "' is declared as const and cannot be changed." );
      }
    }

    checkPropertyType( classId, className, value, propertyName );

    if ( classId === propertyClassId ) {
      //console.log("SET: it is my property");
      obj.classProperties[ propertyName ].value = value;
    } else if ( facade.inherits.indexOf( propertyClassId ) !== -1 ) {
      //console.log( "i inherit from property" );
      obj.classProperties[ propertyName ].value = value;
    } else {
      //console.log( "propertyClassId", propertyClassId, "classID", classId );
      //console.log( "facade inherits", facade.inherits );
      //console.log( "class name", facade.getCurrentClassName() );
      //console.log( "property className", propertyFacade.getCurrentClassName() );
      throw new Error( "Cannot change property '" + propertyName +
        "' only child classes can redefine properties." );
    }

  };

  var __definedClasses = {};
  var __allClasses = {}; // all classes goes here waiting to be extended / mixed


  /**
   *
   * @method  fireConstructor
   * @param   {classInstance}   instance
   * @returns {undefined}
   */
  function fireConstructor( instance, args ) {
    if ( !Array.isArray( args ) ) {
      args = Array.prototype.slice.call( args );
    }
    var facade = getFacadeOfInstance( instance );
    var classId = facade.getClassId();
    var obj = getObject( classId );
    var className = facade.getCurrentClassName();
    var result;

    // if we have constructor we can fire it because if we are here it means that instance is createNested
    // if we are collecting classes to extend no constructor will fire only when new instance is created
    // constructor will fire it - when all classes are prepared and ready to instantiate
    if ( _isDef( facade[ className ] ) && obj.classProperties[ className ].classId === classId ) {
      result = facade[ className ].apply( facade, args );
    } else if ( facade.parent !== '' ) {
      classId = facade.parent;
      obj = getObject( classId );
      instance = obj.classInstance;
      facade = obj.classFacade;
      result = fireConstructor( instance, args );
    }
    return result;
  }

  function stackTrace( skip ) {
    //TODO correct stack trace differences between browsers
    var stack = '';
    try {
      var a = {};
      a.debug();
    } catch ( ex ) {
      stack = ex.stack;
    }
    var arr = stack.split( "\n" ).slice( skip );
    return arr.join( "\n" );
  }

  function fnToStrings( obj ) {
    var type = _type( obj );
    type = type.toLowerCase();
    if ( type === 'function' ) {
      //var stack = stackTrace(9);
      var preStr = "cls.function:/*\ncompressed function*/\n";
      return preStr + obj.toString();
    }
    if ( type === 'object' || type === 'array' ) {
      var iterate = _clone( obj );
      var result;
      if ( type === 'object' ) {
        result = {};
      }
      if ( type === 'array' ) {
        result = [];
      }
      forEach( iterate, function ( val, name ) {
        result[ name ] = fnToStrings( val );
      } );
      return result;
    }
    // if not a function just return original obj
    return obj;
  }

  function _unescape(str){
    var result = str.substr(16);
    return result.substr( result.length-1 -16);
  }

  cls["compress"] = function clsCompress( anything ) {
    if( _isDef(anything.isConstructor ) ){
      return anything.compress();
    }
    var result = fnToStrings( anything );
    var json =  JSON.stringify( result );
    var compressed = LZString.compressToUint8Array( json );
    return compressed;
  }


  function StringsToFn( obj ) {
    var type = _type( obj );
    type = type.toLowerCase();
    if ( type === 'string' ) {
      // check whether we have a function or simple string
      if ( obj.substr( 0, 13 ) === 'cls.function:' ) {
        var str = obj.substr( 13 );
        var fn = eval( "(" + str + ")" );
        return fn;
      }
    }
    if ( type === 'object' || type === 'array' ) {
      var result;
      if ( type === 'object' ) {
        result = {};
      }
      if ( type === 'array' ) {
        result = [];
      }
      forEach( obj, function ( val, name ) {
        result[ name ] = StringsToFn( val );
      } );
      return result;
    }
    return obj;
  }


  cls["decompress"] = function clsDecompress( str ) {
    str =  LZString.decompressFromUint8Array( str );
    if (str === null){
      throw new Error("Cannot decompress file.");
    }
    var obj = JSON.parse( str );
    var result;
    if( _isDef(obj.__compressedClass) ){
      result = buildFromStringObjects( obj.__compressedClass );
    }else{
      result = StringsToFn( obj );
    }
    return result;
  }

  function compressExtend() {
    var compressedClass = {
      __compressedClass:{}
    };
    var result = compressedClass.__compressedClass;
    var self = this;
    result.name = this.___className;
    result.type = this.___type;

    var firstClass = this.___firstClass;
    var secondClass = this.___secondClass;


    result.data = {
      firstClass: compress.call( firstClass, true ),
      secondClass: compress.call( secondClass, true )
    }
    return compressedClass;

  }

  function compressClass() {
    var compressedClass = {
      __compressedClass:{}
    };
    var result = compressedClass.__compressedClass;
    var self = this;
    result.name = this.___className;
    result.type = this.___type;

    var toCompress = this.___source;
    var data = toCompress.toString();
    data = /^function\s[^\{]+\{(?:\s+)?return\s?([^$]+)\s?\}$/gi.exec( data );
    data = data[ 1 ];
    result.data = data;
    return compressedClass;
  }

  function compress( waitForNow ) {
    var result;
    if ( this.___type === 'class' ) {
      result = compressClass.call( this );
    }
    if ( this.___type === 'extend' ) {
      result = compressExtend.call( this );
    }
    if ( !_isDef( waitForNow ) ) {
      result = JSON.stringify( result );
      result = LZString.compressToUint8Array( result );
      this.compressed = result;
    }
    return result;
  }

  function stringToFunction( str ) {
    return new Function( "return " + str );
  }

  function buildFromStringObjects( obj ) {
    var result;
    if ( obj.type === 'class' ) {
      result = _class( obj.name, stringToFunction( obj.data ), true );
    }
    if ( obj.type === 'extend' ) {
      var first = buildFromStringObjects( obj.data.firstClass.__compressedClass );
      var second = buildFromStringObjects( obj.data.secondClass.__compressedClass );
      result = cls.extend( first, second );
    }
    return result;
  }

  function decompress() {
    var str = this.compressed;
    if ( str === '' ) {
      throw new Error( "Class is not compressed." );
    }
    var json = LZString.decompressFromUint8Array( str );
    var obj = JSON.parse( json );
    // we must build classes again form source objects ;)
    var result = buildFromStringObjects( obj.__compressedClass );
    return result;
  }

  function rget( o1, name, value ) {
    Object.defineProperty( o1, name, {
      enumerable: false,
      get: function () {
        return value;
      }
    } )
  }

  function rwget( o1, name, value ) {
    var prv = value;
    Object.defineProperty( o1, name, {
      enumerable: false,
      get: function () {
        return prv;
      },
      set: function ( newVal ) {
        prv = newVal;
      }
    } )
  }


  function getStaticFromObject(obj,className){
    var result = {};
    forEach(obj,function(property,name){
      if( _isDef(property.declarations) ){
        if( property.declarations.indexOf("static") !== -1 ){
          result[ name ] = checkClassProperty( property, className, name, true );
        }
      }
    });
    return result;
  }

  function tabs(indent){
    var result="";
    for(var i =0; i<indent;i++){result+="  ";}
    return result;
  }

  function arrayToString(arr,indent){
    var result = "";
    if( arr.length === 0)return "";
    result+=arr[0].trim();
    if(arr.length > 1){result+="\n";}
    if( arr.length>=3){
      for( var i = 1; i< arr.length-1;i++){
        result += tabs(indent+1)+arr[i].trim()+"\n";
      }
      result+=tabs(indent)+arr[ arr.length-1 ].trim();
    }else if(arr.length === 2){
      result+=tabs(indent)+arr[ 1 ].trim();
    }
    return result;
  }

  function stringify(prop,indent){
    var result="";
    var propType = _type( prop );
    if( propType === 'function'){
      var arr = prop.toString().split("\n");
      result+=arrayToString(arr,indent)
    }else if( propType === 'object'){
      result += objectToString(prop,indent+1);
    }else if( propType === 'array' ){
      if( prop.length > 0){
        if( prop.length>1 ){
          result += "\n"+tabs(indent)+"[\n";
        }else{ result+="[ "; }
        forEach(prop,function(val,index){
          if( prop.length>1 ){result+=tabs(indent+1);}
          result+=stringify(val,indent+2);
        });
        if(prop.length>1){
          result+="\n"+tabs(indent)+"]";
        }else{result+=" ]";}
      }else{
        result+="[]";
      }
    }else if(propType === 'string'){
      arr=prop.
      replace(/\"{1}/gim,"\\\"").
      replace(/^/gim,'"').
      replace(/\n{1}/gim,"\\n\"+\n").
      substr(1).
      split("\n");
      result+='"'+arrayToString(arr,indent-1)+'"';
    }else{
      result += prop.toString();
    }
    return result;
  }

  function objectToString(obj,indent){
    var result = "{\n";
    //indent++;
    if( _type(obj) !== 'object'){
      throw new Error("This is not an object.");
    }
    forEach(obj,function(prop,name){
      result+=tabs(indent+1)+'"'+name+'":'+stringify(prop,indent+1);
      if( _type(prop) !== 'object'){
        result+=',';
      }
      result+="\n";
    });
    result+=tabs(indent-1)+"}";
    if( indent !== 0){ result+=",";}
    return result;
  }

  function asString(){
    var obj = this.asObject();
    var result = objectToString(obj,0);
    return result;
  }

  function saveAsObject(fileName){
    var className = this.___className;
    var str = "// Auto generated class\n\n";
    str+= "var "+className+"Source = "+this.asString()+";\nvar "+className+" = cls.class("+className+","+className+"Source);\n";
    if( _isDef(module) ){
      if( _isDef( module.exports ) ){

        var fs = require("fs");
        fs.writeFileSync(fileName, str);

      }else{return false;}
    }else{return false;}
  }

  /**
   * convert class to object representation
   * @method  toObject
   * @returns {[type]} [description]
   */
  function asObject(){
    var result = {};
    if( _isDef( module )){
      if( _isDef( module.exports ) ){
        result.className = this.___className;
        if( this.___type === 'class'){
          result.type = 'class';
          if( _type( this.___source ) === 'function' ){
            result.source = {};
            parseComments(this.___sourceObject, this.___className, undefined, 'asObjectId', result.source);
            forEach(result.source,function(property,name){
              delete property.classId;
            });
          }else{
            result.source = this.___source;
          }
          // we have an object with all declarations needed to create a class
        }else{// this is extend
          result.type = 'extend';
          result.firstClass = toObject.call(this.firstClass);
          result.secondClass = toObject.call(this.secondClass);
        }
        return result;
      }
    }
  }

  cls["class"] = function ( className, source ) {
    return _class( className, source, false );
  }

  /**
   * classCreator
   * @param  {string} className           [description]
   * @param  {object} source              [description]
   * @return {classConstructor}           [description]
   */
  function _class( className, source, weAreDecompressing ) {

    var sourceType = '',
      nameType = '',
      str = '',
      obj = {},
      sourceObject = {},
      definedNames = Object.keys( __definedClasses );

    if ( !_isDef( className ) && !_isDef( source ) ) {
      throw new Error( "There is no source for class creation." );
    }

    if ( weAreDecompressing ) {
      if ( definedNames.indexOf( className ) !== -1 ) {
        //console.warn( "Class decompression: Class [ " + className + " ] is already defined." );
        return __definedClasses[ className ];
      }
    } else {
      if ( definedNames.indexOf( className ) !== -1 ) {
        throw new Error( "Class [ " + className + " ] is already defined." );
      }
    }

    nameType = _type( className );

    if ( nameType === 'function' || nameType === 'classConstructor' ) {
      if ( _isDef( className.isConstructor ) ) {
        return className;
      }
    }

    if ( nameType !== 'string' ) {
      throw new Error( "class name should be a string" );
    }

    sourceType = _type( source );

    if( sourceType === "function"){
      str = source.toString();
      obj = source();
      sourceObject = {
        'className': className,
        'source': source,
        'str': str,
        'obj': obj
      };
    }else{
      str = "object";
      obj = {};
      forEach(source,function(property,name){
        obj[ name ] = property.value;
      });
      sourceObject = {
        'className': className,
        'source': _clone(source),
        'str': str,
        'obj': obj
      };
      source = sourceObject;
    }

    if ( sourceType !== 'function' && sourceType !== 'object' ) {
      throw new Error( "Source for class creation must be inline function or specially prepared object." );
    }

    var constructor = function classConstructor() {
      var args = arguments;
      var instance = cls.create( className, source );
      var result = fireConstructor( instance, args );
      if ( _type( result ) === 'undefined' ) {
        return instance;
      } else {
        if( _type( result ) === 'clsClassFacade'){
          var classId = result.getClassId();
          var obj = getObject(classId);
          return obj.classInstance;
        }
        return result;
      }
    }


    rget( constructor, '___type', 'class' );
    rget( constructor, '___source', source );
    rget( constructor, '___sourceObject', sourceObject );
    rget( constructor, '___className', className );
    rget( constructor, '___arguments', arguments );
    rget( constructor, 'isConstructor', true );
    rget( constructor, 'extend', constructorExtend.bind( constructor ) );
    rwget( constructor, 'compressed', '' );
    rget( constructor, 'compress', compress.bind( constructor ) );
    rget( constructor, 'asObject', asObject.bind( constructor ) );
    rget( constructor, 'asString', asString.bind( constructor ) );
    rget( constructor, 'saveAsObject', saveAsObject.bind( constructor ) );
    //rget( constructor, 'decompress', decompress.bind( constructor ) );

    if( sourceType === 'function' ){
      var staticProps = parseComments( sourceObject, className, STATIC_METHOD_PROPERTY );
    }else{
      var staticProps = getStaticFromObject(source,className);
    }

    rget( constructor, '___static', staticProps );
    resolveStatic( staticProps, constructor );

    __definedClasses[ className ] = constructor;

    return constructor;
  }


  /**
   * if property is not public block it outside a class
   * @method  lockProperty
   * @param   {[type]}     name     [description]
   * @param   {[type]}     instance [description]
   * @returns {[type]}              [description]
   */
  function lockProperty( name, instance ) {

    var obj = getObject( instance.getClassId() );
    var classProperties = obj.classProperties;
    var property;
    var className;

    if ( _isDef( classProperties[ name ] ) ) {

      property = classProperties[ name ];
      if ( property.declarations.indexOf( 'public' ) === -1 ) {
        Object.defineProperty( instance, name, {
          configureable: false,
          enumerable: false,
          get: function () {
            throw new Error( "Property '" + name + "' is not public." );
          }
        } );
      }

    } else {
      throw new Error( "Internal error: Wrong property name." );
    }

  }

  /**
   * creating a class instance
   * @method  create
   * @param   {[type]} className [description]
   * @param   {[type]} source [description]
   * @returns {[type]} [description]
   */
  function _create( className, source, classProperties, classData ) {

    var classId = _guid(), // new classId for each class
      classInstance = {},
      classFacade = {},
      publicProperties = {},
      result = {},
      obj = {},
      str = '',
      sourceObject;

    if ( _type( className ) !== 'string' ) {
      throw new Error( "className should be a string " + _type( className ) + " given." );
    }

    if ( _isDef( source.___source ) ) {
      source = source.___source;
    }

    if ( _type( source ) === 'function' ) {
      obj = source();
      str = source.toString();
      sourceObject = {
        'className': className,
        'source': source,
        'str': str,
        'obj': obj
      };
    }else{
      obj = source.obj;
      sourceObject = source;
    }

    if ( !_isDef( classProperties ) ) {
      classProperties = new clsClassProperties();
    }


    generateClassProperties( className, sourceObject, classId, classProperties );
    //console.log('generated classProperties',classProperties);
    if ( !_isDef( classData ) ) {
      classData = new clsClassData( classProperties );
    } // we don't need to assign properties to classData because classData is searching in classProperties

    classFacade = new clsClassFacade( classId, className );
    publicProperties = getClassPropertiesOf( classProperties, 'public', classId );

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
    setObject( classId, result );

    classInstance = new clsClassInstance( classId, className );
    result.classInstance = classInstance;

    forEach( classProperties, function ( val, name ) {
      lockProperty( name, classInstance );
      if ( val.classId === classFacade.getClassId() ) {
        if ( !_isDef( classFacade[ name ] ) ) {
          classFacade.___addProperty( name, val, false );
        }
      }
    } );
    classData.addClassFacade( classId, classFacade );


    forEach( publicProperties, function ( val, name ) {
      classInstance.___addPublicProperty( name );
    } );

    //console.log( "there is", Object.keys( __allClasses ).length, "classes created" );
    return classInstance;
  };


  cls["create"] = function create( className, source ) {
    return _create( className, source );
  }

  function getObject( classId ) {
    return __allClasses[ classId ];
  }

  function setObject( classId, result ) {
    __allClasses[ classId ] = result;
  }


  function getClassObjectOfInstance( instance ) {
    var classId = instance.getClassId();
    var classObject = getObject( classId );
    return classObject;
  }

  var getClassObjectOfFacade = getClassObjectOfInstance;

  function getFacadeOfInstance( instance ) {
    var classId = instance.getClassId();
    var classObject = getObject( classId );
    return classObject.classFacade;
  }

  /**
   * @method _buildChildsInfo
   * @param  {array} instances  array of classId
   * @return {[type]}           [description]
   */
  function _instanceInherits( instance ) {
    var allChilds = [];
    // traverse all parents to the first class and collect classId
    var object = getClassObjectOfInstance( instance );
    var facade = object.classFacade;
    var fuse = 1000;
    while ( facade.parent !== '' && fuse >= 0 ) {
      if ( facade.parent !== '' ) {
        object = getObject( facade.parent );
        facade = object.classFacade;
      }
      var classId = facade.getClassId();
      allChilds.push( classId );
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
  function _extend( firstClass, secondClass, classProperties, classData ) {

    var args = Array.prototype.slice.call( arguments ),
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

    if ( !_isDef( classProperties ) ) {
      classProperties = new clsClassProperties();
      classData = new clsClassData( classProperties );
    }

    if ( firstClass.___type === 'class' ) { //simple class
      firstClassInstance = _create( firstClass.___className, firstClass, classProperties, classData );
    } else { //extended class
      firstClassInstance = _extend( firstClass.___firstClass, firstClass.___secondClass, classProperties, classData );
    }
    firstClassFacade = getFacadeOfInstance( firstClassInstance );

    if ( secondClass.___type === 'class' ) { //simple class
      secondClassInstance = _create( secondClass.___className, secondClass, classProperties, classData );
    } else { //extended class
      secondClassInstance = _extend( secondClass.___firstClass, secondClass.___secondClass, classProperties,
        classData );
    }


    secondClassObject = __allClasses[ secondClassInstance.getClassId() ];
    secondClassFacade = secondClassObject.classFacade;


    //classProperties = secondClassObject.classProperties;
    //classData = secondClassObject.classData;

    // last one is one that we are extending

    secondClassFacade.extend = firstClassInstance.getClassId();
    secondClassFacade.parent = firstClassInstance.getClassId();
    secondClassFacade.parentName = firstClassInstance.getCurrentClassName();
    secondClassFacade.inherits = _instanceInherits( secondClassInstance );
    secondClassFacade.child = '';
    var childId = secondClassFacade.getClassId();
    firstClassFacade.child = childId;


    // we have facades with childOf array containing other classes
    // now we must mix properties in classProperties object so classData can access it and check
    var secondClassId = secondClassInstance.getClassId();
    forEach( classProperties, function ( val, key ) {
      // adding properties from parent classes
      if ( val.classId !== secondClassId ) {
        secondClassFacade.___addProperty( key, val, false );
        if ( _typeIs( val, 'public' ) ) {
          secondClassInstance.___addPublicProperty( key );
        }
      }
    } );

    return secondClassInstance;
  };


  function arrayExtend( array ) {
    var result = array[ 0 ];
    forEach( array, function ( val, i ) {
      if ( i > 0 ) {
        result = cls.extend( result, val );
      }
    } );
    return result;
  }


  function constructorExtend( className, source ) {
    if ( _type( className ) === 'string' ) {
      var nextClass = cls.class( className, source );
      return cls.extend( this, nextClass );
    } else {
      return cls.extend( this, className ); //className is cls.class already
    }
  }

  var __definedAllClasses = {};

  cls["extend"] = function extend( firstClass, secondClass ) {

    if ( _type( firstClass ) === 'array' ) {
      return arrayExtend( firstClass );
    }

    var _args = Array.prototype.slice.call( arguments );
    //throw new Error("yumi");
    if ( _args.length > 2 ) {
      return arrayExtend( _args );
    }

    var constructor = function classConstructor() {
      var args = arguments;
      var instance = _extend( firstClass, secondClass );
      var result = fireConstructor( instance, args );
      if ( _type( result ) === 'undefined' ) {
        return instance;
      } else {
        return result;
      }
    }

    // if we want another extend we must have source for creation purpose
    rget( constructor, '___firstClass', firstClass );
    rget( constructor, '___secondClass', secondClass );
    rget( constructor, '___arguments', arguments );
    rget( constructor, '___type', 'extend' );
    rget( constructor, '___className', secondClass.___className );
    rget( constructor, 'isConstructor', true );
    rget( constructor, 'extend', constructorExtend.bind( constructor ) );
    rwget( constructor, 'compressed', '' );
    rget( constructor, 'compress', compress.bind( constructor ) );
    rget( constructor, 'asObject', asObject.bind( constructor ) );
    rget( constructor, 'asString', asString.bind( constructor ) );
    rget( constructor, 'saveAsObject', saveAsObject.bind( constructor ) );
    //rget( constructor, 'decompress', decompress.bind( constructor ) );

    var staticProps = _merge( firstClass.___static, secondClass.___static );
    rget( constructor, '___static', staticProps );
    resolveStatic( staticProps, constructor );

    __definedAllClasses[ secondClass.___className ] = constructor;

    return constructor;
  }


  cls["empty"] = function empty( className ) {
    return cls.class( className, function () {
      return {}
    } );
  }


  cls["getSingleClass"] = function(className){
    if( !_isDef( __definedClasses[ className ])){
      throw new Error("Cannot find [ "+className+" ] class.");
    }
    return __definedClasses[ className ];
  }

  cls["getClass"] = function(className){
    if( _isDef(__definedAllClasses[className] ) ){
      return __definedAllClasses[ className ];
    }else if(_isDef(__definedClasses[className]) ){
      return __definedClasses[ className ];
    }else{
      throw new Error("Cannot find [ "+className+" ] class.");
    }
  }

  function isNode(){
    var result = typeof process !== 'undefined' && typeof module !== 'undefined';
    if(result){
      result = result && _isDef(process.version) && _isDef(module.exports);
      return result;
    }else{
      return false;
    }
  }

  var __classPath = {};
  var __debundledFiles = {};
  var __modules = {};

  cls["loadBundle"] = function loadBundle(fn){
    ajax.get("build.cls").done(function(data){
      var u8str = LZString.decompressFromUint8Array(data);
      var obj = JSON.parse(u8str);
      cls.deBundle(obj,fn);
    });
  }

  cls["deBundle"] = function deBundle(obj,fn){
    forEach(obj,function(content,fileName){
      var exprt = content.replace("module.exports","cls.module.exports");
      cls['module'] = { 'exports': undefined };
      var main;
      if( typeof window !== 'undefined'){
        main = window;
      }
      if( typeof GLOBAL !== 'undefined'){
        main = GLOBAL;
      }
      eval.call(main,exprt);
      __modules[ fileName ] = cls.module.exports;
      if( _isDef(cls.module.exports)){
        if(_isDef(cls.module.exports.isConstructor)){
          var className = cls.module.exports.___className;
          __definedAllClasses[ className ] = cls.module.exports;
          if( typeof window !== 'undefined' ){
            window[className] = cls.module.exports;
          }
          if( typeof GLOBAL !== 'undefined' ){
            GLOBAL[className] = cls.module.exports;
          }
        }
      }
    });

    fn(__definedAllClasses);
  }

  cls["require"] = function clsRequire(path){

    if( isNode() ){
      return require(path);
    }else{
      // if we are in browser it means that all classes are ready
      var className = classNameFromPath(path);
      return cls.getClass(className);
    }

  }

  var __builded = {};
  var __buildString = "";
  var __buildData;

  function buildFile(file){
    console.log("Building from file:",file);
    var fs = require("fs");
    var fileContent = fs.readFileSync(file,{"encoding":"utf8"});
    __builded[file] = fileContent;
  }

  function buildForBrowser(inpt){
    var argv = process.argv;
    var output = 'build.cls';
    var input = ["public/js/*.cls.js","public/js/**/*.cls.js"];
    if(_isDef(inpt)){
      input = inpt;
    }
    if( argv.indexOf('-o') >= 0 ){
      output = argv[ argv.indexOf('-o')+1 ];
    }
    if( argv.indexOf('-f') >= 0 ){
      var inputStr = argv[ argv.indexOf('-f')+1 ];
      input = inputStr.split(',');
    }

    var readdir = require("readdir");
    var files = readdir.readSync('./',input);

    forEach(files,function(file){
      buildFile(file);
    });
    __buildString=JSON.stringify(__builded);
    __buildData = LZString.compressToUint8Array(__buildString);
    var fs = require("fs");
    //fs.writeFileSync(output,__buildData,{encoding:null});
    var fd =  fs.openSync(output, 'w');
    var buff = new Buffer(__buildData, 'base64');
    fs.writeSync(fd, buff, 0, buff.length);
    console.log("Done!");
  }

  function watchFiles(){

    var argv = process.argv;
    var input = "public/js/**/*.cls.js";
    if( argv.indexOf('-f') >= 0 ){
      input = argv[ argv.indexOf('-f')+1 ];
    }
    console.log("Watching files...",input);
    var watch = require('node-watch');
    var path=require('path');
    var dir = path.dirname(input);
    watch(dir, function(filename) {
      console.log(filename, ' changed... rebuilding...');
      buildForBrowser([input]);
    });
  }

  function parseCommand(){
    var command = process.argv[2];
    switch (command) {
      case "build":buildForBrowser();break;
      case "watch":watchFiles();break;
      default:
    }
  }



  // third parties
  /**
   * find closest element like jquery.closest
   * @param  {[type]} el       [description]
   * @param  {[type]} selector [description]
   * @return {[type]}          [description]
   */
  cls["closest"]=function closest(el, selector) {
    var matchesFn;
    // find vendor prefix
    ['matches','webkitMatchesSelector','mozMatchesSelector','msMatchesSelector','oMatchesSelector'].some(function(fn) {
        if (typeof document.body[fn] == 'function') {
            matchesFn = fn;
            return true;
        }
        return false;
    })
    // traverse parents
    while (el!==null) {
        parent = el.parentElement;
        if (parent!==null && parent[matchesFn](selector)) {
            return parent;
        }
        el = parent;
    }
    return null;
  }

  var ajax = {
    request: function(ops) {
        if(typeof ops === 'string') ops = { url: ops };
        ops.url = ops.url || '';
        ops.method = ops.method || 'get';
        ops.data = ops.data || {};
        var getParams = function(data, url) {
            var arr = [], str;
            for(var name in data) {
                arr.push(name + '=' + encodeURIComponent(data[name]));
            }
            str = arr.join('&');
            if(str !== '') {
                return url ? (url.indexOf('?') < 0 ? '?' + str : '&' + str) : str;
            }
            return '';
        };
        var api = {
            host: {},
            process: function(ops) {
                var self = this;
                this.xhr = null;
                if(window.ActiveXObject) { this.xhr = new ActiveXObject('Microsoft.XMLHTTP'); }
                else if(window.XMLHttpRequest) { this.xhr = new XMLHttpRequest(); }
                if(this.xhr) {
                    this.xhr.responseType = "arraybuffer";
                    this.xhr.onreadystatechange = function() {
                        if(self.xhr.readyState === 4 && self.xhr.status === 200) {
                          var result = new Uint8Array(self.xhr.response);
                          self.doneCallback && self.doneCallback.apply(self.host, [result, self.xhr]);
                        } else if(self.xhr.readyState === 4) {
                            self.failCallback && self.failCallback.apply(self.host, [self.xhr]);
                        }
                        self.alwaysCallback && self.alwaysCallback.apply(self.host, [self.xhr]);
                    };
                }
                if(ops.method === 'get') {
                    this.xhr.open("GET", ops.url + getParams(ops.data, ops.url), true);
                } else {
                    this.xhr.open(ops.method, ops.url, true);
                    this.setHeaders({
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-type': 'text/plain; charset=x-user-defined'
                    });
                }
                if(ops.headers && typeof ops.headers === 'object') {
                    this.setHeaders(ops.headers);
                }
                setTimeout(function() {
                    ops.method === 'get' ? self.xhr.send() : self.xhr.send(getParams(ops.data));
                }, 20);
                return this;
            },
            done: function(callback) {
                this.doneCallback = callback;
                return this;
            },
            fail: function(callback) {
                this.failCallback = callback;
                return this;
            },
            always: function(callback) {
                this.alwaysCallback = callback;
                return this;
            },
            setHeaders: function(headers) {
                for(var name in headers) {
                    this.xhr && this.xhr.setRequestHeader(name, headers[name]);
                }
            }
        };
        return api.process(ops);

    },

    get: function( url, data) {
        return this.request({
            url:url,
            data:data,
            method:'get'
        });
    },

    post: function ( url , data ) {
        return this.request({
            url:url,
            data:data,
            method:'post'
        });
    }
  }



  // Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
  // This work is free. You can redistribute it and/or modify it
  // under the terms of the WTFPL, Version 2
  // For more information see LICENSE.txt or http://www.wtfpl.net/
  //
  // For more information, the home page:
  // http://pieroxy.net/blog/pages/lz-string/testing.html
  //
  // LZ-based compression algorithm, version 1.4.4
  var LZString = ( function () {

    // private property
    var f = String.fromCharCode;
    var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
    var baseReverseDic = {};

    function getBaseValue( alphabet, character ) {
      if ( !baseReverseDic[ alphabet ] ) {
        baseReverseDic[ alphabet ] = {};
        for ( var i = 0; i < alphabet.length; i++ ) {
          baseReverseDic[ alphabet ][ alphabet.charAt( i ) ] = i;
        }
      }
      return baseReverseDic[ alphabet ][ character ];
    }

    var LZString = {
      compressToBase64: function ( input ) {
        if ( input == null ) return "";
        var res = LZString._compress( input, 6, function ( a ) {
          return keyStrBase64.charAt( a );
        } );
        switch ( res.length % 4 ) { // To produce valid Base64
          default: // When could this happen ?
          case 0:
            return res;
        case 1:
            return res + "===";
        case 2:
            return res + "==";
        case 3:
            return res + "=";
        }
      },

      decompressFromBase64: function ( input ) {
        if ( input == null ) return "";
        if ( input == "" ) return null;
        return LZString._decompress( input.length, 32, function ( index ) {
          return getBaseValue( keyStrBase64, input.charAt( index ) );
        } );
      },

      compressToUTF16: function ( input ) {
        if ( input == null ) return "";
        return LZString._compress( input, 15, function ( a ) {
          return f( a + 32 );
        } ) + " ";
      },

      decompressFromUTF16: function ( compressed ) {
        if ( compressed == null ) return "";
        if ( compressed == "" ) return null;
        return LZString._decompress( compressed.length, 16384, function ( index ) {
          return compressed.charCodeAt( index ) - 32;
        } );
      },

      //compress into uint8array (UCS-2 big endian format)
      compressToUint8Array: function ( uncompressed ) {
        var compressed = LZString.compress( uncompressed );
        var buf = new Uint8Array( compressed.length * 2 ); // 2 bytes per character

        for ( var i = 0, TotalLen = compressed.length; i < TotalLen; i++ ) {
          var current_value = compressed.charCodeAt( i );
          buf[ i * 2 ] = current_value >>> 8;
          buf[ i * 2 + 1 ] = current_value % 256;
        }
        return buf;
      },

      //decompress from uint8array (UCS-2 big endian format)
      decompressFromUint8Array: function ( compressed ) {
        if ( compressed === null || compressed === undefined ) {
          return LZString.decompress( compressed );
        } else {
          var buf = new Array( compressed.length / 2 ); // 2 bytes per character
          for ( var i = 0, TotalLen = buf.length; i < TotalLen; i++ ) {
            buf[ i ] = compressed[ i * 2 ] * 256 + compressed[ i * 2 + 1 ];
          }

          var result = [];
          buf.forEach( function ( c ) {
            result.push( f( c ) );
          } );
          return LZString.decompress( result.join( '' ) );

        }

      },


      //compress into a string that is already URI encoded
      compressToEncodedURIComponent: function ( input ) {
        if ( input == null ) return "";
        return LZString._compress( input, 6, function ( a ) {
          return keyStrUriSafe.charAt( a );
        } );
      },

      //decompress from an output of compressToEncodedURIComponent
      decompressFromEncodedURIComponent: function ( input ) {
        if ( input == null ) return "";
        if ( input == "" ) return null;
        input = input.replace( / /g, "+" );
        return LZString._decompress( input.length, 32, function ( index ) {
          return getBaseValue( keyStrUriSafe, input.charAt( index ) );
        } );
      },

      compress: function ( uncompressed ) {
        return LZString._compress( uncompressed, 16, function ( a ) {
          return f( a );
        } );
      },
      _compress: function ( uncompressed, bitsPerChar, getCharFromInt ) {
        if ( uncompressed == null ) return "";
        var i, value,
          context_dictionary = {},
          context_dictionaryToCreate = {},
          context_c = "",
          context_wc = "",
          context_w = "",
          context_enlargeIn = 2, // Compensate for the first entry which should not count
          context_dictSize = 3,
          context_numBits = 2,
          context_data = [],
          context_data_val = 0,
          context_data_position = 0,
          ii;

        for ( ii = 0; ii < uncompressed.length; ii += 1 ) {
          context_c = uncompressed.charAt( ii );
          if ( !Object.prototype.hasOwnProperty.call( context_dictionary, context_c ) ) {
            context_dictionary[ context_c ] = context_dictSize++;
            context_dictionaryToCreate[ context_c ] = true;
          }

          context_wc = context_w + context_c;
          if ( Object.prototype.hasOwnProperty.call( context_dictionary, context_wc ) ) {
            context_w = context_wc;
          } else {
            if ( Object.prototype.hasOwnProperty.call( context_dictionaryToCreate, context_w ) ) {
              if ( context_w.charCodeAt( 0 ) < 256 ) {
                for ( i = 0; i < context_numBits; i++ ) {
                  context_data_val = ( context_data_val << 1 );
                  if ( context_data_position == bitsPerChar - 1 ) {
                    context_data_position = 0;
                    context_data.push( getCharFromInt( context_data_val ) );
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                }
                value = context_w.charCodeAt( 0 );
                for ( i = 0; i < 8; i++ ) {
                  context_data_val = ( context_data_val << 1 ) | ( value & 1 );
                  if ( context_data_position == bitsPerChar - 1 ) {
                    context_data_position = 0;
                    context_data.push( getCharFromInt( context_data_val ) );
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              } else {
                value = 1;
                for ( i = 0; i < context_numBits; i++ ) {
                  context_data_val = ( context_data_val << 1 ) | value;
                  if ( context_data_position == bitsPerChar - 1 ) {
                    context_data_position = 0;
                    context_data.push( getCharFromInt( context_data_val ) );
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = 0;
                }
                value = context_w.charCodeAt( 0 );
                for ( i = 0; i < 16; i++ ) {
                  context_data_val = ( context_data_val << 1 ) | ( value & 1 );
                  if ( context_data_position == bitsPerChar - 1 ) {
                    context_data_position = 0;
                    context_data.push( getCharFromInt( context_data_val ) );
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              }
              context_enlargeIn--;
              if ( context_enlargeIn == 0 ) {
                context_enlargeIn = Math.pow( 2, context_numBits );
                context_numBits++;
              }
              delete context_dictionaryToCreate[ context_w ];
            } else {
              value = context_dictionary[ context_w ];
              for ( i = 0; i < context_numBits; i++ ) {
                context_data_val = ( context_data_val << 1 ) | ( value & 1 );
                if ( context_data_position == bitsPerChar - 1 ) {
                  context_data_position = 0;
                  context_data.push( getCharFromInt( context_data_val ) );
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }


            }
            context_enlargeIn--;
            if ( context_enlargeIn == 0 ) {
              context_enlargeIn = Math.pow( 2, context_numBits );
              context_numBits++;
            }
            // Add wc to the dictionary.
            context_dictionary[ context_wc ] = context_dictSize++;
            context_w = String( context_c );
          }
        }

        // Output the code for w.
        if ( context_w !== "" ) {
          if ( Object.prototype.hasOwnProperty.call( context_dictionaryToCreate, context_w ) ) {
            if ( context_w.charCodeAt( 0 ) < 256 ) {
              for ( i = 0; i < context_numBits; i++ ) {
                context_data_val = ( context_data_val << 1 );
                if ( context_data_position == bitsPerChar - 1 ) {
                  context_data_position = 0;
                  context_data.push( getCharFromInt( context_data_val ) );
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
              }
              value = context_w.charCodeAt( 0 );
              for ( i = 0; i < 8; i++ ) {
                context_data_val = ( context_data_val << 1 ) | ( value & 1 );
                if ( context_data_position == bitsPerChar - 1 ) {
                  context_data_position = 0;
                  context_data.push( getCharFromInt( context_data_val ) );
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            } else {
              value = 1;
              for ( i = 0; i < context_numBits; i++ ) {
                context_data_val = ( context_data_val << 1 ) | value;
                if ( context_data_position == bitsPerChar - 1 ) {
                  context_data_position = 0;
                  context_data.push( getCharFromInt( context_data_val ) );
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = 0;
              }
              value = context_w.charCodeAt( 0 );
              for ( i = 0; i < 16; i++ ) {
                context_data_val = ( context_data_val << 1 ) | ( value & 1 );
                if ( context_data_position == bitsPerChar - 1 ) {
                  context_data_position = 0;
                  context_data.push( getCharFromInt( context_data_val ) );
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if ( context_enlargeIn == 0 ) {
              context_enlargeIn = Math.pow( 2, context_numBits );
              context_numBits++;
            }
            delete context_dictionaryToCreate[ context_w ];
          } else {
            value = context_dictionary[ context_w ];
            for ( i = 0; i < context_numBits; i++ ) {
              context_data_val = ( context_data_val << 1 ) | ( value & 1 );
              if ( context_data_position == bitsPerChar - 1 ) {
                context_data_position = 0;
                context_data.push( getCharFromInt( context_data_val ) );
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }


          }
          context_enlargeIn--;
          if ( context_enlargeIn == 0 ) {
            context_enlargeIn = Math.pow( 2, context_numBits );
            context_numBits++;
          }
        }

        // Mark the end of the stream
        value = 2;
        for ( i = 0; i < context_numBits; i++ ) {
          context_data_val = ( context_data_val << 1 ) | ( value & 1 );
          if ( context_data_position == bitsPerChar - 1 ) {
            context_data_position = 0;
            context_data.push( getCharFromInt( context_data_val ) );
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }

        // Flush the last char
        while ( true ) {
          context_data_val = ( context_data_val << 1 );
          if ( context_data_position == bitsPerChar - 1 ) {
            context_data.push( getCharFromInt( context_data_val ) );
            break;
          } else context_data_position++;
        }
        return context_data.join( '' );
      },

      decompress: function ( compressed ) {
        if ( compressed == null ) return "";
        if ( compressed == "" ) return null;
        return LZString._decompress( compressed.length, 32768, function ( index ) {
          return compressed.charCodeAt( index );
        } );
      },

      _decompress: function ( length, resetValue, getNextValue ) {
        var dictionary = [],
          next,
          enlargeIn = 4,
          dictSize = 4,
          numBits = 3,
          entry = "",
          result = [],
          i,
          w,
          bits, resb, maxpower, power,
          c,
          data = {
            val: getNextValue( 0 ),
            position: resetValue,
            index: 1
          };

        for ( i = 0; i < 3; i += 1 ) {
          dictionary[ i ] = i;
        }

        bits = 0;
        maxpower = Math.pow( 2, 2 );
        power = 1;
        while ( power != maxpower ) {
          resb = data.val & data.position;
          data.position >>= 1;
          if ( data.position == 0 ) {
            data.position = resetValue;
            data.val = getNextValue( data.index++ );
          }
          bits |= ( resb > 0 ? 1 : 0 ) * power;
          power <<= 1;
        }

        switch ( next = bits ) {
        case 0:
          bits = 0;
          maxpower = Math.pow( 2, 8 );
          power = 1;
          while ( power != maxpower ) {
            resb = data.val & data.position;
            data.position >>= 1;
            if ( data.position == 0 ) {
              data.position = resetValue;
              data.val = getNextValue( data.index++ );
            }
            bits |= ( resb > 0 ? 1 : 0 ) * power;
            power <<= 1;
          }
          c = f( bits );
          break;
        case 1:
          bits = 0;
          maxpower = Math.pow( 2, 16 );
          power = 1;
          while ( power != maxpower ) {
            resb = data.val & data.position;
            data.position >>= 1;
            if ( data.position == 0 ) {
              data.position = resetValue;
              data.val = getNextValue( data.index++ );
            }
            bits |= ( resb > 0 ? 1 : 0 ) * power;
            power <<= 1;
          }
          c = f( bits );
          break;
        case 2:
          return "";
        }
        dictionary[ 3 ] = c;
        w = c;
        result.push( c );
        while ( true ) {
          if ( data.index > length ) {
            return "";
          }

          bits = 0;
          maxpower = Math.pow( 2, numBits );
          power = 1;
          while ( power != maxpower ) {
            resb = data.val & data.position;
            data.position >>= 1;
            if ( data.position == 0 ) {
              data.position = resetValue;
              data.val = getNextValue( data.index++ );
            }
            bits |= ( resb > 0 ? 1 : 0 ) * power;
            power <<= 1;
          }

          switch ( c = bits ) {
          case 0:
            bits = 0;
            maxpower = Math.pow( 2, 8 );
            power = 1;
            while ( power != maxpower ) {
              resb = data.val & data.position;
              data.position >>= 1;
              if ( data.position == 0 ) {
                data.position = resetValue;
                data.val = getNextValue( data.index++ );
              }
              bits |= ( resb > 0 ? 1 : 0 ) * power;
              power <<= 1;
            }

            dictionary[ dictSize++ ] = f( bits );
            c = dictSize - 1;
            enlargeIn--;
            break;
          case 1:
            bits = 0;
            maxpower = Math.pow( 2, 16 );
            power = 1;
            while ( power != maxpower ) {
              resb = data.val & data.position;
              data.position >>= 1;
              if ( data.position == 0 ) {
                data.position = resetValue;
                data.val = getNextValue( data.index++ );
              }
              bits |= ( resb > 0 ? 1 : 0 ) * power;
              power <<= 1;
            }
            dictionary[ dictSize++ ] = f( bits );
            c = dictSize - 1;
            enlargeIn--;
            break;
          case 2:
            return result.join( '' );
          }

          if ( enlargeIn == 0 ) {
            enlargeIn = Math.pow( 2, numBits );
            numBits++;
          }

          if ( dictionary[ c ] ) {
            entry = dictionary[ c ];
          } else {
            if ( c === dictSize ) {
              entry = w + w.charAt( 0 );
            } else {
              return null;
            }
          }
          result.push( entry );

          // Add w+entry[0] to the dictionary.
          dictionary[ dictSize++ ] = w + entry.charAt( 0 );
          enlargeIn--;

          w = entry;

          if ( enlargeIn == 0 ) {
            enlargeIn = Math.pow( 2, numBits );
            numBits++;
          }

        }
      }
    };
    return LZString;
  } )();

  ( function ( funcName, baseObj ) {
    funcName = funcName || "docReady";
    baseObj = baseObj || window;
    var readyList = [];
    var readyFired = false;
    var readyEventHandlersInstalled = false;

    function ready() {
      if ( !readyFired ) {
          readyFired = true;
        for ( var i = 0; i < readyList.length; i++ ) {
          readyList[ i ].fn.call( window, readyList[ i ].ctx );
        }
        readyList = [];
      }
    }

    function readyStateChange() {
      if ( document.readyState === "complete" ) {
        ready();
      }
    }

    baseObj[ funcName ] = function ( callback, context ) {
      if ( readyFired ) {
        setTimeout( function () {
          callback( context );
        }, 1 );
        return;
      } else {
        readyList.push( {
          fn: callback,
          ctx: context
        } );
      }
      if ( document.readyState === "complete" ) {
        setTimeout( ready, 1 );
      } else if ( !readyEventHandlersInstalled ) {
        if ( document.addEventListener ) {
          document.addEventListener( "DOMContentLoaded", ready, false );
          window.addEventListener( "load", ready, false );
        } else {
          document.attachEvent( "onreadystatechange", readyStateChange );
          window.attachEvent( "onload", ready );
        }
        readyEventHandlersInstalled = true;
      }
    }
  } )( "docReady", cls );


  if( isNode() ){
    GLOBAL.cls = cls;
    if( process.argv.length > 2 ){
      parseCommand();
    }
  }

  if ( isNode() ) {
    module.exports = cls;
  }

  return cls;
}() );
