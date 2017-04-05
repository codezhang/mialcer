# mialcer
back and up
## install dependencies
### python watchdog
watch file change

different from pyinotify. it is cross-platform

ref: https://pypi.python.org/pypi/watchdog

install path tools https://github.com/gorakhargosh/pathtools

## python pros and cons
pros:
0. easy to use variable manipulation
0. support dynamic sub application

cons:
0. cannot easily use async nonblock io

possibly use nodejs/typescript instead. ref:
0. http://stackoverflow.com/questions/40649833/forward-with-query-in-express-js
0. http://stackoverflow.com/questions/10378690/remove-route-mappings-in-nodejs-express

# mstr bi background
think about the whole process.
condition format=>sql=>result format=>olap
## basic report elements
0. dashboard
0. report
0. attribute
0. metric
0. filter
0. consolidation
0. custom group

## olap report elements
0. view filter
0. derived metric
0. derived element

## format concepts
format by value or threshold or condition for cell, row/column header

# instant-config-ui
change on parsed json, finally trigger save to change config file. mialcer will discover submodule change.

## basic concepts
### instruction
#### @title
``` #!some text ``` is short for ``` #@title some text```
if not declared, use key as title
#### @select
``` #. ``` for short
#### @multiselect
``` #* ``` for short
#### @define
define variable effect in whole config file's range.

cyclic variable define dependency is not legal, which will result in unpredictable result.

``` #% ``` for short

#### @template
element will not show. use for dynamic element creation for parent
#### @static
read only
#### @flat
if inside map (or ignore), extract sub elements in current context

by default use original key if no conflict

or

option ``` with_prefix ```: current key, title_{child's key, title or offset}
#### @valid
check input text.
by default, if not matched, show warning and not accept.
``` #@valid number ``` check number

``` #@valid email ``` check email

TODO: support expression e.g. ``` #@valid {$$ > 1}

#### @if
if following expression is True or positive number

Notice: no elif or else

``` #? ``` for short

### variable
besides user defined variables, pre-defined variables are

``` $parent ```
``` $key ```
``` $value ```
``` $title ```

``` $range ```
range declared or bound to request at load time
 or
use children's values as $range

``` $root ```

all variables are read value every time the file loaded. $value is changed by user-interface but not pre-written js expression.
a load event happen every time a value or file structure change.

### expression
``` {js expression} ``` to
0. define global constants
0. construct conditions for ``` @if ```
0. bind $range

notice: ``` { ``` and ``` } ``` should be escaped as ``` \{ ``` and ``` \} ```

#### global function
``` request(uri, [default GET], [body for post, a=1&b=2. e.g.]) ``` return undefined if no value return

``` map_value(array) ``` e.g. ``` map_value(['a', 'b']) ``` returns ``` {a : 'a', b: 'b'} ```
## navigation
### h1~h5
bootstrap
```
#!content-of-title
#one-plain-line-to-show-as-normal-text
```
### menu
bootstrap-sidebar

discover ```#!```

## controls
displayed inline. show values by default.
### bool
bootstrap-switch
### text/data
x-editable(bootstrap)
### select/multiselect
x-editable(bootstrap)
0. multiselect #*
0. select #.

#### static range
```
cities: #*#!城市#other plain text to show
  beijing: true #!北京
  shanghai: false #!上海
  guangzhou: true #!广州
```

#### dynamic range
```
food: #*#!食物#{$range=request('http://foods.com/foods')}
  apple: true
  bread: false
```
the range is bound to the url at load time.
every time a selection happened its children declaration will be changed.

for first time, its children may be ``` _: true ```

## variable controlled part show/hide
use ``` @define ``` ``` @if ``` ``` {js expression} ```

a cascade example

```
countries: #.#!国籍#%{country_ids = map_value($range)}
  china: true #!中国
  italy: false #!意大利
cities: #flat with_prefix#!城市
  china: #*#!中国#?{'china' in country_ids}
    beijing: true #!北京
    shanghai: true #!上海
  italy: #.#!意大利#?{'italy' in country_ids}
    milan: true #!米兰
    rome: false #!罗马
```

## dynamic part
use ``` template ```

```
member:
  - #@template
    name: _
    age: _ #@valid number
  -
    name: tom
    age: 20
```
when required to add one part. new part ui will show input for name and age

TODO: support this feature in next version
