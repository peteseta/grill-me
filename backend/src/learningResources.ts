// Learning resource mappings for topics
// Maps topics/keywords to YouTube videos and learning resources

export interface LearningResource {
    title: string;
    url: string;
    type: 'youtube' | 'article' | 'course' | 'documentation';
    description?: string;
}

export interface TopicResources {
    topic: string;
    keywords: string[]; // Keywords that match this topic
    resources: LearningResource[];
}

// Comprehensive resource database
export const LEARNING_RESOURCES: TopicResources[] = [
    {
        topic: 'Heaps',
        keywords: ['heap', 'heaps', 'priority queue', 'min heap', 'max heap', 'heapify'],
        resources: [
            {
                title: 'NeetCode - Heaps Explained',
                url: 'https://www.youtube.com/watch?v=0wPlQK1Gw30',
                type: 'youtube',
                description: 'Complete guide to heaps and priority queues'
            },
            {
                title: 'Heap Data Structure - GeeksforGeeks',
                url: 'https://www.geeksforgeeks.org/heap-data-structure/',
                type: 'article',
                description: 'Comprehensive article on heap operations'
            },
            {
                title: 'LeetCode - Heap Problems',
                url: 'https://leetcode.com/tag/heap/',
                type: 'article',
                description: 'Practice problems on heaps'
            }
        ]
    },
    {
        topic: 'Binary Trees',
        keywords: ['binary tree', 'tree traversal', 'BST', 'binary search tree', 'tree', 'trees'],
        resources: [
            {
                title: 'NeetCode - Binary Trees',
                url: 'https://www.youtube.com/watch?v=OnSn2XEQ4MY',
                type: 'youtube',
                description: 'Binary tree fundamentals and traversal'
            },
            {
                title: 'Binary Tree - GeeksforGeeks',
                url: 'https://www.geeksforgeeks.org/binary-tree-data-structure/',
                type: 'article',
                description: 'Complete binary tree guide'
            }
        ]
    },
    {
        topic: 'Graphs',
        keywords: ['graph', 'graphs', 'DFS', 'BFS', 'dijkstra', 'shortest path', 'adjacency'],
        resources: [
            {
                title: 'NeetCode - Graphs',
                url: 'https://www.youtube.com/watch?v=09_LlHjoEiY',
                type: 'youtube',
                description: 'Graph algorithms explained'
            },
            {
                title: 'Graph Data Structure - GeeksforGeeks',
                url: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/',
                type: 'article',
                description: 'Graph theory and algorithms'
            }
        ]
    },
    {
        topic: 'Dynamic Programming',
        keywords: ['dynamic programming', 'DP', 'memoization', 'tabulation', 'optimization'],
        resources: [
            {
                title: 'NeetCode - Dynamic Programming',
                url: 'https://www.youtube.com/watch?v=oBt53YbR9Kk',
                type: 'youtube',
                description: 'DP patterns and strategies'
            },
            {
                title: 'Dynamic Programming - GeeksforGeeks',
                url: 'https://www.geeksforgeeks.org/dynamic-programming/',
                type: 'article',
                description: 'DP concepts and problems'
            }
        ]
    },
    {
        topic: 'Arrays & Strings',
        keywords: ['array', 'arrays', 'string', 'strings', 'two pointer', 'sliding window'],
        resources: [
            {
                title: 'NeetCode - Arrays & Hashing',
                url: 'https://www.youtube.com/watch?v=1uIwiIjw1fw',
                type: 'youtube',
                description: 'Array and string manipulation techniques'
            },
            {
                title: 'Array Data Structure - GeeksforGeeks',
                url: 'https://www.geeksforgeeks.org/array-data-structure/',
                type: 'article',
                description: 'Array fundamentals'
            }
        ]
    },
    {
        topic: 'System Design',
        keywords: ['system design', 'scalability', 'distributed systems', 'architecture', 'microservices'],
        resources: [
            {
                title: 'System Design Interview - Tech Dummies Narendra',
                url: 'https://www.youtube.com/watch?v=UzLMhqg3WcQ',
                type: 'youtube',
                description: 'System design fundamentals'
            },
            {
                title: 'System Design Primer - GitHub',
                url: 'https://github.com/donnemartin/system-design-primer',
                type: 'article',
                description: 'Comprehensive system design guide'
            },
            {
                title: 'High Scalability',
                url: 'http://highscalability.com/',
                type: 'article',
                description: 'Real-world system design examples'
            }
        ]
    },
    {
        topic: 'React',
        keywords: ['react', 'reactjs', 'hooks', 'component', 'JSX', 'state management'],
        resources: [
            {
                title: 'React Official Documentation',
                url: 'https://react.dev/',
                type: 'documentation',
                description: 'Official React documentation'
            },
            {
                title: 'React Tutorial - freeCodeCamp',
                url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
                type: 'youtube',
                description: 'Complete React course'
            }
        ]
    },
    {
        topic: 'JavaScript',
        keywords: ['javascript', 'js', 'ES6', 'async', 'promises', 'closures'],
        resources: [
            {
                title: 'JavaScript.info',
                url: 'https://javascript.info/',
                type: 'article',
                description: 'Modern JavaScript tutorial'
            },
            {
                title: 'JavaScript Crash Course - Traversy Media',
                url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c',
                type: 'youtube',
                description: 'JavaScript fundamentals'
            }
        ]
    },
    {
        topic: 'Python',
        keywords: ['python', 'django', 'flask', 'pandas', 'numpy'],
        resources: [
            {
                title: 'Python Official Documentation',
                url: 'https://docs.python.org/3/',
                type: 'documentation',
                description: 'Official Python docs'
            },
            {
                title: 'Python for Everybody - freeCodeCamp',
                url: 'https://www.youtube.com/watch?v=8DvywoWv6fI',
                type: 'youtube',
                description: 'Complete Python course'
            }
        ]
    },
    {
        topic: 'SQL',
        keywords: ['sql', 'database', 'query', 'joins', 'normalization'],
        resources: [
            {
                title: 'SQL Tutorial - freeCodeCamp',
                url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
                type: 'youtube',
                description: 'SQL basics and advanced queries'
            },
            {
                title: 'SQLBolt',
                url: 'https://sqlbolt.com/',
                type: 'article',
                description: 'Interactive SQL tutorial'
            }
        ]
    },
    {
        topic: 'STAR Method',
        keywords: ['star method', 'behavioral', 'interview', 'situation', 'task', 'action', 'result'],
        resources: [
            {
                title: 'STAR Method Explained - Indeed',
                url: 'https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-interview-response-technique',
                type: 'article',
                description: 'Guide to using STAR method'
            },
            {
                title: 'Behavioral Interview Tips - CareerVidz',
                url: 'https://www.youtube.com/watch?v=PFmuCDHHpwk',
                type: 'youtube',
                description: 'STAR method examples'
            }
        ]
    },
    {
        topic: 'Communication Skills',
        keywords: ['communication', 'clarity', 'conciseness', 'explanation', 'articulation'],
        resources: [
            {
                title: 'Technical Communication - freeCodeCamp',
                url: 'https://www.youtube.com/watch?v=5vxYo0x2Bws',
                type: 'youtube',
                description: 'Improving technical communication'
            },
            {
                title: 'How to Explain Technical Concepts - Medium',
                url: 'https://medium.com/@james_aka_yale/the-art-of-explaining-complex-technical-concepts-7b3e5b5c8b1e',
                type: 'article',
                description: 'Tips for clear explanations'
            }
        ]
    }
];

// Function to find resources for a given topic or weakness
export function findResourcesForTopic(topicOrWeakness: string): LearningResource[] {
    const lowerTopic = topicOrWeakness.toLowerCase();
    const matchedResources: LearningResource[] = [];

    for (const topicResource of LEARNING_RESOURCES) {
        // Check if any keyword matches
        const matches = topicResource.keywords.some(keyword => 
            lowerTopic.includes(keyword.toLowerCase())
        );

        if (matches) {
            matchedResources.push(...topicResource.resources);
        }
    }

    // If no specific match, return general resources
    if (matchedResources.length === 0) {
        // Return some general learning resources
        return [
            {
                title: 'LeetCode - Practice Problems',
                url: 'https://leetcode.com/',
                type: 'article',
                description: 'Practice coding problems'
            },
            {
                title: 'NeetCode YouTube Channel',
                url: 'https://www.youtube.com/c/NeetCode',
                type: 'youtube',
                description: 'DSA and coding interview prep'
            }
        ];
    }

    // Remove duplicates and return
    const uniqueResources = matchedResources.filter((resource, index, self) =>
        index === self.findIndex(r => r.url === resource.url)
    );

    return uniqueResources.slice(0, 5); // Return top 5 resources
}

