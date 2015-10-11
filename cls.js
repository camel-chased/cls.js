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
        return cls.createClass(name, obj, ext);
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

        if (typeof obj.constructor !== 'undefined') {
            return obj.constructor.name.toLowerCase();

        } else {

            if (Array.isArray(obj)) {
                return 'array';
            } else if (typeof obj === 'object') {
                return 'object';
            } else {
                return typeof obj;
            }

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
            key = keys[ i ];
            value = o[ key ];

            if (cls.type(value) === 'array' || cls.type(value) === 'object') {
                item = cls.clone(value);
            } else {
                item = value;
            }

            clone[ key ] = item;
            if (typeof to !== 'undefined') {
                if (cls.type(to) === 'object' || cls.type(to) === 'function') {
                    to[ key ] = item;
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
            key = keys [ i ];
            if (cls.type(_obj2[ key ]) === 'object' && cls.type(obj1[ key ]) === 'object') {
                tmp = cls.merge(obj3[ key ], _obj2[ key ]);
                obj3[ key ] = tmp;
            } else {
                obj3[ key ] = _obj2[ key ];
            }
        }
        return obj3;
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
        propNames.forEach(function (name) {
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

        var tmp = '', i = 0, type;

        type = types[ 0 ];

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
    cls.generateArgumentTypes = function generateArgumentTypes(classType) {

        var params = /^\s?\@param\s\{([^\}]+)\}\s([a-z0-9\_\$]+)\s?(?:\=\s?([^\n]+))?\s?$/gim,
                tmp = params.exec(classType.str),
                paramDef = {};
        classType.arguments = [];

        if (cls.isDef(tmp)) {

            if (tmp.length < 3) {
                throw new Error("Variable declaration is incorrect.");
            }
            if (cls.isDef(tmp[1]) && cls.isDef(tmp[2])) {

                paramDef = {types: tmp[1].split('|'), name: tmp[2]};
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
    cls.checkDeclarations = function checkDeclarations(declarations, className, propName) {

        var ok = true;
        if (declarations.length > 2)
            return false;
        if (declarations.indexOf('public') !== -1 && declarations.indexOf('private') !== -1)
            ok = false;
        if (declarations.indexOf('public') !== -1 && declarations.indexOf('protected') !== -1)
            ok = false;
        if (declarations.indexOf('private') !== -1 && declarations.indexOf('protected') !== -1)
            ok = false;
        if (!ok) {
            throw new Error("Property declarations in class [" + className + "] property [" + propName + "] are incorrect.");
        }
        return ok;
    };

    /**
     * search for comment blocks in a given string and parse it to object
     * @method getCommentBlocks
     * @param {string} str
     * @param {string} className - for error info
     * @returns {object}
     */
    cls.getCommentBlocks = function getCommentBlocks(str, className) {

        //var commentBlock = /\/\*\*?\s?([^\/]+)(?!(\*\/))\n?/gi,
        var commentBlock = /\/\*\*?\s*([^\/]+)/gim,
                blocks = {},
                tmp = [],
                parsed = '',
                method = /^\s?\@method +([^\s]+) *(?:([^\n \t]+))?(?: +([^\n]+))?\s?$/gim,
                methodObj = {},
                property = /^\@property +\{([^\}]+)\} +([^ \t\r\n]+) *([^\s\*\/]+)?(?: +([^\n\/]+))?$/gim,
                propertyObj = {},
                returns = /^\@returns?\s+\{([^\}]+)\}/gim,
                returnObj = {},
                i = 0, len = 0, block = '',
                types = {},
                methodName = '', propertyName = [], blockNames = [], blockName = '',
                declarations = [];

        while (cls.isDef(tmp)) {
            method.lastIndex = 0;
            property.lastIndex = 0;

            tmp = commentBlock.exec(str);
            if (cls.isDef(tmp)) {
                parsed = String(tmp[1]).
                        replace(/^[\t\*]+/gim, '').
                        replace(/[\*]+/gim,'').
                        replace(/^[ \t\n]{2,50}/gi, '').
                        replace(/\n/gi,'').
                        replace(/(\@)/gi, "\n$1").
                        replace(/^\s+/gim, '').
                        replace(/\s+$/gim, '');

                //checking out method name if this is method
                methodObj = method.exec(parsed);

                if (cls.isDef(methodObj)) {
                    methodName = methodObj[ 1 ];
                    blocks[ methodName ] = {'types': ['function']};
                    if (methodObj.length === 4) {
                        if (cls.isDef(methodObj[ 2 ])) {
                            // declaration is an array like ['public','static']
                            declarations = [methodObj[ 2 ]];
                            if (cls.isDef(methodObj[ 3 ])) {
                                declarations.push(methodObj[ 3 ]);
                            }
                            if (cls.checkDeclarations(declarations, className, methodName)) {
                                blocks[ methodName ].declarations = declarations;
                            }
                        } else {
                            blocks[ methodName ].declarations = ['public'];
                        }
                    }
                    blocks[ methodName ].str = parsed;

                    cls.generateArgumentTypes(blocks[methodName]);

                    // if this is a method it should have a return value
                    returnObj = returns.exec(parsed);
                    if (cls.isDef(returnObj)) {
                        blocks[ methodName ].returns = returnObj[ 1 ].split('|');
                    }

                } else {
                    propertyObj = property.exec(parsed);

                    if (cls.isDef(propertyObj)) {
                        propertyName = propertyObj[ 2 ];
                        blocks[ propertyName ] = {};
                        blocks[ propertyName ].str = parsed;
                        blocks[ propertyName ].types = propertyObj[1].split('|');

                        if (cls.isDef(propertyObj[3])) {
                            // declaration is an array 3 and 4['public','static']
                            declarations = [propertyObj[3]];
                            if (cls.isDef(propertyObj[4])) {
                                declarations.push(propertyObj[ 4 ]);
                            }
                            if (cls.checkDeclarations(declarations, className, propertyName)) {
                                blocks[ propertyName ].declarations = declarations;
                            }
                        } else {
                            blocks[ propertyName ].declarations = ['public'];
                        }
                    }
                }

            }
        }
        //console.log('classType blocks',blocks);
        return blocks;
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
     * @param {object} classTypes
     * @param {string} key
     * @param {anytype} val
     * @returns {boolean}
     */
    cls.checkClassPropertyType = function checkClassPropertyType(classObject, key, val) {

        if ( cls.isDef( classObject.classTypes[ key ] ) ) {
            if ( cls.isDef( classObject.classTypes[ key ].types ) ) {
                //console.log('property type',key,classTypes[key].types);

                if ( classObject.classTypes[ key ].types.indexOf(cls.type(val)) === -1 &&
                    classObject.classTypes[ key ].types[0] !== 'anytype') {
                    var className = classObject.classInstance.getName(),
                            availableTypes = classObject.classTypes[ key ].types.join(",");
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
     * @param {object} classTypes
     * @param {string} methodName
     * @param {array} args
     * @returns {array} arguments
     */
    cls.checkMethodArgTypes = function checkMethodArgTypes(classObject, methodName, args) {

        var params = classObject.classTypes[ methodName ].arguments,
                val, type = '', i = 0,
                newArgs = [];

        if ( cls.isDef( classObject.classTypes[ methodName ] ) ) {
            if ( cls.isDef( classObject.classTypes[ methodName ].arguments ) ) {

                for (i in params) {

                    val = params[ i ];

                    if (!cls.isDef(args[ i ])) {

                        if (cls.isDef(val.default)) {

                            newArgs[ i ] = val.default;

                        } else if (val.types.indexOf('undefined')) {

                            newArgs[ i ] = undefined;

                        } else {
                            cls.ArgumentTypeMismatch(classObject.classInstance.getName(), methodName, val.name, val.types, 'undefined');
                        }
                    } else {
                        newArgs[ i ] = args[ i ];
                    }

                    type = cls.type(newArgs[ i ]);
                    if (val.types.indexOf(type) === -1 && val.types[0] !== 'anytype') {
                        cls.ArgumentTypeMismatch(classObject.classInstance.getName(), methodName, val.name, val.types, type);
                    }
                }

            }
        }
        return newArgs;
    };

    /**
     * for extending a class
     * @method resolveSourceObject
     * @param {function} sourceFn
     * @param {undefined|function} extendFn
     * @returns {object}
     */
    cls.resolveSourceObject = function resolveSourceObject(sourceFn, extendFn) {

        var obj,
            $parent,
            extend;

        // this class constructor must be executed to get object that he returns
        if (!cls.isDef(sourceFn.sourceFn)) {
            obj = sourceFn();
        } else {
            obj = sourceFn.getBaseObject();
        }
        //console.log('obj',cls.type(obj),obj);
        // always execute to return object instead of function
        if (cls.isDef(extendFn)) {
            extend = extendFn();
        }

        //console.log('obj',obj);

        // if object is function then we are extending other classes
        if (cls.isDef(extend)) {

            if (!cls.isDef(obj)) {
                throw new Error('obj is undefined');
            }
            // getBaseObject is the real object behind constructor
            //console.log('obj getBaseObj',obj);
            $parent = cls.clone( obj );
            // after all we must remove private properties from obj
            // but now we dont have classTypes
            obj = cls.merge( obj, extend );
            obj.$parent = $parent;
        }

        return obj;
    };

    /**
     * add values of class properties to properties definition for easier assignment
     * @method addClassTypeValues
     * @param {object} blocks ; properties types from comment blocks
     * @param {object} resolvedObj ; sourceObject from wich we create a class
     * @returns {undefined}
     */
    cls.addClassTypeValues = function addClassTypeValues(blocks, resolvedObj) {

        var name = '',
            val;

        for ( name in blocks ) {
            if ( cls.isDef( resolvedObj[ name ] ) ) {
                blocks[ name ].value = cls.clone(resolvedObj[ name ]);
            }
        }
        return blocks;
    };


    /**
     * filter class properties by declaration type like public, private etc
     * @method getClassPropertiesOf
     * @param {object} resolvedObj
     * @param {object} classProperties
     * @param {object} classTypes
     * @param {string} declarationName public, static...
     * @returns {array} of strings - names of properties
     */
    cls.getClassPropertiesOf = function getClassPropertiesOf(classObject, declarationName) {

        var result = [],
                name = '',
                type;
        //console.log('classObject',classObject);
        for (name in classObject.classTypes) {
            type = classObject.classTypes[ name ];
            //console.log('type',type);
            if ( cls.isDef( type.declarations ) ) {
                //console.log('declaration',type.declarations);
                if ( type.declarations.indexOf(declarationName) !== -1 ) {
                    //console.log('dodajemy property',name,classProperties);
                    result.push(name);
                }
            }
        }
        //console.log('getClassPropertiesOf',declarationName,result);
        return result;
    };

    /**
     * static properties are saved in constructor
     * @method setStaticProperty
     * @param {type} pseudoClassConstructor
     * @param {type} key
     * @param {type} val
     * @returns {undefined}
     */
    cls.setStaticProperty = function setStaticProperty(pseudoClassConstructor, key, val) {

        if (!cls.isDef(pseudoClassConstructor[ key ])) {
            Object.defineProperty(pseudoClassConstructor, key, {
                writeable: false,
                configurable: false,
                get: function () {
                    return val.bind(val);
                }.bind(val)
            });
        }
    };


    cls.setStaticProperties = function setStaticProperties(resolvedObj, pseudoClassConstructor) {
        var classTypes = pseudoClassConstructor.getClassTypes(),
            type = {},
            name = '',
            val;

        for (name in classTypes) {

            val = classTypes[ name ];

        }
    };


    /**
     * getting property from underlying classProperties object
     * it must get data from classProperties not classFacade because
     * this is the end of road and we dont want a infinite loop
     * this method is fired up by facade itself
     * @method getClassProperty
     * @param {object} classInstance
     * @param {object} classProperties
     * @param {object} classTypes
     * @param {string} key
     * @returns {anytype}
     */
    cls.getClassProperty = function getClassProperty(classObject, key) {
        //console.log('args',args);
        if ( cls.type( classObject.classProperties[ key ]) === 'function' ) {
            return function _getClassProperty() {// this is why func !== func of parent class (always brand new fn created here)
                var args=[];
                //console.log('arguments',arguments);
                args = cls.checkMethodArgTypes(classObject, key, arguments);
                var result = classObject.classProperties[ key ].apply(classObject.classFacade, args);
                return result;
            };
        } else {
            return classObject.classProperties[ key ];
        }
    };


    /**
     * @method setPublicProperty
     * @param {oobject} classInstance
     * @param {object} classProperties
     * @param {object} classTypes
     * @param {string} key
     * @param {anytype} val
     * @returns {undefined}
     */
    cls.setPublicProperty = function setPublicProperty(classObject, key, val) {

        var gettersetter={
            enumerable: true,
            get: function () {
                // access granted
                var result = cls.getClassProperty( classObject, key );
                return    result;

            }.bind(classObject.classFacade),
            set: function (newVal) {
                if (cls.checkClassPropertyType(classObject, key, newVal)) {
                    // access granted
                    classObject.classProperties[ key ] = newVal;
                }
            }.bind(classObject.classFacade)
        },
        where = {};

        Object.defineProperty(classObject.classFacade, key, gettersetter);

        // and execute
        classObject.classFacade[ key ] = val;
        // add geter seter to instance too because it might chande and we must update
        // if value is a function then it is going to prototype

        if( cls.type(val) === 'function' ){
            where = classObject.classInstance;
        }else{
            where = classObject.classInstance;
        }
        Object.defineProperty( classObject.classInstance, key, gettersetter);
        classObject.classInstance[ key ] = val;

    };

    /**
     * executes only once on class creation - from sourceObject
     * @method setPublicProperties
     * @param {object} resolvedObj
     * @param {object} classInstance
     * @param {object} classProperties
     * @param {object} classTypes
     * @returns {undefined}
     */
    cls.setPublicProperties = function setPublicProperties(classObject) {

        var publicProps = cls.getClassPropertiesOf(classObject, 'public'),
            name = '',
            i = 0,
            val;
        //console.log('classTypes',classObject.classTypes);
        //console.log('publicProps',publicProps);
        for (i in publicProps) {
            name = publicProps[ i ];
            val = classObject.resolvedObj[ name ];
            //console.log('name',name,'val',val);
            cls.setPublicProperty(classObject, name, val);
        }
    };

    /**
     * private properties must be executed with this pointing to classProperties
     * instead of classInstance because classInstance doesn't have private properties
     * but when public function is executing private function this is pointing on classInstance
     * so we must call public functions with classProperty as this, and add link to instance
     * @method setPrivateProperty
     * @param  {[type]}           classInstance   [description]
     * @param  {[type]}           classProperties [description]
     * @param  {[type]}           classTypes      [description]
     * @param  {[type]}           key             [description]
     * @param  {[type]}           val             [description]
     * @param  {[type]}           classId         [description]
     */
    cls.setPrivateProperty = function setPrivatePorperty(classObject, key, val, classId) {
        //console.log('setting up private property',key,val);
        Object.defineProperty(classObject.classFacade, key, {
            enumerable: true,
            get: function () {

                if( cls.isDef( this.getId ) ){
                    if( this.getId() === classId ){
                        var result = cls.getClassProperty(classObject, key);
                        return    result;
                    }
                }
                return undefined;

            }.bind(classObject.classFacade),
            set: function (newVal) {
                if (cls.checkClassPropertyType(classObject, key, newVal)) {
                    classObject.classProperties[ key ] = newVal;
                }
            }.bind(classObject.classFacade)
        });

        // and execute
        classObject.classFacade[ key ] = val;
    };


    cls.setPrivateProperties = function setPrivateProperties(classObject, classId) {

        var privateProps = cls.getClassPropertiesOf(classObject, 'private'),
                name = '',
                i = 0,
                val;
        //console.log('privateProps',privateProps);
        for (i in privateProps) {
            name = privateProps[ i ];
            val = classObject.resolvedObj[ name ];
            //console.log('name',name,'val',val);
            cls.setPrivateProperty(classObject, name, val, classId);
        }
    };


    /**
     * protected properties are same like private, only difference is that
     * protected properties will be inherited
     * @method setProtectedProperty
     * @param  {object}           classObject   [description]
     * @param  {string}           key             [description]
     * @param  {anytype}           val             [description]
     * @param  {string}           classId         [description]
     * @returns {undefined}
     */
    cls.setProtectedProperty = function setProtectedPorperty(classObject, key, val, classId) {
        //console.log('setting up private property',key,val);
        Object.defineProperty(classObject.classFacade, key, {
            enumerable: true,
            get: function () {

                if( cls.isDef( this.getId ) ){
                    if( this.getId() === classId ){
                        var result = cls.getClassProperty(classObject, key);
                        return    result;
                    }
                }
                return undefined;

            }.bind(classObject.classFacade),
            set: function (newVal) {
                if (cls.checkClassPropertyType(classObject, key, newVal)) {
                    classObject.classProperties[ key ] = newVal;
                }
            }.bind(classObject.classFacade)
        });

        // and execute
        classObject.classFacade[ key ] = val;
    };

    /**
     *
     * @method setProtectedProperties
     * @param  {object} classObject
     * @param  {string} classId
     */
    cls.setProtectedProperties = function setProtectedProperties(classObject, classId) {

        var protectedProps = cls.getClassPropertiesOf(classObject, 'protected'),
            name = '',
            i = 0,
            val;
        //console.log('protected props',protectedProps );
        for (i in protectedProps) {
            name = protectedProps[ i ];
            val = classObject.resolvedObj[ name ];
            //console.log('name',name,'val',val);
            cls.setProtectedProperty(classObject, name, val, classId);
        }
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
            key = keys[ i ];

            if (!cls.isDef(should[ key ])) {
                continue;
            }

            isVal = is[ key ];
            shouldVal = should[ key ];

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
                    throw new Error("Type mismatch. Object property [ " + path + " ] should be an " + shouldType + ".\n'" + isType + "' given.");
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
            key = keys[ i ];
            val = obj[ key ];
            type = cls.type(val);


            (function (newObj, val, key, type, obj, path) {
                var newType = '',
                        keys = [],
                        contentOk = true,
                        tmp = {};

                if (type === 'object' || type === 'function') {

                    tmp = cls.var(obj[ key ], path + '.' + key);
                    Object.defineProperty(newObj, key, {
                        get: function () {
                            return tmp;
                        },
                        set: function (newVal) {
                            var newType = cls.type(newVal);
                            if (newType !== type && type !== 'anytype') {
                                path = path + '.' + key;
                                path = path.substr(1);
                                throw new Error("Type mismatch. Object [ " + path + " ] should be an " + type + ".\n'" + newType + "' given.");
                            } else {
                                // newVal is object or function
                                contentOk = cls.checkObjectContentTypes(newVal, obj[ key ], path + '.' + key);
                                if (contentOk) {
                                    obj[ key ] = tmp;
                                }
                            }
                        }
                    });

                } else {

                    Object.defineProperty(newObj, key, {
                        //getting object from old object
                        get: function () {
                            return obj[ key ];
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
                                obj[ key ] = newVal;
                            }
                        }
                    });
                }

            }(newObj, val, key, type, obj, path));

        }

        return newObj;
    };



    /**
     * check if spelling in properties declaration is ok
     * if something is declared but not defined in class then throw an error
     * @method checkTypesAreDefined
     * @param {object} classTypes
     * @param {object} resolvedObj
     * @param {string} className
     * @returns {undefined}
     */
    cls.checkTypesAreDefined = function checkTypesAreDefined(classObject, className) {

        var name = '', definedNames = Object.keys( classObject.resolvedObj );
        for ( name in classObject.classTypes ) {
            if ( definedNames.indexOf( name ) === -1)  {
                throw new Error("class [ " + className + " ] property [ " + name + " ] is declared but doesn't exists.");
            }
        }
    };


    /**
     * types declaration parsing from comment blocks
     * @method generateClassTypes
     * @param {string} className
     * @param {function} sourceFn
     * @param {function} extendFn
     * @param {object} resolvedObj
     * @returns {object} classTypes object
     */
    cls.generateClassTypes = function generateClassTypes(className, sourceFn, extendFn, classObject) {

        /*
         * there are three states that class can be
         * first state is when class is brand new and not inherite nothing
         * - objFn will be function with comment blocks without
         *     sourceFn and extendFn props
         *
         * second is when class is inherited from first class
         * - so property of objFn.sourceFn will be instance constructor with sourceFn
         *     pointing to source function of first class (with comment blocks)
         *     and objFn.extendFn will be source that extends sourceFn of first class
         *
         * third state is when third class is extending second one
         * - objFn.sourceFn will point to second class instance constructor
         *     that also have sourceFn property, and objFn.extendFn is extending
         *     funtion with source block comments
         *
         * to create class types for first state just call getCommentBlock
         *
         * in second state there is a comment block already generated for it
         * so we need to get this object and parse extendFn content(getCommentBlock)
         * and merge it into one
         *
         * in third step same as before we must get compiled comment block
         * compile extendFn and merge it into one classTypes object
         *
         * this process(third) repeats for all nested classes
         */

        var classTypes = {},
            tmpClassTypes = {},
            fullClassTypes = {},
                extStr = '',
                extTypes = {},
                objStr = '',
                defaultType = {},
                name = '',
                val,value;

        // if we are extending fn then classTypes are there already
        // so we must extend it
        if (cls.isDef(sourceFn.sourceFn)) {
            // at least second state

            // check if this is third level
            if (cls.isDef(sourceFn.sourceFn.sourceFn)) {
                //if this is a 3 state we are getting classTypes
                // from second state that should have it
                tmpClassTypes = sourceFn.sourceFn.getClassTypes();
                //console.log('classTypes III phaze',classTypes);
            } else {
                // second state - sourceFn.sourceFn is really sourceFn ;) not constructor
                // so we can get class types from there we must compile it and extend
                objStr = sourceFn.sourceFn.toString();
                tmpClassTypes = cls.getCommentBlocks(objStr, className);
                //NOTE here can be an wrong error with class name
                // because class name point to now created one - not inherited
                // sorry this will not happend because class must be ok to compile
                // so if parent class is defined it must be ok - there will be no error
            }

            // we must copy only public properties
            for( name in tmpClassTypes ){
                val = tmpClassTypes[ name ];
                //console.log(name,'declarations',val.declarations);
                if( val.declarations.indexOf('private') === -1 ){
                    classTypes[ name ] = val;
                }
            }

            extStr = extendFn.toString();
            extTypes = cls.getCommentBlocks(extStr, className);

            // merging types
            classTypes = cls.merge(classTypes, extTypes);
            // all of the properties to check if
            fullClassTypes = cls.merge( tmpClassTypes, extTypes );
            //cls.checkTypesAreDefined(classTypes, resolvedObj, className);

            cls.checkTypesAreDefined(classObject, className);

        } else { // if we are creating brand new class then generate classTypes

            objStr = sourceFn.toString();
            classTypes = cls.getCommentBlocks(objStr, className);
            fullClassTypes = classTypes;
        }

        // we must add types to variables that are not declared
        //console.log('fullClassTypes',fullClassTypes);
        for (name in classObject.resolvedObj) {

            if (name === '$parent') {
                continue;
            }

            value = classObject.resolvedObj[ name ];
            // check fullClassTypes instead of classTypes wich are reduced
            if ( !cls.isDef( fullClassTypes[ name ] ) ) {
                //console.log(name,'is not defined - creating public');
                classTypes[ name ] = {
                    declarations: ['public'],
                    str: ''
                };
                if (cls.type(value) === 'function') {
                    classTypes[ name ].types = ['function'];
                    classTypes[ name ].returns = ['anytype'];
                    classTypes[ name ].arguments = [];
                } else {
                    classTypes[ name ].types = ['anytype'];
                }

            }else if( cls.isDef( fullClassTypes[ name ] ) ){// if some props are missing

                if( !cls.isDef( fullClassTypes[ name ].declarations) ){
                    // if property is declared but doesn't have "declaration"
                    classTypes[ name ].declarations = ['public'];
                }
                // if there is no type declaration - wich variable types should be assigned
                if( !cls.isDef( fullClassTypes[ name ].types ) ){
                    if( cls.type( value ) === 'function'){
                        classTypes[ name ].types = ['function'];
                    }else{
                        classTypes[ name ].types = ['anytype'];
                    }
                }

                // if this is function and there are no arguments
                if( cls.type( value ) === 'function' && !cls.isDef( fullClassTypes[ name ].arguments ) ){
                    classTypes[ name ].arguments = [];
                }

                // if this is function and there are no returns
                if( cls.type( value ) === 'function' && !cls.isDef( fullClassTypes[ name ].returns ) ){
                    classTypes[ name ].returns = ['anytype'];
                }
            }

        }
        //console.log('classTypes',classTypes);

        classObject.classTypes = classTypes;
        cls.addClassTypeValues(classObject.classTypes, classObject.resolvedObj);

        return classTypes;
    };

    /**
     * createClass - Yeeeaaahhh now we talking...
     * this function is just cls()
     * it create a constructor function from wich we will be creating instances
     * of our classes
     *
     * obj can be source object (extend parameter ommited)
     * or it can be class to inherits from (extend parameter will have extensions
     * to inherited class)
     *
     * @param {string} name = class name
     * @param {Function} sourceFn = function that returns object with method/props
     * @param {Object} extendFn = depends on number of variables(optional- used to extend other classes)
     * @returns {Object} - class instance constructor
     */
    cls.createClass = function createClass(name, sourceFn, extendFn) {

        var pseudoClassConstructor, pCC,
            pseudoClass,
            classInstance = {},
            $parent,
            classTypes = {},
            resolvedObj = {},
            classObject = {};

        if( cls.type(sourceFn) === 'undefined' ){
            throw new Error("Cannot create class [ "+name+" ] from undefined variable.");
        }
        //console.log('objFn',objFn);
        resolvedObj = cls.resolveSourceObject(sourceFn, extendFn);
        classObject.resolvedObj = resolvedObj;
        classObject.classInstance = {};
        classObject.classTypes = {};
        classObject.classProperties = {};
        classObject.classFacade = {};
        classObject.classPrototype = {}; // all prototype function will be stored here until create new instance

        // this is class to working with
        pseudoClass = function pseudoClass(name, classObject) {

            var baseObject = classObject.resolvedObj,
                id = cls.guid();

            //console.log('sourceObj',name,id,sourceObj);

            this.getId = classObject.classFacade.getId = function () {
                return id;
            };

            cls.setPrivateProperties(classObject,id);
            cls.setProtectedProperties(classObject,id);
        };

        pseudoClass.prototype.getName = classObject.classFacade.getName = function () {
            return name;
        };
        pseudoClass.prototype.getBaseObject = classObject.classFacade.getBaseObject = function () {
            return resolvedObj;
        };
        pseudoClass.prototype.getConstructor = classObject.classFacade.getConstructor = function () {
            return pseudoClassConstructor;
        };
        pseudoClass.prototype.getClassTypes = classObject.classFacade.getClassTypes = function () {
            return classTypes;
        };


        // this fn are copied in each    instance because prototype will
        // have reference only to one variable to every instance
        pseudoClassConstructor = function () {

            var args = arguments;

            classInstance = new pseudoClass(name, classObject);
            classObject.classInstance = classInstance;

            cls.setPublicProperties(classObject);


            if (cls.isDef(classInstance.__construct)) {
                args = cls.checkMethodArgTypes(classObject, '__construct', args);
                classInstance.__construct.apply(classInstance, args);
            }

            return classInstance;
        };

        pCC = pseudoClassConstructor;

        pCC.getBaseObject = function () {
            return resolvedObj;
        };

        pCC.sourceFn = sourceFn;
        pCC.extendFn = extendFn;

        cls.generateClassTypes(name, sourceFn, extendFn, classObject);


        pCC.getClassTypes = function () {
            return classObject.classTypes;
        };

        //cls.setStaticProperties( resolvedObj, pseudoClassConstructor );
        //console.log('resolvedObj',cls.type(resolvedObj),resolvedObj );
        if (!cls.isDef(resolvedObj)) {
            throw new Error("Class must be an object.");
        }
        if (cls.type(resolvedObj) !== 'object') {
            throw new Error("Class must be an object.");
        }

        return  pseudoClassConstructor;
    };

    return cls;
}());

if (typeof module !== 'undefined') {
    module.exports = cls;
}
