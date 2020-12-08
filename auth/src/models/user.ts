// issue 1: properties we pass to User constructor aren't checked by TS
// issue 2: properties avail on indiv. user doc may not match those passed to constructor
import mongoose from 'mongoose';
import { Password } from '../services/password';

// describes the properties required to create a new user: issue 1
interface UserAttrs {
  email: string;
  password: string;
}

//describes the properties that a User Model has: issue 1
// UserModel interface extends mongoose.Model, and represents a collection of UserDocs
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc; // return value of build method must be type UserDoc
}

// describes the properties that a User Document has: solves issue 2
interface UserDoc extends mongoose.Document {
  email: string;
  password: string;
  // if we had extra properties that mongoose added, we'd list them here
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  // second argument: options object of type mongoose.SchemaOptions
  {
    // toJSON object
    toJSON: {
      // when we call res.send(obj), express calls JSON.stringify(obj)
      // stringify's usual behavior is overridden by transform function below (like toJSON)
      // transform function applies to the document before returning
      // doc is the actual user document instance, and ret is the obj. representation
      // that we will mutate. ret is implicitly returned, converted to json.
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
      },
    },
  }
);

// runs every time we call user.save(), hashing the inputted plain-text password
// within, 'this' refers to document being saved
userSchema.pre('save', async function (done) {
  // checking to see if password field has been modified. may not be if user is changing email
  // so we wouldn't want to hash an already hashed password
  // on registration, password will be considered modified
  if (this.isModified('password')) {
    // construct hash
    const hashed = await Password.toHash(this.get('password'));
    // set password field as hashed value
    this.set('password', hashed);
  }
  done();
});

// to create new user, call User.build(..) instead of default constructor new User(..)
// allows TS to check the argument, as mongoose prevents TS from doing so
// Must add build method to UserModel interface for TS to recognize it
userSchema.static('build', function (attrs: UserAttrs) {
  return new User(attrs);
});

// mongoose creates a model out of schema. model is the CRUD interface to reach MongoDB
// we give model constructor template vars UserDoc and UserModel, it returns type UserModel, which represents a collection of UserDocs
// Now, User: UserModel, so we can use build method on it
const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };

/*
How we learned to get mongoose to work with TypeScript:
step 0: understand terminology. 
a model represents a mongo collection of documents. it's also the crud interface to mongodb.
a document represents one aggregate/row/observation.

step 1: create a userSchema to define the shape of the aggregate

step 2: feed schema into Mongoose model:
const User = mongoose.model('User', userSchema)

issue: TS is not currently checking type of args we're passing to model constructor
Ex: No TS error: const user1 = new User({email: 't@gmail.com', passwordOOPS: '123'})
********************
ISSUE 1: properties we pass to User constructor aren't checked by TS

step 3: create UserAttrs interface: interface UserAttrs {email: string; password: string}

step 4: try potential solution 1: define new function whose arguments follow interface
const buildUser = (attrs:UserAttrs)=>{return new User(attrs)}
Instead of instantiating directly with model, we use buildUser function so TS performs check
issue: works, but requires export of both User(for RUD) and buildUser (for creating) 
So, we'll try another approach. Walk back this step.

step 5: Instead, get buildUser(..) built into our User model so we only need to export User
userSchema.statics.build = function (attrs: UserAttrs){return new User(attrs)}
Now, if we try to create a user: User.build({'r@gmail.com', 'abc'}), TS ERROR under .build
Issue is, TS doesn't understand what it means to assign a property to schema.statics obj
In other words, TS doesn't know that build method exists on User model yet

step 6a: Create UserModel interface to describe properties User model has
interface UserModel extends mongoose.Model <any> {
  build(attrs: UserAttrs): any
}
step 6b: Change model creation line to:
const User = mongoose.model <any, UserModel>('User', userSchema)

Now, TS considers User: UserModel
Now, TS is properly checking the properties we pass to User.build({..})

So, solving issue 1 required:
Creating interfaces UserAttrs and UserModel
Adding buildUser via userSchema.statics.build, which implements UserAttrs for arg check
Modifying model creation line's second template variable to UserModel
********************
ISSUE 2: define properties existing on indiv user doc, which may not match those passed to constructor

step 7: create UserDoc interface to describe the properties an indiv. user doc has
interface UserDoc extends mongoose.Document {
  email: string; 
  password: string; 
  //other properties if we had any
}

step 8: replace <any> with this UserDoc interface (3 locations)
where we create the User model: 
const User = mongoose.model <UserDoc, UserModel>('User', userSchema);
in UserModel interface:
interface UserModel extends mongoose.Model<UserDoc>{
  build(attrs: UserAttrs): UserDoc;
} 

Now, UserModel is a collection of UserDoc documents, & its build method constructs a UserDoc
Now, if we create a user & try accessing a property on it, TS checks if it's a valid property!

Ex: const user1 = User.build({..})
user1.email (checks fine)
user1.updatedAt (TS ERROR)

So now, TS checks args passed to User.build AND checks properties on userdoc instances
*/
