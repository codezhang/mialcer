# mialcer
back and up
## install dependencies
### python watchdog
watch file change

different from pyinotify. it is cross-platform

ref: https://pypi.python.org/pypi/watchdog

install path tools https://github.com/gorakhargosh/pathtools

# mstr bi background
think about the whole process.
condition format=>sql=>result format=>olap
## basic report elements
dashboard
report
attribute
metric
filter
consolidation
custom group
## olap report elements
view filter
derived metric
derived element
## format concepts
format by value or threshold or condition for cell, row/column header

# instant-config-ui
change on parsed json, finally trigger save to change config file. mialcer will discover submodule change.

## navigation
### h1~h5 bootstrap
```
#!content-of-title
#one-plain-line-to-show-as-normal-text
```
### menu bootstrap-sidebar
discover ```#!```

## controls(inline)
### bool
bootstrap-switch
### text/data
x-editable(bootstrap)
### select/multiselect
x-editable(bootstrap)
0. multiselect #*
0. select #.

```
cities: #*#!城市#other plain text to show
  beijing: true #!北京
  shanghai: false #!上海
  guangzhou: true #!广州
```
## variable controlled part show/hide
0. define condition variable```#{}```
0. reference condition variable ```${}```
0. hide when no value, only display if referenced value equals given value ```#?{}={}```

a cascade example

```
countries: #.#!国籍#{country-id}
  china: true #!中国
  italy: false #!意大利
cities_for_china: #*#!城市#中国的城市
  beijing: true #!北京
  shanghai: true #!上海
cities_for_italy: #.#!城市#意大利的城市
  milan: true #!米兰
  rome: false #!罗马
```

## dynamic part creation
currently ui not supported. can only do framework in ace and do value config on ui.
