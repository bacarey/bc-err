### Overview

Underlyingly, bc-err uses a custom class called HTTPError that extends Error.  HTTPError does the basic job of ensuring error object consistency.  

Although HTTPError can be used by itself, bc-err is meant to be used to be used in three ways:

---

#### Bulk Creation  

If you run makeAndExportAllHTTPErrorClasses(), this will generate error classes for all status codes defined in http.STATUS_CODES, adding default messaging and explanations appriate to each status code.
```javascript
const errors = require('bc-err');

errors.makeAndExportAllHTTPErrorClasses();
```
The generated classes can then be accessed either of two ways:
```javascript
throw new errors.HTTP403Error('Thou shalt not pass!');
```
... or ...
```javascript
throw new errors.ForbiddenError('Thou shalt not pass!');
```
---

#### As-Needed Creation
If you don't really need a wide variety of HTTPErrors, you can just create them, as needed.  Once created, they are cached so they will not need to be recreated.
```javascript
const errors = require('bc-err');

errors.createErrorClass(418);
throw new errors.ImATeapotError();
```
---

#### Complete Custom Creation
You can also create novel error classes that either act as a special type of error class for an existing status code, or you can make entirely new classes that have nothing to do with existing codes.
```javascript
const errors = require('bc-err');

errors.createErrorClass(418, 'CoffeeIsGross', {
  defaultMessage: 'It smells bad.',
  defaultExplanation: 'Coffee is for the uncultured.',
  defaultSuggestion: 'You should upgrade to tea.',
  showStack: false,
});
throw new errors.CoffeeIsGrossError();
```
