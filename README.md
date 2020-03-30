# BC-Err Error Framework

**This project is still very much a work in progress and NOT production ready.  You should not use it, right now.**

---

This is a mini "framework" that helps facilitate standardized HTTP error and status handling. It is primarily designed to be used in conjunction with Express, but might be used independently, possibly with some modification.  

In its current form, it is designed with my narrow needs in mind, but will evolve to be more practical for a wider audience.  The main objective is to impose some consistency in the way error objects are constructed, the members available on those objects, and the way they are processsed by the server.

## Getting Started

```shell script
npm install bc-err
```
... or if you are cool ...
```shell script
npm i bc-err
```

## Documentation

For more detailed documentation, you can build the docs:

```npm
npm run build:docs
```

This will create a directory called `docs`. Open the `index.html` file in a web browser for the documentation.
