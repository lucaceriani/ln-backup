// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "source", "symbols": ["istruzioni"], "postprocess": id},
    {"name": "istruzioni", "symbols": ["expr"]},
    {"name": "istruzioni", "symbols": ["istruzioni", "newline", "expr"], "postprocess": d => d[0].concat(d[2]).filter(x => x)},
    {"name": "expr", "symbols": ["comando"], "postprocess": id},
    {"name": "expr", "symbols": ["commento"], "postprocess": id},
    {"name": "commento$ebnf$1", "symbols": []},
    {"name": "commento$ebnf$1", "symbols": ["commento$ebnf$1", /./], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "commento$ebnf$2", "symbols": []},
    {"name": "commento$ebnf$2", "symbols": ["commento$ebnf$2", "newline"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "commento", "symbols": [{"literal":"#"}, "commento$ebnf$1", "commento$ebnf$2"], "postprocess": d => null},
    {"name": "comando$ebnf$1", "symbols": ["Src"]},
    {"name": "comando$ebnf$1", "symbols": ["comando$ebnf$1", "Src"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "comando", "symbols": ["Name", "comando$ebnf$1", "Dst"], "postprocess": ([name, src, dst]) => ({name, src, dst})},
    {"name": "Name$ebnf$1", "symbols": ["newline"]},
    {"name": "Name$ebnf$1", "symbols": ["Name$ebnf$1", "newline"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Name", "symbols": [{"literal":"N"}, "_", "param", "Name$ebnf$1"], "postprocess": d => d[2]},
    {"name": "Src$ebnf$1", "symbols": ["newline"]},
    {"name": "Src$ebnf$1", "symbols": ["Src$ebnf$1", "newline"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Src", "symbols": [{"literal":"S"}, "_", "param", "Src$ebnf$1"], "postprocess": d => d[2]},
    {"name": "Dst$ebnf$1", "symbols": []},
    {"name": "Dst$ebnf$1", "symbols": ["Dst$ebnf$1", "newline"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "Dst", "symbols": [{"literal":"D"}, "_", "param", "Dst$ebnf$1"], "postprocess": d => d[2]},
    {"name": "param$ebnf$1", "symbols": [/./]},
    {"name": "param$ebnf$1", "symbols": ["param$ebnf$1", /./], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "param", "symbols": ["param$ebnf$1"], "postprocess": ([d]) => d.join("")},
    {"name": "_", "symbols": [{"literal":" "}]},
    {"name": "newline$ebnf$1", "symbols": [{"literal":"\r"}], "postprocess": id},
    {"name": "newline$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "newline", "symbols": ["newline$ebnf$1", {"literal":"\n"}]}
]
  , ParserStart: "source"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
