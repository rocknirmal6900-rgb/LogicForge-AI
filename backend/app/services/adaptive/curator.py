"""Curated starter curriculum for Python, C++, and Java concepts.
Seeds structured learning objectives, code examples, line-by-line breakdowns,
dry-run variable states, common mistakes, and conceptual quizzes.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.topic import Topic, Lesson
from app.models.problem import Problem

CURATED_TOPICS = [
    # PYTHON
    {
        "slug": "python-variables-types",
        "title": "Variables & Data Types",
        "description": "Master dynamic typing, integers, floats, booleans, typecasting, and memory references in Python 3.",
        "language": "python",
        "icon": "Binary",
        "lessons": [
            {
                "slug": "py-vars-intro",
                "title": "Understanding Python Variables & Memory",
                "objectives": [
                    "Understand how Python allocates names as object references",
                    "Distinguish mutable vs immutable primitive types",
                    "Learn proper variable naming conventions (PEP 8)"
                ],
                "content_markdown": """# Variables in Python: Pointers to Objects

Unlike C++ or Java where variables are static memory boxes that hold a specific type, Python variables are **symbolic names that point to objects in the heap memory**.

```python
x = 42
y = x
```

Here, `42` is an integer object in memory. `x` points to `42`. When `y = x` runs, `y` points to the *exact same object* `42`, rather than copying the value into a new slot.

### Dynamic Typing
Python automatically detects the type of the value assigned:
- `int`: Unlimited precision integers (e.g., `count = 100`)
- `float`: Double-precision IEEE 754 floats (e.g., `price = 19.99`)
- `str`: Unicode character sequences (e.g., `name = "Ada"`)
- `bool`: `True` or `False`
""",
                "code_example": "name = 'LogicForge'\nscore = 98.5\nis_active = True\nprint(f'{name} score: {score}, active: {is_active}')",
                "line_by_line": [
                    {"line": 1, "code": "name = 'LogicForge'", "explanation": "Creates a string object in memory and assigns the variable 'name' to reference it."},
                    {"line": 2, "code": "score = 98.5", "explanation": "Creates a floating-point number object 98.5."},
                    {"line": 3, "code": "is_active = True", "explanation": "Assigns a boolean flag True."},
                    {"line": 4, "code": "print(f'{name} score: {score}, active: {is_active}')", "explanation": "Interpolates variable values using an f-string and prints to standard output."}
                ],
                "dry_run_data": [
                    {"step": 1, "state": {"name": "'LogicForge'"}, "note": "Heap object created for string"},
                    {"step": 2, "state": {"name": "'LogicForge'", "score": "98.5"}, "note": "Float value allocated"},
                    {"step": 3, "state": {"name": "'LogicForge'", "score": "98.5", "is_active": "True"}, "note": "Boolean flag stored"}
                ],
                "common_mistakes": [
                    "Modifying an immutable type (like integers or strings) expecting in-place changes",
                    "Confusing integer division (/) which produces a float with floor division (//)"
                ],
                "quiz": [
                    {
                        "id": 1,
                        "question": "What is the result of type(10 / 2) in Python 3?",
                        "options": ["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'number'>"],
                        "correct_index": 1,
                        "explanation": "In Python 3, the single slash division '/' operator always returns a float (5.0)."
                    }
                ]
            }
        ]
    },
    {
        "slug": "python-loops-control",
        "title": "Conditions & Loops",
        "description": "If-elif-else statements, while loops, for loops with range, break, continue, and loop-else clauses.",
        "language": "python",
        "icon": "Repeat",
        "lessons": [
            {
                "slug": "py-loops-while-for",
                "title": "Mastering For and While Loops",
                "objectives": [
                    "Learn iteration over sequences with for-in",
                    "Understand accumulator patterns and sentinel while loops",
                    "Avoid off-by-one errors with range()"
                ],
                "content_markdown": """# Loops: Automating Repetition

Loops allow executing a block of code repeatedly until a condition evaluates to false.

### The `for` Loop and `range()`
In Python, `range(start, stop, step)` generates numbers from `start` up to but **not including** `stop`.

```python
for i in range(1, 5):
    print(i) # Prints 1, 2, 3, 4
```
""",
                "code_example": "total = 0\nfor i in range(1, 6):\n    total += i\nprint('Sum:', total)",
                "line_by_line": [
                    {"line": 1, "code": "total = 0", "explanation": "Initializes accumulator variable 'total' to 0."},
                    {"line": 2, "code": "for i in range(1, 6):", "explanation": "Loops variable 'i' through values 1, 2, 3, 4, 5."},
                    {"line": 3, "code": "    total += i", "explanation": "Adds current value of 'i' to accumulator."},
                    {"line": 4, "code": "print('Sum:', total)", "explanation": "Prints accumulated sum (15)."}
                ],
                "dry_run_data": [
                    {"step": 1, "state": {"total": "0", "i": "1"}, "note": "First iteration: total = 0 + 1 = 1"},
                    {"step": 2, "state": {"total": "1", "i": "2"}, "note": "Second iteration: total = 1 + 2 = 3"},
                    {"step": 3, "state": {"total": "3", "i": "3"}, "note": "Third iteration: total = 3 + 3 = 6"},
                    {"step": 4, "state": {"total": "6", "i": "4"}, "note": "Fourth iteration: total = 6 + 4 = 10"},
                    {"step": 5, "state": {"total": "10", "i": "5"}, "note": "Fifth iteration: total = 10 + 5 = 15"}
                ],
                "common_mistakes": [
                    "Thinking range(1, 5) includes the number 5",
                    "Creating infinite while loops by forgetting to increment the counter"
                ],
                "quiz": [
                    {
                        "id": 1,
                        "question": "How many times will a loop with range(0, 10, 2) execute?",
                        "options": ["10 times", "5 times", "4 times", "6 times"],
                        "correct_index": 1,
                        "explanation": "The loop iterates through 0, 2, 4, 6, 8, which is exactly 5 iterations."
                    }
                ]
            }
        ]
    },
    {
        "slug": "python-recursion",
        "title": "Recursion & Call Stack",
        "description": "Understand base cases, recursive steps, stack frames, call stack visualization, and divide-and-conquer.",
        "language": "python",
        "icon": "Layers",
        "lessons": [
            {
                "slug": "py-recursion-fundamentals",
                "title": "Building the Recursive Mental Model",
                "objectives": [
                    "Understand how stack frames are pushed and popped during recursion",
                    "Identify the base case that stops infinite recursion",
                    "Analyze time complexity of recursive algorithms"
                ],
                "content_markdown": """# Recursion: Solving Problems in Terms of Themselves

A function is recursive if it **calls itself**. Every valid recursive function needs two components:
1. **Base Case**: The simplest terminating condition that returns without calling itself.
2. **Recursive Step**: Calls itself on a smaller subproblem, making progress toward the base case.

### Call Stack Visualization
When `factorial(3)` is invoked:
- Push `factorial(3)` $\to$ awaits `3 * factorial(2)`
- Push `factorial(2)` $\to$ awaits `2 * factorial(1)`
- Push `factorial(1)` $\to$ base case reached! Returns `1`
- Unwinds: `2 * 1 = 2` $\to$ unwinds `3 * 2 = 6`
""",
                "code_example": "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(4))",
                "line_by_line": [
                    {"line": 1, "code": "def factorial(n):", "explanation": "Defines recursive function taking integer n."},
                    {"line": 2, "code": "    if n <= 1:", "explanation": "Base case check. Prevents infinite recursion."},
                    {"line": 3, "code": "        return 1", "explanation": "Base case value: 1! and 0! both equal 1."},
                    {"line": 4, "code": "    return n * factorial(n - 1)", "explanation": "Recursive call with smaller argument (n - 1)."},
                    {"line": 6, "code": "print(factorial(4))", "explanation": "Calls factorial with 4 and prints output (24)."}
                ],
                "dry_run_data": [
                    {"step": 1, "state": {"call": "factorial(4)", "stack_depth": "1"}, "note": "Waits on 4 * factorial(3)"},
                    {"step": 2, "state": {"call": "factorial(3)", "stack_depth": "2"}, "note": "Waits on 3 * factorial(2)"},
                    {"step": 3, "state": {"call": "factorial(2)", "stack_depth": "3"}, "note": "Waits on 2 * factorial(1)"},
                    {"step": 4, "state": {"call": "factorial(1)", "stack_depth": "4"}, "note": "Base case hit! Returns 1."},
                    {"step": 5, "state": {"unwind": "2 * 1 = 2", "stack_depth": "3"}, "note": "Pops stack frame"},
                    {"step": 6, "state": {"unwind": "3 * 2 = 6", "stack_depth": "2"}, "note": "Pops stack frame"},
                    {"step": 7, "state": {"unwind": "4 * 6 = 24", "stack_depth": "1"}, "note": "Final result computed"}
                ],
                "common_mistakes": [
                    "Missing or incorrect base case causing RecursionError (maximum recursion depth exceeded)",
                    "Not returning the recursive call result"
                ],
                "quiz": [
                    {
                        "id": 1,
                        "question": "What happens in Python if a recursive function does not have a base case?",
                        "options": [
                            "Returns 0 automatically",
                            "Raises RecursionError: maximum recursion depth exceeded",
                            "Freezes the computer permanently",
                            "Executes up to 100,000 times then stops"
                        ],
                        "correct_index": 1,
                        "explanation": "Python has a default recursion limit (usually 1000 frames) and raises RecursionError to prevent stack overflow."
                    }
                ]
            }
        ]
    },

    # C++
    {
        "slug": "cpp-pointers-memory",
        "title": "Pointers & Memory Architecture",
        "description": "Pointers, memory addresses, dereferencing, pointer arithmetic, stack vs heap, dynamic allocation with new/delete.",
        "language": "cpp",
        "icon": "Cpu",
        "lessons": [
            {
                "slug": "cpp-pointers-basics",
                "title": "Pointers and Address-Of Operators",
                "objectives": [
                    "Understand memory addresses in RAM and hexadecimal notation",
                    "Use the address-of operator (&) and dereference operator (*)",
                    "Avoid dangling pointers and null pointer dereferences"
                ],
                "content_markdown": """# Pointers: Direct Memory Control

A pointer is a variable that **stores the memory address of another variable**.

### Syntax
- `&x` is the *address-of* operator (where in memory `x` lives).
- `*ptr` is the *dereference* operator (access the value located at that memory address).

```cpp
int val = 100;
int* ptr = &val; // ptr stores address of val
*ptr = 200;      // modifies val directly through memory
```
""",
                "code_example": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int a = 42;\n    int* p = &a;\n    cout << \"Value of a: \" << a << endl;\n    cout << \"Address of a: \" << p << endl;\n    cout << \"Value via pointer: \" << *p << endl;\n    return 0;\n}",
                "line_by_line": [
                    {"line": 5, "code": "int a = 42;", "explanation": "Allocates 4 bytes on stack memory storing integer 42."},
                    {"line": 6, "code": "int* p = &a;", "explanation": "Declares pointer 'p' storing the 64-bit RAM address of variable 'a'."},
                    {"line": 9, "code": "cout << \"Value via pointer: \" << *p << endl;", "explanation": "Dereferences 'p' to read the integer stored at that address (42)."}
                ],
                "dry_run_data": [
                    {"step": 1, "state": {"a": "42", "address": "0x7ffd10"}, "note": "Variable 'a' placed at memory slot 0x7ffd10"},
                    {"step": 2, "state": {"p": "0x7ffd10", "*p": "42"}, "note": "Pointer 'p' holds memory reference"}
                ],
                "common_mistakes": [
                    "Dereferencing a nullptr or uninitialized pointer causing segmentation fault",
                    "Confusing * in pointer declaration with * in dereferencing"
                ],
                "quiz": [
                    {
                        "id": 1,
                        "question": "If 'int x = 10;' and 'int* p = &x;', what does '*p = 25;' do?",
                        "options": [
                            "Changes the address stored in p",
                            "Changes the value of x to 25",
                            "Creates a compilation error",
                            "Creates a copy of x"
                        ],
                        "correct_index": 1,
                        "explanation": "Dereferencing '*p' refers to the variable x itself; assigning 25 writes directly into x's memory."
                    }
                ]
            }
        ]
    },

    # JAVA
    {
        "slug": "java-oop-fundamentals",
        "title": "OOP & Classes in Java",
        "description": "Classes, objects, constructors, encapsulation, getters/setters, inheritance, and method overriding.",
        "language": "java",
        "icon": "Box",
        "lessons": [
            {
                "slug": "java-classes-objects",
                "title": "Classes, Encapsulation, and Constructors",
                "objectives": [
                    "Define blueprints with classes and instantiate heap objects with 'new'",
                    "Enforce data encapsulation using private fields and public methods",
                    "Understand reference types vs primitive types in the JVM"
                ],
                "content_markdown": """# Object-Oriented Programming in Java

Java is strictly object-oriented. Every method and variable belongs inside a class.

### Encapsulation
Keep fields `private` and expose controlled access via `getters` and `setters`. This prevents external code from corrupting internal object state.
""",
                "code_example": "class Student {\n    private String name;\n    public Student(String name) { this.name = name; }\n    public String getName() { return this.name; }\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        Student s = new Student(\"Ada\");\n        System.out.println(s.getName());\n    }\n}",
                "line_by_line": [
                    {"line": 2, "code": "private String name;", "explanation": "Encapsulated private field inaccessible outside Student class."},
                    {"line": 3, "code": "public Student(String name) { this.name = name; }", "explanation": "Constructor initializes object state upon creation."},
                    {"line": 9, "code": "Student s = new Student(\"Ada\");", "explanation": "Allocates new Student object on JVM Heap and stores reference in stack variable 's'."}
                ],
                "dry_run_data": [
                    {"step": 1, "state": {"heap": "Student{name: 'Ada'}", "stack": "s -> @0x34a"}, "note": "JVM heap memory allocated"}
                ],
                "common_mistakes": [
                    "Comparing strings using '==' instead of '.equals()'",
                    "Attempting to instantiate abstract classes or accessing private members directly"
                ],
                "quiz": [
                    {
                        "id": 1,
                        "question": "Why should fields in a Java class typically be declared private?",
                        "options": [
                            "To make execution faster",
                            "To enforce encapsulation and prevent uncontrolled mutation",
                            "Java requires all variables to be private",
                            "Private fields use less memory in the JVM"
                        ],
                        "correct_index": 1,
                        "explanation": "Encapsulation hides internal implementation details and protects state consistency."
                    }
                ]
            }
        ]
    }
]

STARTER_PROBLEMS = [
    {
        "title": "Two Sum (Target Indices)",
        "slug": "two-sum",
        "language": "python",
        "topic": "Arrays & Hashing",
        "difficulty": "easy",
        "statement": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
        "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
        "input_format": "Two lines: Line 1 contains space-separated integers for nums. Line 2 contains target.",
        "output_format": "Two space-separated indices.",
        "examples": [
            {"input": "2 7 11 15\n9", "output": "0 1", "explanation": "nums[0] + nums[1] == 2 + 7 == 9"}
        ],
        "starter_code": "import sys\n\ndef two_sum(nums, target):\n    # TODO: Implement your solution using a dictionary for O(n) time\n    lookup = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            return [lookup[diff], i]\n        lookup[num] = i\n    return []\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().strip().split('\\n')\n    if len(lines) >= 2:\n        nums = list(map(int, lines[0].split()))\n        target = int(lines[1].strip())\n        ans = two_sum(nums, target)\n        print(' '.join(map(str, ans)))",
        "test_cases": [
            {"id": 1, "input": "2 7 11 15\n9", "expected_output": "0 1", "is_hidden": False},
            {"id": 2, "input": "3 2 4\n6", "expected_output": "1 2", "is_hidden": False},
            {"id": 3, "input": "3 3\n6", "expected_output": "0 1", "is_hidden": True}
        ],
        "hints": [
            "Hint 1: Can you check if the complement (target - num) exists in a hash map as you iterate?",
            "Hint 2: Storing the index as value in the map gives O(1) lookups."
        ],
        "is_ai_generated": False
    },
    {
        "title": "Reverse an Array In-Place",
        "slug": "reverse-array-in-place",
        "language": "python",
        "topic": "Arrays & Pointers",
        "difficulty": "easy",
        "statement": "Given an array of integers, reverse the array in-place using the two-pointer technique with O(1) extra memory.",
        "constraints": ["1 <= nums.length <= 10^4"],
        "input_format": "Space-separated integers.",
        "output_format": "Space-separated reversed integers.",
        "examples": [
            {"input": "1 2 3 4 5", "output": "5 4 3 2 1", "explanation": "Inverted order"}
        ],
        "starter_code": "import sys\n\ndef reverse_array(arr):\n    left, right = 0, len(arr) - 1\n    while left < right:\n        arr[left], arr[right] = arr[right], arr[left]\n        left += 1\n        right -= 1\n    return arr\n\nif __name__ == '__main__':\n    data = sys.stdin.read().strip()\n    if data:\n        nums = list(map(int, data.split()))\n        res = reverse_array(nums)\n        print(' '.join(map(str, res)))",
        "test_cases": [
            {"id": 1, "input": "1 2 3 4 5", "expected_output": "5 4 3 2 1", "is_hidden": False},
            {"id": 2, "input": "42", "expected_output": "42", "is_hidden": False},
            {"id": 3, "input": "10 20 30 40", "expected_output": "40 30 20 10", "is_hidden": True}
        ],
        "hints": [
            "Use two pointers: one at index 0 and one at len(arr) - 1.",
            "Swap elements and move pointers toward each other until they meet."
        ],
        "is_ai_generated": False
    }
]

def seed_curriculum_if_needed(db: Session):
    """Seed starter topics, lessons, and problems if tables are empty."""
    topic_count = db.query(Topic).count()
    if topic_count == 0:
        for idx, t_data in enumerate(CURATED_TOPICS):
            topic = Topic(
                slug=t_data["slug"],
                title=t_data["title"],
                description=t_data["description"],
                language=t_data["language"],
                icon=t_data["icon"],
                sort_order=idx + 1,
            )
            db.add(topic)
            db.flush()

            for l_idx, l_data in enumerate(t_data["lessons"]):
                lesson = Lesson(
                    topic_id=topic.id,
                    slug=l_data["slug"],
                    title=l_data["title"],
                    language=t_data["language"],
                    objectives=l_data["objectives"],
                    content_markdown=l_data["content_markdown"],
                    code_example=l_data["code_example"],
                    line_by_line=l_data["line_by_line"],
                    dry_run_data=l_data["dry_run_data"],
                    common_mistakes=l_data["common_mistakes"],
                    quiz=l_data["quiz"],
                    sort_order=l_idx + 1,
                )
                db.add(lesson)

    prob_count = db.query(Problem).count()
    if prob_count == 0:
        for p_data in STARTER_PROBLEMS:
            problem = Problem(
                title=p_data["title"],
                slug=p_data["slug"],
                language=p_data["language"],
                topic=p_data["topic"],
                difficulty=p_data["difficulty"],
                statement=p_data["statement"],
                constraints=p_data["constraints"],
                input_format=p_data["input_format"],
                output_format=p_data["output_format"],
                examples=p_data["examples"],
                starter_code=p_data["starter_code"],
                test_cases=p_data["test_cases"],
                hints=p_data["hints"],
                is_ai_generated=p_data["is_ai_generated"],
            )
            db.add(problem)

    db.commit()
