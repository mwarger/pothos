import { printSchema, GraphQLID, GraphQLInt, GraphQLString } from 'graphql';
import SchemaBuilder from '.';

type ExampleShape = {
  // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
  example: NonNullable<typeof Example['inputShape']>;
  id: string | number;
  more: ExampleShape;
};

type Types = {
  Input: {
    Example2: ExampleShape;
  };
  Output: {
    User: { firstName: string; lastName: string };
    Article: { title: string; body: string };
    Countable: { count: number };
    Shaveable: { shaved: boolean };
    Sheep: { name: string; count: number; shaved: boolean };
  };
};

const builder = new SchemaBuilder<
  // Model shapes
  Types,
  // Context shape
  { userID: number }
>();

const ID = builder.createScalar('ID', GraphQLID);
const Int = builder.createScalar('Int', GraphQLInt);
const String = builder.createScalar('String', GraphQLString);

// Create input types
const Example = builder.createInputType('Example', {
  fields: {
    // arrow function syntax explained below
    id: () => ID,
  },
});

const Example2 = builder.createInputType('Example2', {
  fields: {
    example: () => Example,
    id: () => ID,
    // We use arrow function syntax to allow this type of circular reference
    more: () => 'Example2',
  },
});

// Union type
const SearchResult = builder.createUnionType('SearchResult', {
  members: ['User', 'Article'],
  resolveType: parent => {
    return Object.prototype.hasOwnProperty.call(parent, 'firstName') ? 'User' : 'Article';
  },
});

// Creating an ObjectType and its resolvers
const User = builder.createObjectType('User', {
  shape: t => ({
    // add a scalar field
    id: t.id({ resolver: () => 5 }),
    // parent is inferred from model shapes defined in builder
    displayName: t.string({
      resolver: ({ firstName, lastName }) => `${firstName} ${lastName.slice(0, 1)}.`,
    }),
    // can omit resolvers by exposing fields from the backing model
    firstName: t.exposeString('firstName'),
    lastName: t.exposeString('lastName'),
    // Non scalar fields:
    firstBornChild: t.field({
      type: 'User',
      resolver: () => ({
        firstName: 'child',
        lastName: '1',
      }),
    }),
    // creating a resolver with args
    partialName: t.string({
      args: {
        // args use arrow function syntax for consistency with input type syntax
        example: () => Example,
        firstN: () => Int,
      },
      resolver: (parent, args) => {
        return parent.firstName.slice(0, args.firstN) + args.example.id;
      },
    }),
    // creating a resolver with args that use recursive types
    recursiveArgs: t.id({
      args: {
        example2: () => Example2,
        firstN: () => Int,
      },
      resolver: (parent, args) => {
        return args.example2.more.more.more.example.id;
      },
    }),
    // add directives
    privateField: t.string({
      // map of directives -> directive args
      directives: { privateData: [] },
      resolver: (parent, args) => {
        return 'private stuff';
      },
    }),
    // Using a union type
    related: t.field({
      resolver: parent => {
        return {
          body: 'stuff',
          title: 'hi',
        };
      },
      // reference implementation so we can automatically pull types for all member types
      type: () => SearchResult,
    }),
    // Lists
    friends: t.field({
      resolver: parent => {
        return [parent];
      },
      type: ['User'],
    }),
    // list helpers
    stuff: t.stringList({
      resolver() {
        return ['soup', 'cats'];
      },
    }),
    // optional fields
    optional: t.string({
      required: false,
      resolver: () => null,
    }),
    // list and optional args
    list: t.idList({
      args: {
        ids: {
          required: false,
          type: () => [ID],
        },
      },
      required: false,
      resolver: (parent, args) => args.ids,
    }),
  }),
});

// TODO
// Build fields independently
// const UserFields = builder
//   .fieldBuilder('User')
//   .string('firstName', {})
//   .string('lastName', {})
//   .string('displayName', {
//     resolver: ({ firstName, lastName }) => `${firstName} ${lastName.slice(0, 1)}.`,
//   });

// Build using fields defined outside the class
// builder.createObjectType('User', {
//   shape: UserFields,
// });

const Countable = builder.createInterfaceType('Countable', {
  shape: t => ({
    count: t.int({
      args: {
        max: () => Int,
      },
      required: true,
      resolver: (parent, args) => Math.min(args.max, parent.count),
    }),
  }),
});

const Shaveable = builder.createInterfaceType('Shaveable', {
  shape: t => ({
    id: t.id({
      resolver: () => 5,
    }),
    shaved: t.exposBoolean('shaved'),
  }),
});

// Enums
const Stuff = builder.createEnumType('stuff', {
  values: ['Beats', 'Bears', 'BattlestarGalactica'] as const,
});

const Sheep = builder.createObjectType('Sheep', {
  implements: [Shaveable, Countable],
  // used in dynamic resolveType method for Shaveable and Countable interfaces
  // probably needs a different name, but when true, the interfaces resolveType will return
  check: () => true,
  shape: t => ({
    color: t.string({
      args: { id: () => ID },
      resolver: (p, { id }) => (id === 1 ? 'black' : 'white'),
    }),
    // // Errors when adding type already defined in interface
    // count: t.id({ resolver: () => 4n }),
    count: t
      .extend('count') // required to get the args for the correct field
      // grabs args and requiredness from interface field
      .implement({ resolver: (parent, args) => Math.min(args.max, parent.count) }),
    thing: t.field({
      type: () => Stuff,
      resolver: () => 'Bears' as const,
    }),
  }),
});

const Query = builder.createObjectType('Query', {
  shape: t => ({
    user: t.field({
      resolver: () => ({
        firstName: 'user',
        lastName: 'name',
      }),
      type: 'User',
    }),
    stuff: t.field({
      type: () => [Stuff],
      resolver() {
        return ['Bears', 'Beats', 'BattlestarGalactica'] as const;
      },
    }),
    sheep: t.field({
      type: 'Sheep',
      resolver: () => ({
        count: 5,
        name: 'bah-bah',
        shaved: true,
      }),
    }),
  }),
});

const Article = builder.createObjectType('Article', {
  shape: t => ({}),
});

const schema = builder.toSchema([
  ID,
  Int,
  String,
  Query,
  Shaveable,
  Stuff,
  User,
  Sheep,
  SearchResult,
  Article,
  Example,
  Example2,
]);

console.log(printSchema(schema));
