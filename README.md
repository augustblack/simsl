## sImSl: simple search language 

This is a simple search language that takes a query program such as:

```
  and(name ~= "Luther Blissett" , or(books.title ~= "best escaped \\"string", books.year != 2020))
```

and, with field limitations, can parse it into a usable AST such as:

```
{
  "type": "and",
  "para": [
    {
      "type": "op",
      "left": {
        "token": "name",
        "row": 0,
        "col": 6
      },
      "right": {
        "token": "Luther Blissett",
        "row": 0,
        "col": 15
      },
      "op": {
        "token": "~=",
        "row": 0,
        "col": 10
      }
    },
    {
      "type": "or",
      "para": [
        {
          "type": "op",
          "left": {
            "token": "books.title",
            "row": 0,
            "col": 37
          },
          "right": {
            "token": "best escaped \"string",
            "row": 0,
            "col": 53
          },
          "op": {
            "token": "~=",
            "row": 0,
            "col": 48
          }
        },
        {
          "type": "op",
          "left": {
            "token": "books.year",
            "row": 0,
            "col": 76
          },
          "right": {
            "token": "2020",
            "row": 0,
            "col": 90
          },
          "op": {
            "token": "!=",
            "row": 0,
            "col": 86
          }
        }
      ]
    }
  ]
}
```

which can be further transpiled into a safe SQL query with escaping such as:

```
(name ilike 'Luther Blissett' AND (books.title ilike 'best escaped "string' OR books.year != '2020'))
```

This is a work in progress


