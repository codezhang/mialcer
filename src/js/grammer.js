/**
 * yaml 原有输入
 * weaved_yaml  将注释编织入内容中的yaml
 * direct_json 将weaved-yaml直接转换得到的json
 * head 头注释 不属于任何子位置
 * tail 尾注释 不属于任何子位置
 * weaved_json 将注释（不含头尾）作为单独的字段织入原有内容的json
 * plain_json 将注释全部去除掉的json
 * comment_paths 位置路径(jquery style)同注释的关系表
 */
var patterns = [\
  RegExp('[ \t]*\n$', 'gm'),
  RegExp('([ \t]*:[ \t]*)', 'g'),
  RegExp('\n([^\#]+)\n([ \t]*)\#', 'gm'),//为防止多行注释合并到之前一行，而不是新启一行，故先将无注释行同注释行用一空白行隔开
  RegExp('\n[ \t]*\#', 'gm'),
  RegExp('\#\#\#\#\#\#', 'g'),//以6个#隔开开头注释与区间注释
  RegExp('\n\#(.*)\n([^\n\#]+)', 'gm'),
  RegExp('\n([^:\#\n]*):[ \t]*\#([^\n]*)\n', 'gm'),
  RegExp('([\\\'"])(:?)[ \t]*\#([^\n]*)\n', 'gm'),//若注释在在行尾部附在字符串后（或隔着冒号），并入字符串
  RegExp('\n([ \t]*)-[ \t]*\#([^\n]*)\n', 'gm'),
  RegExp('\n([^\n:\#\\\'"]+)\#([^:]*)(:?)', 'gm'),
  RegExp(':([ \t]*)([^\n:\#\\\'"]+)\#([^\n]*)\n', 'gm'),
  RegExp('\n[ \t]*\#([^ \t\n]*)', 'gm'),
  RegExp('[ \t]*\#([^ \t\n]*)', 'gm')
]
var substitutions = [\
  '',
  ':',
  '\n$1\n\n$2\#',
  '\#',
  '\n',
  '\n$2\#$1',
  '\n$1\#$2:\n',
  '\#$3$1$2\n',
  '\n$1- \'\#$2\'\n$1-\n',
  '\n\'$1\#$2\'$3',
  ':$1\'$2\#$3\'\n',
  '\ntail_comment:\'\#$1\'',
  'head_comment:\'\#$1\''
]
var reverse_patterns = [
  RegExp('\n([\t ]*)([^\n\#]*)\#([^\n:\\\'"])([\\\'"])[ \t]*(:?)\n', 'gm'),
  RegExp('\n([\t ]*)-[ \t]*\#([^\n]*)\n[ \t]*-([^\#\n]*)\n', 'gm'),
  RegExp('head_comment:[^\#\n]*\#([^\n]*)\n', 'gm'),
  RegExp('\ntail_comment:[^\#\n]*\#([^\n])\n', 'gm')
]
var reverse_substitutions = [
  '\n$1\#$3\n$1$2$4$5\n',
  '\n$1- \#$2\n$1  $3\n',
  '\#$1\n\#\#\#\#\#\#\n',
  '\n\#$1\n'
]
/**
 * yaml -> weaved_yaml
 */
function weave_yaml(input) {
  for (var i = 1; i < patterns.length; ++i) {
    input = input.replace(patterns[i], substitutions[i]);
  }
  return input;
}
function parseArray(input, curPath, paths) {
  var last = null
  to_delete = []
  real_id = -1
  for (var i = 0; i < input.length; ++i) {
    var content = input[i]
    if (typeof content === 'string' && content[0] === '#') {
      last = content
      to_delete.push(i)
    } else {
      real_id += 1
      if (last === null) {
        input[i] = parse(content, curPath + '[' + real_id + ']', paths)
      } else {
        input[i] = JSON.stringify({
          value: parse(content, curPath + '[' + real_id + ']', paths)
          comment: last
        })
        paths[curPath + '[' + real_id + ']'] = last
        last = null
      }
    }
  }
  var output = []
  for (var i = 0; i < input.length; ++i) {
    if (to_delete.indexOf(i) == -1) {
      output.push(input[i])
    }
  }
  return output
}
function parse(input, curPath, paths) {
  if (input instanceof Array) {
    return parseArray(input, curPath, paths)
  } else if (input instanceof Object) {
    return parseObject(input, curPath, paths)
  } else if (typeof input === 'string' && input.indexOf('#') != -1) {
    int offset = input.indexOf('#')
    var prefix = input.substring(0, offset)
    var suffix = input.substring(offset)
    var content_wrapped = {
      value: prefix,
      comment: suffix
    }
    paths[curPath + '/' + prefix] = suffix
    return JSON.stringify(content_wrapped)
  }
}

function parseObject(input, curPath, paths) {
  to_delete = []
  for (key in input) {
    if (key.indexOf('#') == -1) {
      input[key] = parse(input[key], curPath + '/' + key, paths)
    } else {
      int offset = key.indexOf('#')
      var prefix = key.substring(0, offset)
      var suffix = key.substring(offset)
      var content_wrapped = {
        value: prefix,
        comment: suffix
      }
      to_delete.push(key)
      var new_key = JSON.stringify(content_wrapped)
      input[new_key] = input[key]
      paths[curPath + '/' + prefix] = suffix
      input[new_key] = parse(input[new_key], curPath + '/' + prefix, paths)
    }
  }
  for (key in to_delete) {
    delete input[to_delete[key]]
  }
  return input
}
function object_keys(obj) {
  var keys = []
  for (var key in obj) {
    keys.push(key)
  }
  return keys
}
function try_parse_as_json(input) {
  try {
    var transformed = JSON.parse(input)
    return transformed
  } catch (e) {
    return input
  }
}
function transformArray(input) {
  output = []
  for (var i = 0; i < input.length; ++i) {
    var real_key = try_parse_as_json(input[i])
    if (real_key instanceof Object && 'value' in real_key && 'comment' in real_key && object_keys(real_key) == 2) {
      output.push(real_key.comment)
      output.push(transformValue(input[real_key.content]))
    } else {
      output.push(input[i])
    }
  }
  return output
}
function transformObject(input) {
  to_delete = []
  to_add = {}
  for (var key in input) {
    var = real_key = try_parse_as_json(key)
    if (real_key instanceof Object && 'value' in real_key && 'comment' in real_key && object_keys(real_key) == 2) {
      to_delete.push(key)
      to_add[real_key.content + real_key.comment] = transformValue(input[key])
      //如果input[key]实际为复杂类型，所带的注释实际对应到了key上；如果是简单类型，有可能是带注释的json
    }
  }
  for (var i = 0; i < to_delete.length; ++i) {
    delete input[to_delete[i]]
  }
  for (var key in to_add) {
    input[key] = to_add[key]
  }
  return input
}
/**
 * weaved_json, head, tail -> direct_json
 */
function transform(input, head, tail) {
  input = tarnsformValue(input)
  input['head_comment'] = head
  input['tail_comment'] = tail
  return input
}
function transformValue(input) {
  if (input instanceof Array) {
    return transformArray(input, curPath, paths)
  } else if (input instanceof Object) {
    return transformObject(input, curPath, paths)
  } else if (typeof input === 'string') {
    obj = try_parse_as_json(input)
    if (obj instanceof Object && 'value' in obj && 'comment' in obj && object_keys[real_key] == 2) {
      return obj.content + obj.comment
    }
  }
  return input
}
/**
 * weaved_json -> plain_json
 */
function to_plain(input) {
  if (input instanceof Array) {
    for (var i in input) {
      input[i] = to_plain(input[i])
    }
  } else if (input instanceof Object) {
    to_delete = []
    for (var key in input) {
      try {
        var content = JSON.parse(key)
        to_delete.push(key)
        input[content.value] = to_plain(input[key])
      } catch (e) {
        input[key] = to_plain(input[key])
      }
    }
    for (var i in to_delete) {
      delete input[to_delete[i]]
    }
  } else if (typeof input === 'string') {
    try {
      var content = JSON.parse(input)
      input = content.value
    } catch (e) {
    }
  }
  return input
}
/**
 * mode = 'path' =>
 *  direct_json -> plain_json, comment_paths, head, tail
 * mode = 'mixed' =>
 *  direct_json -> weaved_json, head, tail
 */
function parse_comment_weaved_json(input, mode) {
  if (!(mode in ['path', 'mixed'])) {
    return input;
  }
  var head_comment = input['head_comment']
  var tail_comment = input['tail_comment']
  delete input['head_comment']
  delete input['tail_comment']
  var paths = {}
  input = parse(input, '$', paths)
  if (mode === 'path') {
    return {
      content: to_plain(input),
      comment: paths,
      head: head_comment,
      tail: tail_comment
    }
  } else {
    return {
      content: input,
      head: head_comment,
      tail: tail_comment
    }
  }
}
/**
 * plain_json, comment_paths -> weaved_json
 */
function weave_path_to_obj(content, path) {
  return weave_path(content, path, '$')
}
function weave_path(content, paths, curPath) {
  if (input instanceof Array) {
    for (var i = 0; i < input.length; ++i) {
      var path = curPath + '[' + i + ']'
      if (path in paths) {
        input[i] = JSON.stringify({
          value: weave_path(input[i], paths, path)
          comment: paths[path]
        })
      }
    }
  } else if (input instanceof Object) {
    var to_add = {}
    var to_delete = []
    for (var key in input) {
      var path = curPath + '/' + key
      if (path in paths) {
        var value = input[key]
        if (!(value instanceof Object) && !(value instanceof Array)) {
          var new_key = JSON.stringify({
            value: key,
            comment: paths[path]
          })
          to_add[new_key] = value
          to_delele.push(key)
        } else {
          input[key] = JSON.stringify({
            value: weave_path(value, paths, path),
            comment: paths[path]
          })
        }
      }
    }
    for (var key in to_add) {
      input[key] = to_add[key]
    }
    for (var i = 0; i < to_delete.length; ++i) {
      delete input[to_delete[i]];
    }
  }
  return input
}
var multiline_pattern = RegExp('\n[\t ]*\#[^\#\n]*\#[^\n]*\n', 'gm')
var indent_pattern = RegExp('\n[\t ]*\#')
var indent_append_pattern = RegExp('\n?[\t ]*\#([^\#\n]*)', 'gm')
var indent_append_substitution = '\n' + indent + '\#$1'
/**
 * weave_yaml -> yaml
 */
function unweave_yaml(input) {
  for (var i = 0; i < reverse_patterns.length; ++i) {
    input = input.replace(reverse_patterns[i], reverse_substitutions[i]);
  }
  multiline_comments = input.match(multiline_pattern)
  for (var i = 0; i < multiline_pattern.length; ++i) {
    line = multiline_pattern[i]
    indent = line.match(indent_pattern)[0]
    input.replace(line, line.replace(indent_append_pattern, indent_append_substitution))
  }
  return input;
}
