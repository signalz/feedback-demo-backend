# Feedback Backend

## Dev environment

- npm install
- Change configuration in src/config.db.config.js
- npm run watch

## API Docs

### Sign in

```javascript
[POST] /signin
Request: {
  username,
  password
}

Response: {
  token,
  firstName,
  lastName,
  username,
  roles
}
```

### Sign in with token

```javascript
[POST] /signin-with-token
Header: {
  Authorization: `Bearer ${token}`
}

Request: {}

Response: {
  firstName,
  lastName,
  username,
  roles
}
```

### Users API

#### Create User

```javascript
[POST] /api/users
Header: {
  Authorization: `Bearer ${token}`
}

Request: Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  firstName: Joi.string().allow('').optional(),
  lastName: Joi.string().allow('').optional(),
  roles: Joi.array().items(Joi.string().valid(ROLE_USER, ROLE_ADMIN)).min(1).required(),
  isDeleted: Joi.boolean().optional(),
})

Response: {
  firstName,
  lastName,
  username,
  roles,
  id,
  isDeleted
}
```

#### Update User

```javascript
[PATCH] /api/users/:id
Header: {
  Authorization: `Bearer ${token}`
}

Request: Joi.object({
  username: Joi.string().optional(),
  password: Joi.string().optional(),
  firstName: Joi.string().allow('').optional(),
  lastName: Joi.string().allow('').optional(),
  roles: Joi.array().items(Joi.string().valid(ROLE_USER, ROLE_ADMIN)).min(1).optional(),
  isDeleted: Joi.boolean().optional(),
})

Response: {
  firstName,
  lastName,
  username,
  roles,
  id,
  isDeleted
}
```

#### Delete User

```javascript
[DELETE] /api/users/:id
Header: {
  Authorization: `Bearer ${token}`
}

Response: {
  firstName,
  lastName,
  username,
  roles,
  id,
  isDeleted
}
```

#### Get User

```javascript
[GET] /api/users
Header: {
  Authorization: `Bearer ${token}`
}

Response: [{
  firstName,
  lastName,
  username,
  roles,
  id,
  isDeleted
}]
```

### Projects API

#### Create Project

```javascript
[POST] /api/projects
Header: {
  Authorization: `Bearer ${token}`
}

Request: Joi.object({
  name: Joi.string().required(),
  // ID of an user
  manager: Joi.string().allow('').optional(),
  surveyId: Joi.string().allow('').optional(),
  // list IDs of users
  associates: Joi.array().items(Joi.string().allow('').optional()),
  description: Joi.string().allow('').optional(),
})

Response: {
  associates,
  name,
  manager,
  surveyId,
  id,
  description
}
```

#### Update Project

```javascript
[PATCH] /api/projects/:id
Header: {
  Authorization: `Bearer ${token}`
}

Request: Joi.object({
  name: Joi.string().required(),
  // ID of an user
  manager: Joi.string().allow('').optional(),
  // ID of survey
  surveyId: Joi.string().allow('').optional(),
  // list IDs of users
  associates: Joi.array().items(Joi.string().allow('').optional()),
  description: Joi.string().allow('').optional(),
})

Response: {
  associates,
  name,
  manager,
  surveyId,
  id,
  description
}
```

#### Delete Project

```javascript
NOT IMPLEMENTED YET
```

#### Get Projects

```javascript
[GET] /api/projects
Header: {
  Authorization: `Bearer ${token}`
}

Response: [{
  associates: [{ USER }],
  name,
  manager: { user },
  survey: { survey },
  id,
  description
}]
```

#### Get Single Project

```javascript
[GET] /api/projects/:id
Header: {
  Authorization: `Bearer ${token}`
}

Response: {
  associates: [{ USER }],
  name,
  manager: { user },
  survey: { survey },
  id,
  description
}
```

### Surveys API

#### Create Survey

```javascript
[POST] /api/surveys
Header: {
  Authorization: `Bearer ${token}`
}

Request: Joi.object({
  description: Joi.string().required(),
  sections: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required(),
        order: Joi.number().min(0).required(),
        questions: Joi.array()
          .items(
            Joi.object({
              text: Joi.string().required(),
              order: Joi.number().min(0).required(),
            }),
          )
          .min(1)
          .required(),
      }),
    )
    .min(1)
    .required(),
})

Response: {
  id,
  description,
  sections: [{
    id,
    title,
    order,
    questions:[{
      text,
      order,
      id
    }]
  }]
}
```

#### Update Survey

```javascript
[PATCH] /api/surveys/:id
Header: {
  Authorization: `Bearer ${token}`
}

Request: Joi.object({
  description: Joi.string().required(),
  sections: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required(),
        order: Joi.number().min(0).required(),
        questions: Joi.array()
          .items(
            Joi.object({
              text: Joi.string().required(),
              order: Joi.number().min(0).required(),
            }),
          )
          .min(1)
          .required(),
      }),
    )
    .min(1)
    .required(),
})

Response: {
  id,
  description,
  sections: [{
    id,
    title,
    order,
    questions:[{
      text,
      order,
      id
    }]
  }]
}
```

#### Delete Survey

```javascript
NOT IMPLEMENTED YET
```

#### Get Surveys

```javascript
[GET] /api/projects
Header: {
  Authorization: `Bearer ${token}`
}

Response: [{
  id,
  description,
  sections: [{
    id,
    title,
    order,
    questions:[{
      text,
      order,
      id
    }]
  }]
}]
```

#### Get Single Survey

```javascript
[GET] /api/projects/:id
Header: {
  Authorization: `Bearer ${token}`
}

Response: {
  id,
  description,
  sections: [{
    id,
    title,
    order,
    questions:[{
      text,
      order,
      id
    }]
  }]
}
```

### Feedback API

#### Create Feedback

```javascript
[POST] /api/feedbacks
Header: {
  Authorization: `Bearer ${token}`
}

Request: projectId: Joi.string().required(),
  sections: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required(),
        order: Joi.number().min(0).required(),
        questions: Joi.array()
          .items(
            Joi.object({
              text: Joi.string().required(),
              order: Joi.number().min(0).required(),
              rating: Joi.number().min(0).max(4).required(),
            }),
          )
          .min(1)
          .optional(),
      }),
    )
    .min(1)
    .optional(),
  review: Joi.string().allow('').optional(),
  event: Joi.string().allow('').optional(),
})

Response: {
  id,
  userId,
  projectId
  review,
  event,
  sections: [{
    id,
    title,
    order,
    questions:[{
      text,
      order,
      id,
      rating
    }]
  }]
}
```

#### Get Latest Feedback

```javascript
[GET] /api/feedbacks?projectId
Header: {
  Authorization: `Bearer ${token}`
}

Request:

Response: {
  id,
  description,
  review,
  event,
  sections: [{
    id,
    title,
    order,
    questions:[{
      text,
      order,
      id,
      rating
    }]
  }]
}
```

### Section API

Get section from all feedbacks. Distinct by title.

#### Get all Sections

```javascript
[GET] /api/sections
Header: {
  Authorization: `Bearer ${token}`
}

Request:

Response: [{
  title
}]
```

### Dashboard API

#### Overview dashboard

```javascript
[POST] /api/dashboard/projects/summary
Header: {
  Authorization: `Bearer ${token}`
}

Request: {
  projectId,
  sectionTitle
}

Response: {
  PLATINUM,
  GOLD,
  SILVER,
  BRONZE
}
```

#### History dashboard

```javascript
[POST] /api/dashboard/projects/summary
Header: {
  Authorization: `Bearer ${token}`
}

Request: {
  projectId,
  sectionTitle
}

Response: [
  {
    date,
    rating
  }
]
```
