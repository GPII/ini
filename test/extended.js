var i = require("../")
  , tap = require("tap")
  , test = tap.test
  , fs = require("fs")
  , path = require("path")
  , fixture = path.resolve(__dirname, "./fixtures/extended.ini")
  , data = fs.readFileSync(fixture, "utf8")
  , d
  , expectE ='no = section\n'
      + '\n'
      + '[a]\n'
      + 'hello = world\n'
      + 'mellow = mars\n'
      + '\n'
      + '[[b]]\n'
      + 'sub1 = some value\n'
      + 'sub2 = some other value\n'
      + '\n'
      + '[[c]]\n'
      + 'Another = subsection\n'
      + '\n'
      + '[new mainsection\\.amb\\.iguous]\n'
      + 'this = is using dots\n'
      + '\n'
      + '[another\\.section]\n'
      + 'h = 5678\n'
      + '\n'
      + '[[escaped\\.subheader]]\n'
      + 'keya = vala\n'
      + '\n'
      + '[[non-escaped\\.subheader]]\n'
      + 'j = 1234\n'

  , expectD =
    {
      no:"section",
      "a": {
        "hello": "world",
        "mellow": "mars",
        "b": {
          "sub1": "some value",
          "sub2": "some other value"
        },
        "c": {
          "Another": "subsection"
        }
      },
      "new mainsection.amb.iguous": {
        "this": "is using dots"
      },
      "another.section": {
        "h": "5678",
        "escaped.subheader": {
          "keya": "vala"
        },
        "non-escaped.subheader": {
          "j": "1234"
        }
      }
    }

test("decode from file", function (t) {
  var d = i.decode(data, { allowHashComments: true, allowSubSections: true })
  t.deepEqual(d, expectD)
  t.end()
})

test("encode from data", function (t) {
  var e = i.encode(expectD, undefined, { allowSubSections: true })
  t.deepEqual(e, expectE)

  var obj = {log: { type:'file', level: {label:'debug', value:10} } }
  e = i.encode(obj)
  t.notEqual(e.slice(0, 1), '\n', 'Never a blank first line')
  t.notEqual(e.slice(-2), '\n\n', 'Never a blank final line')

  t.end()
})
