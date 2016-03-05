// Auto generated class

var ClassFromCommentsSource = {
  "className":"ClassFromComments",
  "type":"class",
  "source":{
      "someMethod":{
          "types":[ "function" ],
          "className":"ClassFromComments",
          "value":function ( name ) {
            return "someMethod";
          },
          "declarations":[ "protected" ],
          "str":"[function description]\n"+
          "@method  someMethod protected\n"+
          "@param {string} name = \"John\"\n"+
        "@returns {string}",
          "arguments":[ {
                  "types":[ "string" ],
                  "name":"name",
                  "default":"John",
              }, ],
          "returns":[ "string" ],
      },
      "getSomeMethod":{
          "types":[ "function" ],
          "className":"ClassFromComments",
          "value":function () {
            return this.someMethod();
          },
          "declarations":[ "public" ],
          "str":"[function description]\n"+
          "@method  getSomeMethod public\n"+
        "@returns {string}",
          "arguments":[],
          "returns":[ "string" ],
      },
  },
};
var ClassFromComments = cls.class(ClassFromComments,ClassFromCommentsSource);
