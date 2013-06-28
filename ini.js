
exports.parse = exports.decode = decode
exports.stringify = exports.encode = encode

exports.safe = safe
exports.unsafe = unsafe

var eol = process.platform === "win32" ? "\n" : "\n"

function encode (obj, section, options, superSection) {
  var children = []
    , out = ""
    , sectionHeader;

  Object.keys(obj).forEach(function (k, _, __) {
    var val = obj[k]
    if (val && Array.isArray(val)) {
        val.forEach(function(item) {
            out += safe(k + "[]") + " = " + safe(item) + "\n"
        })
    }
    else if (val && typeof val === "object") {
      children.push(k)
    } else {
      out += safe(k) + " = " + safe(val) + eol
    }
  })

  if (section && out.length) {
    if (!superSection) {
      sectionHeader = safe(section);
    } else if (options && options.allowSubSections) {
      //if we're in subsection and they're allowed, add extra set of brackets
      sectionHeader = "[" + safe(section) + "]"; 
    } else {
      sectionHeader =  safe((superSection ? superSection + "." : "") + section);
    }
    out = "[" + sectionHeader + "]" + eol + out  
  }

  children.forEach(function (k, _, __) {
    var nk = dotSplit(k).join('\\.')
    var child = encode(obj[k], (superSection ? section + "." : "") + nk, options, superSection ? superSection : section)
    if (out.length && child.length) {
      out += eol
    }
    out += child
  })

  return out
}

function dotSplit (str) {
  return str.replace(/\1/g, '\2LITERAL\\1LITERAL\2')
         .replace(/\\\./g, '\1')
         .split(/\./).map(function (part) {
           return part.replace(/\1/g, '\\.')
                  .replace(/\2LITERAL\\1LITERAL\2/g, '\1')
         })
}

function decode (str, options) {
  var out = {}
    , p = out
    , section = null
    , state = "START"
           // section     |key = value
    , re = /^\[([^\]]*)\]$|^([^=]+)(=(.*))?$/i
    , subRe = /^\s*\[\[(.*)\]\]\s*/i
    , lines = str.split(/[\r\n]+/g)
    , section = null
    , comment = (options && options.allowHashComments) ? /^\s*[;#]/ : /^\s*;/
    , allowSubSections = options && options.allowSubSections;    
    
  lines.forEach(function (line, _, __) {
    if (!line || line.match(comment)) return
    var match = line.match(re)
    if (!match) return
    if (match[1] !== undefined) {
      section = unsafe(match[1]).replace(/\\\./g, '.'); //unsafe and unescape dots
      p = out[section] = out[section] || {}
      return
    } else if (allowSubSections) {
      var subMatch = match[2].match(subRe);
      if (subMatch && subMatch[1]) {
        var subsection = unsafe(subMatch[1]).replace(/\\\./g, '.'); //unsafe and unescape dots
        p = out[section][subsection] = out[section][subsection] || {};
        return;
      }}
    var key = unsafe(match[2])
      , value = match[3] ? unsafe((match[4] || "")) : true
    switch (value) {
      case 'true':
      case 'false':
      case 'null': value = JSON.parse(value)
    }

    // Convert keys with '[]' suffix to an array
    if (key.length > 2 && key.slice(-2) === "[]") {
        key = key.substring(0, key.length - 2)
        if (!p[key]) {
          p[key] = []
        }
        else if (!Array.isArray(p[key])) {
          p[key] = [p[key]]
        }
    }

    // safeguard against resetting a previously defined
    // array by accidentally forgetting the brackets
    if (Array.isArray(p[key])) {
      p[key].push(value)
    }
    else {
      p[key] = value
    }
  })

  return out
}

function safe (val) {
  return ( typeof val !== "string"
         || val.match(/[\r\n]/)
         || val.match(/^\[/)
         || (val.length > 1
             && val.charAt(0) === "\""
             && val.slice(-1) === "\"")
         || val !== val.trim() )
         ? JSON.stringify(val)
         : val.replace(/;/g, '\\;')
}

function unsafe (val, doUnesc) {
  val = (val || "").trim()
  if (val.charAt(0) === "\"" && val.slice(-1) === "\"") {
    try { val = JSON.parse(val) } catch (_) {}
  } else {
    // walk the val to find the first not-escaped ; character
    var esc = false
    var unesc = "";
    for (var i = 0, l = val.length; i < l; i++) {
      var c = val.charAt(i)
      if (esc) {
        if (c === "\\" || c === ";")
          unesc += c
        else
          unesc += "\\" + c
        esc = false
      } else if (c === ";") {
        break
      } else if (c === "\\") {
        esc = true
      } else {
        unesc += c
      }
    }
    if (esc)
      unesc += "\\"
    return unesc
  }
  return val
}
