const Joi = require('joi');
const statusCodes = require('http-status-codes');
const User = require('../models/userModels');
const helpers = require('../helpers/helpers');
const bcrypt = require('bcryptjs');

module.exports = {
    async CreateUser(req, res) {
        const schema = Joi.object().keys({
            username: Joi.string().min(5).max(15).required(),
            password: Joi.string().min(8).max(30).regex(/^[a-zA-Z0-9]{3,30}$/),
            email: Joi.string().email({ minDomainAtoms: 2 }).required()
        });

        const { error, value } = Joi.validate(req.body, schema);
        console.log(value);
        if (error && error.details) {
            return res.status(statusCodes.BAD_REQUEST).json({ message: error.details });
        }

        const userEmail = await User.findOne({ email: helpers.lowerCase(value.email) });
        if (userEmail) {
            return res.status(statusCodes.CONFLICT).json({ message: 'Email already exists' });
        }

        const userName = await User.findOne({ username: helpers.firstUpper(req.body.username) });
        if (userName) {
            return res.status(statusCodes.CONFLICT).json({ message: 'Username already exists' });
        }

        return bcrypt.hash(value.password, 10, (err, hash) => {
            if (err) {
                return res.status(statusCodes.BAD_REQUEST).json({ message: 'Error when hashing password' });
            }
            const body = {
                username: value.username,
                email: value.email.toLowerCase(),
                password: hash
            };
            User.create(body).then((user) => {
                res.status(statusCodes.CREATED).json({ message: 'User created successfully', user });
            }).catch(err => {
                res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Error occured' });
            })
        });
    }
};