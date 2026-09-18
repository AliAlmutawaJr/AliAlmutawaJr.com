---
title: "Pie's Type System!"
description: "What happens when you add every 'cool' idea that comes to your mind?"
---

## Introduction

When declaring a new variable in Pie, you can, optionally, give a type to the variable. The declration syntax goes something like this:
```pie
<name> (":" <type>)? "=" <expr>
```
More concretely:
```pie
x: Int = 1;
```
If a variable is un-annotated, the type given to the variable is `Any`.

But wait, what is considered a "type" in Pie?

## The Basics

### Builtin Types:
- `Any`
- `Bool`
- `Double`
- `Int`
- `String`
- `Type`


### Collection Types:
- List Type: `{Int}`
- Map Type: `{String: Double}`

### Function Types:
- `(Int, String): Bool`

### User Defined Types:
- #### Classes
    ```pie
    Human = class {
        name = "";
        age: Int = 0;
    };

    h: Human = Human("Pie", 2);
    ```
- #### Unions
    ```pie
    Number_ish = union {
        Int;
        Double;
        Bool;
    };

    x: Number_ish = 1;
    x = 3.14;
    x = true;
    ```


## The Type Checker
Now that we know what can be a type, let's see how type checking works!

### Checking Builtin Types:
Pie's type checker works as expected.

In an assignment, if the type of the RHS doesn't match the type of the LHS, the program is ill-formed:
```pie
x: Int = true; .: fails
y: Int = 2.71; .: fails
z: Int = "2";  .: fails
w: Int = 1;    .: passes
```

### Checking Function Types:
Type-checking functions consists of 2 parts:
- Checking parameter types
- Checking the return types

Consider this line of Pie code:
```pie
func: (Int, Double): Any = (a, b: Double): String => "";
```

We're declaring the variable `func` and assigning it to a closure that takes in 2 arguments and returns an empty string.

Notice how the type annotation for `func` is different than the type of the closure itself. Realistically, the type of the closure is:
```pie
(Any, Double): String
```
Which is clearly different than:
```pie
(Int, Double): Any
```
Yet, the assignment type-checks fine. What gives?


#### Covariance vs Contravariance
If a closure returns a specific type (`String`), the type annotation may safely replace that type with a more general one (`Any`). It works because a `String` *is* an `Any`. This is known as **Covariance**.

The same idea applies backwards in the case of the parameter types. If the closure expects a general type for its parameter (`Any`), then the type annotation may safely replace it with a more specific type like `Int`. It works because if the closure is broad enough to handle `Any` input, then it can for sure handle an `Int`. This demonstrates a very similar concept to Covariance, but in the opposite direction, so it's called **Contravariance**.



## The Interesting Bit!

### Structural Typing:
Pie has a [structural type system](https://en.wikipedia.org/wiki/Structural_type_system). This means that the type-checker is only concerned with the shape of the type, as opposed to the name of it.
For example, in Pie, these 2 classes are considered the same type:
```pie
C1 = class {
    a = 0;
    b = 0;
};

C2 = class {
    a = 0;
    b = 0;
};
```
However, if you look at other languages that have a [nominal type system](https://en.wikipedia.org/wiki/Nominal_type_system), they would be considered as completely different types. C++ for example:
```cpp
class C1 {
public:
    int a;
    int b;
};

class C2 {
public:
    int a;
    int b;
};

C1 c = C2(); // fails to compile!
```

### Structural Sub-Typing:
Class `X` is considered a subtype of class `Y` if it contains all the members of `Y` inside itself. Consider this example:
```pie
Human = class {
    name = "";
    age = 0;
};

Named = class {
    name = "";
};

h = Human("Pie");
a: Named = h;
a.name = "Cake"; .: `h` is mutated as well
```


### Values-as-Types:
Inspired by TypeScript, values can be used as types in Pie:
```pie
one: 1 = 1;
greeting: "hello" = "hello";
ALWAYS: true = true;
```
Trying to assign these variables with any other value would fail to type check, effectively making them constants. Another usage would be creating enums:
```pie
State = union {
    "LOADING";
    "BAD";
    "GOOD";
};

s: State = getState();
match s {
    ="LOADING" => print("Waiting");
    ="GOOD"    => print("Yay");
    ="BAD"     => print("Nay");
};
```

### Concepts:
Concepts is a C++20 feature that allows for placing constraints on compile-time values. They are, in a sense, very similar to Rust traits (or so I've heard).

Pie adopts a similar idea. Unary predicate funtions can be used as a type. The value assigned to a variable with such type will be passed to the function. The type-checker depends on whether the function returns `true` or not.
Example:

```pie
moreThan10 = (n) => n > 10;

x: moreThan10 = 20; .: passes
x = 5;              .: fails
```
Concepts allow for what's known as "Design by Contract" where pre-conditions are the types of the arguments, and the post-condition is the return type.

Do note that Pie is an interpreted language, so all these checks happen dynamically at runtime.

---
If you found Pie interesting, please give it a shot using the online playground at [PieLang.org](https://PieLang.org/playground.html)