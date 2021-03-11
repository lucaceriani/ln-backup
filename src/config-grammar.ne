source     -> istruzioni                 {% id %}

istruzioni -> expr				
			| istruzioni newline expr    {% d => d[0].concat(d[2]).filter(x => x) %}


expr       -> comando 			         {% id %}
			| commento				     {% id %}

commento   -> "#" .:* newline:*          {% d => null %}

comando    -> Name Src:+ Dst             {% ([name, src, dst]) => ({name, src, dst})  %}

Name       -> "N" _ param newline:+      {% d => d[2]  %}
Src        -> "S" _ param newline:+      {% d => d[2]  %}
Dst        -> "D" _ param newline:*      {% d => d[2]  %}


param      -> .:+                        {% ([d]) => d.join("") %}

_          -> " " 
newline    -> "\r":? "\n"