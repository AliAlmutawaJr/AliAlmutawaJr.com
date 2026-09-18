---
title: "The Evolution of Pattern Matching in Pie"
description: "Matching against value? type? structure?"
---

## Introduction

My first encounter with a functional programming language was with Scala. Along with its immutable variables, TCO optimized functions, and functors, I was particularly drawn towards one single feature: `Pattern Matching`!

I was learning Scala as part of a PL course I was taking during my undergrad. The way `match` lets you inspect the AST so easily and decide what to do based on the structure was so amazing. Coming from a C++ background, the only thing that resembled a `match` expression is a `switch` statement, which only lets you switch on integer constants.

You can imagine how revolutionary `match` must've felt to me. So it only made sense that my language's `match` would offer similar capabilities to Scala's `match` expressions.



## What Can Pie's Match Do?

In Pie, you can match against 3 things:
- Value
- Type
- Structure

Let's look at each one of these individually:

### Matching Against Values
```pie
x = 1;

result = match x {
    = 1 => 10;
    = 2 => 23;
    = 3 => 42;
};
```
The `=` means to match against the next value. The `=>` indicates the body of the case.\
In this example, `result` will be 10. If `x` were `2`, then result would be `23`, and so on.
However, if no case matches, then the program panics. One can prevent such event by adding a case that matches against anything:

```pie
match x {
    _ => std::print("catch all!");
};
```


### Matching Against Types
```pie
x = getValue();

result = match x {
    : Int    => "integer";
    : Double => "decimal";
    : Bool   => "true or false";
};
```

As you can see, the `:` indicates we're matching against the type.



### Matching Against Structure
Imagine you have a user-defined type:
```pie
Human = class {
    name = "";
    age = 0;
}
```
Matching against the structure mimics the same syntax to how construction works:
```pie
human = Human("Pie", 3);

human_name = match human {
    Human(name, _) => name;
    _ => "";
};
```
Note that the names inside a destructuring case do _not_ have to match the class member names. 


### Putting it all together
One can match against structure, value, and type in the same case:
```pie
match human {
    Human(name: String, = 1) => "{name} is one year old";

    Human(name = "Ali", age: Double = 24.5) => "Ali is 24.5!";

    Human(: String = "", age) => "unnamed who is {age} years old";

    _ => "didn't match";
};
```

This design is very neat and concise. It resembles the original inspiration, which is Scala's `match` expression. However, it was still not flexible enough for Pie's capabilities.


## The Problem
There were 3 main issues with the current design

### Destructuring requires a type name
Destructuring an object without caring what the type of the object is impossible with the current implementation of `match`. 
```pie
Pair = class { first = 0; second = 0; };
pair = getPair();

match pair {
    Pair(x: Int, y: Int) => "both are integers!"
    Pair(x: String, y: String) => "both are strings!"
    Pair(x, y) => "pair of {typeOf(x)} and {typeOf(y)}";
}
```
Typing `Pair()` over and over again is very repetitive. Not only that, but for a structurally typed language, one would expect to be able to match against the structure of an object only without requiring a type name.


### Primitive Data Structures
As helpful as `match` is for user-defined types, it had limited capabilities for working with built-in data structures (lists and maps). This stems directly from the previous problem, which is requiring a type name in order to destructure, since lists and maps don't have a type name per se. The type of a list is `{SomeType}` and for a map it's `{KeyType: ValueType}`.

Matching against the value of the type of a list/map was allowed. But attempting to destructure the elements did not work. Not sure how that would even look like.


### Expressions as Types
The biggest hurdle so far was the fact that Pie allowed expressions to be used as types. Pie, being an interpreted language, relies heavily on runtime machinery. This, in turn, makes it _very_ flexible in a lot of different ways, notably its type system.


<!-- Pie has a [structural type system](https://en.wikipedia.org/wiki/Structural_type_system), which means the type-checker is only concerned with the shape of the type, as opposed to the name of it. -->

Types can be computed at runtime in Pie:
```pie
.: function/closure definition
makeUnion = (types: ...Type) => union { types...; };

num_or_str: makeUnion(Int, String) = getValue();
```
Notice how the type is the result of the function call.


Now imagine this different scenario where you want to match on the fact that the second member of an object has the same type as the first member:
```pie
match expr {
    SomeType(member1, member2: typeOf(member1)) => "matched";
};
```
This obviously works at the moment, but it breaks once you attempt to destructure that second member:
```pie
match expr {
    SomeType(member1, typeOf(member1)(nested1, nested2)) => "matched";
};
```
The parser interprets `typeOf(member1)` as `typeOf` being the name of a type, and `member1` is the destructured member of that type. Then it hits a `(nested1, nested2)` which is unexpected, so it errors out.

This means that expressions cannot be used in place of types if the programmer wants to destructure the object. That felt inconsistent to me, especially that using expressions in place of types is allowed if not destructuring.

It is important to note that the second and third problems stem directly from the first: `match` destructuring pattern requiring a named type.

But as incomplete as this felt, it seemed unavoidable, and the case where that limitation would affect anyone was rare. So I left it..


## The New Inspiration
Months went by, I kept working on Pie by adding new features every couple weeks, until one day, I added Structured Bindings (Object Destructuring). Or as I call them "Unpackments", which comes from "Unpack" + "Assignment":
```pie
Human = class {
    name = "";
    age = 0;
};

human = Human("Pie", 3.14);
{name, age} = human;
```
Again, the destructured members don't have to match the class member names.

Unpackments were very powerful for multiple reasons

### Unrequired Type Name!
A type name is now optional:
```pie
{name, age}        = human;
{name, age}: Human = human;
```

### Primitive Data Structures
```pie
list = {1, 2, 3};
{a, b, c} = list;
```

### They Can Introduce Packs!
```pie
list = {1, 2, 3, 4, 5, 6, 7, 8, 9};
{first, ...mid, last} = list;
```


## What Now?
I was excited about the new feature. But something kept nagging me. Pattern Matching and Unpackments are sister features! They both deal with the structure of a variable. **Why do they look different from each other?**


## The Solution
Since Unpackments' syntax was strictly more powerful than the old pattern-matching syntax, I decided to change the `match` cases syntax to mimic Unpackments' syntax. Basically, unpackments became a small DSL for matching structures, types, and values in Pie, and `match` just happens to use that DSL. And sure, it was a breaking change, but a necessary one in my opinion.


What would look like this:
```pie
match getHuman() {
    Human(parent_name: String,: Int, Human(child_name = "cake", = 1)) => "matched";
};
```
Now looks like this:
```pie
match getHuman() {
    {parent_name: String, : Int, {child_name = "cake", = 1}: Human}: Human => "matched"
};
```

Except now we can simplify it further to be as such:
```pie
match getHuman() {
    {parent_name: String, : Int, {child_name = "cake", = 1}} => "matched"
};
```
Finally...no noise.




## The Final Piece
Since Unpackments and Pattern Matching look the same, why not take some of the features from `match` and port them into Unpackments?

I'm talking about matching against types and values, and even nesting them:

```pie
{name: String, age = 0} = getHuman();
```
This isn't just destructuring at this point, it's asserting that `name` must be a `String` and that `age` must be equal to `0`.

Note that the outer `=` is just a regular assignment. Any `=` inside the unpackment are actually matching against the given value. In other words, an unpackment is no longer merely extracting data. It can also describe the shape, types, and values that the data must have.

Now Unpackments and Pattern Matching work _exactly_ the same. The only difference is that `match` will test the Unpackments (cases) one by one, where if one fails, we move on to the next one, otherwise, execute the body and yield its value.


## Conclusion
Overall, I'm REALLY happy with where pattern matching in Pie ended up. What started as an attempt to recreate Scala's pattern matching turned into something quite different: a single syntax for describing the structure of a value, which can be used both for unpacking and for matching.

Thinking of pattern matching and unpackments as two separate features was a mistake. I realized they were really two applications of the same concept.

A friend of mine pointed out that Pie's pattern matching somewhat resembles Elixir's. I haven't actually used Elixir, so I'll leave that comparison to people who have :\).

If you're interested in reading about Pie's type system, see this [other blog post](https://www.alialmutawajr.com/blog/post2)!

Wanna give Pie and all these pattern matching features a shot? Try the Online Playground at [PieLang.org](https://PieLang.org/playground.html). Or check out the [GitHub Repository](https://github.com/AliAlmutawaJr/Pie).
