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
[POST] /signin-with-token
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
  roles
}
```
