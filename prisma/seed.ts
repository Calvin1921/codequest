import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clean existing data (order matters for foreign keys)
  await prisma.userProgress.deleteMany()
  await prisma.streak.deleteMany()
  await prisma.challenge.deleteMany()
  await prisma.post.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  // Create demo users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      emailVerified: new Date(),
      totalXp: 0,
      posts: {
        create: [
          {
            title: 'Getting Started with Next.js 15',
            content: 'Next.js 15 brings exciting new features including...',
            published: true,
          },
          {
            title: 'React Server Components Deep Dive',
            content:
              'Server Components are a game changer for React applications...',
            published: true,
          },
          {
            title: 'Draft: Optimizing Database Queries',
            content: 'This is a work in progress...',
            published: false,
          },
        ],
      },
    },
  })

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      emailVerified: new Date(),
      totalXp: 0,
      posts: {
        create: [
          {
            title: 'Understanding Server Actions',
            content: 'Server Actions in Next.js allow you to...',
            published: true,
          },
        ],
      },
    },
  })

  // Create streak records for existing users
  await prisma.streak.create({
    data: {
      userId: alice.id,
      currentStreak: 0,
      longestStreak: 0,
      freezesLeft: 1,
    },
  })

  await prisma.streak.create({
    data: {
      userId: bob.id,
      currentStreak: 0,
      longestStreak: 0,
      freezesLeft: 1,
    },
  })

  // Seed challenges
  const challenges = [
    {
      title: 'Sum of Array',
      description:
        'Write a function that returns the sum of all numbers in an array.',
      problemStatement: `# Sum of Array

Write a function \`sumArray(arr)\` that takes an array of numbers and returns their sum.

## Requirements
- Return \`0\` for an empty array
- Handle both positive and negative numbers
- The input will always be an array of numbers

## Examples
\`\`\`js
sumArray([1, 2, 3]) // => 6
sumArray([])         // => 0
sumArray([-1, 5])    // => 4
\`\`\``,
      difficulty: 'easy',
      category: 'javascript',
      starterCode: `function sumArray(arr) {
  // Your code here
}`,
      solutionCode: `function sumArray(arr) {
  return arr.reduce((sum, num) => sum + num, 0);
}`,
      testCases: JSON.stringify([
        { input: [[]], expected: 0, description: 'Returns 0 for empty array' },
        {
          input: [[5]],
          expected: 5,
          description: 'Returns the element for single-element array',
        },
        {
          input: [[1, 2, 3, 4, 5]],
          expected: 15,
          description: 'Sums positive numbers correctly',
        },
        {
          input: [[-3, 7, -2, 10]],
          expected: 12,
          description: 'Handles mixed positive and negative numbers',
        },
      ]),
      hints: JSON.stringify([
        'Consider using Array.prototype.reduce() to accumulate the sum.',
        'Make sure to handle the empty array case — what should reduce return with no elements?',
      ]),
      xpReward: 50,
      timeEstimate: 180,
      order: 1,
    },
    {
      title: 'String Reverse',
      description:
        'Write a function that reverses a string without using .reverse().',
      problemStatement: `# String Reverse

Write a function \`reverseString(str)\` that returns the input string reversed, without using the built-in \`.reverse()\` method.

## Requirements
- Do not use \`Array.prototype.reverse()\`
- Return an empty string for empty input
- Handle single-character strings

## Examples
\`\`\`js
reverseString("hello") // => "olleh"
reverseString("")       // => ""
reverseString("a")      // => "a"
\`\`\``,
      difficulty: 'easy',
      category: 'javascript',
      starterCode: `function reverseString(str) {
  // Your code here — do not use .reverse()
}`,
      solutionCode: `function reverseString(str) {
  let result = '';
  for (let i = str.length - 1; i >= 0; i--) {
    result += str[i];
  }
  return result;
}`,
      testCases: JSON.stringify([
        {
          input: ['hello'],
          expected: 'olleh',
          description: 'Reverses a normal string',
        },
        {
          input: [''],
          expected: '',
          description: 'Returns empty string for empty input',
        },
        {
          input: ['a'],
          expected: 'a',
          description: 'Handles single character',
        },
        {
          input: ['racecar'],
          expected: 'racecar',
          description: 'Handles palindrome (result equals input)',
        },
      ]),
      hints: JSON.stringify([
        'Try iterating through the string from the last character to the first.',
        'You can also split into an array, build a new array in reverse order, then join.',
      ]),
      xpReward: 50,
      timeEstimate: 180,
      order: 2,
    },
    {
      title: 'Find Duplicates',
      description:
        'Write a function that returns an array of duplicate values from the input array.',
      problemStatement: `# Find Duplicates

Write a function \`findDuplicates(arr)\` that takes an array and returns a new array containing only the values that appear more than once.

## Requirements
- Each duplicate should appear only once in the output
- Order of the output does not matter
- Return an empty array if there are no duplicates

## Examples
\`\`\`js
findDuplicates([1, 2, 3, 2, 4, 3]) // => [2, 3]
findDuplicates([1, 2, 3])           // => []
findDuplicates([1, 1, 1])           // => [1]
\`\`\``,
      difficulty: 'medium',
      category: 'javascript',
      starterCode: `function findDuplicates(arr) {
  // Your code here
}`,
      solutionCode: `function findDuplicates(arr) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.add(item);
    }
    seen.add(item);
  }
  return Array.from(duplicates);
}`,
      testCases: JSON.stringify([
        {
          input: [[1, 2, 3, 2, 4, 3]],
          expected: [2, 3],
          description: 'Finds multiple duplicates',
        },
        {
          input: [[1, 2, 3]],
          expected: [],
          description: 'Returns empty array when no duplicates',
        },
        {
          input: [[1, 1, 1]],
          expected: [1],
          description: 'Handles repeated same value (returns it once)',
        },
        {
          input: [['a', 'b', 'a', 'c', 'b']],
          expected: ['a', 'b'],
          description: 'Works with string values',
        },
      ]),
      hints: JSON.stringify([
        'Use a Set to track values you have already seen.',
        'Use a second Set for duplicates to avoid adding the same duplicate more than once.',
      ]),
      xpReward: 150,
      timeEstimate: 300,
      order: 3,
    },
    {
      title: 'Flatten Array',
      description:
        'Write a function that deeply flattens a nested array structure.',
      problemStatement: `# Flatten Array

Write a function \`flatten(arr)\` that takes a deeply nested array and returns a single flat array with all values.

## Requirements
- Handle any depth of nesting
- Do not use \`Array.prototype.flat()\`
- Preserve the order of elements

## Examples
\`\`\`js
flatten([1, [2, 3], [4, [5, 6]]]) // => [1, 2, 3, 4, 5, 6]
flatten([[1], [[2]], [[[3]]]])     // => [1, 2, 3]
flatten([])                        // => []
\`\`\``,
      difficulty: 'medium',
      category: 'javascript',
      starterCode: `function flatten(arr) {
  // Your code here — do not use .flat()
}`,
      solutionCode: `function flatten(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item));
    } else {
      result.push(item);
    }
  }
  return result;
}`,
      testCases: JSON.stringify([
        {
          input: [[[1, 2], 3, [4, 5]]],
          expected: [1, 2, 3, 4, 5],
          description: 'Flattens one level of nesting',
        },
        {
          input: [[1, [2, [3, [4, [5]]]]]],
          expected: [1, 2, 3, 4, 5],
          description: 'Flattens deeply nested arrays',
        },
        { input: [[]], expected: [], description: 'Handles empty array' },
        {
          input: [[1, 2, 3]],
          expected: [1, 2, 3],
          description: 'Returns same values for already-flat array',
        },
      ]),
      hints: JSON.stringify([
        'Recursion is a natural fit: if an element is an array, flatten it; otherwise, keep it.',
        'You can also solve this iteratively using a stack (push/pop) to avoid recursion limits.',
      ]),
      xpReward: 150,
      timeEstimate: 300,
      order: 4,
    },
    {
      title: 'LRU Cache',
      description:
        'Implement a Least Recently Used (LRU) cache with get and put operations.',
      problemStatement: `# LRU Cache

Implement an \`LRUCache\` class that supports the following operations:

- \`LRUCache(capacity)\` — Initialise the cache with a positive capacity.
- \`get(key)\` — Return the value associated with \`key\`, or \`-1\` if not found. Marks the key as recently used.
- \`put(key, value)\` — Insert or update the value for \`key\`. If the cache exceeds capacity, evict the least recently used entry.

Both \`get\` and \`put\` must run in **O(1)** average time.

## Examples
\`\`\`js
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
cache.get(1);    // => 1
cache.put(3, 3); // evicts key 2
cache.get(2);    // => -1
\`\`\``,
      difficulty: 'hard',
      category: 'javascript',
      starterCode: `class LRUCache {
  constructor(capacity) {
    // Your code here
  }

  get(key) {
    // Your code here
  }

  put(key, value) {
    // Your code here
  }
}`,
      solutionCode: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    // Move to most recent by deleting and re-inserting
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict the least recently used (first entry in Map)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}`,
      testCases: JSON.stringify([
        {
          input: [
            ['LRUCache', 2],
            ['put', 1, 1],
            ['put', 2, 2],
            ['get', 1],
            ['put', 3, 3],
            ['get', 2],
          ],
          expected: [null, null, null, 1, null, -1],
          description: 'Basic put/get and eviction',
        },
        {
          input: [
            ['LRUCache', 1],
            ['put', 1, 10],
            ['get', 1],
            ['put', 2, 20],
            ['get', 1],
            ['get', 2],
          ],
          expected: [null, null, 10, null, -1, 20],
          description: 'Capacity of 1 — each new put evicts previous',
        },
        {
          input: [
            ['LRUCache', 2],
            ['put', 1, 1],
            ['put', 1, 10],
            ['get', 1],
          ],
          expected: [null, null, null, 10],
          description: 'Updating existing key does not increase size',
        },
        {
          input: [
            ['LRUCache', 3],
            ['put', 1, 1],
            ['put', 2, 2],
            ['put', 3, 3],
            ['get', 1],
            ['put', 4, 4],
            ['get', 2],
            ['get', 3],
          ],
          expected: [null, null, null, null, 1, null, -1, 3],
          description: 'get() refreshes key so it is not evicted next',
        },
      ]),
      hints: JSON.stringify([
        'JavaScript Map preserves insertion order — you can leverage this for O(1) LRU tracking.',
        'When a key is accessed, delete it and re-insert it so it moves to the end (most recent). The first key in the Map is the least recently used.',
        'For put(), check if the key already exists before checking capacity to avoid unnecessary eviction.',
      ]),
      xpReward: 250,
      timeEstimate: 600,
      order: 5,
    },
  ]

  for (const challenge of challenges) {
    await prisma.challenge.create({ data: challenge })
  }

  console.log('Database seeded successfully!')
  console.log(`Created users: ${alice.name}, ${bob.name}`)
  console.log(`Created ${challenges.length} challenges`)
  console.log('Created streak records for all users')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
