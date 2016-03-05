var EOF = -1;

    var Stream = function() {
        /* ABSTRACT */
    };
    // you must define one of read / readByte for a readable stream
    Stream.prototype.readByte = function() {
        var buf = [ 0 ];
        var len = this.read(buf, 0, 1);
        if (len===0) { this._eof = true; return EOF; }
        return buf[0];
    };
    Stream.prototype.read = function(buf, bufOffset, length) {
        var ch, bytesRead = 0;
        while (bytesRead < length) {
            ch = this.readByte();
            if (ch === EOF) { this._eof = true; break; }
            buf[bufOffset+(bytesRead++)] = ch;
        }
        return bytesRead;
    };
    // reasonable default implementation of 'eof'
    Stream.prototype.eof = function() { return !!this._eof; };
    // not all readable streams are seekable
    Stream.prototype.seek = function(pos) {
        throw new Error('Stream is not seekable.');
    };
    Stream.prototype.tell = function() {
        throw new Error('Stream is not seekable.');
    };
    // you must define one of write / writeByte for a writable stream
    Stream.prototype.writeByte = function(_byte) {
        var buf = [ _byte ];
        this.write(buf, 0, 1);
    };
    Stream.prototype.write = function(buf, bufOffset, length) {
        var i;
        for (i=0; i<length; i++) {
            this.writeByte(buf[bufOffset + i]);
        }
        return length;
    };
    // flush will happily do nothing if you don't override it.
    Stream.prototype.flush = function() { };

    // export EOF as a constant.
    Stream.EOF = EOF;



    var BitStream = function(stream) {
        (function() {
            var bufferByte = 0x100; // private var for readers
            this.readBit = function() {
                if ((bufferByte & 0xFF) === 0) {
                    var ch = stream.readByte();
                    if (ch === Stream.EOF) {
                        this._eof = true;
                        return ch; /* !!! */
                    }
                    bufferByte = (ch << 1) | 1;
                }
                var bit = (bufferByte & 0x100) ? 1 : 0;
                bufferByte <<= 1;
                return bit;
            };
            // seekable iff the provided stream is
            this.seekBit = function(pos) {
                var n_byte = pos >>> 3;
                var n_bit = pos - (n_byte*8);
                this.seek(n_byte);
                this._eof = false;
                this.readBits(n_bit);
            };
            this.tellBit = function() {
                var pos = stream.tell() * 8;
                var b = bufferByte;
                while ((b & 0xFF) !== 0) {
                    pos--;
                    b <<= 1;
                }
                return pos;
            };
            // implement byte stream interface as well.
            this.readByte = function() {
                if ((bufferByte & 0xFF) === 0) {
                    return stream.readByte();
                }
                return this.readBits(8);
            };
            this.seek = function(pos) {
                stream.seek(pos);
                bufferByte = 0x100;
            };
        }).call(this);
        (function() {
            var bufferByte = 1; // private var for writers
            this.writeBit = function(b) {
                bufferByte <<= 1;
                if (b) { bufferByte |= 1; }
                if (bufferByte & 0x100) {
                    stream.writeByte(bufferByte & 0xFF);
                    bufferByte = 1;
                }
            };
            // implement byte stream interface as well
            this.writeByte = function(_byte) {
                if (bufferByte===1) {
                    stream.writeByte(_byte);
                } else {
                    stream.writeBits(8, _byte);
                }
            };
            this.flush = function() {
                while (bufferByte !== 1) {
                    this.writeBit(0);
                }
                if (stream.flush) { stream.flush(); }
            };
        }).call(this);
    };
    // inherit read/write methods from Stream.
    BitStream.EOF = Stream.EOF;
    BitStream.prototype = Object.create(Stream.prototype);
    // bit chunk read/write
    BitStream.prototype.readBits = function(n) {
        var i, r = 0, b;
        if (n > 31) {
            r = this.readBits(n-16)*0x10000; // fp multiply, not shift
            return r + this.readBits(16);
        }
        for (i = 0; i < n; i++) {
            r <<= 1; // this could make a negative value if n>31
            // bits read past EOF are all zeros!
            if (this.readBit() > 0) { r++; }
        }
        return r;
    };
    BitStream.prototype.writeBits = function(n, value) {
        if (n > 32) {
            var low = (value & 0xFFFF);
            var high = (value - low) / (0x10000); // fp division, not shift
            this.writeBits(n-16, high);
            this.writeBits(16, low);
            return;
        }
        var i;
        for (i = n-1; i >= 0; i--) {
            this.writeBit( (value >>> i) & 1 );
        }
    };








    var Context1Model = function(modelFactory, contextSize, alphabetSize) {
      var i;
      this.literalModel = [];
      // even if there's an EOF symbol, we don't need a context for it!
      for (i=0; i<contextSize; i++) {
        this.literalModel[i] = modelFactory(alphabetSize);
      }
    };
    Context1Model.prototype.encode = function(ch, context) {
      this.literalModel[context].encode(ch);
    };
    Context1Model.prototype.decode = function(context) {
      return this.literalModel[context].decode();
    };

    /** Simple self-test. */
    Context1Model.MAGIC='ctx1';
    Context1Model.compressFile = Util.compressFileHelper(Context1Model.MAGIC, function(inStream, outStream, fileSize, props) {
      var bitstream = new BitStream(outStream);
      var alphabetSize = 256;
      if (fileSize < 0) { alphabetSize++; }
      var coder = Huffman.factory(bitstream, 8191);
      var model = new Context1Model(coder, 256, alphabetSize);
      var lastchar = 0x20;
      var modelp = {
        encode: function(symbol) {
          model.encode(symbol, lastchar);
          lastchar = symbol;
        }
      };
      Util.compressWithModel(inStream, fileSize, modelp);
      bitstream.flush();
    });
    Context1Model.decompressFile = Util.decompressFileHelper(Context1Model.MAGIC, function(inStream, outStream, fileSize) {
      var bitstream = new BitStream(inStream);
      var alphabetSize = 256;
      if (fileSize < 0) { alphabetSize++; }
      var coder = Huffman.factory(bitstream, 8191);
      var model = new Context1Model(coder, 256, alphabetSize);
      var lastchar = 0x20;
      var modelp = {
        decode: function() {
          var symbol = model.decode(lastchar);
          lastchar = symbol;
          return symbol;
        }
      };
      Util.decompressWithModel(outStream, fileSize, modelp);
    });








    var LOG_PROB_TOTAL = 8;
var PROB_TOTAL = 1 << LOG_PROB_TOTAL;
var MAX_ESCAPE_COUNT = 40;

var DefSumModel = function(coder, size, isDecoder) {
  var i;
  console.assert(size < 300); // not meant for sparse
  var ESCAPE = this.numSyms = size;
  this.coder = coder;
  this.prob = Util.makeU16Buffer(size+2); /* size + ESC + 1 */
  this.escape = Util.makeU16Buffer(size+1);  /* size + 1*/
  this.update = Util.makeU16Buffer(size+1); /* size + ESC */
  this.prob[ESCAPE+1] = PROB_TOTAL;
  for (i=0; i<=this.numSyms; i++) {
    this.escape[i] = i;
  }
  this.updateCount = 0;
  this.updateThresh = PROB_TOTAL - Math.floor(PROB_TOTAL / 2);
  if (!isDecoder) { return; }
  // extra tables for fast decoding
  this.probToSym = Util.makeU16Buffer(PROB_TOTAL);
  this.escProbToSym = Util.makeU16Buffer(this.numSyms);
  for (i=0; i<PROB_TOTAL; i++) {
    this.probToSym[i] = ESCAPE;
  }
  for (i=0; i<this.numSyms; i++) {
    this.escProbToSym[i] = i;
  }
};
DefSumModel.factory = function(coder, isDecoder) {
  return function(size) { return new DefSumModel(coder, size, isDecoder); };
};
DefSumModel.prototype._update = function(symbol, isDecoder) {
  if (symbol === this.numSyms) {
    // some special cases for the escape character
    if (this.update[symbol] >= MAX_ESCAPE_COUNT) { return; } // hard limit
    // don't let an escape character trigger an update, because then the
    // escaped character might find itself unescaped after the tables have
    // been updated!
    if (this.updateCount >= (this.updateThresh - 1)) { return; }
  }
  this.update[symbol]++;
  this.updateCount++;
  // is it time to transfer the updated probabilities?
  if (this.updateCount < this.updateThresh) {
    return; //defer update
  }
  var cumProb, cumEscProb, odd, i, j, k;
  this.escape[0] = this.prob[0] = cumProb = cumEscProb = odd = 0;
  for (i=0; i < this.numSyms+1; i++) {
    var newProb = ((this.prob[i+1]-this.prob[i]) >>> 1) + this.update[i];
    if (newProb) {
      // live 'un
      this.prob[i] = cumProb;
      cumProb += newProb;
      if (newProb & 1) { odd++; }
      this.escape[i] = cumEscProb;
    } else {
      // this symbol will escape
      this.prob[i] = cumProb;
      this.escape[i] = cumEscProb;
      cumEscProb++;
    }
  }
  this.prob[i] = cumProb;
  console.assert(cumProb === PROB_TOTAL);
  /* how many updates will be required after current probs are halved? */
  this.updateThresh = PROB_TOTAL - Math.floor((cumProb-odd) / 2);
  /* reset the update table */
  for (i=0; i < (this.numSyms + 1); i++) {
    this.update[i] = 0;
  }
  this.update[this.numSyms] = 1; // ensure that escape never goes away
  this.updateCount = 1;
  /* compute decode table, if this is a decoder */
  if (!isDecoder) { return; }
  for (i=0, j=0, k=0; i<(this.numSyms+1); i++) {
    var probLimit = this.prob[i+1];
    for (; j<probLimit; j++) {
      this.probToSym[j] = i;
    }
    var escProbLimit = this.escape[i+1];
    for (; k<escProbLimit; k++) {
      this.escProbToSym[k] = i;
    }
  }
};
DefSumModel.prototype.encode = function(symbol) {
  var lt_f = this.prob[symbol];
  var sy_f = this.prob[symbol+1] - lt_f;
  console.assert(this.prob[this.numSyms+1] === PROB_TOTAL);
  if (sy_f) {
    this.coder.encodeShift(sy_f, lt_f, LOG_PROB_TOTAL);
    return this._update(symbol);
  }
  // escape!
  console.assert(symbol !== this.numSyms); // catch infinite recursion
  this.encode(this.numSyms); // guaranteed non-zero probability
  // code symbol as literal, taking advantage of reduced escape range.
  lt_f = this.escape[symbol];
  sy_f = this.escape[symbol+1] - lt_f;
  var tot_f = this.escape[this.numSyms];
  this.coder.encodeFreq(sy_f, lt_f, tot_f);
  return this._update(symbol);
};
DefSumModel.prototype.decode = function() {
  var prob = this.coder.decodeCulShift(LOG_PROB_TOTAL);
  var symbol = this.probToSym[prob];
  var lt_f = this.prob[symbol];
  var sy_f = this.prob[symbol+1] - lt_f;
  this.coder.decodeUpdate(sy_f, lt_f, PROB_TOTAL);
  this._update(symbol, true);
  if (symbol !== this.numSyms) {
    return symbol;
  }
  // escape!
  var tot_f = this.escape[this.numSyms];
  prob = this.coder.decodeCulFreq(tot_f);
  symbol = this.escProbToSym[prob];
  lt_f = this.escape[symbol];
  sy_f = this.escape[symbol+1] - lt_f;
  this.coder.decodeUpdate(sy_f, lt_f, tot_f);
  this._update(symbol, true);
  return symbol;
};

DefSumModel.MAGIC='dfsm';
/** Simple order-0 compressor, as self-test. */
DefSumModel.compressFile = Util.compressFileHelper(DefSumModel.MAGIC, function(inStream, outStream, fileSize, props, finalByte) {
  var range = new RangeCoder(outStream);
  range.encodeStart(finalByte, 1);
  var model = new DefSumModel(range, (fileSize<0) ? 257 : 256);
  Util.compressWithModel(inStream, fileSize, model);
  range.encodeFinish();
},true);
/** Simple order-0 decompresser, as self-test. */
DefSumModel.decompressFile = Util.decompressFileHelper(DefSumModel.MAGIC, function(inStream, outStream, fileSize) {
  var range = new RangeCoder(inStream);
  range.decodeStart(true/*already read the final byte*/);
  var model = new DefSumModel(range, (fileSize<0) ? 257 : 256, true);
  Util.decompressWithModel(outStream, fileSize, model);
  range.decodeFinish();
});








/** We store two probabilities in a U32, so max prob is going to be 0xFFFF */
var DEFAULT_MAX_PROB = 0xFF00;
var DEFAULT_INCREMENT= 0x0100;

var ESC_MASK = 0x0000FFFF, ESC_SHIFT = 0;
var SYM_MASK = 0xFFFF0000, SYM_SHIFT = 16;
var SCALE_MASK=0xFFFEFFFE;

var FenwickModel = function(coder, size, max_prob, increment) {
    this.coder = coder;
    this.numSyms = size + 1; // save space for an escape symbol
    this.tree = Util.makeU32Buffer(this.numSyms*2);
    this.increment = (+increment) || DEFAULT_INCREMENT;
    this.max_prob = (+max_prob) || DEFAULT_MAX_PROB;
    // sanity-check to prevent overflow.
    console.assert((this.max_prob + (this.increment-1)) <= 0xFFFF);
    console.assert(size <= 0xFFFF);
    // record escape probability as 1.
    var i;
    for (i=0; i<size; i++) {
        this.tree[this.numSyms + i] = // escape prob=1, sym prob = 0
            (1 << ESC_SHIFT) | (0 << SYM_SHIFT);
    }
    this.tree[this.numSyms + i] = // escape prob = 0, sym prob = 1
        (0 << ESC_SHIFT) | (this.increment << SYM_SHIFT);
    this._sumTree();
    // probability sums are in this.tree[1].  this.tree[0] is unused.
};
FenwickModel.factory = function(coder, max_prob, increment) {
    return function(size) {
        return new FenwickModel(coder, size, max_prob, increment);
    };
};
FenwickModel.prototype.clone = function() {
    var newModel = new FenwickModel(this.coder, this.size,
                                    this.max_prob, this.increment);
    var i;
    for (i=1; i<this.tree.length; i++) {
        newModel.tree[i] = this.tree[i];
    }
    return newModel;
};
FenwickModel.prototype.encode = function(symbol) {
    var i = this.numSyms + symbol;
    var sy_f = this.tree[i];
    var mask = SYM_MASK, shift = SYM_SHIFT;
    var update = (this.increment << SYM_SHIFT);

    if ((sy_f & SYM_MASK) === 0) { // escape!
        this.encode(this.numSyms-1);
        mask = ESC_MASK;
        update -= (1<<ESC_SHIFT); // not going to escape no mo'
        shift = ESC_SHIFT;
    } else if (symbol === (this.numSyms-1) &&
               ((this.tree[1] & ESC_MASK) >>> ESC_SHIFT) === 1) {
        // this is the last escape, zero it out
        update = -this.tree[i];
    }
    // sum up the proper lt_f
    var lt_f = 0;
    while (i > 1) {
        var isRight = (i & 1);
        var parent = (i >>> 1);
        // if we're the right child, we need to
        // add the prob from the left child
        if (isRight) {
            lt_f += this.tree[2*parent];
        }
        // update sums
        this.tree[i] += update; // increase sym / decrease esc
        i = parent;
    }
    var tot_f = this.tree[1];
    this.tree[1] += update; // update prob in root
    sy_f = (sy_f & mask) >>> shift;
    lt_f = (lt_f & mask) >>> shift;
    tot_f =(tot_f& mask) >>> shift;
    this.coder.encodeFreq(sy_f, lt_f, tot_f);
    // rescale?
    if ((( this.tree[1] & SYM_MASK ) >>> SYM_SHIFT) >= this.max_prob) {
        this._rescale();
    }
};
FenwickModel.prototype._decode = function(isEscape) {
    var mask = SYM_MASK, shift = SYM_SHIFT;
    var update = (this.increment << SYM_SHIFT);
    if (isEscape) {
        mask = ESC_MASK;
        update -= (1 << ESC_SHIFT);
        shift = ESC_SHIFT;
    }
    var tot_f = (this.tree[1] & mask) >>> shift;
    var prob = this.coder.decodeCulFreq(tot_f);
    // travel down the tree looking for this
    var i = 1, lt_f = 0;
    while (i < this.numSyms) {
        this.tree[i] += update;
        // look at probability in left child.
        var leftProb = (this.tree[2*i] & mask) >>> shift;
        i *= 2;
        if ((prob-lt_f) >= leftProb) {
            lt_f += leftProb;
            i++; // take the right child.
        }
    }
    var symbol = i - this.numSyms;
    var sy_f = (this.tree[i] & mask) >>> shift;
    this.tree[i] += update;
    this.coder.decodeUpdate(sy_f, lt_f, tot_f);
    // was this the last escape?
    if (symbol === (this.numSyms-1) &&
        ((this.tree[1] & ESC_MASK) >>> ESC_SHIFT) === 1) {
        update = -this.tree[i]; // zero it out
        while (i >= 1) {
            this.tree[i] += update;
            i = (i >>> 1); // parent
        }
    }
    // rescale?
    if ((( this.tree[1] & SYM_MASK ) >>> SYM_SHIFT) >= this.max_prob) {
        this._rescale();
    }
    return symbol;
};
FenwickModel.prototype.decode = function() {
    var symbol = this._decode(false); // not escape
    if (symbol === (this.numSyms-1)) {
        // this was an escape!
        symbol = this._decode(true); // an escape!
    }
    return symbol;
};
FenwickModel.prototype._rescale = function() {
    var i, prob, noEscape = true;
    // scale symbols (possible causing them to escape)
    for (i=0; i < this.numSyms-1; i++) {
        prob = this.tree[this.numSyms + i];
        if ((prob & ESC_MASK) !== 0) {
            // this symbol escapes
            noEscape = false;
            continue;
        }
        prob = (prob & SCALE_MASK) >>> 1;
        if (prob === 0) {
            // this symbol newly escapes
            prob = (1 << ESC_SHIFT);
            noEscape = false;
        }
        this.tree[this.numSyms + i] = prob;
    }
    // scale the escape symbol
    prob = this.tree[this.numSyms + i];
    prob = (prob & SCALE_MASK) >>> 1;
    // prob should be zero if there are no escaping symbols, otherwise
    // it must be at least 1.
    if (noEscape) { prob = 0; }
    else if (prob === 0) { prob = (1 << SYM_SHIFT); }
    this.tree[this.numSyms + i] = prob;
    // sum it all up afresh
    this._sumTree();
};
FenwickModel.prototype._sumTree = function() {
    var i;
    // sum it all. (we know we won't overflow)
    for (i=this.numSyms - 1; i > 0; i--) {
        this.tree[i] = this.tree[2*i] + this.tree[2*i + 1];
    }
};

FenwickModel.MAGIC = 'fenw';
/** Simple order-0 compressor, as self-test. */
FenwickModel.compressFile = Util.compressFileHelper(FenwickModel.MAGIC, function(inStream, outStream, fileSize, props, finalByte) {
    var range = new RangeCoder(outStream);
    range.encodeStart(finalByte, 1);
    var model = new FenwickModel(range, (fileSize<0) ? 257 : 256);
    Util.compressWithModel(inStream, fileSize, model);
    range.encodeFinish();
}, true);

/** Simple order-0 decompresser, as self-test. */
FenwickModel.decompressFile = Util.decompressFileHelper(FenwickModel.MAGIC, function(inStream, outStream, fileSize) {
    var range = new RangeCoder(inStream);
    range.decodeStart(true/*already read the final byte*/);
    var model = new FenwickModel(range, (fileSize<0) ? 257 : 256);
    Util.decompressWithModel(outStream, fileSize, model);
    range.decodeFinish();
});











var HTable = function(up, down, symbol, weight) {
    this.up = up; // next node up the tree
    this.down = down; // pair of down nodes
    this.symbol = symbol;       // node symbol value
    this.weight = weight;       // node weight
};
HTable.prototype.clone = function() {
  return new HTable(this.up, this.down, this.symbol, this.weight);
};
HTable.prototype.set = function(htable) {
  this.up = htable.up;
  this.down = htable.down;
  this.symbol = htable.symbol;
  this.weight = htable.weight;
};

//  initialize an adaptive coder
//  for alphabet size, and count
//  of nodes to be used
var Huffman = function(size, root, bitstream, max_weight) {
  var i;
  //  default: all alphabet symbols are used

  console.assert(size && typeof(size)==='number');
  if( !root || root > size )
      root = size;

  //  create the initial escape node
  //  at the tree root

  if ( root <<= 1 ) {
      root--;
  }

  // create root+1 htables (coding table)
  // XXX this could be views on a backing Uint32 array?
  this.table = [];
  for (i=0; i<=root; i++) {
    this.table[i] = new HTable(0,0,0,0);
  }

  // this.map => mapping for symbols to nodes
  this.map = [];
  // this.size => the alphabet size
  if( this.size = size ) {
    for (i=0; i<size; i++) {
      this.map[i] = 0;
    }
  }

  // this.esc  => the current tree height
  // this.root => the root of the tree
  this.esc = this.root = root;

  if (bitstream) {
    this.readBit = bitstream.readBit.bind(bitstream);
    this.writeBit = bitstream.writeBit.bind(bitstream);
  }
  this.max_weight = max_weight; // may be null or undefined
}
// factory interface
Huffman.factory = function(bitstream, max_weight) {
  return function(size) {
    return new Huffman(size, size, bitstream, max_weight);
  };
};


// split escape node to incorporate new symbol

Huffman.prototype.split = function(symbol) {
  var pair, node;

  //  is the tree already full???

  if( pair = this.esc ) {
    this.esc--;
  } else {
    console.assert(false);
    return 0;
  }

  //  if this is the last symbol, it moves into
  //  the escape node's old position, and
  //  this.esc is set to zero.

  //  otherwise, the escape node is promoted to
  //  parent a new escape node and the new symbol.

  if( node = this.esc ) {
    this.table[pair].down = node;
    this.table[pair].weight = 1;
    this.table[node].up = pair;
    this.esc--;
  } else {
    pair = 0;
    node = 1;
  }

  //  initialize the new symbol node

  this.table[node].symbol = symbol;
  this.table[node].weight = 0;
  this.table[node].down = 0;
  this.map[symbol] = node;

  //  initialize a new escape node.

  this.table[this.esc].weight = 0;
  this.table[this.esc].down = 0;
  this.table[this.esc].up = pair;
  return node;
};

//  swap leaf to group leader position
//  return symbol's new node

Huffman.prototype.leader = function(node) {
  var weight = this.table[node].weight;
  var leader = node, prev, symbol;

  while( weight === this.table[leader + 1].weight ) {
    leader++;
  }

  if( leader === node ) {
    return node;
  }

  // swap the leaf nodes

  symbol = this.table[node].symbol;
  prev = this.table[leader].symbol;

  this.table[leader].symbol = symbol;
  this.table[node].symbol = prev;
  this.map[symbol] = leader;
  this.map[prev] = node;
  return leader;
};

//  slide internal node up over all leaves of equal weight;
//  or exchange leaf with next smaller weight internal node

//  return node's new position

Huffman.prototype.slide = function(node) {
  var next = node;
  var swap;

  swap = this.table[next++].clone();

  // if we're sliding an internal node, find the
  // highest possible leaf to exchange with

  if( swap.weight & 1 ) {
    while( swap.weight > this.table[next + 1].weight ) {
      next++;
    }
  }

  //  swap the two nodes

  this.table[node].set(this.table[next]);
  this.table[next].set(swap);

  this.table[next].up = this.table[node].up;
  this.table[node].up = swap.up;

  //  repair the symbol map and tree structure

  if( swap.weight & 1 ) {
    this.table[swap.down].up = next;
    this.table[swap.down - 1].up = next;
    this.map[this.table[node].symbol] = node;
  } else {
    this.table[this.table[node].down - 1].up = node;
    this.table[this.table[node].down].up = node;
    this.map[swap.symbol] = next;
  }

  return next;
};

//  increment symbol weight and re balance the tree.

Huffman.prototype.increment = function(node) {
  var up;

  //  obviate swapping a parent with its child:
  //    increment the leaf and proceed
  //    directly to its parent.

  //  otherwise, promote leaf to group leader position in the tree

  if( this.table[node].up === node + 1 ) {
    this.table[node].weight += 2;
    node++;
  } else {
    node = this.leader (node);
  }

  //  increase the weight of each node and slide
  //  over any smaller weights ahead of it
  //  until reaching the root

  //  internal nodes work upwards from
  //  their initial positions; while
  //  symbol nodes slide over first,
  //  then work up from their final
  //  positions.

  while( this.table[node].weight += 2, up = this.table[node].up ) {
    while( this.table[node].weight > this.table[node + 1].weight ) {
        node = this.slide (node);
    }

    if( this.table[node].weight & 1 ) {
        node = up;
    } else {
        node = this.table[node].up;
    }
  }

  /* Re-scale if necessary. */
  if (this.max_weight) {
    if (this.table[this.root].weight >= this.max_weight) {
      this.scale(1);
    }
  }
};

//  scale all weights and re-balance the tree

//  zero weight nodes are removed from the tree
//  by sliding them out the left of the rank list

Huffman.prototype.scale = function(bits) {
  var node = this.esc, weight, prev;

  //  work up the tree from the escape node
  //  scaling weights by the value of bits

  while( ++node <= this.root ) {
    //  recompute the weight of internal nodes;
    //  slide down and out any unused ones

    if( this.table[node].weight & 1 ) {
      if( weight = this.table[this.table[node].down].weight & ~1 ) {
        weight += this.table[this.table[node].down - 1].weight | 1;
      }

      //  remove zero weight leaves by incrementing HuffEsc
      //  and removing them from the symbol map.  take care

    } else if( !(weight = this.table[node].weight >> bits & ~1) ) {
      if( this.map[this.table[node].symbol] = 0, this.esc++ ) {
        this.esc++;
      }
    }

    // slide the scaled node back down over any
    // previous nodes with larger weights

    this.table[node].weight = weight;
    prev = node;

    while( weight < this.table[--prev].weight ) {
      this.slide(prev);
    }
  }

  // prepare a new escape node

  this.table[this.esc].down = 0;
};

//  send the bits for an escaped symbol

Huffman.prototype.sendid = function(symbol) {
  var empty = 0, max;

  //  count the number of empty symbols
  //  before the symbol in the table

  while( symbol-- ) {
    if( !this.map[symbol] ) {
      empty++;
    }
  }

  //  send LSB of this count first, using
  //  as many bits as are required for
  //  the maximum possible count

  if( max = this.size - Math.floor((this.root - this.esc) / 2) - 1 ) {
    do {
      this.writeBit(empty & 1);
      empty >>= 1;
    } while( max >>= 1 );
  }
};

//  encode the next symbol

Huffman.prototype.encode = function(symbol) {
  var emit = 1, bit;
  var up, idx, node;

  if( symbol < this.size ) {
    node = this.map[symbol];
  } else {
    console.assert(false);
    return;
  }

  //  for a new symbol, direct the receiver to the escape node
  //  but refuse input if table is already full.

  if( !(idx = node) ) {
    if( !(idx = this.esc) ) {
      return;
    }
  }

  //  accumulate the code bits by
  //  working up the tree from
  //  the node to the root

  while( up = this.table[idx].up ) {
    emit <<= 1; emit |= idx & 1; idx = up;
  }

  //  send the code, root selector bit first

  while( bit = emit & 1, emit >>= 1 ) {
    this.writeBit(bit);
  }

  //  send identification and incorporate
  //  new symbols into the tree

  if( !node ) {
    this.sendid(symbol);
    node = this.split(symbol);
  }

  //  adjust and re-balance the tree

  this.increment(node);
};

//  read the identification bits
//  for an escaped symbol

Huffman.prototype.readid = function() {
  var empty = 0, bit = 1, max, symbol;

  //  receive the symbol, LSB first, reading
  //  only the number of bits necessary to
  //  transmit the maximum possible symbol value

  if( max = this.size - Math.floor((this.root - this.esc) / 2) - 1 ) {
    do {
      empty |= this.readBit() ? bit : 0;
      bit <<= 1;
    } while( max >>= 1 );
  }

  //  the count is of unmapped symbols
  //  in the table before the new one

  for( symbol = 0; symbol < this.size; symbol++ ) {
    if( !this.map[symbol] ) {
      if( !empty-- ) {
        return symbol;
      }
    }
  }

  //  oops!  our count is too big, either due
  //  to a bit error, or a short node count
  //  given to huff_init.

  console.assert(false);
  return 0;
};

//  decode the next symbol

Huffman.prototype.decode = function() {
  var node = this.root;
  var symbol, down;

  //  work down the tree from the root
  //  until reaching either a leaf
  //  or the escape node.  A one
  //  bit means go left, a zero
  //  means go right.

  while( down = this.table[node].down ) {
    if( this.readBit() ) {
      node = down - 1;  // the left child precedes the right child
    } else {
      node = down;
    }
  }

  //  sent to the escape node???
  //  refuse to add to a full tree

  if( node === this.esc ) {
    if( this.esc ) {
      symbol = this.readid ();
      node = this.split (symbol);
    } else {
      console.assert(false);
      return 0;
    }
  } else {
    symbol = this.table[node].symbol;
  }

  //  increment weights and re-balance
  //  the coding tree

  this.increment (node);
  return symbol;
};

// stand alone compressor, mostly for testing
Huffman.MAGIC = 'huff';
Huffman.compressFile = Util.compressFileHelper(Huffman.MAGIC, function(input, output, size, props) {
  var bitstream = new BitStream(output);

  var alphabetSize = 256;
  if (size < 0) { alphabetSize++; }
  var huff = new Huffman(257, alphabetSize, bitstream, 8191);
  Util.compressWithModel(input, size, huff);
  bitstream.flush();
});

// stand alone decompresser, again for testing
Huffman.decompressFile = Util.decompressFileHelper(Huffman.MAGIC, function(input, output, size) {
  var bitstream = new BitStream(input);

  var alphabetSize = 256;
  if (size < 0) { alphabetSize++; }
  var huff = new Huffman(257, alphabetSize, bitstream, 8191);
  Util.decompressWithModel(output, size, huff);
});




// lengthBitsModelFactory will be called with arguments 2, 4, 8, 16, etc
  // and must return an appropriate model or coder.
  var LogDistanceModel = function(size, extraStates,
                                  lgDistanceModelFactory,
                                  lengthBitsModelFactory) {
      var i;
      var bits = Util.fls(size-1);
      this.extraStates = +extraStates || 0;
      this.lgDistanceModel = lgDistanceModelFactory(1 + bits + extraStates);
      // this.distanceModel[n] used for distances which are n-bits long,
      // but only n-1 bits are encoded: the top bit is known to be one.
      this.distanceModel = [];
      for (i=2 ; i <= bits; i++) {
          var numBits = i - 1;
          this.distanceModel[i] = lengthBitsModelFactory(1<<numBits);
      }
  };
  /* you can give this model arguments between 0 and (size-1), or else
     a negative argument which is one of the 'extra states'. */
  LogDistanceModel.prototype.encode = function(distance) {
      if (distance < 2) { // small distance or an 'extra state'
          this.lgDistanceModel.encode(distance + this.extraStates);
          return;
      }
      var lgDistance = Util.fls(distance);
      console.assert(distance & (1<<(lgDistance-1))); // top bit is set
      console.assert(lgDistance >= 2);
      this.lgDistanceModel.encode(lgDistance + this.extraStates);
      // now encode the rest of the bits.
      var rest = distance & ((1 << (lgDistance-1)) - 1);
      this.distanceModel[lgDistance].encode(rest);
  };
  LogDistanceModel.prototype.decode = function() {
      var lgDistance = this.lgDistanceModel.decode() - this.extraStates;
      if (lgDistance < 2) {
          return lgDistance; // this is a small distance or an 'extra state'
      }
      var rest = this.distanceModel[lgDistance].decode();
      return (1 << (lgDistance-1)) + rest;
  };





var NoModel = function(bitstream, size) {
  this.bitstream = bitstream;
  this.bits = Util.fls(size-1);
};
NoModel.factory = function(bitstream) {
  return function(size) { return new NoModel(bitstream, size); };
};
NoModel.prototype.encode = function(symbol) {
  var i;
  for (i=this.bits-1; i>=0; i--) {
    var b = (symbol >>> i) & 1;
    this.bitstream.writeBit(b);
  }
};
NoModel.prototype.decode = function() {
  var i, r = 0;
  for (i=this.bits-1; i>=0; i--) {
    r <<= 1;
    if (this.bitstream.readBit()) r++;
  }
  return r;
};

/** Brain-dead self-test. */
NoModel.MAGIC = 'nomo';
NoModel.compressFile = Util.compressFileHelper(NoModel.MAGIC, function(inStream, outStream, fileSize, props) {
    var bitstream = new BitStream(outStream);
    var model = new NoModel(bitstream, (fileSize<0) ? 257 : 256);
    Util.compressWithModel(inStream, fileSize, model);
    bitstream.flush();
});
NoModel.decompressFile = Util.decompressFileHelper(NoModel.MAGIC, function(inStream, outStream, fileSize) {
    var bitstream = new BitStream(inStream);
    var model = new NoModel(bitstream, (fileSize<0) ? 257 : 256);
    Util.decompressWithModel(outStream, fileSize, model);
});






var CODE_BITS = 32;
  var Top_value = Math.pow(2, CODE_BITS-1);
  var SHIFT_BITS = (CODE_BITS - 9);
  var EXTRA_BITS = ((CODE_BITS-2) % 8 + 1);
  var Bottom_value = (Top_value >>> 8);

  var MAX_INT = Math.pow(2, CODE_BITS) - 1;

  /* it is highly recommended that the total frequency count is less  */
  /* than 1 << 19 to minimize rounding effects.                       */
  /* the total frequency count MUST be less than 1<<23                */


  var RangeCoder = function(stream) {
      this.low = 0; /* low end of interval */
      this.range = Top_value; /* length of interval */
      this.buffer = 0; /* buffer for input/output */
      this.help = 0; /* bytes_to_follow / intermediate value */
      this.bytecount = 0; /* counter for output bytes */
      this.stream = stream;
  };

  /* Do the normalization before we need a defined state, instead of
   * after messing it up.  This simplifies starting and ending. */
  var enc_normalize = function(rc, outputStream) {
      while (rc.range <= Bottom_value) { /* do we need renormalization? */
          if (rc.low < (0xFF << SHIFT_BITS)) {//no carry possible, so output
              outputStream.writeByte(rc.buffer);
              for (; rc.help; rc.help--)
                  outputStream.writeByte(0xFF);
              rc.buffer = (rc.low >>> SHIFT_BITS) & 0xFF;
          } else if (rc.low & Top_value) { /* carry now, no future carry */
              outputStream.writeByte(rc.buffer+1);
              for (; rc.help; rc.help--)
                  outputStream.writeByte(0x00);
              rc.buffer = (rc.low >>> SHIFT_BITS) & 0xFF;
          } else {
              rc.help++;
              if (rc.help > MAX_INT)
                  throw new Error("Too many bytes outstanding, "+
                                  "file too large!");
          }
          rc.range = (rc.range << 8) >>> 0;/*ensure result remains positive*/
          rc.low = ((rc.low << 8) & (Top_value - 1)) >>> 0; /* unsigned */
          rc.bytecount++;
      }
  };

  /* Start the encoder                                         */
  /* c is written as the first byte in the datastream.
   * one could do w/o, but then you have an additional if per output byte */
  RangeCoder.prototype.encodeStart = function(c, initlength) {
      this.low = 0;
      this.range = Top_value;
      this.buffer = c;
      this.help = 0;
      this.bytecount = initlength;
  };

 /* Encode a symbol using frequencies                         */
  /* rc is the range coder to be used                          */
  /* sy_f is the interval length (frequency of the symbol)     */
  /* lt_f is the lower end (frequency sum of < symbols)        */
  /* tot_f is the total interval length (total frequency sum)  */
  /* or (faster): tot_f = (code_value)1<<shift                             */
  RangeCoder.prototype.encodeFreq = function(sy_f, lt_f, tot_f) {
      enc_normalize(this, this.stream);
      var r = (this.range / tot_f) >>> 0; // note coercion to integer
      var tmp = r * lt_f;
      this.low += tmp;
      if ((lt_f + sy_f) < tot_f) {
          this.range = r * sy_f;
      } else {
          this.range -= tmp;
      }
  };
  RangeCoder.prototype.encodeShift = function(sy_f, lt_f, shift) {
      enc_normalize(this, this.stream);
      var r = this.range >>> shift;
      var tmp = r * lt_f;
      this.low += tmp;
      if ((lt_f + sy_f) >>> shift) {
          this.range -= tmp;
      } else {
          this.range = r * sy_f;
      }
  };
  /* Encode a bit w/o modelling. */
  RangeCoder.prototype.encodeBit = function(b) {
      this.encodeShift(1, b?1:0, 1);
  };
  /* Encode a byte w/o modelling. */
  RangeCoder.prototype.encodeByte = function(b) {
      this.encodeShift(1, b, 8);
  };
  /* Encode a short w/o modelling. */
  RangeCoder.prototype.encodeShort = function(s) {
      this.encodeShift(1, s, 16);
  };

  /* Finish encoding                                           */
  /* returns number of bytes written                           */
  RangeCoder.prototype.encodeFinish = function() {
      var outputStream = this.stream;
      enc_normalize(this, outputStream);
      this.bytecount += 5;
      var tmp = this.low >>> SHIFT_BITS;
      if ((this.low & (Bottom_value-1)) >= ((this.bytecount&0xFFFFFF)>>>1)) {
          tmp++;
      }
      if (tmp > 0xFF) { /* we have a carry */
          outputStream.writeByte(this.buffer + 1);
          for (; this.help; this.help--)
              outputStream.writeByte(0x00);
      } else { /* no carry */
          outputStream.writeByte(this.buffer);
          for (; this.help; this.help--)
              outputStream.writeByte(0xFF);
      }
      outputStream.writeByte(tmp & 0xFF);
      // XXX: i'm pretty sure these could be three arbitrary bytes
      //      they are consumed by the decoder at the end
      outputStream.writeByte((this.bytecount >>> 16) & 0xFF);
      outputStream.writeByte((this.bytecount >>>  8) & 0xFF);
      outputStream.writeByte((this.bytecount       ) & 0xFF);
      return this.bytecount;
  };

  /* Start the decoder; you need to provide the *second* byte from the
   * datastream. (The first byte was provided to startEncoding and is
   * ignored by the decoder.)
   */
  RangeCoder.prototype.decodeStart = function(skipInitialRead) {
      var c = skipInitialRead ? 0 : this.stream.readByte();
      if (typeof(c) !== 'number' || c < 0) {
          return c; // EOF
      }
      this.buffer = this.stream.readByte();
      this.low = this.buffer >>> (8 - EXTRA_BITS);
      this.range = 1 << EXTRA_BITS;
      return c;
  };

  var dec_normalize = function(rc, inputStream) {
      while (rc.range <= Bottom_value) {
          rc.low = (rc.low << 8) | ((rc.buffer << EXTRA_BITS) & 0xFF);
          /* rc.low could be negative here; don't fix it quite yet */
          rc.buffer = inputStream.readByte();
          rc.low |= rc.buffer >>> (8-EXTRA_BITS);
          rc.low = rc.low >>> 0; /* fix it now */
          rc.range = (rc.range << 8) >>> 0; /* ensure stays positive */
      }
  };

  /* Calculate cumulative frequency for next symbol. Does NO update!*/
  /* rc is the range coder to be used                          */
  /* tot_f is the total frequency                              */
  /* or: totf is (code_value)1<<shift                                      */
  /* returns the <= cumulative frequency                         */
  RangeCoder.prototype.decodeCulFreq = function(tot_f) {
      dec_normalize(this, this.stream);
      this.help = (this.range / tot_f) >>> 0; // note coercion to integer
      var tmp = (this.low / this.help) >>> 0; // again
      return (tmp >= tot_f ? tot_f-1 : tmp);
  };
  RangeCoder.prototype.decodeCulShift = function(shift) {
      dec_normalize(this, this.stream);
      this.help = this.range >>> shift;
      var tmp = (this.low / this.help) >>> 0; // coercion to unsigned
      // shift is less than 31, so shift below will remain positive
      return ((tmp>>>shift) ? (1<<shift)-1 : tmp);
  };

  /* Update decoding state                                     */
  /* rc is the range coder to be used                          */
  /* sy_f is the interval length (frequency of the symbol)     */
  /* lt_f is the lower end (frequency sum of < symbols)        */
  /* tot_f is the total interval length (total frequency sum)  */
  RangeCoder.prototype.decodeUpdate = function(sy_f, lt_f, tot_f) {
      var tmp = this.help * lt_f; // should not overflow!
      this.low -= tmp;
      if (lt_f + sy_f < tot_f) {
          this.range = (this.help * sy_f);
      } else {
          this.range -= tmp;
      }
  };

  /* Decode a bit w/o modelling. */
  RangeCoder.prototype.decodeBit = function() {
      var tmp = this.decodeCulShift(1);
      this.decodeUpdate(1, tmp, 1<<1);
      return tmp;
  };
  /* decode a byte w/o modelling */
  RangeCoder.prototype.decodeByte = function() {
      var tmp = this.decodeCulShift(8);
      this.decodeUpdate(1, tmp, 1<<8);
      return tmp;
  };
  /* decode a short w/o modelling */
  RangeCoder.prototype.decodeShort = function() {
      var tmp = this.decodeCulShift(16);
      this.decodeUpdate(1, tmp, 1<<16);
      return tmp;
  };

  /* Finish decoding */
  RangeCoder.prototype.decodeFinish = function() {
      /* normalize to use up all bytes */
      dec_normalize(this, this.stream);
  };

  /** Utility functions */

  // bitstream interface
  RangeCoder.prototype.writeBit = RangeCoder.prototype.encodeBit;
  RangeCoder.prototype.readBit = RangeCoder.prototype.decodeBit;

  // stream interface
  RangeCoder.prototype.writeByte = RangeCoder.prototype.encodeByte;
  RangeCoder.prototype.readByte = RangeCoder.prototype.decodeByte;










      var Util = Object.create(null);

        var EOF = Stream.EOF;

        /* Take a buffer, array, or stream, and return an input stream. */
        Util.coerceInputStream = function(input, forceRead) {
            if (!('readByte' in input)) {
                var buffer = input;
                input = new Stream();
                input.size = buffer.length;
                input.pos = 0;
                input.readByte = function() {
                    if (this.pos >= this.size) { return EOF; }
                    return buffer[this.pos++];
                };
                input.read = function(buf, bufOffset, length) {
                    var bytesRead = 0;
                    while (bytesRead < length && this.pos < buffer.length) {
                        buf[bufOffset++] = buffer[this.pos++];
                        bytesRead++;
                    }
                    return bytesRead;
                };
                input.seek = function(pos) { this.pos = pos; };
                input.tell = function() { return this.pos; };
                input.eof = function() { return this.pos >= buffer.length; };
            } else if (forceRead && !('read' in input)) {
                // wrap input if it doesn't implement read
                var s = input;
                input = new Stream();
                input.readByte = function() {
                    var ch = s.readByte();
                    if (ch === EOF) { this._eof = true; }
                    return ch;
                };
                if ('size' in s) { input.size = s.size; }
                if ('seek' in s) {
                    input.seek = function(pos) {
                        s.seek(pos); // may throw if s doesn't implement seek
                        this._eof = false;
                    };
                }
                if ('tell' in s) {
                    input.tell = s.tell.bind(s);
                }
            }
            return input;
        };

        var BufferStream = function(buffer, resizeOk) {
            this.buffer = buffer;
            this.resizeOk = resizeOk;
            this.pos = 0;
        };
        BufferStream.prototype = Object.create(Stream.prototype);
        BufferStream.prototype.writeByte = function(_byte) {
            if (this.resizeOk && this.pos >= this.buffer.length) {
                var newBuffer = Util.makeU8Buffer(this.buffer.length * 2);
                newBuffer.set(this.buffer);
                this.buffer = newBuffer;
            }
            this.buffer[this.pos++] = _byte;
        };
        BufferStream.prototype.getBuffer = function() {
            // trim buffer if needed
            if (this.pos !== this.buffer.length) {
                if (!this.resizeOk)
                    throw new TypeError('outputsize does not match decoded input');
                var newBuffer = Util.makeU8Buffer(this.pos);
                newBuffer.set(this.buffer.subarray(0, this.pos));
                this.buffer = newBuffer;
            }
            return this.buffer;
        };

        /* Take a stream (or not) and an (optional) size, and return an
         * output stream.  Return an object with a 'retval' field equal to
         * the output stream (if that was given) or else a pointer at the
         * internal Uint8Array/buffer/array; and a 'stream' field equal to
         * an output stream to use.
         */
        Util.coerceOutputStream = function(output, size) {
            var r = { stream: output, retval: output };
            if (output) {
                if (typeof(output)==='object' && 'writeByte' in output) {
                    return r; /* leave output alone */
                } else if (typeof(size) === 'number') {
                    console.assert(size >= 0);
                    r.stream = new BufferStream(Util.makeU8Buffer(size), false);
                } else { // output is a buffer
                    r.stream = new BufferStream(output, false);
                }
            } else {
                r.stream = new BufferStream(Util.makeU8Buffer(16384), true);
            }
            Object.defineProperty(r, 'retval', {
                get: r.stream.getBuffer.bind(r.stream)
            });
            return r;
        };

        Util.compressFileHelper = function(magic, guts, suppressFinalByte) {
            return function(inStream, outStream, props) {
                inStream = Util.coerceInputStream(inStream);
                var o = Util.coerceOutputStream(outStream, outStream);
                outStream = o.stream;

                // write the magic number to identify this file type
                // (it better be ASCII, we're not doing utf-8 conversion)
                var i;
                for (i=0; i<magic.length; i++) {
                    outStream.writeByte(magic.charCodeAt(i));
                }

                // if we know the size, write it
                var fileSize;
                if ('size' in inStream && inStream.size >= 0) {
                    fileSize = inStream.size;
                } else {
                    fileSize = -1; // size unknown
                }
                if (suppressFinalByte) {
                    var tmpOutput = Util.coerceOutputStream([]);
                    Util.writeUnsignedNumber(tmpOutput.stream, fileSize + 1);
                    tmpOutput = tmpOutput.retval;
                    for (i=0; i<tmpOutput.length-1; i++) {
                        outStream.writeByte(tmpOutput[i]);
                    }
                    suppressFinalByte = tmpOutput[tmpOutput.length-1];
                } else {
                    Util.writeUnsignedNumber(outStream, fileSize + 1);
                }

                // call the guts to do the real compression
                guts(inStream, outStream, fileSize, props, suppressFinalByte);

                return o.retval;
            };
        };
        Util.decompressFileHelper = function(magic, guts) {
            return function(inStream, outStream) {
                inStream = Util.coerceInputStream(inStream);

                // read the magic number to confirm this file type
                // (it better be ASCII, we're not doing utf-8 conversion)
                var i;
                for (i=0; i<magic.length; i++) {
                    if (magic.charCodeAt(i) !== inStream.readByte()) {
                        throw new Error("Bad magic");
                    }
                }

                // read the file size & create an appropriate output stream/buffer
                var fileSize = Util.readUnsignedNumber(inStream) - 1;
                var o = Util.coerceOutputStream(outStream, fileSize);
                outStream = o.stream;

                // call the guts to do the real decompression
                guts(inStream, outStream, fileSize);

                return o.retval;
            };
        };
        // a helper for simple self-test of model encode
        Util.compressWithModel = function(inStream, fileSize, model) {
            var inSize = 0;
            while (inSize !== fileSize) {
                var ch = inStream.readByte();
                if (ch === EOF) {
                    model.encode(256); // end of stream;
                    break;
                }
                model.encode(ch);
                inSize++;
            }
        };
        // a helper for simple self-test of model decode
        Util.decompressWithModel = function(outStream, fileSize, model) {
            var outSize = 0;
            while (outSize !== fileSize) {
                var ch = model.decode();
                if (ch === 256) {
                    break; // end of stream;
                }
                outStream.writeByte(ch);
                outSize++;
            }
        };

        /** Write a number using a self-delimiting big-endian encoding. */
        Util.writeUnsignedNumber = function(output, n) {
            console.assert(n >= 0);
            var bytes = [], i;
            do {
                bytes.push(n & 0x7F);
                // use division instead of shift to allow encoding numbers up to
                // 2^53
                n = Math.floor( n / 128 );
            } while (n !== 0);
            bytes[0] |= 0x80; // mark end of encoding.
            for (i=bytes.length-1; i>=0; i--) {
                output.writeByte(bytes[i]); // write in big-endian order
            }
            return output;
        };

        /** Read a number using a self-delimiting big-endian encoding. */
        Util.readUnsignedNumber = function(input) {
            var n = 0, c;
            while (true) {
                c = input.readByte();
                if (c&0x80) { n += (c&0x7F); break; }
                // using + and * instead of << allows decoding numbers up to 2^53
                n = (n + c) * 128;
            }
            return n;
        };

        // Compatibility thunks for Buffer/TypedArray constructors.

        var zerofill = function(a) {
            for (var i = 0, len = a.length; i < len; i++) {
                a[i] = 0;
            }
            return a;
        };

        var fallbackarray = function(size) {
            return zerofill(new Array(size));
        };

        // Node 0.11.6 - 0.11.10ish don't properly zero fill typed arrays.
        // See https://github.com/joyent/node/issues/6664
        // Try to detect and workaround the bug.
        var ensureZeroed = function id(a) { return a; };
        if ((typeof(process) !== 'undefined') &&
            Array.prototype.some.call(new Uint32Array(128), function(x) {
                return x !== 0;
            })) {
            //console.warn('Working around broken TypedArray');
            ensureZeroed = zerofill;
        }

        /** Portable 8-bit unsigned buffer. */
        Util.makeU8Buffer = (typeof(Uint8Array) !== 'undefined') ? function(size) {
            // Uint8Array ought to be  automatically zero-filled
            return ensureZeroed(new Uint8Array(size));
        } : (typeof(Buffer) !== 'undefined') ? function(size) {
            var b = new Buffer(size);
            b.fill(0);
            return b;
        } : fallbackarray;

        /** Portable 16-bit unsigned buffer. */
        Util.makeU16Buffer = (typeof(Uint16Array) !== 'undefined') ? function(size) {
            // Uint16Array ought to be  automatically zero-filled
            return ensureZeroed(new Uint16Array(size));
        } : fallbackarray;

        /** Portable 32-bit unsigned buffer. */
        Util.makeU32Buffer = (typeof(Uint32Array) !== 'undefined') ? function(size) {
            // Uint32Array ought to be  automatically zero-filled
            return ensureZeroed(new Uint32Array(size));
        } : fallbackarray;

        /** Portable 32-bit signed buffer. */
        Util.makeS32Buffer = (typeof(Int32Array) !== 'undefined') ? function(size) {
            // Int32Array ought to be  automatically zero-filled
            return ensureZeroed(new Int32Array(size));
        } : fallbackarray;

        Util.arraycopy = function(dst, src) {
            console.assert(dst.length >= src.length);
            for (var i = 0, len = src.length; i < len ; i++) {
                dst[i] = src[i];
            }
            return dst;
        };

        /** Highest bit set in a byte. */
        var bytemsb = [
            0, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5,
            5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
            6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7,
            7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
            7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
            7, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
            8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
            8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
            8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
            8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
            8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8 /* 256 */
        ];
        console.assert(bytemsb.length===0x100);
        /** Find last set (most significant bit).
         *  @return the last bit set in the argument.
         *          <code>fls(0)==0</code> and <code>fls(1)==1</code>. */
        var fls = Util.fls = function(v) {
            console.assert(v>=0);
            if (v > 0xFFFFFFFF) { // use floating-point mojo
                return 32 + fls(Math.floor(v / 0x100000000));
            }
            if ( (v & 0xFFFF0000) !== 0) {
                if ( (v & 0xFF000000) !== 0) {
                    return 24 + bytemsb[(v>>>24) & 0xFF];
                } else {
                    return 16 + bytemsb[v>>>16];
                }
            } else if ( (v & 0x0000FF00) !== 0) {
                return 8 + bytemsb[v>>>8];
            } else {
                return bytemsb[v];
            }
        };
        /** Returns ceil(log2(n)) */
        Util.log2c = function(v) {
            return (v===0)?-1:fls(v-1);
        };




        var Lzp3 = Object.create(null);
        Lzp3.MAGIC = 'lzp3';

        // use Huffman coder (fast) or else use range coder (slow)
        var USE_HUFFMAN_CODE = false;
        // use deferred-sum model, which is supposed to be faster (but compresses worse)
        var USE_DEFSUM = false;
        // when to give up attempting to model the length
        var LENGTH_MODEL_CUTOFF = 256;
        var MODEL_MAX_PROB = 0xFF00;
        var MODEL_INCREMENT = 0x100;

        // Constants was used for compress/decompress function.
        var CTXT4_TABLE_SIZE = 1 << 16;
        var CTXT3_TABLE_SIZE = 1 << 12;
        var CTXT2_TABLE_SIZE = 1 << 16;
        var CONTEXT_LEN = 4;
        var LOG_WINDOW_SIZE = 20;
        var WINDOW_SIZE = 1 << LOG_WINDOW_SIZE;
        var MAX_MATCH_LEN = WINDOW_SIZE-1;
        var MATCH_LEN_CONTEXTS = 16;

        var MAX32 = 0xFFFFFFFF;
        var MAX24 = 0x00FFFFFF;
        var MAX16 = 0x0000FFFF;
        var MAX8  = 0x000000FF;


        var Window = function(maxSize) {
          this.buffer = Util.makeU8Buffer(Math.min(maxSize+4, WINDOW_SIZE));
          this.pos = 0;
          // context-4 hash table.
          this.ctxt4 = Util.makeU32Buffer(CTXT4_TABLE_SIZE);
          // context-3 hash table
          this.ctxt3 = Util.makeU32Buffer(CTXT3_TABLE_SIZE);
          // context-2 table (not really a hash any more)
          this.ctxt2 = Util.makeU32Buffer(CTXT2_TABLE_SIZE);
          // initial context
          this.put(0x63); this.put(0x53); this.put(0x61); this.put(0x20);
        };
        Window.prototype.put = function(_byte) {
          this.buffer[this.pos++] = _byte;
          if (this.pos >= WINDOW_SIZE) { this.pos = 0; }
          return _byte;
        };
        Window.prototype.get = function(pos) {
          return this.buffer[pos & (WINDOW_SIZE-1)];
        };
        Window.prototype.context = function(pos, n) {
          var c = 0, i;
          pos = (pos - n) & (WINDOW_SIZE-1);
          for (i=0; i<n; i++) {
            c = (c << 8) | this.buffer[pos++];
            if (pos >= WINDOW_SIZE) { pos = 0; }
          }
          return c;
        };
        // if matchLen !== 0, update the index; otherwise get index value.
        Window.prototype.getIndex = function(s, matchLen) {
          var c = this.context(s, 4);
          // compute context hashes
          var h4 = ((c>>>15) ^ c) & (CTXT4_TABLE_SIZE-1);
          var h3 = ((c>>>11) ^ c) & (CTXT3_TABLE_SIZE-1);
          var h2 = c & MAX16;
          // check order-4 context
          var p = 0, checkc;
          // only do context confirmation if matchLen==0 (that is, if we're not just
          // doing an update)
          if (matchLen===0) {
            p = this.ctxt4[h4];
            if (p !== 0 && c !== this.context(p-1, 4)) {
              p = 0; // context confirmation failed
            }
            if (p === 0) {
              // check order-3 context
              p = this.ctxt3[h3];
              if (p !== 0 && (c & MAX24) !== this.context(p-1, 3)) {
                p = 0; // context confirmation failed
              }
              if (p === 0) {
                // check order-2 context
                p = this.ctxt2[h2];
                if (p !== 0 && (c && MAX16) !== this.context(p-1, 2)) {
                  p = 0; // context confirmation failed
                }
              }
            }
          }
          // update context index
          if (matchLen) { matchLen--; }
          this.ctxt4[h4] = this.ctxt3[h3] = this.ctxt2[h2] =
            (s | (matchLen << LOG_WINDOW_SIZE)) + 1;
          // return lookup result.
          return p;
        };

        /**
         * Compress using modified LZP3 algorithm.  Instead of using static
         * Huffman coding, we use an adaptive Huffman code or range encoding.
         */
        Lzp3.compressFile = Util.compressFileHelper(Lzp3.MAGIC, function(inStream, outStream, fileSize, props) {
          // sliding window & hash table
          var window = new Window( (fileSize>=0) ? fileSize : WINDOW_SIZE );

          var coderFactory, sparseCoderFactory, flush;

          if (USE_HUFFMAN_CODE) {
            // Huffman contexts
            outStream.writeByte(0x80); // mark that this is Huffman coded.
            var bitstream = new BitStream(outStream);
            flush = bitstream.flush.bind(bitstream);
            coderFactory = Huffman.factory(bitstream, MAX16);
            sparseCoderFactory = NoModel.factory(bitstream);

          } else { // range encoder
            var range = new RangeCoder(outStream);
            range.encodeStart(0x00, 0); // 0x00 == range encoded

            coderFactory = FenwickModel.factory(range, MODEL_MAX_PROB, MODEL_INCREMENT);
            if (USE_DEFSUM) {
              coderFactory = DefSumModel.factory(range, false /* encoder */);
            }
            // switch sparseCoderFactory to a NoModel when size > cutoff
            var noCoderFactory = NoModel.factory(range);
            sparseCoderFactory = function(size) {
              if (size > LENGTH_MODEL_CUTOFF) {
                return noCoderFactory(size);
              }
              return coderFactory(size);
            };
            flush = function() { range.encodeFinish(); };
          }

          var huffLiteral= new Context1Model(coderFactory, 256,
                                             (fileSize<0) ? 257 : 256);
          var huffLen = [], i;
          for (i=0; i<MATCH_LEN_CONTEXTS; i++) {
            huffLen[i] = new LogDistanceModel(MAX_MATCH_LEN+1, 1,
                                              coderFactory, sparseCoderFactory);
          }

          var inSize = 0, s, matchContext = 0;
          while (inSize !== fileSize) {
            var ch = inStream.readByte();
            s = window.pos;
            var p = window.getIndex(s, 0);
            if (p !== 0) {
              // great, a match! how long is it?
              p--; // p=0 is used for 'not here'. p=1 really means WINDOW_SIZE
              var prevMatchLen = (p >>> LOG_WINDOW_SIZE) + 1;
              var matchLen = 0;
              while (window.get(p + matchLen) === ch && matchLen < MAX_MATCH_LEN) {
                matchLen++;
                window.put(ch);
                ch = inStream.readByte();
              }
              // code match length; match len = 0 means "literal"
              // use "extra state" -1 to mean "same as previous match length"
              if (prevMatchLen===matchLen) {
                huffLen[matchContext&(MATCH_LEN_CONTEXTS-1)].encode(-1);
              } else {
                huffLen[matchContext&(MATCH_LEN_CONTEXTS-1)].encode(matchLen);
              }
              // update hash with this match
              window.getIndex(s, matchLen);
              inSize += matchLen;
              matchContext <<= 1;
              if (matchLen > 0) { matchContext |= 1; }
              // XXX: LZMA uses a special "delta match" context here if matchLen==0
              // XXX: it also uses the offset as context for the length (or vice-versa)
            }
            // always encode a literal after a match
            var context1 = window.get(window.pos-1);
            if (ch===Stream.EOF) {
              if (fileSize < 0) {
                huffLiteral.encode(256, context1);
              }
              break;
            }
            huffLiteral.encode(ch, context1);
            window.put(ch);
            inSize++;
          }
          if (flush) flush();
        });

        /**
         * Decompress using modified LZP3 algorithm.
         */
        Lzp3.decompressFile = Util.decompressFileHelper(Lzp3.MAGIC, function(inStream, outStream, fileSize) {
          var flags = inStream.readByte();
          var use_huffman_code = !!(flags & 0x80);

          // sliding window & hash table
          var window = new Window( (fileSize>=0) ? fileSize : WINDOW_SIZE );

          var coderFactory, sparseCoderFactory, finish;

          if (use_huffman_code) {
            // Huffman contexts
            var bitstream = new BitStream(inStream);
            coderFactory = Huffman.factory(bitstream, MAX16);
            sparseCoderFactory = NoModel.factory(bitstream);
          } else { // range encoder
            var range = new RangeCoder(inStream);
            range.decodeStart(true/* skip initial read */);
            coderFactory = FenwickModel.factory(range, MODEL_MAX_PROB, MODEL_INCREMENT);
            if (USE_DEFSUM) {
              coderFactory = DefSumModel.factory(range, true /* decoder */);
            }
            // switch sparseCoderFactory to a NoModel when size > cutoff
            var noCoderFactory = NoModel.factory(range);
            sparseCoderFactory = function(size) {
              if (size > LENGTH_MODEL_CUTOFF) {
                return noCoderFactory(size);
              }
              return coderFactory(size);
            };
            finish = function() { range.decodeFinish(); };
          }

          var huffLiteral= new Context1Model(coderFactory, 256,
                                             (fileSize<0) ? 257 : 256);
          var huffLen = [], i;
          for (i=0; i<MATCH_LEN_CONTEXTS; i++) {
            huffLen[i] = new LogDistanceModel(MAX_MATCH_LEN+1, 1,
                                              coderFactory, sparseCoderFactory);
          }

          var s, ch, outSize = 0, matchContext = 0;
          while (outSize !== fileSize) {
            s = window.pos;
            var p = window.getIndex(s, 0);
            if (p !== 0) {
              p--; // p=0 is used for 'not here'. p=1 really means WINDOW_SIZE
              var prevMatchLen = (p >>> LOG_WINDOW_SIZE) + 1;
              var matchLen = huffLen[matchContext&(MATCH_LEN_CONTEXTS-1)].decode();
              if (matchLen < 0) { matchLen = prevMatchLen; }
              // copy characters!
              for (i=0; i<matchLen; i++) {
                ch = window.get(p + i);
                outStream.writeByte(window.put(ch));
              }
              window.getIndex(s, matchLen);
              outSize += matchLen;
              matchContext <<= 1;
              if (matchLen > 0) matchContext |= 1;
            }
            // literal always follows match (or failed match)
            if (outSize === fileSize) {
              break; // EOF
            }
            var context1 = window.get(window.pos-1);
            ch = huffLiteral.decode(context1);
            if (ch === 256) {
              break; // EOF
            }
            outStream.writeByte(window.put(ch));
            outSize++;
          }
          if (finish) finish();
        });


console.log("hello");
